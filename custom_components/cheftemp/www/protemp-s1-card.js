(() => {
  const CARD = "protemp-s1-card";
  const SVG = "http://www.w3.org/2000/svg";
  const FAN = {
    offline: "Offline",
    slow: "Slow",
    fast: "Fast",
    paused: "Paused",
    stopped: "Stopped",
  };
  const ICONS = {
    thermo: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V12H11V5A1 1 0 0 1 12 4Z",
    timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
    power: "M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",
    minus: "M19 13H5V11H19V13Z",
    plus: "M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z",
    turtle: "M5.94 17.31C5.69 17.12 5.63 16.97 5.63 16.57C5.63 16.22 5.56 16.00 5.40 15.86C5.19 15.67 5.06 15.66 3.78 15.79C2.23 15.95 1.10 15.85 1.10 15.56C1.10 15.46 1.43 15.22 1.83 15.02C2.88 14.50 2.95 14.42 2.86 13.89C2.79 13.48 2.83 13.40 3.36 12.80C3.70 12.42 4.20 11.62 4.59 10.83C5.95 8.08 7.32 6.87 9.59 6.44C11.67 6.04 12.85 6.37 15.68 8.15C16.64 8.75 18.65 9.80 18.85 9.80C18.89 9.80 19.15 9.62 19.43 9.39C19.70 9.17 20.12 8.90 20.35 8.80C21.85 8.18 23.30 9.29 22.90 10.76C22.48 12.31 19.61 13.65 17.59 13.22C17.23 13.14 16.86 13.00 16.79 12.91C16.58 12.66 16.40 12.70 16.08 13.04C15.85 13.29 15.83 13.37 15.94 13.54C16.72 14.64 17.26 16.02 17.26 16.92L17.26 17.43L16.73 17.51C16.03 17.61 14.81 17.47 14.47 17.25C14.24 17.11 14.21 16.98 14.21 16.38C14.21 15.63 14.01 15.02 13.70 14.76C13.54 14.63 13.37 14.65 12.61 14.91C11.57 15.27 10.17 15.56 9.47 15.56C8.76 15.56 8.57 15.79 8.65 16.57C8.74 17.49 8.65 17.56 7.33 17.56C6.41 17.56 6.20 17.52 5.94 17.31ZM20.95 10.20A0.52 0.52 0 1 1 20.94 10.20Z",
    rabbit: "M1.32 19.30C1.14 19.14 1.10 19.06 1.10 18.89C1.10 18.69 1.16 18.61 1.86 17.93C2.56 17.25 2.66 17.13 2.96 16.56C3.14 16.22 3.33 15.91 3.37 15.87C3.42 15.83 3.66 15.81 4.01 15.82C4.56 15.83 4.58 15.83 4.80 15.65C5.12 15.40 5.26 15.06 5.40 14.25C5.55 13.34 5.65 13.03 5.89 12.65C6.68 11.40 8.30 10.65 9.86 10.82C10.33 10.87 11.91 11.17 13.38 11.50C14.49 11.74 14.90 11.82 15.17 11.82C15.53 11.82 16.06 11.54 16.36 11.20C16.61 10.91 16.89 10.40 16.89 10.22C16.89 10.00 16.24 9.80 15.09 9.68C13.41 9.50 12.76 9.30 11.64 8.64C10.55 8.00 9.72 7.17 9.83 6.83C9.91 6.59 10.22 6.51 11.12 6.52C12.04 6.53 12.81 6.63 13.84 6.89C14.67 7.09 15.34 7.36 16.14 7.80C16.72 8.11 16.89 8.16 16.89 7.99C16.89 7.87 15.93 7.16 15.31 6.84C14.65 6.49 13.72 6.16 13.00 6.01C12.56 5.92 12.45 5.87 12.34 5.74C12.03 5.36 11.89 4.84 11.99 4.50C12.10 4.18 13.16 4.44 14.57 5.13C16.25 5.96 17.30 6.88 18.74 8.81C18.95 9.10 18.97 9.11 19.44 9.21C20.06 9.34 21.01 9.71 21.41 9.99C22.01 10.39 22.60 11.22 22.87 12.04C22.99 12.39 22.99 12.42 22.90 12.61C22.68 13.07 21.86 13.80 21.42 13.93C21.30 13.96 20.90 14.01 20.54 14.04C19.71 14.11 19.41 14.24 19.14 14.65C18.97 14.90 18.95 14.99 18.95 15.31C18.95 15.67 18.95 15.68 19.24 16.00C19.41 16.18 19.73 16.46 19.96 16.63C21.05 17.43 21.87 18.16 22.03 18.46C22.21 18.79 21.97 19.38 21.67 19.38C21.59 19.38 21.37 19.28 21.19 19.17C19.68 18.20 17.95 17.30 16.60 16.78C15.51 16.35 13.68 15.98 12.71 15.98C12.39 15.98 11.67 16.05 11.11 16.13C10.54 16.21 10.07 16.27 10.06 16.26C10.04 16.24 10.11 16.06 10.20 15.86C10.43 15.36 10.53 14.90 10.49 14.47C10.46 14.04 10.23 13.55 10.06 13.55C9.96 13.55 9.95 13.59 9.94 14.08C9.92 15.25 9.49 16.08 8.57 16.79C7.68 17.47 6.56 17.69 4.99 17.48L4.26 17.38L3.97 17.72C3.52 18.25 2.52 19.23 2.30 19.37C2.16 19.45 1.99 19.50 1.81 19.50C1.58 19.50 1.50 19.47 1.32 19.30ZM20.79 11.51C20.87 11.44 20.96 11.29 20.98 11.19C21.01 11.03 20.98 10.97 20.83 10.82C20.68 10.67 20.61 10.64 20.48 10.67C20.05 10.77 19.98 11.35 20.38 11.57C20.55 11.67 20.62 11.66 20.79 11.51Z",
  };
  const BATT_PATHS = {
    "mdi:battery": "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-90": "M16,8H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-80": "M16,9H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-70": "M16,10H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-60": "M16,12H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-50": "M16,13H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-40": "M16,14H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-30": "M16,15H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-20": "M16,17H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-10": "M16,18H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-outline": "M16,20H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
    "mdi:battery-unknown": "M15.07,12.25L14.17,13.17C13.63,13.71 13.25,14.18 13.09,15H11.05C11.16,14.1 11.56,13.28 12.17,12.67L13.41,11.41C13.78,11.05 14,10.55 14,10C14,8.89 13.1,8 12,8A2,2 0 0,0 10,10H8A4,4 0 0,1 12,6A4,4 0 0,1 16,10C16,10.88 15.64,11.68 15.07,12.25M13,19H11V17H13M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.66C6,21.4 6.6,22 7.33,22H16.67C17.4,22 18,21.4 18,20.66V5.33C18,4.59 17.4,4 16.67,4Z",
    "mdi:battery-alert-variant-outline": "M14 20H6V6H14M14.67 4H13V2H7V4H5.33C4.6 4 4 4.6 4 5.33V20.67C4 21.4 4.6 22 5.33 22H14.67C15.4 22 16 21.4 16 20.67V5.33C16 4.6 15.4 4 14.67 4M21 7H19V13H21V8M21 15H19V17H21V15Z",
  };

  function batteryMdi(percent) {
    if (percent === null || percent === undefined) return "mdi:battery-unknown";
    if (percent <= 0) return "mdi:battery-alert-variant-outline";
    const rounded = Math.round(percent / 10) * 10;
    if (rounded >= 100) return "mdi:battery";
    if (rounded <= 0) return "mdi:battery-alert-variant-outline";
    return `mdi:battery-${rounded}`;
  }

  function sameTemp(a, b) {
    if (a === null || b === null) return false;
    return Math.round(a * 10) === Math.round(b * 10);
  }

  function classify(entityId) {
    let m;
    if ((m = entityId.match(/_ch([1-4])_t([1-5])$/))) {
      return { kind: "tip", slot: Number(m[1]), tip: Number(m[2]) };
    }
    if ((m = entityId.match(/_ch([1-4])_ambient$/))) {
      return { kind: "probe_ambient", slot: Number(m[1]) };
    }
    if ((m = entityId.match(/_ch([1-4])_battery$/))) {
      return { kind: "probe_battery", slot: Number(m[1]) };
    }
    if ((m = entityId.match(/_ch([1-4])$/))) {
      return { kind: "probe", slot: Number(m[1]) };
    }
    if (entityId.startsWith("sensor.") && /_ambient$/.test(entityId)) return { kind: "dome" };
    if (entityId.startsWith("sensor.") && /_fan$/.test(entityId)) return { kind: "fan" };
    if (entityId.startsWith("sensor.") && /_battery$/.test(entityId)) return { kind: "battery" };
    if (entityId.startsWith("number.") && /_setpoint$/.test(entityId)) return { kind: "setpoint" };
    if (entityId.startsWith("number.") && /_timer$/.test(entityId)) return { kind: "timer" };
    if (entityId.startsWith("select.") && /_mode$/.test(entityId)) return { kind: "mode" };
    if (entityId.startsWith("select.") && /_speed$/.test(entityId)) return { kind: "speed" };
    return null;
  }

  function cheftempDeviceIds(hass) {
    const ids = new Set();
    Object.values((hass && hass.entities) || {}).forEach((meta) => {
      if (meta && meta.platform === "cheftemp" && meta.device_id) ids.add(meta.device_id);
    });
    return [...ids];
  }

  function mapEntities(hass, deviceId) {
    const out = { tips: { 1: {}, 2: {}, 3: {}, 4: {} }, probe: {}, probeAmbient: {}, probeBattery: {} };
    Object.entries((hass && hass.entities) || {}).forEach(([entityId, meta]) => {
      if (!meta || meta.device_id !== deviceId) return;
      const hit = classify(entityId);
      if (!hit) return;
      if (hit.kind === "tip") out.tips[hit.slot][hit.tip] = entityId;
      else if (hit.kind === "probe") out.probe[hit.slot] = entityId;
      else if (hit.kind === "probe_ambient") out.probeAmbient[hit.slot] = entityId;
      else if (hit.kind === "probe_battery") out.probeBattery[hit.slot] = entityId;
      else out[hit.kind] = entityId;
    });
    return out;
  }

  function num(state) {
    if (!state || state.state === "unknown" || state.state === "unavailable") return null;
    const value = Number(state.state);
    return Number.isFinite(value) ? value : null;
  }

  function fmtTemp(value, digits) {
    if (value === null || value === undefined) return "—";
    return `${Number(value).toFixed(digits)}°`;
  }

  function fmtProbeNum(value) {
    if (value === null || value === undefined) return "—";
    const rounded = Math.round(Number(value) * 10) / 10;
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) return String(Math.round(rounded));
    return rounded.toFixed(1);
  }

  function fmtProbeTemp(value) {
    if (value === null || value === undefined) return "—";
    return `${fmtProbeNum(value)}°`;
  }

  function fmtTimer(seconds) {
    if (seconds === null || seconds === undefined) return "—";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function h(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  }

  function icon(name, parent) {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "glyph");
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", ICONS[name]);
    path.setAttribute("fill", "currentColor");
    path.setAttribute("fill-rule", "evenodd");
    svg.appendChild(path);
    if (parent) parent.append(svg);
    return svg;
  }

  function makeBattery(parent) {
    if (customElements.get("ha-icon")) {
      const el = document.createElement("ha-icon");
      el.className = "batt";
      el.icon = "mdi:battery-unknown";
      parent.append(el);
      return el;
    }
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "batt");
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", BATT_PATHS["mdi:battery-unknown"]);
    path.setAttribute("fill", "currentColor");
    svg.appendChild(path);
    parent.append(svg);
    return svg;
  }

  function setBattery(el, percent) {
    const name = batteryMdi(percent);
    el.title = percent === null || percent === undefined ? "Battery" : `${Math.round(percent)}%`;
    if (el.tagName === "HA-ICON") {
      el.icon = name;
      return;
    }
    const path = el.querySelector("path");
    if (path) path.setAttribute("d", BATT_PATHS[name] || BATT_PATHS["mdi:battery-unknown"]);
  }

  const CSS = `
    :host {
      display: block; background: transparent;
      container-type: inline-size; container-name: s1;
    }
    button {
      appearance: none; -webkit-appearance: none; font: inherit; color: inherit;
      margin: 0; background: transparent; box-sizing: border-box;
    }
    .empty {
      padding: 20px 12px; text-align: center;
      color: var(--dom-state-off, var(--secondary-text-color, #7b8794));
    }
    .hide { display: none !important; }
    .stack { display: flex; flex-direction: column; gap: 8px; }
    .pill {
      display: flex; align-items: center; gap: 8px;
      min-height: 50px; height: 50px; padding: 0 10px 0 6px;
      border-radius: 25px; box-sizing: border-box;
      background: var(--dom-bubble-off, rgba(255, 255, 255, 0.62));
      border: 1px solid var(--dom-bubble-off-edge, rgba(255, 255, 255, 0.55));
      color: var(--dom-name-off, var(--primary-text-color, #243044));
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    }
    .pill.on {
      background: var(--dom-bubble-on, rgba(116, 154, 214, 0.88));
      border-color: var(--dom-bubble-on-edge, rgba(148, 180, 228, 0.95));
      color: var(--dom-name-on, #f7f8fc);
    }
    .pill.heat {
      background: var(--dom-bubble-heat, rgba(236, 196, 112, 0.78));
      border-color: var(--dom-bubble-heat-edge, rgba(248, 216, 150, 0.95));
      color: var(--dom-name-off, #243044);
    }
    .pill.on .state { color: var(--dom-state-on, rgba(247, 248, 252, 0.82)); }
    .pill.heat .state { color: var(--dom-state-off, rgba(36, 48, 68, 0.62)); }
    .icon-wrap {
      width: 38px; height: 38px; min-width: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--dom-icon-off-bg, rgba(36, 48, 68, 0.10));
      color: var(--dom-icon-off, #3a4458);
    }
    .pill.on .icon-wrap {
      background: rgba(247, 248, 252, 0.18);
      color: var(--dom-name-on, #f7f8fc);
    }
    .ch {
      font-size: 12px; font-weight: 600; line-height: 1; letter-spacing: 0;
      white-space: nowrap;
    }
    .glyph { width: 22px; height: 22px; display: block; }
    .col { display: flex; flex-direction: column; justify-content: center; min-width: 0; flex: 1; gap: 4px; }
    .name {
      font-size: 13px; font-weight: 600; line-height: 1.1; opacity: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .state {
      font-size: 12px; font-weight: 400; line-height: 1.1; opacity: 1;
      color: var(--dom-state-off, rgba(36, 48, 68, 0.62));
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .now {
      font-size: 22px; font-weight: 600; letter-spacing: -0.03em;
      flex: 0 0 auto; line-height: 1;
    }
    .hero { gap: 10px; padding: 0 6px; }
    .hero .now { font-size: var(--dom-setpoint-size, 40px); }
    .hero.temp .icon-wrap:not(.power) {
      color: var(--dom-icon-on, #ffd56a);
      background: var(--dom-icon-on-bg, rgba(255, 196, 72, 0.32));
      filter: var(--dom-icon-glow, drop-shadow(0 0 5px rgba(255, 190, 60, 0.75)));
    }
    .power { margin-left: auto; border: 0; cursor: pointer; color: inherit; }
    .power:disabled { opacity: 0.35; cursor: default; }
    .control-row { display: flex; width: 100%; min-height: 50px; }
    .probe, .control {
      display: grid; width: 100%; box-sizing: border-box;
      grid-template-columns: 38px 3.6rem 36px repeat(6, 36px) minmax(0, 1fr) 22px;
      column-gap: 4px; align-items: center;
      padding-right: 12px;
    }
    .kind { display: contents; }
    .kind-btn:last-child { justify-self: center; }
    .kind-btn {
      width: 38px; height: 38px; min-width: 38px; padding: 0; border-radius: 50%;
      border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      background: var(--dom-icon-off-bg, rgba(36, 48, 68, 0.10));
      color: var(--dom-icon-off, #3a4458);
    }
    .kind-btn .glyph { width: 22px; height: 22px; }
    .kind-btn.on {
      background: var(--dom-bubble-on, rgba(116, 154, 214, 0.88));
      color: var(--dom-name-on, #f7f8fc);
    }
    .kind-btn:disabled { opacity: 0.35; cursor: default; }
    .stepper {
      display: flex; align-items: center; gap: 12px;
      grid-column: 5 / 10; justify-self: start;
    }
    .step {
      width: 36px; height: 36px; min-width: 36px; padding: 0; border-radius: 50%;
      border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      background: var(--dom-icon-off-bg, rgba(36, 48, 68, 0.10));
      color: var(--dom-icon-off, #3a4458);
    }
    .step .glyph { width: 20px; height: 20px; }
    .step:disabled { opacity: 0.35; cursor: default; }
    .value { min-width: 4.6rem; text-align: center; font-size: 18px; font-weight: 600; }
    .value.edit { cursor: text; }
    .value input {
      width: 100%; min-width: 4.6rem; margin: 0; padding: 0; border: 0;
      background: transparent; color: inherit; font: inherit; text-align: center;
      outline: none; -moz-appearance: textfield;
    }
    .value input::-webkit-outer-spin-button,
    .value input::-webkit-inner-spin-button { appearance: none; }
    .timer-edit {
      display: inline-flex; align-items: baseline; justify-content: center;
      min-width: 4.6rem;
    }
    .timer-edit input { width: 2rem; min-width: 1.5rem; }
    .timer-edit input.mins { text-align: right; }
    .timer-edit input.secs { text-align: left; }
    .timer-edit .sep { flex: 0 0 auto; padding: 0 1px; user-select: none; pointer-events: none; }
    .speeds {
      display: inline-flex; align-items: stretch;
      grid-column: 10 / 12; justify-self: end;
      height: 32px; min-width: 76px; padding: 0; gap: 0;
      border-radius: 16px; overflow: hidden;
      border: 1px solid var(--dom-bubble-off-edge, rgba(255, 255, 255, 0.55));
      background: var(--dom-icon-off-bg, rgba(36, 48, 68, 0.08));
    }
    .speed-btn {
      flex: 1; height: 100%; border: 0; border-radius: 0; padding: 0 10px;
      min-width: 38px; cursor: pointer;
      color: var(--dom-name-off, #243044);
    }
    .speed-btn .glyph { width: 22px; height: 22px; display: block; }
    .speed-btn.on {
      background: var(--dom-bubble-on, rgba(116, 154, 214, 0.88));
      color: var(--dom-name-on, #f7f8fc);
    }
    .speed-btn:disabled { opacity: 0.35; cursor: default; }
    .probes { display: flex; flex-direction: column; gap: 8px; }
    .probe .now { min-width: 0; justify-self: center; }
    .shaft-gap { width: 36px; height: 36px; }
    .cluster { display: contents; }
    .tip {
      width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; line-height: 1; letter-spacing: -0.04em;
      background: var(--dom-icon-off-bg, rgba(36, 48, 68, 0.10));
      color: var(--dom-name-off, #243044);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .tip.min {
      background: var(--dom-bubble-on, rgba(116, 154, 214, 0.88));
      color: var(--dom-name-on, #f7f8fc);
    }
    .amb {
      margin-left: 4px;
      background: var(--dom-bubble-heat, rgba(236, 196, 112, 0.78));
      color: var(--dom-name-off, #243044);
    }
    .batt {
      width: 22px; height: 22px; justify-self: end; grid-column: 11;
      --mdc-icon-size: 22px; --iron-icon-width: 22px; --iron-icon-height: 22px;
      color: var(--dom-icon-off, #3a4458);
    }
    .batt svg, ha-icon.batt { display: block; width: 22px; height: 22px; }
    @container s1 (max-width: 400px) {
      .probe { grid-template-columns: 38px auto 1fr 22px; }
      .cluster { display: flex; align-items: center; justify-content: flex-end; }
      .cluster > .tip:not(.amb) { display: none; }
      .shaft-gap { display: none; }
      .amb { margin-left: 0; }
      .batt { grid-column: auto; }
      .speeds { display: none; }
    }
  `;

  class ProtempS1Card extends HTMLElement {
    static getConfigElement() {
      return document.createElement(`${CARD}-editor`);
    }

    static getStubConfig() {
      return {};
    }

    constructor() {
      super();
      this._config = {};
      this._editing = false;
    }

    setConfig(config) {
      this._config = config || {};
      try {
        if (this._hass && this._root) this._update();
      } catch (err) {
        console.error("protemp-s1-card", err);
      }
    }

    set hass(hass) {
      this._hass = hass;
      this._config = this._config || {};
      try {
        if (!this._root) this._build();
        this._update();
      } catch (err) {
        console.error("protemp-s1-card", err);
      }
    }

    getCardSize() {
      return 6;
    }

    getGridOptions() {
      return { columns: 12, rows: "auto", min_columns: 6, min_rows: 4 };
    }

    _build() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = CSS;

      this._empty = h("div", "empty");
      this._body = h("div", "stack");

      const hero = h("div", "pill hero", this._body);
      this._hero = hero;
      const heroIcon = h("div", "icon-wrap", hero);
      icon("thermo", heroIcon);
      heroIcon.title = "Dome";
      this._now = h("div", "now", hero);
      this._now.title = "Dome";
      const heroCol = h("div", "col", hero);
      this._name = h("div", "name", heroCol);
      this._sub = h("div", "state", heroCol);
      this._power = h("button", "icon-wrap power", hero);
      this._power.type = "button";
      this._power.title = "Power";
      icon("power", this._power);
      this._power.addEventListener("click", () => this._togglePower());

      this._controlRow = h("div", "control-row", this._body);
      const control = h("div", "pill control", this._controlRow);
      this._control = control;
      const kind = h("div", "kind", control);
      this._tempBtn = h("button", "kind-btn", kind);
      this._tempBtn.type = "button";
      this._tempBtn.title = "Temperature";
      icon("thermo", this._tempBtn);
      this._tempBtn.addEventListener("click", () => this._setMode("temperature"));
      this._timerBtn = h("button", "kind-btn", kind);
      this._timerBtn.type = "button";
      this._timerBtn.title = "Timer";
      icon("timer", this._timerBtn);
      this._timerBtn.addEventListener("click", () => this._setMode("timer"));
      const stepper = h("div", "stepper", control);
      this._minus = h("button", "step", stepper);
      this._minus.type = "button";
      this._minus.title = "Minus";
      icon("minus", this._minus);
      this._minus.addEventListener("click", () => this._nudge(-1));
      this._value = h("div", "value", stepper);
      this._value.addEventListener("click", () => this._beginEdit());
      this._plus = h("button", "step", stepper);
      this._plus.type = "button";
      this._plus.title = "Plus";
      icon("plus", this._plus);
      this._plus.addEventListener("click", () => this._nudge(1));

      this._speeds = h("div", "speeds", control);
      this._speedBtns = {};
      [
        ["slow", "turtle"],
        ["fast", "rabbit"],
      ].forEach(([key, glyph]) => {
        const btn = h("button", "speed-btn", this._speeds);
        btn.type = "button";
        const label = key === "slow" ? "Slow" : "Fast";
        btn.title = label;
        btn.setAttribute("aria-label", label);
        icon(glyph, btn);
        btn.addEventListener("click", () => this._setSpeed(key));
        this._speedBtns[key] = btn;
      });

      this._probes = h("div", "probes", this._body);
      this._probeRow = {};
      for (let slot = 1; slot <= 4; slot += 1) {
        this._probes.append(this._makeProbe(slot));
      }

      this.shadowRoot.append(style, this._empty, this._body);
      this._root = true;
    }

    _makeProbe(slot) {
      const row = h("div", "pill probe");
      const ch = h("div", "icon-wrap ch", row);
      ch.textContent = `CH\u2009${slot}`;
      ch.title = `CH ${slot}`;
      const now = h("div", "now", row);
      now.title = "Minimum";
      h("div", "shaft-gap", row);
      const cluster = h("div", "cluster", row);
      const tipNodes = [];
      for (let t = 1; t <= 5; t += 1) {
        const tip = h("div", "tip", cluster);
        tip.title = `T${t}`;
        tipNodes.push(tip);
      }
      const amb = h("div", "tip amb", cluster);
      amb.title = "Ambient";
      const batt = makeBattery(row);
      this._probeRow[slot] = { row, now, tipNodes, amb, batt };
      return row;
    }

    _deviceId() {
      const ids = cheftempDeviceIds(this._hass);
      const wanted = this._config && this._config.device;
      if (wanted && ids.includes(wanted)) return wanted;
      if (ids.length === 1) return ids[0];
      return wanted || ids[0] || null;
    }

    _state(entityId) {
      if (!entityId || !this._hass) return null;
      return this._hass.states[entityId] || null;
    }

    _update() {
      if (!this._root) return;
      const deviceId = this._deviceId();
      if (!deviceId) {
        this._body.hidden = true;
        this._empty.hidden = false;
        this._empty.textContent = "Add ProTemp S1 first.";
        return;
      }
      this._empty.hidden = true;
      this._body.hidden = false;
      const ids = mapEntities(this._hass, deviceId);
      this._ids = ids;
      const device = (this._hass.devices || {})[deviceId];
      this._name.textContent = (device && (device.name_by_user || device.name)) || "ProTemp S1";
      this._name.title = this._name.textContent;
      const battery = num(this._state(ids.battery));
      const fan = this._state(ids.fan);
      const fanKey = fan && FAN[fan.state] ? fan.state : null;
      const fanLabel = fanKey ? FAN[fanKey] : "Fan —";
      const pack = battery === null ? "Battery —" : `${battery}%`;
      this._sub.textContent = `${fanLabel} · ${pack}`;
      this._sub.title = `${fanLabel} · ${pack}`;
      this._now.textContent = fmtTemp(num(this._state(ids.dome)), 0);

      const modeState = this._state(ids.mode);
      const mode = modeState && modeState.state !== "unavailable" ? modeState.state : null;
      const ready = Boolean(modeState && modeState.state !== "unavailable" && modeState.state !== "unknown");
      const selected = mode === "temperature" || mode === "timer";
      const running = fanKey === "slow" || fanKey === "fast";
      this._hero.classList.toggle("on", selected && !running);
      this._hero.classList.toggle("temp", mode === "temperature");
      this._hero.classList.toggle("heat", Boolean(running));
      this._power.disabled = !ready;
      this._tempBtn.classList.toggle("on", mode === "temperature");
      this._timerBtn.classList.toggle("on", mode === "timer");
      this._tempBtn.disabled = !ready;
      this._timerBtn.disabled = !ready;

      const idle = mode === "off" || mode === null;
      this._controlRow.classList.toggle("hide", idle);
      this._speeds.classList.toggle("hide", mode !== "timer");

      const speedState = this._state(ids.speed);
      const speedReady = Boolean(speedState && speedState.state !== "unavailable" && speedState.state !== "unknown");
      Object.entries(this._speedBtns).forEach(([key, btn]) => {
        btn.classList.toggle("on", speedState && speedState.state === key);
        btn.disabled = !speedReady;
      });

      const setpoint = num(this._state(ids.setpoint));
      const timer = num(this._state(ids.timer));
      this._value.classList.toggle("edit", mode === "temperature" || mode === "timer");
      this._value.title = mode === "timer" ? "Timer" : "Setpoint";
      if (!this._editing) {
        if (mode === "timer") this._value.textContent = fmtTimer(timer);
        else if (mode === "temperature") {
          this._value.textContent = setpoint === null ? "—" : `${Math.round(setpoint)}°`;
        }
      }
      if (mode === "timer") {
        this._minus.disabled = !ready || timer === null || this._editing;
        this._plus.disabled = !ready || timer === null || this._editing;
      } else if (mode === "temperature") {
        this._minus.disabled = !ready || setpoint === null || this._editing;
        this._plus.disabled = !ready || setpoint === null || this._editing;
      } else {
        this._minus.disabled = true;
        this._plus.disabled = true;
      }
      for (let slot = 1; slot <= 4; slot += 1) this._paintProbe(slot, ids);
    }

    _paintProbe(slot, ids) {
      const row = this._probeRow[slot];
      const tips = [];
      for (let t = 1; t <= 5; t += 1) {
        tips.push(num(this._state(ids.tips[slot][t])));
      }
      const minVal = num(this._state(ids.probe[slot]));
      const ambVal = num(this._state(ids.probeAmbient[slot]));
      const battVal = num(this._state(ids.probeBattery[slot]));
      const online = minVal !== null || tips.some((value) => value !== null);
      row.row.classList.toggle("hide", !online);
      if (!online) return;
      const known = tips.filter((value) => value !== null);
      const active = minVal !== null ? minVal : (known.length ? Math.min(...known) : null);
      row.now.textContent = fmtProbeTemp(active);
      let marked = false;
      row.tipNodes.forEach((node, index) => {
        const value = tips[index];
        node.textContent = fmtProbeTemp(value);
        const isMin = !marked && sameTemp(value, active);
        if (isMin) marked = true;
        node.classList.toggle("min", isMin);
      });
      row.amb.textContent = fmtProbeTemp(ambVal);
      setBattery(row.batt, battVal);
    }

    _beginEdit() {
      const ids = this._ids;
      if (!ids || !this._hass || this._editing) return;
      const mode = this._state(ids.mode) && this._state(ids.mode).state;
      if (mode === "temperature") this._beginTempEdit(ids);
      else if (mode === "timer") this._beginTimerEdit(ids);
    }

    _beginTempEdit(ids) {
      if (!ids.setpoint) return;
      const st = this._state(ids.setpoint);
      const current = num(st);
      if (current === null) return;
      this._editing = true;
      const input = document.createElement("input");
      input.type = "number";
      input.min = String(st.attributes.min ?? 30);
      input.max = String(st.attributes.max ?? 200);
      input.step = String(st.attributes.step ?? 1);
      input.value = String(Math.round(current));
      input.setAttribute("aria-label", "Setpoint");
      this._value.replaceChildren(input);
      this._minus.disabled = true;
      this._plus.disabled = true;
      input.focus();
      input.select();
      const finish = (commit) => {
        if (!this._editing) return;
        this._editing = false;
        if (commit) {
          const value = Number(input.value);
          if (Number.isFinite(value)) {
            const min = Number(st.attributes.min ?? 30);
            const max = Number(st.attributes.max ?? 200);
            this._hass.callService("number", "set_value", {
              entity_id: ids.setpoint,
              value: Math.min(max, Math.max(min, value)),
            });
          }
        }
        this._update();
      };
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          input.blur();
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          finish(false);
        }
      });
      input.addEventListener("blur", () => finish(true));
    }

    _beginTimerEdit(ids) {
      if (!ids.timer) return;
      const st = this._state(ids.timer);
      const current = num(st);
      if (current === null) return;
      this._editing = true;
      const total = Math.max(0, Math.round(current));
      const wrap = document.createElement("div");
      wrap.className = "timer-edit";
      const mins = document.createElement("input");
      mins.className = "mins";
      mins.inputMode = "numeric";
      mins.setAttribute("aria-label", "Minutes");
      mins.value = String(Math.floor(total / 60));
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = ":";
      const secs = document.createElement("input");
      secs.className = "secs";
      secs.inputMode = "numeric";
      secs.maxLength = 2;
      secs.setAttribute("aria-label", "Seconds");
      secs.value = String(total % 60).padStart(2, "0");
      wrap.append(mins, sep, secs);
      this._value.replaceChildren(wrap);
      this._minus.disabled = true;
      this._plus.disabled = true;
      const digits = (el, maxLen) => {
        el.addEventListener("input", () => {
          el.value = el.value.replace(/\D/g, "").slice(0, maxLen);
        });
      };
      digits(mins, 3);
      digits(secs, 2);
      const finish = (commit) => {
        if (!this._editing) return;
        this._editing = false;
        if (commit) {
          const minutes = Number(mins.value);
          const seconds = Number(secs.value);
          if (Number.isFinite(minutes) || Number.isFinite(seconds)) {
            const min = Number(st.attributes.min ?? 0);
            const max = Number(st.attributes.max ?? 3600);
            const value = (Number.isFinite(minutes) ? minutes : 0) * 60 + Math.min(59, Number.isFinite(seconds) ? seconds : 0);
            this._hass.callService("number", "set_value", {
              entity_id: ids.timer,
              value: Math.min(max, Math.max(min, value)),
            });
          }
        }
        this._update();
      };
      const onKey = (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          finish(true);
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          finish(false);
        }
      };
      mins.addEventListener("keydown", onKey);
      secs.addEventListener("keydown", onKey);
      const onBlur = (ev) => {
        if (wrap.contains(ev.relatedTarget)) return;
        finish(true);
      };
      mins.addEventListener("blur", onBlur);
      secs.addEventListener("blur", onBlur);
      mins.focus();
      mins.select();
    }

    _nudge(direction) {
      const ids = this._ids;
      if (!ids || !this._hass || this._editing) return;
      const mode = this._state(ids.mode) && this._state(ids.mode).state;
      if (mode === "temperature" && ids.setpoint) {
        const st = this._state(ids.setpoint);
        const current = num(st);
        if (current === null) return;
        const min = Number(st.attributes.min ?? 30);
        const max = Number(st.attributes.max ?? 200);
        const step = Number(st.attributes.step ?? 1);
        this._hass.callService("number", "set_value", {
          entity_id: ids.setpoint,
          value: Math.min(max, Math.max(min, current + direction * step)),
        });
      } else if (mode === "timer" && ids.timer) {
        const st = this._state(ids.timer);
        const current = num(st);
        if (current === null) return;
        const min = Number(st.attributes.min ?? 0);
        const max = Number(st.attributes.max ?? 3600);
        this._hass.callService("number", "set_value", {
          entity_id: ids.timer,
          value: Math.min(max, Math.max(min, current + direction * 30)),
        });
      }
    }

    _setMode(option) {
      const ids = this._ids;
      if (!ids || !ids.mode || !this._hass) return;
      this._hass.callService("select", "select_option", { entity_id: ids.mode, option });
    }

    _togglePower() {
      const ids = this._ids;
      if (!ids || !ids.mode) return;
      const mode = this._state(ids.mode) && this._state(ids.mode).state;
      this._setMode(mode === "off" ? "temperature" : "off");
    }

    _setSpeed(option) {
      const ids = this._ids;
      if (!ids || !ids.speed || !this._hass) return;
      this._hass.callService("select", "select_option", { entity_id: ids.speed, option });
    }
  }

  class ProtempS1CardEditor extends HTMLElement {
    setConfig(config) {
      this._config = { ...(config || {}) };
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._form) this._form.hass = hass;
      else this._render();
    }

    _render() {
      if (!this._hass) return;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.addEventListener("value-changed", (ev) => {
          this._config = ev.detail.value;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
        });
        this.append(this._form);
      }
      this._form.hass = this._hass;
      this._form.data = this._config;
      this._form.schema = [
        { name: "device", selector: { device: { filter: { integration: "cheftemp" } } } },
      ];
      this._form.computeLabel = (schema) => (schema.name === "device" ? "ProTemp S1" : schema.name);
    }
  }

  function defineWhenReady(name, ctor) {
    const attempt = () => {
      if (customElements.get(name)) return;
      try {
        customElements.define(name, ctor);
      } catch (err) {
        console.error("protemp-s1-card define", name, err);
      }
    };
    attempt();
    customElements.whenDefined("home-assistant").then(attempt);
    [0, 100, 1000].forEach((ms) => setTimeout(attempt, ms));
  }

  defineWhenReady(CARD, ProtempS1Card);
  defineWhenReady(`${CARD}-editor`, ProtempS1CardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((item) => item.type === CARD)) {
    window.customCards.push({
      type: CARD,
      name: "ProTemp S1",
      description: "Bubble-style ProTemp S1: dome, mode, setpoint, and probes.",
      preview: true,
    });
  }
})();
