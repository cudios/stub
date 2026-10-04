import { h, replace } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { emptyState } from "../../ui/empty.js";
import { CONFLICT_TITLES, conflictSummary } from "./conflict-copy.js";
import { openConflictDetail } from "./conflict-detail.js";
import { latestMoment } from "../../domain/conflicts.js";
import { formatTime } from "../../domain/dates.js";

function conflictCard(conflict, state, session, reviewed) {
  const pass = state.attendees.get(conflict.passId);
  return h("button", { class: ["conflict-card", reviewed && "conflict-card--reviewed"], type: "button", onclick: () => openConflictDetail(session, conflict.id) },
    h("span", { class: "conflict-card__icon" }, icon(reviewed ? "check" : "alert", { size: 20 })),
    h("span", { class: "conflict-card__main" },
      h("span", { class: "conflict-card__title" }, CONFLICT_TITLES[conflict.type]),
      h("span", { class: "conflict-card__name" }, pass?.name || "Unknown pass"),
      h("span", { class: "conflict-card__meta" }, conflictSummary(conflict))
    ),
    h("span", { class: "conflict-card__time" }, formatTime(latestMoment(conflict)))
  );
}

export function createConflictsPanel({ session, day }) {
  const openList = h("div", { class: "stack stack--tight" });
  const reviewedList = h("div", { class: "stack stack--tight" });
  const reviewedLabel = h("span", {});
  const reviewed = h("details", { class: "reviewed", hidden: true }, h("summary", {}, reviewedLabel, icon("chevron", { size: 16 })), reviewedList);
  const el = h("section", { class: "panel" }, openList, reviewed);

  function update(state) {
    const todays = state.conflicts.filter((conflict) => conflict.day === day);
    const open = todays.filter((conflict) => !state.reviews.has(conflict.id));
    const done = todays.filter((conflict) => state.reviews.has(conflict.id));

    replace(openList, open.length
      ? open.map((conflict) => conflictCard(conflict, state, session, false))
      : emptyState("No open conflicts", "When two offline devices let in the same pass, or edit the same attendee, it shows up here after they sync."));

    reviewed.hidden = done.length === 0;
    reviewedLabel.textContent = `Reviewed (${done.length})`;
    replace(reviewedList, done.map((conflict) => conflictCard(conflict, state, session, true)));
    return open.length;
  }

  return { el, update };
}
