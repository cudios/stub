import { h, replace } from "./dom.js";
import { icon } from "./icons.js";
import { openSheet } from "./sheet.js";
import { on } from "../core/bus.js";
import { isOnline } from "../core/connectivity.js";
import { formatTime } from "../domain/dates.js";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function syncStatus(state) {
  const pending = state?.pendingCount || 0;
  const waiting = `${plural(pending, "change")} waiting to sync`;
  if (!isOnline()) return { key: "offline", icon: "offline", label: pending ? `Offline. ${waiting}` : "Offline. Working from this device" };
  if (!state?.connected) return { key: "connecting", icon: "cloud", label: pending ? `Connecting. ${waiting}` : "Connecting to server" };
  if (pending) return { key: "syncing", icon: "sync", label: `Syncing ${plural(pending, "change")}` };
  return { key: "synced", icon: "cloudCheck", label: "All changes synced" };
}

const EXPLANATIONS = {
  offline: () => "Everything you do here is saved on this device first. It uploads by itself when the connection is back, as long as the app is open.",
  connecting: () => "The device has a network but the server hasn't answered yet. Weak signal causes this. Your changes are safe on this device.",
  syncing: () => "Uploading changes made on this device. Other devices see them right after.",
  synced: (state) => `This device matches the server. Last confirmed at ${formatTime(state?.lastSyncedAt || Date.now())}.`
};

const stat = (label, value) => h("div", { class: "stats__item" }, h("dt", {}, label), h("dd", {}, String(value)));

function openSyncDetails(session) {
  const body = h("div", { class: "stack" });
  const render = () => {
    const state = session.state;
    const status = syncStatus(state);
    const breakdown = state?.pendingBreakdown || { scans: 0, passes: 0, other: 0 };
    replace(body,
      h("p", { class: ["sync-detail", `is-${status.key}`] }, h("span", { class: "sync__icon" }, icon(status.icon, { size: 22 })), status.label),
      h("p", { class: "text-muted" }, EXPLANATIONS[status.key](state)),
      h("dl", { class: "stats" }, stat("Scans waiting", breakdown.scans), stat("Pass changes waiting", breakdown.passes), stat("Other changes", breakdown.other))
    );
  };
  const unsubscribe = session.subscribe(render);
  const off = on("connectivity", render);
  openSheet({ title: "Sync status", content: body, onClose: () => { unsubscribe(); off(); } });
}

export function syncStrip(session) {
  const label = h("span", { class: "sync__label" });
  const glyph = h("span", { class: "sync__icon" });
  const el = h("button", { class: "sync", type: "button", "aria-live": "polite", onclick: () => openSyncDetails(session) },
    glyph,
    label,
    icon("chevron", { size: 16 })
  );
  const render = () => {
    const status = syncStatus(session.state);
    if (el.dataset.state !== status.key) glyph.replaceChildren(icon(status.icon, { size: 18 }));
    el.dataset.state = status.key;
    label.textContent = status.label;
  };
  const unsubscribe = session.subscribe(render);
  const off = on("connectivity", render);
  render();
  return { el, destroy: () => { unsubscribe(); off(); } };
}
