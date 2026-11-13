const LABELS = {
  en: "Dark mode",
  pt: "Modo escuro",
  es: "Modo oscuro",
};

const STYLE = `
  :host { display:block; flex-shrink:0; margin:0 4px 4px;
    margin-inline-start:calc(4px + var(--safe-area-inset-left, 0px));
    --sky-day:linear-gradient(180deg, #4aa8f5 0%, #9fd6ff 100%);
    --sky-night:linear-gradient(180deg, #131a3a 0%, #3b2f73 100%);
    --ease:cubic-bezier(.34, 1.4, .64, 1); --time:.5s }
  button { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px;
    width:48px; height:40px; padding:0 4px; border-radius:var(--ha-border-radius-sm, 8px);
    cursor:pointer; overflow:hidden; white-space:nowrap; -webkit-tap-highlight-color:transparent;
    color:var(--sidebar-text-color); font-family:var(--ha-font-family-body, inherit);
    font-size:var(--ha-font-size-m, 14px); font-weight:var(--ha-font-weight-medium, 500);
    transition:width var(--ha-animation-duration-normal, .25s) ease, background-color .2s }
  :host([expanded]) button { width:var(--ha-sidebar-expanded-item-width, 248px); padding:0 8px }
  :host([narrow][expanded]) button { width:calc(100% - 8px) }
  button:hover { background:color-mix(in srgb, var(--sidebar-text-color) 8%, transparent) }
  button:focus-visible { outline:2px solid var(--primary-color); outline-offset:-2px }
  .label { opacity:0; transition:opacity .2s }
  :host([expanded]) .label { opacity:1 }

  .track { position:relative; flex:none; width:40px; height:28px; border-radius:14px;
    overflow:hidden; background:var(--sky-day);
    box-shadow:inset 0 1px 3px rgba(0, 20, 60, .35), inset 0 0 0 1px rgba(255, 255, 255, .14);
    transition:width var(--ha-animation-duration-normal, .25s) ease }
  :host([expanded]) .track { width:56px }
  .track::before { content:""; position:absolute; inset:0; background:var(--sky-night); opacity:0;
    transition:opacity var(--time) ease }
  :host([dark]) .track::before { opacity:1 }

  .knob { position:absolute; top:4px; left:4px; width:20px; height:20px; border-radius:50%;
    background:radial-gradient(circle at 35% 30%, #fff3b0 0%, #ffcf3a 55%, #ffab1a 100%);
    box-shadow:0 0 0 3px rgba(255, 214, 90, .30), 0 0 0 7px rgba(255, 214, 90, .14),
      0 1px 3px rgba(120, 60, 0, .45);
    transform:translateX(6px);
    transition:transform var(--time) var(--ease), background var(--time) ease,
      box-shadow var(--time) ease }
  :host([expanded]) .knob { transform:translateX(0) }
  :host([dark]) .knob { transform:translateX(10px) rotate(360deg);
    background:radial-gradient(circle at 35% 30%, #ffffff 0%, #dfe5f2 60%, #b9c2d6 100%);
    box-shadow:0 0 0 3px rgba(200, 212, 255, .16), 0 0 10px 2px rgba(190, 205, 255, .35),
      0 1px 3px rgba(0, 0, 0, .5) }
  :host([dark][expanded]) .knob { transform:translateX(28px) rotate(360deg) }
  .crater { position:absolute; border-radius:50%; background:#a7b1c8; opacity:0; transform:scale(.4);
    box-shadow:inset 1px 1px 1px rgba(60, 70, 100, .45);
    transition:opacity var(--time) ease, transform var(--time) var(--ease) }
  .crater:nth-child(1) { width:6px; height:6px; top:4px; left:9px }
  .crater:nth-child(2) { width:4px; height:4px; top:11px; left:4px }
  .crater:nth-child(3) { width:3px; height:3px; top:13px; left:12px }
  :host([dark]) .crater { opacity:.85; transform:scale(1) }

  .cloud { position:absolute; background:#fff; border-radius:999px; opacity:.95;
    transition:transform var(--time) var(--ease), opacity var(--time) ease }
  .cloud.a { width:18px; height:8px; right:3px; bottom:4px;
    box-shadow:-6px -3px 0 -1px #fff, 3px -4px 0 0 #fff }
  .cloud.b { width:10px; height:5px; right:16px; top:5px; opacity:.7 }
  :host(:not([expanded])) .cloud.b { opacity:0 }
  :host(:not([expanded])) .cloud.a { transform:translate(8px, 4px) scale(.8) }
  :host([dark]) .cloud { transform:translateY(22px); opacity:0 }

  .star { position:absolute; width:2px; height:2px; border-radius:50%; background:#fff;
    opacity:0; transform:scale(0);
    transition:opacity var(--time) ease, transform var(--time) var(--ease) }
  .star:nth-of-type(1) { left:8px; top:7px }
  .star:nth-of-type(2) { left:17px; top:17px; width:3px; height:3px }
  .star:nth-of-type(3) { left:24px; top:6px }
  .star:nth-of-type(4) { left:11px; top:19px; width:1.5px; height:1.5px }
  .star:nth-of-type(5) { left:21px; top:12px; width:1.5px; height:1.5px }
  :host(:not([expanded])) .star:nth-of-type(n+3) { display:none }
  :host(:not([expanded])) .star:nth-of-type(1) { left:5px; top:6px }
  :host(:not([expanded])) .star:nth-of-type(2) { left:8px; top:18px }
  :host([dark]) .star { opacity:1; transform:scale(1); animation:twinkle 3.2s ease-in-out infinite }
  :host([dark]) .star:nth-of-type(2) { animation-delay:.8s; transition-delay:.08s }
  :host([dark]) .star:nth-of-type(3) { animation-delay:1.6s; transition-delay:.14s }
  :host([dark]) .star:nth-of-type(4) { animation-delay:2.2s; transition-delay:.2s }
  :host([dark]) .star:nth-of-type(5) { animation-delay:.4s; transition-delay:.26s }
  @keyframes twinkle { 0%, 100% { opacity:1 } 50% { opacity:.35 } }

  @media (prefers-reduced-motion: reduce) {
    :host { --time:.01s; --ease:linear }
    :host([dark]) .star { animation:none }
    :host([dark]) .knob { transform:translateX(10px) }
    :host([dark][expanded]) .knob { transform:translateX(28px) }
  }
`;

