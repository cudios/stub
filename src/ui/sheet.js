import { h, replace } from "./dom.js";
import { icon } from "./icons.js";

export function openSheet({ title, content, onClose }) {
  const titleEl = h("h2", { class: "sheet__title" }, title);
  const body = h("div", { class: "sheet__body" });
  const dialog = h(
    "dialog",
    { class: "sheet", "aria-label": title },
    h("div", { class: "sheet__panel" },
      h("header", { class: "sheet__head" },
        titleEl,
        h("button", { class: "icon-btn", type: "button", "aria-label": "Close", onclick: () => close() }, icon("close"))
      ),
      body
    )
  );

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
    onClose?.();
  });

  replace(body, content);
  document.body.append(dialog);
  dialog.showModal();

  return {
    close,
    body,
    setContent: (node) => replace(body, node),
    setTitle: (text) => { titleEl.textContent = text; }
  };
}

export function confirmSheet({ title, message, confirmLabel, cancelLabel = "Keep it", danger = false }) {
  return new Promise((resolve) => {
    let confirmed = false;
    const sheet = openSheet({
      title,
      onClose: () => resolve(confirmed),
      content: h("div", { class: "stack" },
        h("p", { class: "text-muted" }, message),
        h("div", { class: "button-row" },
          h("button", { class: "btn btn--ghost", type: "button", onclick: () => sheet.close() }, cancelLabel),
          h("button", { class: ["btn", danger ? "btn--danger" : "btn--primary"], type: "button", onclick: () => { confirmed = true; sheet.close(); } }, confirmLabel)
        )
      )
    });
  });
}
