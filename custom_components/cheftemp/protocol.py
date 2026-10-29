"""Кадры ProTemp S1. Байты сверены с логом приложения 20.10.2026."""

from __future__ import annotations

from dataclasses import dataclass

_EMPTY_TEMP = {0xFF00, 0xFF01, 0xFF02}
_PROBE_OPCODE = {0x20: 1, 0x21: 2, 0x22: 3, 0x23: 4}


def checksum(body: bytes) -> int:
    """Младший байт суммы всех предыдущих."""
    return sum(body) & 0xFF


def fan_frame(idx: int, mode: int, seconds: int, temp: int, strength: int) -> bytes:
    body = bytes(
        [
            0xAA,
            0x55,
            0x53,
            0x81,
            0x07,
            0x20,
            0x07,
            idx & 0xFF,
            mode & 0xFF,
            (seconds >> 8) & 0xFF,
            seconds & 0xFF,
            (temp >> 8) & 0xFF,
            temp & 0xFF,
            strength & 0xFF,
        ]
    )
    return body + bytes([checksum(body)])


def limit_frame(minimum: bool, celsius: int) -> bytes:
    """0x75 минимум, 0x76 максимум. Температура — целое °C."""
    opcode = 0x75 if minimum else 0x76
    body = bytes(
        [
            0xAA,
            0x55,
            0x53,
            0x81,
            0x08,
            opcode,
            0x02,
            (celsius >> 8) & 0xFF,
            celsius & 0xFF,
        ]
    )
    return body + bytes([checksum(body)])


def alarm_frame(enabled: bool) -> bytes:
    """Выключатель аварии купола. 21.10.2026: выкл = 0, вкл = 1."""
    body = bytes([0xAA, 0x55, 0x53, 0x81, 0x07, 0x17, 0x01, 0x01 if enabled else 0x00])
    return body + bytes([checksum(body)])


@dataclass
class FanSetting:
    """Режим 2 — температура, 1 — таймер, 0 — выкл.

    Секунды, температура и сила уходят в каждом кадре, как в прилке.
    Температура — целое число с экрана, без перевода в °F.
    """

    idx: int | None = None
    mode: int = 0
    seconds: int = 120
    temp_c: float = 78
    strength: int = 1
    known: bool = False

    def frame(self) -> bytes:
        if not self.idx or not self.known:
            raise ValueError("fan settings unknown")
        return fan_frame(
            self.idx,
            self.mode,
            self.seconds,
            int(round(self.temp_c)),
            self.strength,
        )

    def apply_wire_mode(self, mode: int) -> None:
        self.mode = mode if mode in (0, 1, 2) else 0


@dataclass
class FanRun:
    """Отчёт турбинки, кадр 0x73. Разбор как в NotifyTempProtocol.parseData.

    Тело: 0–5 мак наоборот, 6 версия, 7 на связи (0 — нет), 8 способ управления,
    9 рабочий режим, 10 обороты (2 — сильный ветер).
    """

    version: int = 0
    online: bool = False
    control: int = 0
    mode: int = 0
    speed: int = 0


def fan_state(run: FanRun | None, app_mode: int, dome_c: int | None, setpoint: float) -> str:
    """Состояние, как его считает прилка в Stand.updateFanVersionOnline.

    0 нет связи, 1 медленно, 2 быстро, 3 пауза, 4 стоп.
    """
    if run is None or not run.online:
        return "offline"
    if app_mode == 2 and dome_c is not None and dome_c > setpoint:
        return "paused"
    if run.mode != 0:
        return "fast" if run.speed == 2 else "slow"
    return "stopped"


@dataclass
class Probe:
    """Щуп на канале S1. Тело 14 байт, сверено 29.10.2026.

    ambient — целое °C (ручка). t1 — измеренная, t2–t5 — участки, десятые °C.
    Пусто на проводе: FF 00, FF 01, FF 02.
    """

    slot: int
    ambient_c: int | None = None
    battery_pct: int | None = None
    signal: int | None = None
    tips: tuple[
        float | None, float | None, float | None, float | None, float | None
    ] = (None, None, None, None, None)

    @property
    def min_internal(self) -> float | None:
        vals = [tip for tip in self.tips if tip is not None]
        return min(vals) if vals else None


def _u16(payload: bytes, offset: int) -> int:
    return int.from_bytes(payload[offset : offset + 2], "big")


