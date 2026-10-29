(() => {
  const CARD = "protemp-s1-card";
  const MODES = [
    ["temperature", "Temperature"],
    ["off", "Off"],
    ["timer", "Timer"],
  ];
  const FAN = {
    offline: "Offline",
    slow: "Slow",
    fast: "Fast",
    paused: "Paused",
    stopped: "Stopped",
  };

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
    Object.values(hass.entities || {}).forEach((meta) => {
      if (meta && meta.platform === "cheftemp" && meta.device_id) ids.add(meta.device_id);
    });
    return [...ids];
  }

  function mapEntities(hass, deviceId) {
    const out = { tips: { 1: {}, 2: {}, 3: {}, 4: {} }, probe: {}, probeAmbient: {}, probeBattery: {} };
    Object.entries(hass.entities || {}).forEach(([entityId, meta]) => {
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
    return `${value.toFixed(digits)}°`;
  }

  function fmtTimer(seconds) {
    if (seconds === null || seconds === undefined) return "—";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function circleClass(value, extra) {
    const bits = ["dot"];
    if (extra) bits.push(extra);
    if (value === null) bits.push("empty");
    else if (value < 40) bits.push("cool");
    else if (value < 60) bits.push("warm");
    else if (value < 80) bits.push("hot");
    else bits.push("fire");
    return bits.join(" ");
  }

  function circleLabel(value) {
    if (value === null) return "";
    return Number.isInteger(value) ? String(value) : value.toFixed(0);
  }

  const CSS = `
    :host { display: block; }
    ha-card { padding: 16px 18px 18px; }
    button {
      appearance: none;
      -webkit-appearance: none;
      font: inherit;
      color: inherit;
      margin: 0;
      background: transparent;
      box-sizing: border-box;
    }
    .empty { padding: 24px 8px; text-align: center; color: var(--secondary-text-color); }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .name { font-size: 0.95rem; font-weight: 600; }
    .pack { color: var(--secondary-text-color); font-size: 0.85rem; }
    .hero { text-align: center; padding: 6px 0 0; }
    .now { font-size: 4.4rem; font-weight: 300; letter-spacing: -0.06em; line-height: 1; }
    .hint { margin-top: 4px; color: var(--secondary-text-color); font-size: 0.95rem; }
    .fan {
      margin-top: 10px;
      font-size: 1.55rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      line-height: 1.1;
    }
    .fan.muted { color: var(--secondary-text-color); font-weight: 400; }
    .speed { display: block; margin-top: 2px; font-size: 0.8rem; font-weight: 400; color: var(--secondary-text-color); letter-spacing: 0; }
    .control { display: flex; align-items: center; justify-content: center; gap: 18px; margin: 16px 0 14px; min-height: 52px; }
    .step {
      width: 44px;
      height: 44px;
      min-width: 44px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid var(--divider-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }
    .step:disabled { opacity: 0.35; cursor: default; }
    .value { min-width: 5.5rem; text-align: center; font-size: 1.8rem; font-weight: 500; }
    .off-label { color: var(--secondary-text-color); font-size: 1.2rem; }
    .modes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .mode {
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      padding: 11px 10px;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .mode.on {
      background: var(--primary-text-color);
      color: var(--card-background-color, var(--ha-card-background, #fff));
      border-color: var(--primary-text-color);
    }
    .mode:disabled { opacity: 0.35; cursor: default; }
    .probes { display: flex; flex-direction: column; gap: 14px; }
    .probe { display: flex; flex-direction: column; gap: 6px; }
    .probe-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .slot { font-size: 0.85rem; font-weight: 700; }
    .batt { font-size: 0.8rem; color: var(--secondary-text-color); }
    .stats { display: flex; gap: 14px; }
    .stat { display: flex; flex-direction: column; gap: 1px; }
    .stat span { font-size: 0.68rem; text-transform: lowercase; letter-spacing: 0.04em; color: var(--secondary-text-color); }
    .stat b { font-size: 0.95rem; font-weight: 600; }
    .shaft { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 6px; }
    .end { font-size: 0.65rem; letter-spacing: 0.04em; text-transform: lowercase; color: var(--secondary-text-color); }
    .dots { display: flex; gap: 5px; justify-content: space-between; }
    .dot {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 600;
      background: color-mix(in srgb, var(--disabled-text-color) 18%, transparent);
      color: var(--secondary-text-color);
    }
    .dot.empty { background: color-mix(in srgb, var(--disabled-text-color) 12%, transparent); }
    .dot.cool { background: color-mix(in srgb, #5b8def 28%, var(--ha-card-background, transparent)); color: var(--primary-text-color); }
    .dot.warm { background: color-mix(in srgb, #e0a106 32%, var(--ha-card-background, transparent)); color: var(--primary-text-color); }
    .dot.hot { background: color-mix(in srgb, #e26a2c 38%, var(--ha-card-background, transparent)); color: var(--primary-text-color); }
    .dot.fire { background: color-mix(in srgb, #d73728 42%, var(--ha-card-background, transparent)); color: var(--primary-text-color); }
    .dot.handle { outline: 1px dashed color-mix(in srgb, var(--secondary-text-color) 45%, transparent); outline-offset: 1px; }
    .probe.off .stat b, .probe.off .batt { color: var(--secondary-text-color); font-weight: 500; }
  `;

  class ProtempS1Card extends HTMLElement {
    static getConfigElement() {
      return document.createElement(`${CARD}-editor`);
    }

    static getStubConfig() {
      return {};
    }

    setConfig(config) {
      this._config = config || {};
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._root) this._build();
      this._update();
    }

    getCardSize() {
      return 9;
    }

    getGridOptions() {
      return { columns: 12, min_rows: 8 };
    }

    _build() {
      this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = CSS;
      const card = document.createElement("ha-card");
      this._empty = document.createElement("div");
      this._empty.className = "empty";
      this._body = document.createElement("div");

      const top = document.createElement("div");
      top.className = "top";
      this._name = document.createElement("div");
      this._name.className = "name";
      this._pack = document.createElement("div");
      this._pack.className = "pack";
      top.append(this._name, this._pack);

      const hero = document.createElement("div");
      hero.className = "hero";
      this._now = document.createElement("div");
      this._now.className = "now";
      this._hint = document.createElement("div");
      this._hint.className = "hint";
      this._fan = document.createElement("div");
      this._fan.className = "fan";
      this._fanLabel = document.createElement("span");
      this._speed = document.createElement("span");
      this._speed.className = "speed";
      this._fan.append(this._fanLabel, this._speed);
      hero.append(this._now, this._hint, this._fan);

      const control = document.createElement("div");
      control.className = "control";
      this._minus = document.createElement("button");
      this._minus.className = "step";
      this._minus.type = "button";
      this._minus.textContent = "−";
      this._minus.addEventListener("click", () => this._nudge(-1));
      this._value = document.createElement("div");
      this._value.className = "value";
      this._plus = document.createElement("button");
      this._plus.className = "step";
      this._plus.type = "button";
      this._plus.textContent = "+";
      this._plus.addEventListener("click", () => this._nudge(1));
      this._off = document.createElement("div");
      this._off.className = "off-label";
      this._off.textContent = "Off";
      control.append(this._minus, this._value, this._plus, this._off);

      const modes = document.createElement("div");
      modes.className = "modes";
      this._modeBtns = {};
      MODES.forEach(([key, label]) => {
        const btn = document.createElement("button");
        btn.className = "mode";
        btn.type = "button";
        btn.textContent = label;
        btn.addEventListener("click", () => this._setMode(key));
        this._modeBtns[key] = btn;
        modes.append(btn);
      });

      this._probes = document.createElement("div");
      this._probes.className = "probes";
      this._probeRow = {};
      for (let slot = 1; slot <= 4; slot += 1) {
        const row = document.createElement("div");
        row.className = "probe";
        const head = document.createElement("div");
        head.className = "probe-head";
        const name = document.createElement("div");
        name.className = "slot";
        name.textContent = `CH${slot}`;
        const batt = document.createElement("div");
        batt.className = "batt";
        head.append(name, batt);

        const stats = document.createElement("div");
        stats.className = "stats";
        const min = this._stat("min");
        const amb = this._stat("amb");
        stats.append(min.wrap, amb.wrap);

        const shaft = document.createElement("div");
        shaft.className = "shaft";
        const tip = document.createElement("span");
        tip.className = "end";
        tip.textContent = "tip";
        const dots = document.createElement("div");
        dots.className = "dots";
        const circles = [];
        for (let n = 1; n <= 5; n += 1) {
          const dot = document.createElement("div");
          dot.className = "dot empty";
          dots.append(dot);
          circles.push(dot);
        }
        const tail = document.createElement("span");
        tail.className = "end";
        tail.textContent = "tail";
        const handle = document.createElement("div");
        handle.className = "dot handle empty";
        shaft.append(tip, dots, tail, handle);

        row.append(head, stats, shaft);
        this._probes.append(row);
        this._probeRow[slot] = { row, batt, min, amb, circles, handle };
      }

      this._body.append(top, hero, control, modes, this._probes);
      card.append(this._empty, this._body);
      this.shadowRoot.append(style, card);
      this._root = true;
    }

    _stat(label) {
      const wrap = document.createElement("div");
      wrap.className = "stat";
      const name = document.createElement("span");
      name.textContent = label;
      const value = document.createElement("b");
      wrap.append(name, value);
      return { wrap, value };
    }

    _deviceId() {
      const ids = cheftempDeviceIds(this._hass);
      if (this._config.device && ids.includes(this._config.device)) return this._config.device;
      if (ids.length === 1) return ids[0];
      if (this._config.device) return this._config.device;
      return ids[0] || null;
    }

    _state(entityId) {
      if (!entityId || !this._hass) return null;
      return this._hass.states[entityId] || null;
    }

    _update() {
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
      const battery = num(this._state(ids.battery));
      this._pack.textContent = battery === null ? "Battery —" : `${battery}%`;
      const fan = this._state(ids.fan);
      const fanKey = fan && FAN[fan.state] ? fan.state : null;
      this._fan.className = fanKey && fanKey !== "offline" ? "fan" : "fan muted";
      this._fanLabel.textContent = fanKey ? FAN[fanKey] : "Fan —";
      const speed = this._state(ids.speed);
      const showSpeed = fanKey && fanKey !== "offline" && speed && (speed.state === "fast" || speed.state === "slow");
      this._speed.textContent = showSpeed ? (speed.state === "fast" ? "Fast airflow" : "Slow airflow") : "";
      this._speed.hidden = !showSpeed;
      const dome = num(this._state(ids.dome));
      this._now.textContent = fmtTemp(dome, 0);
      const modeState = this._state(ids.mode);
      const mode = modeState && modeState.state !== "unavailable" ? modeState.state : null;
      const setpoint = num(this._state(ids.setpoint));
      const timer = num(this._state(ids.timer));
      this._hint.textContent = setpoint === null ? "Setpoint —" : `Setpoint ${Math.round(setpoint)}°`;
      const ready = Boolean(modeState && modeState.state !== "unavailable" && modeState.state !== "unknown");
      Object.entries(this._modeBtns).forEach(([key, btn]) => {
        btn.classList.toggle("on", mode === key);
        btn.disabled = !ready;
      });
      const showOff = mode === "off" || mode === null;
      this._off.hidden = !showOff;
      this._minus.hidden = showOff;
      this._plus.hidden = showOff;
      this._value.hidden = showOff;
      if (mode === "timer") {
        this._value.textContent = fmtTimer(timer);
        this._minus.disabled = !ready || timer === null;
        this._plus.disabled = !ready || timer === null;
      } else if (mode === "temperature") {
        this._value.textContent = setpoint === null ? "—" : `${Math.round(setpoint)}°`;
        this._minus.disabled = !ready || setpoint === null;
        this._plus.disabled = !ready || setpoint === null;
      } else {
        this._minus.disabled = true;
        this._plus.disabled = true;
      }
      for (let slot = 1; slot <= 4; slot += 1) {
        const row = this._probeRow[slot];
        const minVal = num(this._state(ids.probe[slot]));
        const ambVal = num(this._state(ids.probeAmbient[slot]));
        const battVal = num(this._state(ids.probeBattery[slot]));
        const online = minVal !== null;
        row.row.classList.toggle("off", !online);
        row.batt.textContent = online && battVal !== null ? `${Math.round(battVal)}%` : "—";
        row.min.value.textContent = online ? fmtTemp(minVal, 1) : "—";
        row.amb.value.textContent = online ? fmtTemp(ambVal, 0) : "—";
        for (let tip = 1; tip <= 5; tip += 1) {
          const value = online ? num(this._state(ids.tips[slot][tip])) : null;
          const dot = row.circles[tip - 1];
          dot.className = circleClass(value);
          dot.textContent = circleLabel(value);
        }
        row.handle.className = circleClass(online ? ambVal : null, "handle");
        row.handle.textContent = online ? circleLabel(ambVal) : "";
      }
    }

    _nudge(direction) {
      const ids = this._ids;
      if (!ids || !this._hass) return;
      const modeState = this._state(ids.mode);
      const mode = modeState && modeState.state;
      if (mode === "temperature" && ids.setpoint) {
        const st = this._state(ids.setpoint);
        const current = num(st);
        if (current === null) return;
        const min = Number(st.attributes.min ?? 30);
        const max = Number(st.attributes.max ?? 200);
        const step = Number(st.attributes.step ?? 1);
        const next = Math.min(max, Math.max(min, current + direction * step));
        this._hass.callService("number", "set_value", { entity_id: ids.setpoint, value: next });
      } else if (mode === "timer" && ids.timer) {
        const st = this._state(ids.timer);
        const current = num(st);
        if (current === null) return;
        const min = Number(st.attributes.min ?? 0);
        const max = Number(st.attributes.max ?? 3600);
        const next = Math.min(max, Math.max(min, current + direction * 30));
        this._hass.callService("number", "set_value", { entity_id: ids.timer, value: next });
      }
    }

    _setMode(option) {
      const ids = this._ids;
      if (!ids || !ids.mode || !this._hass) return;
      this._hass.callService("select", "select_option", { entity_id: ids.mode, option });
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
        { name: "device", selector: { device: { integration: "cheftemp" } } },
      ];
      this._form.computeLabel = (schema) => (schema.name === "device" ? "ProTemp S1" : schema.name);
    }
  }

  customElements.define(CARD, ProtempS1Card);
  customElements.define(`${CARD}-editor`, ProtempS1CardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD,
    name: "ProTemp S1",
    description: "Dome, fan, mode, and four probes from tip to tail.",
    preview: true,
  });
})();
