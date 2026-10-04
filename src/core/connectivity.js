import { emit } from "./bus.js";

let online = navigator.onLine;

export const isOnline = () => online;

function update(next) {
  if (next === online) return;
  online = next;
  emit("connectivity", online);
}

export function startConnectivityWatch() {
  window.addEventListener("online", () => update(true));
  window.addEventListener("offline", () => update(false));
}
