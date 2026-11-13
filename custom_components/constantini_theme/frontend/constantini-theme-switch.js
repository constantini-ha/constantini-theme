const TEXT = {
  en: {
    dark_mode: "Dark mode", edit_menu: "Edit menu", title: "Sidebar items",
    hint: "Move items with the arrows, hide what you do not use and add your own shortcuts. This is saved for your user, on every device.",
    up: "Move up", down: "Move down", show: "Show", hide: "Hide", edit: "Edit", remove: "Remove",
    add: "Add shortcut", edit_shortcut: "Edit shortcut", name: "Name", icon: "Icon", target: "Destination",
    target_hint: "A Home Assistant page, like /config/automation, or a full address, like https://example.com (opens in a new tab).",
    cancel: "Cancel", save: "Save", done: "Done", hidden: "Hidden", shortcut: "Shortcut",
    missing: "Fill in the name and the destination.",
    bad_target: "The destination must start with / or with http:// or https://.",
    save_failed: "Could not save: {err}",
  },
  pt: {
    dark_mode: "Modo escuro", edit_menu: "Editar menu", title: "Itens da barra lateral",
    hint: "Mova os itens com as setas, oculte o que você não usa e adicione seus próprios atalhos. Fica salvo para o seu usuário, em todos os aparelhos.",
    up: "Mover para cima", down: "Mover para baixo", show: "Mostrar", hide: "Ocultar", edit: "Editar", remove: "Remover",
    add: "Adicionar atalho", edit_shortcut: "Editar atalho", name: "Nome", icon: "Ícone", target: "Destino",
    target_hint: "Uma página do Home Assistant, como /config/automation, ou um endereço completo, como https://exemplo.com (abre em nova aba).",
    cancel: "Cancelar", save: "Salvar", done: "Concluir", hidden: "Oculto", shortcut: "Atalho",
    missing: "Preencha o nome e o destino.",
    bad_target: "O destino precisa começar com / ou com http:// ou https://.",
    save_failed: "Não consegui salvar: {err}",
  },
  es: {
    dark_mode: "Modo oscuro", edit_menu: "Editar menú", title: "Elementos de la barra lateral",
    hint: "Mueve los elementos con las flechas, oculta lo que no usas y añade tus propios accesos directos. Se guarda para tu usuario, en todos los dispositivos.",
    up: "Subir", down: "Bajar", show: "Mostrar", hide: "Ocultar", edit: "Editar", remove: "Quitar",
    add: "Añadir acceso directo", edit_shortcut: "Editar acceso directo", name: "Nombre", icon: "Icono", target: "Destino",
    target_hint: "Una página de Home Assistant, como /config/automation, o una dirección completa, como https://ejemplo.com (se abre en una pestaña nueva).",
    cancel: "Cancelar", save: "Guardar", done: "Listo", hidden: "Oculto", shortcut: "Acceso directo",
    missing: "Rellena el nombre y el destino.",
    bad_target: "El destino debe empezar por / o por http:// o https://.",
    save_failed: "No pude guardar: {err}",
  },
};

