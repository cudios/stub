import { h } from "./dom.js";

export function emptyState(title, message, action = null) {
  return h("div", { class: "empty" },
    h("p", { class: "empty__title" }, title),
    h("p", { class: "empty__text" }, message),
    action
  );
}

export function loadingRows(count = 3) {
  return h("div", { class: "skeleton", "aria-label": "Loading" }, Array.from({ length: count }, () => h("span", { class: "skeleton__row" })));
}
