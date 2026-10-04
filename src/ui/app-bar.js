import { h } from "./dom.js";
import { icon } from "./icons.js";

export function appBar({ title, subtitle = "", onBack = null, actions = [] }) {
  const titleEl = h("h1", { class: "appbar__title" }, title);
  const subtitleEl = h("p", { class: "appbar__sub", hidden: !subtitle }, subtitle);
  const el = h("header", { class: "appbar" },
    onBack ? h("button", { class: "icon-btn", type: "button", "aria-label": "Back", onclick: onBack }, icon("back")) : null,
    h("div", { class: "appbar__titles" }, titleEl, subtitleEl),
    h("div", { class: "appbar__actions" }, actions)
  );
  return {
    el,
    setTitle: (text) => { titleEl.textContent = text; },
    setSubtitle: (text) => {
      subtitleEl.textContent = text;
      subtitleEl.hidden = !text;
    }
  };
}
