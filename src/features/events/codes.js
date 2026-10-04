import { h } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { toast } from "../../ui/toast.js";

export const spacedCode = (code) => (code ? `${code.slice(0, 3)} ${code.slice(3)}` : "Loading");

async function copyCode(code) {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    toast("Code copied");
  } catch {
    toast("Couldn't copy. Long-press the code to select it.");
  }
}

export function codeRow(label, code, hint) {
  const value = h("p", { class: "code-row__code" }, spacedCode(code));
  const button = h("button", { class: "icon-btn icon-btn--outline", type: "button", "aria-label": `Copy ${label.toLowerCase()}`, onclick: () => copyCode(button.dataset.code) }, icon("copy", { size: 18 }));
  button.dataset.code = code || "";
  const el = h("div", { class: "code-row" },
    h("div", { class: "code-row__text" }, h("p", { class: "code-row__label" }, label), value, h("p", { class: "field__hint" }, hint)),
    button
  );
  return {
    el,
    set(next) {
      value.textContent = spacedCode(next);
      button.dataset.code = next || "";
    }
  };
}

export const MANAGER_HINT = "Full access: attendees, settings and scanning.";
export const VOLUNTEER_HINT = "For gate staff: scanning, plus anything you allow in settings.";
