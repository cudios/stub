import { h } from "./dom.js";
import { icon } from "./icons.js";
import { formatNumericDate } from "../domain/dates.js";

export function field(label, control, hint) {
  return h("label", { class: "field" },
    h("span", { class: "field__label" }, label),
    control,
    hint ? h("span", { class: "field__hint" }, hint) : null
  );
}

export const input = (props) => h("input", { class: "input", ...props });

export const textarea = (props) => h("textarea", { class: "input input--area", rows: 3, ...props });

export function toggle({ label, description, checked = false, disabled = false, onchange }) {
  const control = h("input", { class: "toggle__input", type: "checkbox", role: "switch", checked, disabled, onchange: (event) => onchange?.(event.target.checked) });
  return h("label", { class: "toggle" },
    h("span", { class: "toggle__text" },
      h("span", { class: "toggle__label" }, label),
      description ? h("span", { class: "toggle__desc" }, description) : null
    ),
    control,
    h("span", { class: "toggle__track", "aria-hidden": "true" })
  );
}

export function segmented({ name, options, value, onchange }) {
  return h("div", { class: "segmented", role: "radiogroup" },
    options.map((option) =>
      h("label", { class: "segmented__option" },
        h("input", { type: "radio", name, value: option.value, checked: option.value === value, onchange: () => onchange(option.value) }),
        h("span", {}, option.label)
      )
    )
  );
}

export function stepper({ value, min, max, onchange, label }) {
  let current = value;
  const output = h("output", { class: "stepper__value", "aria-live": "polite" }, String(current));
  const minus = h("button", { class: "icon-btn icon-btn--outline", type: "button", "aria-label": `Fewer ${label}`, onclick: () => set(current - 1) }, h("span", { class: "stepper__glyph" }, "−"));
  const plus = h("button", { class: "icon-btn icon-btn--outline", type: "button", "aria-label": `More ${label}`, onclick: () => set(current + 1) }, icon("plus", { size: 18 }));
  function set(next) {
    current = Math.min(max, Math.max(min, next));
    output.textContent = String(current);
    minus.disabled = current <= min;
    plus.disabled = current >= max;
    onchange(current);
  }
  set(current);
  return h("div", { class: "stepper" }, minus, output, plus);
}

export function errorText() {
  return h("p", { class: "form-error", role: "alert", hidden: true });
}

export function showError(el, message) {
  el.textContent = message || "";
  el.hidden = !message;
}

export function dateField({ value = "", min = "", label, onchange }) {
  const native = h("input", { class: "date-field__native", type: "date", value, min: min || null, tabindex: "-1", "aria-hidden": "true" });
  const text = h("span", { class: "date-field__value" });
  const button = h("button", { class: "input date-field", type: "button", "aria-label": label, onclick: open }, text, icon("calendar", { size: 20 }));

  function render() {
    text.textContent = native.value ? formatNumericDate(native.value) : "DD-MM-YYYY";
    text.classList.toggle("is-empty", !native.value);
  }

  function open() {
    try {
      native.showPicker();
    } catch {
      native.focus();
    }
  }

  native.addEventListener("change", () => {
    render();
    onchange?.(native.value);
  });
  render();

  return {
    el: h("span", { class: "date-field-wrap" }, button, native),
    get value() {
      return native.value;
    },
    set value(next) {
      native.value = next;
      render();
    },
    setMin(next) {
      native.min = next;
    }
  };
}