def _celsius_int(raw: int) -> int | None:
    if raw in _EMPTY_TEMP:
        return None
    return raw


def _celsius_tenth(raw: int) -> float | None:
    if raw in _EMPTY_TEMP:
        return None
    return raw / 10.0


def parse_probe(opcode: int, payload: bytes) -> Probe | None:
    """Канал CH1–CH4, только подтверждённая длина 14."""
    slot = _PROBE_OPCODE.get(opcode)
    if slot is None or len(payload) != 14:
        return None
    batt = payload[4]
    return Probe(
        slot=slot,
        ambient_c=_celsius_int(_u16(payload, 0)),
        battery_pct=batt if batt <= 100 else None,
        signal=payload[5],
        tips=(
            _celsius_tenth(_u16(payload, 2)),
            _celsius_tenth(_u16(payload, 6)),
            _celsius_tenth(_u16(payload, 8)),
            _celsius_tenth(_u16(payload, 10)),
            _celsius_tenth(_u16(payload, 12)),
        ),
    )


@dataclass
class Parsed:
    dome_c: int | None = None
    fan: FanSetting | None = None
    fan_run: FanRun | None = None
    limit_min_c: int | None = None
    limit_max_c: int | None = None
    alarm: bool | None = None
    battery_pct: int | None = None
    probe: Probe | None = None


def parse_stream(buf: bytearray) -> list[Parsed]:
    """Вынуть целые кадры из куска UART. Хвост остаётся в buf."""
    found: list[Parsed] = []
    while True:
        start = buf.find(b"\xaa\x55")
        if start < 0:
            if len(buf) > 1:
                del buf[:-1]
            return found
        if start:
            del buf[:start]
        frame = _take_frame(buf)
        if frame is None:
            return found
        if frame is False:
            del buf[:2]
            continue
        parsed = _parse_frame(frame)
        if parsed is None:
            del buf[:2]
            continue
        del buf[: len(frame)]
        found.append(parsed)


def _take_frame(buf: bytearray) -> bytes | None | bool:
    if len(buf) < 6:
        return None
    kind = buf[2]
    if kind in (0x57, 0x58):
        if len(buf) < 7:
            return None
        length = buf[6]
        if length > 32:
            return False
        need = 8 + length
    elif kind == 0x53 and buf[3] == 0x81:
        cmd = buf[5]
        if cmd == 0x20:
            need = 15
        elif cmd in (0x75, 0x76):
            need = 10
        elif cmd == 0x17:
            need = 9
        else:
            return False
    else:
        return False
    if len(buf) < need:
        return None
    frame = bytes(buf[:need])
    if checksum(frame[:-1]) != frame[-1]:
        return False
    return frame


def _parse_frame(frame: bytes) -> Parsed | None:
    if frame[2] == 0x57:
        opcode = frame[5]
        payload = frame[7:-1]
        if opcode == 0x71 and payload:
            return Parsed(dome_c=payload[-1])
        probe = parse_probe(opcode, payload)
        if probe is not None:
            return Parsed(probe=probe)
        if opcode == 0x73 and len(payload) >= 11:
            return Parsed(
                fan_run=FanRun(
                    version=payload[6],
                    online=payload[7] != 0,
                    control=payload[8],
                    mode=payload[9],
                    speed=payload[10],
                )
            )
        return Parsed()
    if frame[2] == 0x58:
        payload = frame[7:-1]
        if frame[5] == 0x10 and payload and payload[-1] <= 100:
            return Parsed(battery_pct=payload[-1])
        return Parsed()
    if frame[2] != 0x53:
        return None
    cmd = frame[5]
    if cmd == 0x20:
        fan = FanSetting(
            idx=frame[7],
            seconds=int.from_bytes(frame[9:11], "big"),
            temp_c=int.from_bytes(frame[11:13], "big"),
            strength=frame[13],
        )
        fan.apply_wire_mode(frame[8])
        return Parsed(fan=fan)
    if cmd == 0x75:
        return Parsed(limit_min_c=int.from_bytes(frame[7:9], "big"))
    if cmd == 0x76:
        return Parsed(limit_max_c=int.from_bytes(frame[7:9], "big"))
    if cmd == 0x17:
        return Parsed(alarm=frame[7] != 0)
    return None
