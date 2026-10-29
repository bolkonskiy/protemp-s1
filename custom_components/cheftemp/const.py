"""ProTemp S1, облачный MQTT."""

DOMAIN = "cheftemp"
VERSION = "1.3.0"

DEFAULT_HOST = "198.58.114.115"
DEFAULT_PORT = 1883

PLATFORMS = ["sensor", "number", "switch", "select"]

DOME_STALE_SECONDS = 120
# Прилка для S1 всегда ставит вентилятору номер 8 и шлёт его плюс один (Stand.setFanSet).
S1_FAN_IDX = 9
PROBE_SLOTS = (1, 2, 3, 4)
PROBE_TIPS = (1, 2, 3, 4, 5)
