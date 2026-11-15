const GREETINGS = {
  en: { morning: "Good morning", afternoon: "Good afternoon", night: "Good evening",
    card: "Greeting", about: "Greets the signed-in person by name over a sky that follows the time of day and the weather." },
  pt: { morning: "Bom dia", afternoon: "Boa tarde", night: "Boa noite",
    card: "Saudação", about: "Cumprimenta quem está logado pelo nome, sobre um céu que acompanha a hora do dia e o clima." },
  es: { morning: "Buenos días", afternoon: "Buenas tardes", night: "Buenas noches",
    card: "Saludo", about: "Saluda por su nombre a quien inició sesión, sobre un cielo que sigue la hora del día y el clima." },
};

const words = (language) => GREETINGS[(language || "en").split("-")[0]] || GREETINGS.en;

function period(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  return hour >= 12 && hour < 18 ? "afternoon" : "night";
}

// Home Assistant's weather conditions, folded into the few skies the card can draw.
const SKIES = {
  rainy: "rain", "snowy-rainy": "rain", hail: "rain", pouring: "pour",
  lightning: "storm", "lightning-rainy": "storm", snowy: "snow",
  cloudy: "cloudy", windy: "cloudy", "windy-variant": "cloudy", fog: "fog", partlycloudy: "partly",
};
const OVERCAST = ["rain", "pour", "storm", "snow", "cloudy", "fog"];

