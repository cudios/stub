import { h, replace, screen } from "../ui/dom.js";
import { appBar } from "../ui/app-bar.js";
import { tabs } from "../ui/tabs.js";
import { syncStrip } from "../ui/sync-status.js";
import { createScanPanel } from "../features/scanner/scan-panel.js";
import { createEntriesPanel } from "../features/entries/entries-panel.js";
import { createConflictsPanel } from "../features/conflicts/conflicts-panel.js";
import { notOnDeviceScreen } from "./not-found.js";
import { getSession } from "../data/event-session.js";
import { getMembership } from "../core/store.js";
import { goBack, replacePath } from "../core/router.js";
import { todayKey, formatDay } from "../domain/dates.js";

export function dayScreen({ eventId, day, tab }) {
  const membership = getMembership(eventId);
  if (!membership) return notOnDeviceScreen();
  const session = getSession(eventId);
  const isToday = day === todayKey();
  const bar = appBar({
    title: isToday ? "Today" : formatDay(day),
    subtitle: isToday ? `${formatDay(day)}, ${membership.name || ""}`.replace(/, $/, "") : membership.name || "",
    onBack: () => goBack(`/e/${eventId}/days`)
  });
  const strip = syncStrip(session);
  const entries = createEntriesPanel({ session, day, allowUndo: isToday });
  const conflicts = createConflictsPanel({ session, day });
  const scan = isToday ? createScanPanel({ session }) : null;
  const body = h("div", { class: "screen__body" });
  const panels = { scan, entries, conflicts };
  const tabIds = isToday ? ["scan", "entries", "conflicts"] : ["entries"];
  let active = tabIds.includes(tab) ? tab : tabIds[0];

  const show = (id) => {
    if (active === "scan" && id !== "scan") scan?.pause();
    active = id;
    replace(body, panels[id].el);
    replacePath(`/e/${eventId}/d/${day}/${id}`);
  };

  const labels = { scan: "Scan", entries: "Entries", conflicts: "Conflicts" };
  const tabbar = tabIds.length > 1 ? tabs({ items: tabIds.map((id) => ({ id, label: labels[id] })), active, onselect: show }) : null;

  const unsubscribe = session.subscribe((state) => {
    if (state.event) bar.setSubtitle(isToday ? `${formatDay(day)}, ${state.event.name}` : state.event.name);
    entries.update(state);
    const open = conflicts.update(state);
    tabbar?.setBadge("conflicts", open);
  });

  show(active);

  const el = screen("day-screen", h("div", { class: "sticky-top" }, bar.el, strip.el, tabbar?.el), body);
  return {
    el,
    destroy: () => {
      unsubscribe();
      strip.destroy();
      scan?.destroy();
    }
  };
}