class ConstantiniThemeSwitch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <button role="switch" aria-checked="false">
        <span class="track" aria-hidden="true">
          <i class="star"></i><i class="star"></i><i class="star"></i><i class="star"></i><i class="star"></i>
          <span class="cloud a"></span><span class="cloud b"></span>
          <span class="knob"><span class="crater"></span><span class="crater"></span><span class="crater"></span></span>
        </span>
        <span class="label"></span>
      </button>`;
    this.shadowRoot.querySelector("button").addEventListener("click", () => this._toggle());
  }

  set hass(hass) {
    this._hass = hass;
    const dark = !!(hass.themes && hass.themes.darkMode);
    const label = LABELS[(hass.language || "en").split("-")[0]] || LABELS.en;
    if (dark === this._dark && label === this._label) return;
    this._dark = dark;
    this._label = label;
    this.toggleAttribute("dark", dark);
    const button = this.shadowRoot.querySelector("button");
    button.setAttribute("aria-checked", String(dark));
    button.setAttribute("aria-label", label);
    button.title = label;
    this.shadowRoot.querySelector(".label").textContent = label;
  }

  _toggle() {
    const hass = this._hass;
    if (!hass) return;
    setTheme({ ...live(hass), dark: !hass.themes.darkMode });
  }
}

if (!customElements.get("constantini-theme-switch")) {
  customElements.define("constantini-theme-switch", ConstantiniThemeSwitch);
}

// The choice is kept in the user's account. A theme name that no longer exists there
// would win over the default and leave the stock look, so it is cleared. Home Assistant
// merges the event into what it has: only an empty name clears it.
function live(hass) {
  const selected = { ...(hass.selectedTheme || {}) };
  if (selected.theme && selected.theme !== "default" && !(selected.theme in hass.themes.themes)) {
    selected.theme = "";
  }
  return selected;
}

function setTheme(detail) {
  document.querySelector("home-assistant").dispatchEvent(
    new CustomEvent("settheme", { detail, bubbles: true, composed: true }));
}

function sidebar() {
  const root = document.querySelector("home-assistant");
  const main = root && root.shadowRoot && root.shadowRoot.querySelector("home-assistant-main");
  const bar = main && main.shadowRoot && main.shadowRoot.querySelector("ha-sidebar");
  return bar && bar.shadowRoot ? { root, bar } : null;
}

// The sidebar is drawn by Home Assistant and may be rebuilt, so the switch is put back when missing.
function keep() {
  const found = sidebar();
  if (!found || !found.root.hass) return;
  const { root, bar } = found;
  let toggle = bar.shadowRoot.querySelector("constantini-theme-switch");
  if (!toggle) {
    const bottom = bar.shadowRoot.querySelector("ha-list-nav.after-spacer") ||
      bar.shadowRoot.querySelector(".panels-list > :last-child");
    if (!bottom || !bottom.parentNode) return;
    toggle = document.createElement("constantini-theme-switch");
    bottom.parentNode.insertBefore(toggle, bottom);
  }
  toggle.toggleAttribute("expanded", bar.hasAttribute("expanded"));
  toggle.toggleAttribute("narrow", bar.hasAttribute("narrow"));
  toggle.hass = root.hass;
  const selected = root.hass.selectedTheme;
  if (selected && selected.theme && !live(root.hass).theme) setTheme(live(root.hass));
}

if (!window.__constantiniThemeSwitch) {
  window.__constantiniThemeSwitch = setInterval(keep, 400);
  keep();
}