// The same spot every time, so a redraw does not shuffle the sky.
const spread = (index, salt) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const GREETING_STYLE = `
  :host { display:block }
  .card { position:relative; overflow:hidden; isolation:isolate; min-height:112px; box-sizing:border-box;
    display:flex; flex-direction:column; justify-content:center; padding:18px 100px 18px 20px;
    border-radius:var(--ha-card-border-radius, 22px); color:#fff;
    font-family:var(--ha-font-family-body, inherit);
    box-shadow:inset 0 0 0 1px rgba(255, 255, 255, .12) }
  h2 { margin:0; font-size:21px; line-height:1.25; font-weight:600; letter-spacing:-.01em;
    text-shadow:0 1px 8px rgba(0, 10, 40, .45) }
  p { margin:4px 0 0; font-size:13px; line-height:1.35; opacity:.9; text-shadow:0 1px 6px rgba(0, 10, 40, .45) }
  p:empty { display:none }
  .sky { position:absolute; inset:0; z-index:-1; overflow:hidden; pointer-events:none }
  .sky i { position:absolute; display:block }

  .night .sky { background:linear-gradient(160deg, #0a0f2c 0%, #1b1f52 55%, #3b2f73 100%) }
  .morning .sky { background:linear-gradient(115deg, #3a86cf 0%, #6aaee6 42%, #ffc48a 80%, #ff9560 100%) }
  .afternoon .sky { background:linear-gradient(160deg, #1f7fe0 0%, #4da6f5 55%, #8fd0ff 100%) }
  .overcast.morning .sky, .overcast.afternoon .sky { background:linear-gradient(160deg, #4d6178 0%, #74889d 60%, #98a9b9 100%) }
  .overcast.night .sky { background:linear-gradient(160deg, #0d1222 0%, #1d2438 60%, #333c55 100%) }

  .star { width:2px; height:2px; border-radius:50%; background:#fff;
    animation:twinkle var(--t) ease-in-out var(--d) infinite }
  .star.big { width:3px; height:3px; box-shadow:0 0 6px 1px rgba(200, 215, 255, .7) }
  .shoot { top:14%; right:30%; width:46px; height:1.5px; border-radius:2px; opacity:0;
    background:linear-gradient(90deg, #fff, transparent); animation:shoot 9s ease-in 3s infinite }
  .orb { right:26px; top:50%; width:46px; height:46px; margin-top:-23px }
  .orb i { inset:0; border-radius:50% }
  .moon .disc { background:radial-gradient(circle at 35% 30%, #fff 0%, #dfe5f2 60%, #b9c2d6 100%);
    box-shadow:0 1px 3px rgba(0, 0, 0, .5) }
  .moon .halo { inset:-16px; background:radial-gradient(circle, rgba(190, 205, 255, .5) 0%, rgba(190, 205, 255, 0) 68%);
    animation:glow 4.5s ease-in-out infinite }
  .moon { animation:float 7s ease-in-out infinite alternate }
  .orb .crater { inset:auto; border-radius:50%; background:#a7b1c8; box-shadow:inset 1px 1px 1px rgba(60, 70, 100, .45) }

  .sun .disc { background:radial-gradient(circle at 35% 30%, #fff6c2 0%, #ffd23f 55%, #ffab1a 100%);
    box-shadow:0 0 18px 4px rgba(255, 205, 80, .55) }
  .sun .halo { inset:-22px; background:radial-gradient(circle, rgba(255, 225, 130, .6) 0%, rgba(255, 225, 130, 0) 68%);
    animation:glow 3.6s ease-in-out infinite }
  .sun .rays { inset:-30px;
    background:repeating-conic-gradient(rgba(255, 236, 150, .75) 0 7deg, rgba(255, 236, 150, 0) 7deg 30deg);
    -webkit-mask:radial-gradient(circle, transparent 42%, #000 46%, transparent 72%);
    mask:radial-gradient(circle, transparent 42%, #000 46%, transparent 72%);
    animation:spin 26s linear infinite }
  .afternoon .sun { width:54px; height:54px; margin-top:-30px }
  .afternoon .sun .rays { inset:-32px; animation-duration:16s }
  .afternoon .sun .halo { inset:-34px; animation-duration:2.6s }
  .morning .sun { top:auto; bottom:2px; margin:0; animation:dawn 7s ease-in-out infinite alternate }
  .morning .horizon { right:-30px; bottom:-60px; width:220px; height:120px; border-radius:50%;
    background:radial-gradient(ellipse, rgba(255, 190, 110, .75) 0%, rgba(255, 190, 110, 0) 70%);
    animation:glow 7s ease-in-out infinite }

  .cloud { width:58px; height:20px; border-radius:999px; background:var(--cloud, #fff);
    animation:drift var(--t) ease-in-out var(--d) infinite alternate }
  .cloud::before, .cloud::after { content:""; position:absolute; border-radius:50%; background:inherit }
  .cloud::before { width:26px; height:26px; left:9px; top:-12px }
  .cloud::after { width:20px; height:20px; right:9px; top:-8px }
  .overcast { --cloud:#dfe6ee }
  .overcast.night { --cloud:#59647f }
  .night { --cloud:#8d98b8 }

  .drop { top:-18px; width:1.5px; height:13px; border-radius:2px;
    background:linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(235, 244, 255, .85));
    animation:fall var(--t) linear var(--d) infinite }
  .flake { top:-8px; width:4px; height:4px; border-radius:50%; background:#fff; opacity:.9;
    animation:snow var(--t) linear var(--d) infinite }
  .flash { inset:0; background:#fff; opacity:0; animation:flash 6.5s linear infinite }
  .mist { left:-20%; width:140%; height:34px;
    background:radial-gradient(ellipse at center, rgba(255, 255, 255, .28) 0%, rgba(255, 255, 255, 0) 70%);
    animation:drift var(--t) ease-in-out var(--d) infinite alternate }

  @keyframes twinkle { 0%, 100% { opacity:1; transform:scale(1) } 50% { opacity:.2; transform:scale(.6) } }
  @keyframes shoot { 0% { opacity:0; transform:translate3d(60px, -20px, 0) rotate(-24deg) }
    2% { opacity:1 } 9% { opacity:0; transform:translate3d(-120px, 60px, 0) rotate(-24deg) }
    100% { opacity:0; transform:translate3d(-120px, 60px, 0) rotate(-24deg) } }
  @keyframes glow { 0%, 100% { opacity:.65; transform:scale(1) } 50% { opacity:1; transform:scale(1.18) } }
  @keyframes float { from { transform:translateY(-3px) } to { transform:translateY(4px) } }
  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes dawn { from { transform:translateY(30px) } to { transform:translateY(-22px) } }
  @keyframes drift { from { transform:translateX(-10px) } to { transform:translateX(12px) } }
  @keyframes fall { to { transform:translate3d(-34px, 170px, 0) } }
  @keyframes snow { 50% { transform:translate3d(10px, 80px, 0) } 100% { transform:translate3d(-6px, 170px, 0) } }
  @keyframes flash { 0%, 90%, 100% { opacity:0 } 91% { opacity:.55 } 92% { opacity:.08 } 93.5% { opacity:.4 } 96% { opacity:0 } }
  @media (prefers-reduced-motion: reduce) { .sky i { animation:none !important } }
`;

