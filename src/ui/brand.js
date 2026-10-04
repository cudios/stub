import { h } from "./dom.js";

const MARK = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor"/><path fill="#fff" d="M10 22a4 4 0 0 1 4-4h22a4 4 0 0 0 8 0h6a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-6a4 4 0 0 0-8 0H14a4 4 0 0 1-4-4z"/><path stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" d="M40 24v16"/><rect x="16" y="25" width="14" height="3.5" rx="1.75" fill="currentColor"/><rect x="16" y="31" width="10" height="3.5" rx="1.75" fill="currentColor"/><rect x="16" y="37" width="7" height="3.5" rx="1.75" fill="currentColor"/></svg>';

export function brand() {
  return h("div", { class: "brand" },
    h("span", { class: "brand__mark", html: MARK }),
    h("span", { class: "brand__text" },
      h("span", { class: "brand__name" }, "Stub"),
      h("span", { class: "brand__tag" }, "Offline entry passes")
    )
  );
}
