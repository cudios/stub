const routes = [];
let outlet = null;
let current = null;
let depth = 0;

export function route(pattern, screen) {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, key) => (keys.push(key), "([^/]+)"))}$`);
  routes.push({ regex, keys, screen });
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (replace) history.replaceState(null, "", target);
  else if (location.hash !== target) {
    history.pushState(null, "", target);
    depth += 1;
  }
  render();
}

export function replacePath(path) {
  history.replaceState(null, "", `#${path}`);
}

export const goBack = (fallback) => (depth > 0 ? history.back() : navigate(fallback, { replace: true }));

function resolve(path) {
  for (const { regex, keys, screen } of routes) {
    const match = regex.exec(path);
    if (match) return { screen, params: Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(match[i + 1])])) };
  }
  return null;
}

function render() {
  const path = location.hash.replace(/^#/, "") || "/";
  const found = resolve(path) || resolve("/");
  current?.destroy?.();
  current = found.screen(found.params);
  outlet.replaceChildren(current.el);
  window.scrollTo(0, 0);
}

export function startRouter(target) {
  outlet = target;
  window.addEventListener("popstate", () => {
    depth = Math.max(0, depth - 1);
    render();
  });
  render();
}
