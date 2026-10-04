function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : String(child));
  }
}

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  append(el, children);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = Array.isArray(value) ? value.filter(Boolean).join(" ") : value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key === "html") el.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else if (key === "value" || typeof value === "boolean") el[key] = value;
    else el.setAttribute(key, value);
  }
  return el;
}

export function replace(el, ...children) {
  el.replaceChildren();
  append(el, children);
}

export function screen(className, ...children) {
  return h("main", { class: ["screen", className] }, ...children);
}
