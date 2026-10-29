# ProTemp S1

Home Assistant integration for the **ChefsTemp ProTemp S1** grill thermometer and Breezo fan.

Dome temperature and fan state come from ChefsTemp cloud MQTT. You do not enter a broker. Home Assistant publishes nothing on startup. Setpoint, timer, mode and speed stay unavailable until the grill itself sends those fields.

## Installation

### HACS (recommended)

1. HACS → Integrations → ⋮ → Custom repositories
2. URL: `https://github.com/bolkonskiy/protemp-s1`
3. Category: **Integration**
4. Download **ProTemp S1** and restart Home Assistant
5. **Settings → Devices & services → Add integration → ProTemp S1**

On Home Assistant 2026.11 and later the same URL goes under **Settings → Marketplace**.

### Manual

Copy `custom_components/cheftemp` into `config/custom_components/` and restart Home Assistant. Then add **ProTemp S1**.

Scan the LAN or type the MAC from the sticker on the bottom. Discovery broadcasts on every IPv4 network Home Assistant has, not only the default route. The grill IP is not needed. The config entry is saved only after a frame arrives from that MAC.

## Entities

| Entity | What it is |
|---|---|
| `sensor.protemp_s1_ambient` | Ambient / dome temperature |
| `sensor.protemp_s1_fan` | Fan: Offline, Slow, Fast, Paused, Stopped |
| `sensor.protemp_s1_battery` | Battery, percent from the status frame |
| `select.protemp_s1_mode` | Mode: Temperature, Timer, Off |
| `number.protemp_s1_setpoint` | Setpoint |
| `number.protemp_s1_timer` | Timer, seconds |
| `select.protemp_s1_speed` | Speed: Fast, Slow |
| `switch.protemp_s1_alarm` | Alarm. Disabled on a new config entry |
| `number.protemp_s1_maximum` | Maximum. Disabled on a new config entry |
| `number.protemp_s1_minimum` | Minimum. Disabled on a new config entry |
| `sensor.protemp_s1_ch1` … | Per probe: `CH1` min of internals, `.t1`–`.t5`, `.ambient`, `.battery` |

Probe channel entities are unavailable when that probe is offline.

## Lovelace card

The integration registers `custom:protemp-s1-card` on startup. After a restart it appears under **Add card → ProTemp S1**. You do not add a Lovelace resource by hand.

```yaml
type: custom:protemp-s1-card
```

If there is more than one grill, pick the device in the card editor.

## License

MIT
