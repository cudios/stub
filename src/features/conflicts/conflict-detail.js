import { h, replace } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { openSheet } from "../../ui/sheet.js";
import { toast } from "../../ui/toast.js";
import { CONFLICT_TITLES, conflictSummary } from "./conflict-copy.js";
import { ConflictType } from "../../domain/conflicts.js";
import { describeRule } from "../../domain/pass-rules.js";
import { permissionsFor } from "../../domain/permissions.js";
import { formatDateTime, formatDay } from "../../domain/dates.js";
import { formatPassId } from "../../domain/ids.js";
import { markReviewed } from "../../data/scans-repo.js";
import { getDevice, getMembership } from "../../core/store.js";

function side(heading, rows, highlight = "") {
  return h("div", { class: ["compare__side", highlight && `compare__side--${highlight}`] },
    h("p", { class: "compare__heading" }, heading),
    h("dl", { class: "compare__rows" }, rows.filter(Boolean).map(([label, value]) => h("div", {}, h("dt", {}, label), h("dd", {}, value))))
  );
}

function scanSide(scan, index) {
  return side(`Entry ${index + 1}`, [
    ["Device", scan.deviceName || "Unnamed device"],
    ["Time", formatDateTime(scan.at)],
    ["Day", formatDay(scan.day)]
  ]);
}

function comparison(conflict, state) {
  if (conflict.type === ConflictType.EDIT) {
    return conflict.edits.map((edit, index) =>
      side(edit.id === conflict.keptId ? "Kept (latest)" : `Version ${index + 1}`, [
        ["Value", edit.value || "(empty)"],
        ["Device", edit.deviceName || "Unnamed device"],
        ["Edited", formatDateTime(edit.editedAt)]
      ], edit.id === conflict.keptId ? "kept" : "")
    );
  }
  if (conflict.type === ConflictType.AFTER_CANCEL) {
    const cancel = state.edits.find((edit) => edit.passId === conflict.passId && edit.field === "deleted");
    return [
      side("Cancelled", [["Device", cancel?.deviceName || "Unnamed device"], ["Time", formatDateTime(conflict.cancelledAt)]]),
      side("Let in", [["Device", conflict.scans[0].deviceName || "Unnamed device"], ["Time", formatDateTime(conflict.scans[0].at)]], "bad")
    ];
  }
  return conflict.scans.map(scanSide);
}

export function openConflictDetail(session, conflictId) {
  const body = h("div", { class: "stack" });
  let sheet = null;

  const render = (state) => {
    const conflict = state.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      replace(body, h("p", { class: "text-muted" }, "This conflict was resolved, for example by undoing one of the entries."));
      return;
    }
    const pass = state.attendees.get(conflict.passId);
    const perms = permissionsFor(getMembership(session.eventId)?.role, state.event);
    const review = state.reviews.get(conflict.id);

    replace(body,
      h("p", { class: "conflict-detail__summary" }, conflictSummary(conflict)),
      pass
        ? h("div", { class: "person" },
            h("p", { class: "person__name" }, pass.name),
            h("p", { class: "text-muted" }, `${describeRule(pass.rule, state.days.length)}, pass ${formatPassId(pass.passId)}`),
            perms.seePhone && pass.phone ? h("p", { class: "person__phone" }, pass.phone) : null
          )
        : null,
      h("div", { class: "compare" }, comparison(conflict, state)),
      conflict.type === ConflictType.EDIT
        ? h("p", { class: "field__hint" }, "The most recent edit is shown everywhere. The other version is kept here so nothing is lost silently.")
        : h("p", { class: "field__hint" }, "Each device was offline and couldn't see the other's scan. Both entries were recorded and flagged here after syncing."),
      review
        ? h("p", { class: "notice" }, `Reviewed by ${review.reviewedBy || "a device"} at ${formatDateTime(review.reviewedAt)}`)
        : h("button", {
            class: "btn btn--primary btn--block",
            type: "button",
            onclick: () => {
              markReviewed(session.eventId, conflict.id, getDevice());
              toast("Moved to reviewed");
              sheet?.close();
            }
          }, icon("check", { size: 18 }), "Mark reviewed")
    );
  };

  const conflict = session.state?.conflicts.find((c) => c.id === conflictId);
  const unsubscribe = session.subscribe(render);
  sheet = openSheet({ title: conflict ? CONFLICT_TITLES[conflict.type] : "Conflict", content: body, onClose: unsubscribe });
}
