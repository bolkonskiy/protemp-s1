"""Минимальный MQTT-клиент к брокеру ChefTemp. Только топик этого MAC."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
import logging
import struct

_LOGGER = logging.getLogger(__name__)

MessageHandler = Callable[[str, bytes], Awaitable[None]]


def _remaining(n: int) -> bytes:
    out = bytearray()
    while True:
        digit = n % 128
        n //= 128
        if n:
            digit |= 0x80
        out.append(digit)
        if not n:
            return bytes(out)


def _utf(text: str) -> bytes:
    raw = text.encode()
    return struct.pack("!H", len(raw)) + raw


def _packet(ptype: int, payload: bytes) -> bytes:
    return bytes([ptype]) + _remaining(len(payload)) + payload


def _read_packet(buf: bytearray) -> bytes | None:
    if len(buf) < 2:
        return None
    value = 0
    multiplier = 1
    index = 1
    while True:
        if index >= len(buf) or index > 4:
            return None
        byte = buf[index]
        value += (byte & 0x7F) * multiplier
        index += 1
        multiplier *= 128
        if not byte & 0x80:
            break
    total = index + value
    if len(buf) < total:
        return None
    packet = bytes(buf[:total])
    del buf[:total]
    return packet


class CloudLink:
    """Подписка на телеметрию и командный топик, публикация кадров."""

    def __init__(
        self,
        host: str,
        port: int,
        client_id: str,
        topics: list[str],
        on_message: MessageHandler,
    ) -> None:
        self.host = host
        self.port = port
        self.client_id = client_id
        self.topics = topics
        self._on_message = on_message
        self._stop = asyncio.Event()
        self._write_lock = asyncio.Lock()
        self._writer: asyncio.StreamWriter | None = None
        self.connected = False

    async def publish(self, topic: str, payload: bytes) -> None:
        writer = self._writer
        if writer is None or not self.connected:
            raise ConnectionError("брокер ChefTemp недоступен")
        packet = _packet(0x30, _utf(topic) + payload)
        async with self._write_lock:
            writer.write(packet)
            await writer.drain()

    def stop(self) -> None:
        self._stop.set()
        writer = self._writer
        if writer is not None:
            writer.close()

    async def run(self) -> None:
        while not self._stop.is_set():
            try:
                await self._session()
            except asyncio.CancelledError:
                raise
            except Exception:
                _LOGGER.warning("Связь с брокером ChefTemp оборвалась", exc_info=True)
            self.connected = False
            self._writer = None
            if self._stop.is_set():
                return
            await asyncio.sleep(5)

    async def _session(self) -> None:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(self.host, self.port),
            timeout=10,
        )
        self._writer = writer
        connect = _packet(
            0x10,
            _utf("MQTT") + bytes([4, 0x02]) + struct.pack("!H", 30) + _utf(self.client_id),
        )
        writer.write(connect)
        await writer.drain()
        connack = await asyncio.wait_for(reader.readexactly(4), timeout=10)
        if connack[0] != 0x20 or connack[3] != 0:
            raise ConnectionError(f"брокер отказал: {connack.hex()}")
        body = struct.pack("!H", 1)
        for topic in self.topics:
            body += _utf(topic) + bytes([0])
        writer.write(_packet(0x82, body))
        await writer.drain()
        self.connected = True
        _LOGGER.info("ChefTemp слушает %s", ", ".join(self.topics))

        buf = bytearray()
        while not self._stop.is_set():
            try:
                chunk = await asyncio.wait_for(reader.read(4096), timeout=20)
            except TimeoutError:
                async with self._write_lock:
                    writer.write(bytes([0xC0, 0x00]))
                    await writer.drain()
                continue
            if not chunk:
                raise ConnectionError("брокер закрыл соединение")
            buf.extend(chunk)
            while True:
                packet = _read_packet(buf)
                if packet is None:
                    break
                await self._incoming(packet)

    async def _incoming(self, packet: bytes) -> None:
        if packet[0] >> 4 != 3:
            return
        index = 1
        while packet[index] & 0x80:
            index += 1
        index += 1
        topic_len = struct.unpack("!H", packet[index : index + 2])[0]
        index += 2
        topic = packet[index : index + topic_len].decode()
        index += topic_len
        qos = (packet[0] >> 1) & 0x03
        if qos:
            packet_id = struct.unpack("!H", packet[index : index + 2])[0]
            index += 2
            writer = self._writer
            if writer is not None:
                async with self._write_lock:
                    writer.write(bytes([0x40, 0x02]) + struct.pack("!H", packet_id))
                    await writer.drain()
        await self._on_message(topic, packet[index:])


async def wait_for_frame(host: str, port: int, mac: str, timeout: float = 12.0) -> bool:
    """Подписаться на топик MAC и дождаться одного целого кадра.

    Модулю ничего не отправляется: ни AT, ни второй UDP-пакет.
    """
    from .protocol import parse_stream

    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=10,
        )
    except (OSError, TimeoutError, asyncio.TimeoutError) as err:
        raise ConnectionError("брокер недоступен") from err
    try:
        client_id = f"ha-cheftemp-probe-{mac[-6:].lower()}-{id(writer) & 0xFFFF:04x}"
        connect = _packet(
            0x10,
            _utf("MQTT") + bytes([4, 0x02]) + struct.pack("!H", 15) + _utf(client_id),
        )
        writer.write(connect)
        await writer.drain()
        connack = await asyncio.wait_for(reader.readexactly(4), timeout=10)
        if connack[0] != 0x20 or connack[3] != 0:
            raise ConnectionError("брокер отказал")
        body = struct.pack("!H", 1) + _utf(mac) + bytes([0])
        writer.write(_packet(0x82, body))
        await writer.drain()
        packets = bytearray()
        raw = bytearray()
        deadline = asyncio.get_running_loop().time() + timeout
        while True:
            remaining = deadline - asyncio.get_running_loop().time()
            if remaining <= 0:
                return False
            try:
                chunk = await asyncio.wait_for(reader.read(4096), timeout=remaining)
            except TimeoutError:
                return False
            if not chunk:
                return False
            packets.extend(chunk)
            while True:
                packet = _read_packet(packets)
                if packet is None:
                    break
                if packet[0] >> 4 != 3:
                    continue
                index = 1
                while packet[index] & 0x80:
                    index += 1
                index += 1
                topic_len = struct.unpack("!H", packet[index : index + 2])[0]
                index += 2 + topic_len
                raw.extend(packet[index:])
                if parse_stream(raw):
                    return True
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
