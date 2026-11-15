const GREETINGS = {
  en: { morning: "Good morning", afternoon: "Good afternoon", night: "Good evening",
    card: "Greeting", about: "Greets the signed-in person by name, according to the time of day." },
  pt: { morning: "Bom dia", afternoon: "Boa tarde", night: "Boa noite",
    card: "Saudação", about: "Cumprimenta quem está logado pelo nome, conforme a hora do dia." },
  es: { morning: "Buenos días", afternoon: "Buenas tardes", night: "Buenas noches",
    card: "Saludo", about: "Saluda por su nombre a quien inició sesión, según la hora del día." },
};

const words = (language) => GREETINGS[(language || "en").split("-")[0]] || GREETINGS.en;

function period(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  return hour >= 12 && hour < 18 ? "afternoon" : "night";
}

const GREETING_STYLE = `
  :host { display:block }
  h2 { margin:0; display:flex; align-items:center; flex-wrap:wrap; column-gap:.3em; min-height:32px;
    font-family:var(--ha-font-family-heading, var(--ha-font-family-body, inherit));
    font-size:22px; line-height:1.3; font-weight:600; letter-spacing:-.01em;
    color:var(--primary-text-color) }
  .word { display:inline-flex; white-space:pre }
  .char { display:inline-block; animation:rise .5s cubic-bezier(.2, .8, .2, 1) backwards;
    animation-delay:calc(var(--i) * 28ms) }
  .name .char { color:var(--primary-color) }
  .hand { display:inline-block; transform-origin:70% 80%; cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    animation:pop .4s cubic-bezier(.34, 1.4, .64, 1) backwards, wave 1.5s ease-in-out;
    animation-delay:calc(var(--i) * 28ms), calc(var(--i) * 28ms + .35s) }
  .hand.again { animation:wave 1.5s ease-in-out }
  @keyframes rise { from { opacity:0; transform:translateY(.55em) } }
  @keyframes pop { from { opacity:0; transform:scale(.3) } }
  @keyframes wave { 0%, 60%, 100% { transform:rotate(0) } 10%, 30%, 50% { transform:rotate(16deg) }
    20%, 40% { transform:rotate(-10deg) } }
  @media (prefers-reduced-motion: reduce) { .char, .hand, .hand.again { animation:none } }
`;

class ConstantiniGreeting extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = config || {};
    this._shown = null;
    this._draw();
  }

  set hass(hass) {
    this._hass = hass;
    this._draw();
  }

  connectedCallback() {
    this._shown = null;
    this._draw();
    this._clock = setInterval(() => this._draw(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._clock);
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 3 };
  }

  static getStubConfig() {
    return {};
  }

  _draw() {
    const hass = this._hass;
    if (!hass || !this.isConnected) return;
    let name = (this._config.name || (hass.user && hass.user.name) || "").trim();
    if (name && name === name.toLowerCase()) name = name[0].toUpperCase() + name.slice(1);
    const greeting = words(hass.language)[period(new Date().getHours())];
    const text = name ? `${greeting}, ${name}` : greeting;
    if (text === this._shown) return;
    this._shown = text;

    const root = this.shadowRoot;
    root.innerHTML = `<style>${GREETING_STYLE}</style><h2></h2>`;
    const title = root.querySelector("h2");
    title.setAttribute("aria-label", text);
    let index = 0;
    const add = (part, cls) => {
      for (const piece of part.split(" ")) {
        const word = document.createElement("span");
        word.className = `word ${cls}`.trim();
        word.setAttribute("aria-hidden", "true");
        for (const letter of piece) {
          const char = document.createElement("span");
          char.className = "char";
          char.style.setProperty("--i", index++);
          char.textContent = letter;
          word.append(char);
        }
        title.append(word);
      }
    };
    add(name ? `${greeting},` : greeting, "");
    if (name) add(name, "name");
    const hand = document.createElement("span");
    hand.className = "hand";
    hand.setAttribute("aria-hidden", "true");
    hand.style.setProperty("--i", index + 2);
    hand.textContent = "👋";
    hand.addEventListener("click", () => {
      hand.classList.remove("again");
      void hand.offsetWidth;
      hand.classList.add("again");
    });
    title.append(hand);
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
