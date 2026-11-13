# Notes for whoever works on this integration

- User-visible text ships in three languages (en, pt-BR, es): `translations/`,
  the label in `frontend/constantini-theme-switch.js`, the three READMEs and the
  release notes.
- Home Assistant has no call to register a theme. The integration writes into
  `hass.data["frontend_themes"]` and fires `themes_updated`; `frontend.reload_themes`
  replaces that whole table, so the listener puts the theme back. The keys are
  plain strings on purpose: importing them from `frontend.helpers` ties the
  integration to one core version.
- The theme is one entry with `modes: light / dark`. Colours go in the modes,
  shape in the base. The dashboard background is `constantini-sky`, CSS gradients
  only: no external image.
- The choice of theme and mode is kept in the **user's account** (`frontend` user
  data, key `theme`), so it follows the person to every device; it is not per
  browser. The switch fires `settheme` on `<home-assistant>` with
  `{...selectedTheme, dark}`. A stored theme name that no longer exists is dropped
  as soon as the script sees it, or it would win over the default. Home Assistant
  merges the event detail into the stored choice, so clearing takes `theme: ""`,
  not a missing key. A test that
  fires `settheme` changes the real user's choice: put it back afterwards
  (`frontend/set_user_data`, key `theme`).
- The sidebar is Home Assistant's own (`home-assistant` → `home-assistant-main` →
  `ha-sidebar`, all shadow roots). The switch is inserted before
  `ha-list-nav.after-spacer` and re-inserted by a 400 ms check; `expanded` and
  `narrow` are copied from the sidebar. If a core update renames those, the switch
  just does not show: nothing else breaks.
- The script is served under `/constantini_theme/frontend/<version>/`: bump
  `manifest.json` on any change to it.
- To try a theme change without a release, drop the YAML (under another theme
  name) into the instance's `themes` folder, call `frontend.reload_themes`, and
  select it in a test browser with a `settheme` event; inject the switch with
  `page.addScriptTag`.
- `text-primary-color` is the text on amber: white in light mode, near-black in
  dark mode. The header text is set apart (`app-header-text-color`).
- Releases are `gh release create vX.Y.Z`; HACS and the Marketplace only offer
  what has a published release.
- The sidebar editor is frontend only. Home Assistant's own order and hidden list
  are the `sidebar` user-data key (`{panelOrder, hiddenPanels}`; the older
  `sidebarPanelOrder` / `sidebarHiddenPanels` keys are no longer read). Shortcuts
  and their place among the panels are the `constantini_sidebar` key
  (`{links: [{id, name, icon, url}], order: [panel id | "link:<id>"]}`).
- Shortcuts are `ha-list-item-button` elements inserted next to the panel items
  (`#sidebar-panel-<url_path>`), so the sidebar's own styles apply. Lit may drop
  them when it redraws a neighbour; the 400 ms check puts them back. The click is
  handled by the script (`pushState` + `location-changed`), external addresses
  open in a new tab.
- The editor reads the order from what is drawn, then appends hidden panels. A test
  that saves in it changes the real user's sidebar: restore both keys afterwards.
