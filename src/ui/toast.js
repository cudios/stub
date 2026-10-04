import { h } from "./dom.js";
import { on } from "../core/bus.js";

let region = null;

const supportsPopover = () => typeof region?.showPopover === "function";

function bringToFront() {
  if (!supportsPopover()) return;
  if (region.matches(":popover-open")) region.hidePopover();
  region.showPopover();
}

function hideIfEmpty() {
  if (supportsPopover() && region.children.length === 0 && region.matches(":popover-open")) region.hidePopover();
}

export function initToasts(el) {
  region = el;
  on("toast", (payload) => toast(payload.message, payload));
}

export function toast(message, { tone = "neutral", action = null, duration = 3600 } = {}) {
  if (!region) return;
  const node = h(
    "div",
    { class: ["toast", `toast--${tone}`], role: tone === "bad" ? "alert" : "status" },
    h("span", { class: "toast__text" }, message),
    action && h("button", { class: "toast__action", type: "button", onclick: () => { action.run(); dismiss(); } }, action.label)
  );
  const timer = setTimeout(dismiss, duration);
  function dismiss() {
    clearTimeout(timer);
    node.classList.add("is-leaving");
    setTimeout(() => {
      node.remove();
      hideIfEmpty();
    }, 180);
  }
  region.append(node);
  while (region.children.length > 3) region.firstElementChild.remove();
  bringToFront();
}