class ConstantiniGreeting extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = config || {};
    this._draw();
  }

  set hass(hass) {
    this._hass = hass;
    this._draw();
  }

  connectedCallback() {
    this._draw();
    this._clock = setInterval(() => this._draw(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._clock);
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 6 };
  }

  static getStubConfig() {
    return {};
  }

  _weather() {
    const states = this._hass.states;
    const id = this._config.weather || Object.keys(states).find((key) => key.startsWith("weather."));
    const state = id && states[id];
    return state && !["unavailable", "unknown"].includes(state.state) ? state : null;
  }

  _draw() {
    const hass = this._hass;
    if (!hass || !this.isConnected) return;
    const root = this.shadowRoot;
    if (!root.querySelector(".card")) {
      root.innerHTML = `<style>${GREETING_STYLE}</style>
        <div class="card"><div class="sky" aria-hidden="true"></div><h2></h2><p></p></div>`;
    }
    let name = (this._config.name || (hass.user && hass.user.name) || "").trim();
    if (name && name === name.toLowerCase()) name = name[0].toUpperCase() + name.slice(1);
    const time = period(new Date().getHours());
    const greeting = words(hass.language)[time];
    const title = name ? `${greeting}, ${name}` : greeting;
    const weather = this._weather();
    let detail = "";
    if (weather && hass.formatEntityState) {
      detail = [hass.formatEntityState(weather),
        weather.attributes.temperature != null && hass.formatEntityAttributeValue(weather, "temperature")]
        .filter(Boolean).join(" · ");
    }
    if (root.querySelector("h2").textContent !== title) root.querySelector("h2").textContent = title;
    if (root.querySelector("p").textContent !== detail) root.querySelector("p").textContent = detail;

    const kind = (weather && SKIES[weather.state]) || "clear";
    const scene = `${time} ${kind}`;
    if (scene === this._scene) return;
    this._scene = scene;
    root.querySelector(".card").className = `card ${time}${OVERCAST.includes(kind) ? " overcast" : ""}`;
    this._paint(root.querySelector(".sky"), time, kind);
  }

  _paint(sky, time, kind) {
    sky.innerHTML = "";
    const put = (cls, style = {}, parent = sky) => {
      const el = document.createElement("i");
      el.className = cls;
      for (const [key, value] of Object.entries(style)) el.style.setProperty(key, value);
      parent.append(el);
      return el;
    };
    const many = (count, cls, style) => {
      for (let n = 0; n < count; n++) put(typeof cls === "function" ? cls(n) : cls, style(n));
    };
    const night = time === "night";
    const open = kind === "clear" || kind === "partly";

    if (night && open) {
      many(kind === "clear" ? 22 : 12, (n) => (n % 5 === 0 ? "star big" : "star"), (n) => ({
        left: `${4 + spread(n, 1) * 92}%`, top: `${6 + spread(n, 2) * 80}%`,
        "--t": `${2.4 + spread(n, 3) * 3}s`, "--d": `${-spread(n, 4) * 5}s`,
      }));
      if (kind === "clear") put("shoot");
    }
    if (time === "morning" && open) put("horizon");
    if (open) {
      const orb = put(`orb ${night ? "moon" : "sun"}`);
      put("halo", {}, orb);
      if (!night) put("rays", {}, orb);
      put("disc", {}, orb);
      if (night) {
        put("crater", { width: "12px", height: "12px", top: "9px", left: "21px" }, orb);
        put("crater", { width: "8px", height: "8px", top: "25px", left: "10px" }, orb);
        put("crater", { width: "6px", height: "6px", top: "30px", left: "27px" }, orb);
      }
    }
    if (kind === "partly") {
      put("cloud", { right: "14px", top: "58%", "--t": "9s", "--d": "0s" });
    } else if (!open && kind !== "fog") {
      [[8, 20, 1], [58, 42, .8], [-20, 56, .7]].forEach(([right, top, size], n) => put("cloud", {
        right: `${right}px`, top: `${top}px`, transform: `scale(${size})`, opacity: n ? ".85" : "1",
        "--t": `${8 + n * 2}s`, "--d": `${-n * 3}s`,
      }));
    }
    if (kind === "rain" || kind === "pour" || kind === "storm") {
      const heavy = kind !== "rain";
      many(heavy ? 34 : 20, "drop", (n) => ({
        left: `${spread(n, 5) * 108}%`, rotate: "11deg",
        "--t": `${(heavy ? .55 : .8) + spread(n, 6) * .5}s`, "--d": `${-spread(n, 7) * 2}s`,
      }));
      if (kind === "storm") put("flash");
    }
    if (kind === "snow") {
      many(20, "flake", (n) => ({
        left: `${spread(n, 5) * 100}%`, scale: `${.6 + spread(n, 8) * .7}`,
        "--t": `${5 + spread(n, 6) * 4}s`, "--d": `${-spread(n, 7) * 9}s`,
      }));
    }
    if (kind === "fog") {
      many(5, "mist", (n) => ({ top: `${n * 20 - 4}%`, left: `${-30 + spread(n, 9) * 30}%`, "--t": `${9 + n * 3}s`, "--d": `${-n * 4}s` }));
    }
  }
}

