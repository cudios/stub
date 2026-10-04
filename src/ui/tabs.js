import { h } from "./dom.js";

export function tabs({ items, active, onselect }) {
  const buttons = new Map();
  const el = h("div", { class: "tabs", role: "tablist" },
    items.map((item) => {
      const badge = h("span", { class: "tabs__badge", hidden: true });
      const button = h("button", {
        class: "tabs__tab",
        type: "button",
        role: "tab",
        "aria-selected": String(item.id === active),
        onclick: () => {
          setActive(item.id);
          onselect(item.id);
        }
      }, h("span", {}, item.label), badge);
      buttons.set(item.id, { button, badge });
      return button;
    })
  );

  function setActive(id) {
    for (const [key, { button }] of buttons) button.setAttribute("aria-selected", String(key === id));
  }

  function setBadge(id, count) {
    const entry = buttons.get(id);
    if (!entry) return;
    entry.badge.textContent = String(count);
    entry.badge.hidden = !count;
  }

  return { el, setActive, setBadge };
}
