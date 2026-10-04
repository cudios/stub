import { h, replace, screen } from "../ui/dom.js";
import { icon } from "../ui/icons.js";
import { appBar } from "../ui/app-bar.js";
import { tabs } from "../ui/tabs.js";
import { input } from "../ui/fields.js";
import { emptyState, loadingRows } from "../ui/empty.js";
import { syncStrip } from "../ui/sync-status.js";
import { openAddAttendee, openPassDetail } from "../features/passes/attendee-sheets.js";
import { openEventSettings } from "../features/events/settings-sheet.js";
import { notOnDeviceScreen } from "./not-found.js";
import { getSession } from "../data/event-session.js";
import { getMembership } from "../core/store.js";
import { navigate, goBack, replacePath } from "../core/router.js";
import { describeRule, allowedDayCount } from "../domain/pass-rules.js";
import { permissionsFor } from "../domain/permissions.js";
import { isLiveEntry } from "../domain/conflicts.js";
import { groupBy } from "../domain/collections.js";
import { todayKey, formatDay, formatRange, daysBetween } from "../domain/dates.js";

function attendeeRow(view, state, session, liveByPass) {
  const used = new Set((liveByPass.get(view.passId) || []).map((scan) => scan.day)).size;
  const meta = view.deleted ? "Cancelled" : `${describeRule(view.rule, state.days.length)}, ${used} of ${allowedDayCount(view.rule)} used`;
  return h("button", { class: ["row", view.deleted && "row--muted"], type: "button", onclick: () => openPassDetail(session, view.passId) },
    h("span", { class: "row__main" }, h("span", { class: "row__title" }, view.name), h("span", { class: "row__meta" }, meta)),
    state.pendingPasses.has(view.passId) ? h("span", { class: "tag" }, "Not synced") : null,
    icon("chevron", { size: 18 })
  );
}

function createManagePanel(session, role) {
  let query = "";
  let state = null;
  const description = h("p", { class: "event-description", hidden: true });
  const count = h("span", { class: "section__count" });
  const search = input({ type: "search", placeholder: "Search name or pass ID", "aria-label": "Search attendees", autocomplete: "off" });
  const searchWrap = h("label", { class: "search", hidden: true }, icon("search", { size: 18 }), search);
  const list = h("div", { class: "list" });
  const add = role === "manager"
    ? h("button", { class: "btn btn--primary btn--small", type: "button", onclick: () => openAddAttendee(session) }, icon("plus", { size: 18 }), "Add")
    : null;
  const el = h("section", { class: "panel" },
    description,
    h("div", { class: "section__head" }, h("h2", { class: "section__title" }, "Attendees ", count), add),
    searchWrap,
    list
  );

  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    render();
  });

  function render() {
    if (!state) return;
    description.textContent = state.event?.description || "";
    description.hidden = !state.event?.description;
    const perms = permissionsFor(role, state.event);
    const all = state.attendeeList;
    count.textContent = String(all.filter((view) => !view.deleted).length);
    searchWrap.hidden = all.length < 6;
    if (!state.ready && !all.length) return replace(list, loadingRows());
    if (!all.length) {
      return replace(list, emptyState("No attendees yet", perms.manage ? "Add an attendee to create their QR pass." : "The organizer hasn't added anyone yet."));
    }
    const compact = query.replace(/[^a-z0-9]/g, "");
    const matches = all.filter((view) => !query || view.name.toLowerCase().includes(query) || (compact && view.passId.toLowerCase().includes(compact)));
    if (!matches.length) return replace(list, h("p", { class: "text-muted list__empty" }, "Nobody matches that search."));
    const liveByPass = groupBy(state.scans.filter(isLiveEntry), (scan) => scan.passId);
    replace(list, matches.map((view) => attendeeRow(view, state, session, liveByPass)));
  }

  return { el, update(next) { state = next; render(); } };
}

function dayCard(day, index, today, entries, eventId) {
  const label = `Day ${index + 1}`;
  if (day === today) {
    return h("button", { class: "day day--today", type: "button", onclick: () => navigate(`/e/${eventId}/d/${day}`) },
      h("span", { class: "day__label" }, `${label}, today`),
      h("span", { class: "day__date" }, formatDay(day)),
      h("span", { class: "day__meta" }, `${entries} entered so far`),
      h("span", { class: "day__cta" }, icon("scan", { size: 20 }), "Open scanner")
    );
  }
  if (day < today) {
    return h("button", { class: "day day--past", type: "button", onclick: () => navigate(`/e/${eventId}/d/${day}`) },
      h("span", { class: "day__label" }, label),
      h("span", { class: "day__date" }, formatDay(day)),
      h("span", { class: "day__meta" }, `${entries} ${entries === 1 ? "entry" : "entries"}`),
      icon("chevron", { size: 18 })
    );
  }
  const wait = daysBetween(today, day);
  return h("div", { class: "day day--upcoming", "aria-disabled": "true" },
    h("span", { class: "day__label" }, label),
    h("span", { class: "day__date" }, formatDay(day)),
    h("span", { class: "day__meta" }, wait === 1 ? "Tomorrow" : `In ${wait} days`)
  );
}

function createDaysPanel(session) {
  const el = h("section", { class: "panel" });
  function update(state) {
    if (!state.event) return replace(el, state.eventMissing ? emptyState("Event not found", "It may have been removed from the server.") : loadingRows());
    const today = todayKey();
    const entriesByDay = groupBy(state.scans.filter((scan) => isLiveEntry(scan) && scan.reason === "entry"), (scan) => scan.day);
    const note = state.days.includes(today)
      ? null
      : h("p", { class: "notice" }, today < state.days[0] ? `Scanning opens on ${formatDay(state.days[0])}.` : "This event has ended. Past days stay available below.");
    replace(el,
      note,
      h("div", { class: "days" }, state.days.map((day, index) => dayCard(day, index, today, (entriesByDay.get(day) || []).length, session.eventId)))
    );
  }
  return { el, update };
}

export function eventScreen({ eventId, tab }) {
  const membership = getMembership(eventId);
  if (!membership) return notOnDeviceScreen();
  const role = membership.role;
  const session = getSession(eventId);
  let active = tab === "manage" || tab === "days" ? tab : role === "manager" ? "manage" : "days";

  const bar = appBar({
    title: membership.name || "Event",
    subtitle: membership.startDate ? formatRange(membership.startDate, membership.endDate) : "",
    onBack: () => goBack("/"),
    actions: [h("button", { class: "icon-btn", type: "button", "aria-label": "Settings", onclick: () => openEventSettings(session) }, icon("sliders"))]
  });
  const strip = syncStrip(session);
  const manage = createManagePanel(session, role);
  const days = createDaysPanel(session);
  const body = h("div", { class: "screen__body" });

  const show = (id) => {
    active = id;
    replace(body, id === "manage" ? manage.el : days.el);
    replacePath(`/e/${eventId}/${id}`);
  };

  const tabbar = tabs({
    items: [{ id: "manage", label: role === "manager" ? "Manage" : "Passes" }, { id: "days", label: "Days" }],
    active,
    onselect: show
  });

  const unsubscribe = session.subscribe((state) => {
    if (state.event) {
      bar.setTitle(state.event.name);
      bar.setSubtitle(formatRange(state.event.startDate, state.event.endDate));
    }
    manage.update(state);
    days.update(state);
  });

  show(active);

  const el = screen("event-screen", h("div", { class: "sticky-top" }, bar.el, strip.el, tabbar.el), body);
  return {
    el,
    destroy: () => {
      unsubscribe();
      strip.destroy();
    }
  };
}