if (!customElements.get("constantini-greeting")) {
  customElements.define("constantini-greeting", ConstantiniGreeting);
  const text = words(navigator.language);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "constantini-greeting", name: `Constantini · ${text.card}`, description: text.about });
}

// Cards come in one after the other when a dashboard opens. The rule goes into the view's own
// shadow root as it is created, so the first frame is already the animated one.
const ENTRANCE = `
  hui-card { animation:constantini-in .45s cubic-bezier(.2, .8, .2, 1) backwards;
    animation-delay:calc(var(--constantini-wave, 0) * 70ms) }
  hui-card:nth-child(2) { animation-delay:calc(var(--constantini-wave, 0) * 70ms + 40ms) }
  hui-card:nth-child(3) { animation-delay:calc(var(--constantini-wave, 0) * 70ms + 80ms) }
  hui-card:nth-child(4) { animation-delay:calc(var(--constantini-wave, 0) * 70ms + 120ms) }
  hui-card:nth-child(5) { animation-delay:calc(var(--constantini-wave, 0) * 70ms + 160ms) }
  hui-card:nth-child(n+6) { animation-delay:calc(var(--constantini-wave, 0) * 70ms + 200ms) }
  @keyframes constantini-in { from { opacity:0; transform:translateY(12px) scale(.985) } }
  @media (prefers-reduced-motion: reduce) { hui-card { animation:none } }
`;
const CARD_HOSTS = ["hui-grid-section", "hui-masonry-view", "hui-sidebar-view", "hui-panel-view"];
let sheet = null;
let wave = 0;
let lastHost = 0;

function animateCards(host, root) {
  if (!root) return;
  const now = performance.now();
  if (now - lastHost > 400) wave = 0;
  lastHost = now;
  host.style.setProperty("--constantini-wave", Math.min(wave++, 8));
  try {
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(ENTRANCE);
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  } catch (err) {
    const style = document.createElement("style");
    style.textContent = ENTRANCE;
    root.append(style);
  }
}

if (!window.__constantiniMotion) {
  window.__constantiniMotion = true;
  for (const tag of CARD_HOSTS) {
    customElements.whenDefined(tag).then(() => {
      // Home Assistant's element registry keeps its own copy of connectedCallback, so the hook
      // goes on the method Lit looks up each time it builds the shadow root.
      const proto = customElements.get(tag).prototype;
      const create = proto.createRenderRoot;
      proto.createRenderRoot = function () {
        const root = create.call(this);
        try {
          animateCards(this, root);
        } catch (err) {
          // The view still draws without the entrance.
        }
        return root;
      };
    });
  }
}
