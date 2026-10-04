import { emit } from "./bus.js";

let installEvent = null;

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

export function watchInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event;
    emit("install:available", true);
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    emit("install:available", false);
  });
}

export const canInstall = () => installEvent !== null;

export async function promptInstall() {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  emit("install:available", false);
}