function tr(hass, key, vars = {}) {
  const table = TEXT[((hass && hass.language) || "en").split("-")[0]] || TEXT.en;
  return (table[key] || TEXT.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

// Shortcuts and their place among the panels live in the user's account, like the sidebar order.
const DATA_KEY = "constantini_sidebar";
const FIXED_PANELS = ["config", "profile"];
const LINK = "link:";
let sidebarData = { links: [], order: [] };

const STYLE = `
  :host { display:block; flex-shrink:0; margin:0 4px 4px;
    margin-inline-start:calc(4px + var(--safe-area-inset-left, 0px));
    --sky-day:linear-gradient(180deg, #4aa8f5 0%, #9fd6ff 100%);
    --sky-night:linear-gradient(180deg, #131a3a 0%, #3b2f73 100%);
    --ease:cubic-bezier(.34, 1.4, .64, 1); --time:.5s }
  .row { display:flex; align-items:center; width:48px;
    transition:width var(--ha-animation-duration-normal, .25s) ease }
  :host([expanded]) .row { width:var(--ha-sidebar-expanded-item-width, 248px) }
  :host([narrow][expanded]) .row { width:calc(100% - 8px) }
  .edit { flex:none; justify-content:center; width:0 !important; padding:0 !important; opacity:0;
    color:var(--sidebar-icon-color); --mdc-icon-size:20px }
  :host([expanded]) .edit { width:40px !important; opacity:1 }
  button { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px;
    flex:1; min-width:0; height:40px; padding:0 4px; border-radius:var(--ha-border-radius-sm, 8px);
    cursor:pointer; overflow:hidden; white-space:nowrap; -webkit-tap-highlight-color:transparent;
    color:var(--sidebar-text-color); font-family:var(--ha-font-family-body, inherit);
    font-size:var(--ha-font-size-m, 14px); font-weight:var(--ha-font-weight-medium, 500);
    transition:width var(--ha-animation-duration-normal, .25s) ease, background-color .2s }
  :host([expanded]) button { padding:0 8px }
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
      <div class="row">
      <button class="mode" role="switch" aria-checked="false">
        <span class="track" aria-hidden="true">
          <i class="star"></i><i class="star"></i><i class="star"></i><i class="star"></i><i class="star"></i>
          <span class="cloud a"></span><span class="cloud b"></span>
          <span class="knob"><span class="crater"></span><span class="crater"></span><span class="crater"></span></span>
        </span>
        <span class="label"></span>
      </button>
      <button class="edit"><ha-icon icon="mdi:playlist-edit"></ha-icon></button>
      </div>`;
    this.shadowRoot.querySelector(".mode").addEventListener("click", () => this._toggle());
    this.shadowRoot.querySelector(".edit").addEventListener("click", () => openEditor(this._hass));
  }

  set hass(hass) {
    this._hass = hass;
    const dark = !!(hass.themes && hass.themes.darkMode);
    const label = tr(hass, "dark_mode");
    if (dark === this._dark && label === this._label) return;
    this._dark = dark;
    this._label = label;
    this.toggleAttribute("dark", dark);
    const button = this.shadowRoot.querySelector(".mode");
    const edit = this.shadowRoot.querySelector(".edit");
    edit.title = tr(hass, "edit_menu");
    edit.setAttribute("aria-label", edit.title);
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

function watchData(hass) {
  if (window.__constantiniSidebarData) return;
  window.__constantiniSidebarData = true;
  hass.connection.subscribeMessage(
    ({ value }) => {
      sidebarData = { links: [], order: [], ...(value || {}) };
    },
    { type: "frontend/subscribe_user_data", key: DATA_KEY }
  ).catch(() => {
    window.__constantiniSidebarData = false;
  });
}

function go(url) {
  if (!url.startsWith("/")) {
    window.open(url, "_blank", "noopener");
    return;
  }
  history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

function linkElement(link, bar) {
  const item = document.createElement("ha-list-item-button");
  item.className = "constantini-link";
  item.dataset.link = link.id;
  item.innerHTML = '<ha-icon slot="start"></ha-icon><span class="item-text" slot="headline"></span>';
  item.addEventListener("click", (ev) => {
    ev.preventDefault();
    go(item.dataset.url);
    if (bar.hasAttribute("narrow")) {
      bar.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    }
  });
  return item;
}

// The shortcuts are drawn among Home Assistant's own items, in the order the user chose.
function placeLinks(bar) {
  const first = bar.shadowRoot.querySelector('[id^="sidebar-panel-"]');
  const host = first && first.parentNode;
  if (!host) return;
  const drawn = new Map();
  for (const item of host.querySelectorAll(".constantini-link")) {
    if (sidebarData.links.some((link) => link.id === item.dataset.link)) drawn.set(item.dataset.link, item);
    else item.remove();
  }
  for (const link of sidebarData.links) {
    let item = drawn.get(link.id);
    if (!item) {
      item = linkElement(link, bar);
      drawn.set(link.id, item);
    }
    const signature = JSON.stringify(link);
    if (item.dataset.signature !== signature) {
      item.dataset.signature = signature;
      item.dataset.url = link.url;
      item.href = link.url;
      item.title = link.name;
      item.querySelector("ha-icon").setAttribute("icon", link.icon || "mdi:link-variant");
      item.querySelector(".item-text").textContent = link.name;
    }
    item.classList.toggle("selected", link.url.startsWith("/") && location.pathname === link.url);
  }
  const element = (id) => (id.startsWith(LINK)
    ? drawn.get(id.slice(LINK.length))
    : host.querySelector(`#${CSS.escape(`sidebar-panel-${id}`)}`));
  const order = sidebarData.order.filter((id) => element(id));
  for (const link of sidebarData.links) {
    if (!order.includes(LINK + link.id)) order.push(LINK + link.id);
  }
  order.forEach((id, index) => {
    if (!id.startsWith(LINK)) return;
    const item = element(id);
    const next = order.slice(index + 1).map(element).find((el) => el && el.parentNode === host) || null;
    const placed = item.parentNode === host &&
      (next ? item.nextElementSibling === next : !item.nextElementSibling);
    if (!placed) host.insertBefore(item, next);
  });
}

const EDITOR_STYLE = `
  dialog { box-sizing:border-box; width:min(520px, calc(100vw - 24px)); max-height:min(760px, calc(100dvh - 24px));
    padding:0; border:1px solid var(--ha-card-border-color, var(--divider-color)); border-radius:22px;
    background:var(--card-background-color); color:var(--primary-text-color);
    font-family:var(--ha-font-family-body, inherit); box-shadow:0 24px 60px -20px rgba(0, 0, 0, .55);
    overflow:hidden }
  dialog[open] { display:flex; flex-direction:column; animation:rise .22s ease-out }
  dialog::backdrop { background:rgba(8, 12, 22, .55); backdrop-filter:blur(3px) }
  @keyframes rise { from { opacity:0; transform:translateY(10px) scale(.98) } }
  header { padding:20px 22px 6px }
  h2 { margin:0; font-size:20px; font-weight:600 }
  header p { margin:6px 0 0; font-size:13px; line-height:1.45; color:var(--secondary-text-color) }
  .body { flex:1; min-height:0; overflow-y:auto; padding:10px 14px; outline:none }
  .item { display:flex; align-items:center; gap:4px; min-height:48px; padding:2px 4px 2px 10px;
    border-radius:14px }
  .item:hover { background:color-mix(in srgb, var(--primary-text-color) 5%, transparent) }
  .item > ha-icon { flex:none; color:var(--secondary-text-color); --mdc-icon-size:22px }
  .item .text { flex:1; min-width:0; padding:0 8px }
  .item .name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:15px }
  .item .tag { font-size:12px; color:var(--secondary-text-color) }
  .item.off .name, .item.off > ha-icon { opacity:.45 }
  button { all:unset; box-sizing:border-box; cursor:pointer; display:inline-flex; align-items:center;
    justify-content:center; -webkit-tap-highlight-color:transparent }
  button:focus-visible { outline:2px solid var(--primary-color); outline-offset:1px }
  button[disabled] { opacity:.28; cursor:default }
  .ico { flex:none; width:40px; height:40px; border-radius:50%; color:var(--secondary-text-color);
    --mdc-icon-size:20px }
  .ico:not([disabled]):hover { background:color-mix(in srgb, var(--primary-text-color) 9%, transparent);
    color:var(--primary-text-color) }
  .ico.danger:not([disabled]):hover { color:var(--error-color, #db4437) }
  .add { gap:8px; margin:8px 4px 4px; padding:0 16px; min-height:44px; border-radius:22px;
    font-size:14px; font-weight:500; color:var(--primary-color); --mdc-icon-size:20px;
    background:color-mix(in srgb, var(--primary-color) 13%, transparent) }
  .add:hover { background:color-mix(in srgb, var(--primary-color) 20%, transparent) }
  form { display:grid; gap:14px; padding:6px 8px 4px }
  label { display:grid; gap:6px; font-size:13px; color:var(--secondary-text-color) }
  input { font:inherit; font-size:16px; padding:11px 12px; border-radius:12px;
    border:1px solid var(--outline-color, var(--divider-color));
    background:var(--secondary-background-color); color:var(--primary-text-color) }
  input:focus-visible { outline:2px solid var(--primary-color); outline-offset:1px }
  small { font-size:12px; line-height:1.4 }
  .error { padding:10px 12px; border-radius:12px; font-size:13px; color:var(--primary-text-color);
    background:color-mix(in srgb, var(--error-color, #db4437) 18%, transparent) }
  footer { display:flex; justify-content:flex-end; gap:8px; padding:10px 16px 16px }
  .btn { min-height:42px; padding:0 20px; border-radius:21px; font-size:14px; font-weight:500 }
  .btn.plain:hover { background:color-mix(in srgb, var(--primary-text-color) 8%, transparent) }
  .btn.go { background:var(--primary-color); color:var(--text-primary-color) }
  @media (prefers-reduced-motion: reduce) { dialog[open] { animation:none } }
`;

class ConstantiniSidebarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  open(hass) {
    this._hass = hass;
    this._form = null;
    this._error = null;
    this._items = this._read();
    this._render();
    this.shadowRoot.querySelector("dialog").showModal();
  }

  _t(key, vars) {
    return tr(this._hass, key, vars);
  }

  // What is on screen is the truth for the order; what is hidden comes after it.
  _read() {
    const hass = this._hass;
    const found = sidebar();
    const first = found && found.bar.shadowRoot.querySelector('[id^="sidebar-panel-"]');
    const shown = first ? [...first.parentNode.children] : [];
    const items = [];
    const seen = new Set();
    const panel = (id, hidden) => {
      const info = hass.panels[id];
      if (!info || seen.has(id)) return;
      seen.add(id);
      items.push({
        id,
        name: hass.localize(`panel.${info.title}`) || info.title || id,
        icon: info.icon || "mdi:view-dashboard",
        hidden,
      });
    };
    for (const el of shown) {
      if (el.classList.contains("constantini-link")) {
        const link = sidebarData.links.find((entry) => entry.id === el.dataset.link);
        if (link) items.push({ ...link, link: true });
      } else if (el.id && el.id.startsWith("sidebar-panel-")) {
        panel(el.id.slice("sidebar-panel-".length), false);
      }
    }
    for (const info of Object.values(hass.panels)) {
      if (info.title && info.show_in_sidebar !== false && !FIXED_PANELS.includes(info.url_path)) {
        panel(info.url_path, true);
      }
    }
    return items;
  }

  _icon(icon, label, onClick, { disabled = false, cls = "" } = {}) {
    const button = document.createElement("button");
    button.className = `ico ${cls}`.trim();
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.disabled = disabled;
    button.innerHTML = `<ha-icon icon="${icon}"></ha-icon>`;
    button.addEventListener("click", onClick);
    return button;
  }

  _move(index, step) {
    const [item] = this._items.splice(index, 1);
    this._items.splice(index + step, 0, item);
    this._render(`[data-id="${CSS.escape(item.id)}"] .${step < 0 ? "up" : "down"}`);
  }

  _render(focus) {
    const root = this.shadowRoot;
    let dialog = root.querySelector("dialog");
    const scroll = dialog ? dialog.querySelector(".body").scrollTop : 0;
    if (!dialog) {
      root.innerHTML = `<style>${EDITOR_STYLE}</style><dialog></dialog>`;
      dialog = root.querySelector("dialog");
      dialog.addEventListener("close", () => this.remove());
      dialog.addEventListener("click", (ev) => ev.target === dialog && dialog.close());
    }
    dialog.innerHTML = "<header><h2></h2><p></p></header><div class='body'></div><footer></footer>";
    dialog.querySelector("h2").textContent = this._t(
      this._form ? (this._form.id ? "edit_shortcut" : "add") : "title");
    dialog.querySelector("p").textContent = this._form ? "" : this._t("hint");
    const body = dialog.querySelector(".body");
    const footer = dialog.querySelector("footer");
    if (this._error) {
      const error = document.createElement("div");
      error.className = "error";
      error.setAttribute("role", "alert");
      error.textContent = this._error;
      body.append(error);
    }
    if (this._form) this._renderForm(body, footer);
    else this._renderList(body, footer);
    body.scrollTop = scroll;
    const target = focus && dialog.querySelector(focus);
    if (target && !target.disabled) target.focus();
  }

  _renderList(body, footer) {
    const home = this._hass.defaultPanel || "lovelace";
    this._items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = item.hidden ? "item off" : "item";
      row.dataset.id = item.id;
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", item.icon || "mdi:link-variant");
      const text = document.createElement("div");
      text.className = "text";
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = item.name;
      text.append(name);
      const tag = item.link ? this._t("shortcut") : item.hidden ? this._t("hidden") : "";
      if (tag) {
        const small = document.createElement("div");
        small.className = "tag";
        small.textContent = tag;
        text.append(small);
      }
      row.append(icon, text,
        this._icon("mdi:arrow-up", this._t("up"), () => this._move(index, -1),
          { disabled: index === 0, cls: "up" }),
        this._icon("mdi:arrow-down", this._t("down"), () => this._move(index, 1),
          { disabled: index === this._items.length - 1, cls: "down" }));
      if (item.link) {
        row.append(
          this._icon("mdi:pencil-outline", this._t("edit"), () => {
            this._form = { id: item.id, name: item.name, icon: item.icon, url: item.url };
            this._render();
          }),
          this._icon("mdi:trash-can-outline", this._t("remove"), () => {
            this._items.splice(index, 1);
            this._render();
          }, { cls: "danger" }));
      } else {
        row.append(this._icon(item.hidden ? "mdi:eye-off-outline" : "mdi:eye-outline",
          this._t(item.hidden ? "show" : "hide"), () => {
            item.hidden = !item.hidden;
            this._render(`[data-id="${CSS.escape(item.id)}"] .eye`);
          }, { disabled: item.id === home, cls: "eye" }));
      }
      body.append(row);
    });
    const add = document.createElement("button");
    add.className = "add";
    add.type = "button";
    add.innerHTML = '<ha-icon icon="mdi:plus"></ha-icon><span></span>';
    add.querySelector("span").textContent = this._t("add");
    add.addEventListener("click", () => {
      this._form = { id: null, name: "", icon: "mdi:star-outline", url: "" };
      this._error = null;
      this._render();
    });
    body.append(add);
    footer.append(
      this._button(this._t("cancel"), () => this.shadowRoot.querySelector("dialog").close()),
      this._button(this._t("save"), () => this._save(), true));
  }

  _button(label, onClick, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = primary ? "btn go" : "btn plain";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  _renderForm(body, footer) {
    const form = document.createElement("form");
    const field = (key, placeholder) => {
      const label = document.createElement("label");
      label.textContent = this._t(key === "url" ? "target" : key);
      const input = document.createElement("input");
      input.value = this._form[key];
      input.placeholder = placeholder || "";
      input.autocomplete = "off";
      input.autocapitalize = key === "name" ? "sentences" : "off";
      input.spellcheck = false;
      input.addEventListener("input", () => {
        this._form[key] = input.value;
      });
      label.append(input);
      return label;
    };
    const name = field("name");
    const icon = document.createElement("label");
    icon.textContent = this._t("icon");
    if (customElements.get("ha-icon-picker")) {
      const picker = document.createElement("ha-icon-picker");
      picker.hass = this._hass;
      picker.value = this._form.icon;
      picker.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._form.icon = ev.detail.value || "";
      });
      icon.append(picker);
    }
    const target = field("url", "/config/automation");
    const hint = document.createElement("small");
    hint.textContent = this._t("target_hint");
    target.append(hint);
    form.append(name, customElements.get("ha-icon-picker") ? icon : field("icon", "mdi:star-outline"), target);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this._commitForm();
    });
    body.append(form);
    footer.append(
      this._button(this._t("cancel"), () => {
        this._form = null;
        this._error = null;
        this._render();
      }),
      this._button(this._t("done"), () => this._commitForm(), true));
    requestAnimationFrame(() => name.querySelector("input").focus());
  }

  _commitForm() {
    const form = this._form;
    const name = form.name.trim();
    const url = form.url.trim();
    if (!name || !url) {
      this._error = this._t("missing");
      this._render();
      return;
    }
    if (!/^(\/(?!\/)|https?:\/\/)/.test(url)) {
      this._error = this._t("bad_target");
      this._render();
      return;
    }
    const entry = { name, url, icon: (form.icon || "").trim() || "mdi:link-variant", link: true };
    const index = this._items.findIndex((item) => item.link && item.id === form.id);
    if (index >= 0) {
      this._items[index] = { ...entry, id: form.id };
    } else {
      const lastShown = this._items.map((item) => !item.hidden).lastIndexOf(true);
      this._items.splice(lastShown + 1, 0,
        { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
    }
    this._form = null;
    this._error = null;
    this._render();
  }

  async _save() {
    const panels = this._items.filter((item) => !item.link);
    const links = this._items.filter((item) => item.link)
      .map(({ id, name, icon, url }) => ({ id, name, icon, url }));
    const order = this._items.filter((item) => item.link || !item.hidden)
      .map((item) => (item.link ? LINK + item.id : item.id));
    try {
      await this._hass.callWS({
        type: "frontend/set_user_data",
        key: "sidebar",
        value: {
          panelOrder: panels.filter((item) => !item.hidden).map((item) => item.id),
          hiddenPanels: panels.filter((item) => item.hidden).map((item) => item.id),
        },
      });
      await this._hass.callWS({
        type: "frontend/set_user_data", key: DATA_KEY, value: { links, order },
      });
      sidebarData = { links, order };
      this.shadowRoot.querySelector("dialog").close();
    } catch (err) {
      this._error = this._t("save_failed", { err: err.message || String(err) });
      this._render();
    }
  }
}

if (!customElements.get("constantini-sidebar-editor")) {
  customElements.define("constantini-sidebar-editor", ConstantiniSidebarEditor);
}

function openEditor(hass) {
  if (!hass || document.querySelector("constantini-sidebar-editor")) return;
  const editor = document.createElement("constantini-sidebar-editor");
  document.body.append(editor);
  editor.open(hass);
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
  watchData(root.hass);
  placeLinks(bar);
  const selected = root.hass.selectedTheme;
  if (selected && selected.theme && !live(root.hass).theme) setTheme(live(root.hass));
}

if (!window.__constantiniThemeSwitch) {
  window.__constantiniThemeSwitch = setInterval(keep, 400);
  keep();
}
