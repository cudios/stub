import { h, replace } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { emptyState } from "../../ui/empty.js";
import { confirmSheet } from "../../ui/sheet.js";
import { toast } from "../../ui/toast.js";
import { REASON_LABELS } from "../scanner/result-copy.js";
import { Reason } from "../../domain/pass-rules.js";
import { permissionsFor } from "../../domain/permissions.js";
import { formatTime } from "../../domain/dates.js";
import { formatPassId } from "../../domain/ids.js";
import { undoScan } from "../../data/scans-repo.js";
import { getDevice, getMembership } from "../../core/store.js";

const stat = (label, value) => h("div", { class: "stats__item" }, h("dt", {}, label), h("dd", {}, String(value)));

function entryRow(scan, state, session, canUndo) {
  const pass = scan.passId ? state.attendees.get(scan.passId) : null;
  const ok = scan.status === "valid";
  const tone = scan.undone ? "undone" : ok ? "ok" : "bad";
  const pending = state.pendingScans.has(scan.id);
  const undo = canUndo && ok && !scan.undone
    ? h("button", {
        class: "link-btn",
        type: "button",
        onclick: async () => {
          const confirmed = await confirmSheet({ title: "Undo this entry?", message: "The pass can be scanned again today.", confirmLabel: "Undo entry" });
          if (confirmed) {
            undoScan(session.eventId, scan.id, getDevice());
            toast("Entry undone");
          }
        }
      }, icon("undo", { size: 16 }), "Undo")
    : null;

  return h("li", { class: ["entry", `entry--${tone}`] },
    h("span", { class: "entry__icon" }, icon(scan.undone ? "undo" : ok ? "check" : "close", { size: 16 })),
    h("span", { class: "entry__main" },
      h("span", { class: "entry__title" }, pass?.name || (scan.passId ? `Pass ${formatPassId(scan.passId)}` : "Unreadable pass")),
      h("span", { class: "entry__meta" }, [scan.undone ? "Undone" : REASON_LABELS[scan.reason] || scan.reason, formatTime(scan.at), scan.deviceName || "Unnamed device"].join(", "))
    ),
    pending ? h("span", { class: "tag" }, "Not synced") : null,
    undo
  );
}

export function createEntriesPanel({ session, day, allowUndo }) {
  const summary = h("dl", { class: "stats stats--row" });
  const list = h("ul", { class: "entries" });
  const el = h("section", { class: "panel" }, summary, list);

  function update(state) {
    const scans = state.scans.filter((scan) => scan.day === day);
    const live = scans.filter((scan) => scan.status === "valid" && !scan.undone);
    replace(summary,
      stat("People in", live.filter((scan) => scan.reason === Reason.ENTRY).length),
      stat("Re-entries", live.filter((scan) => scan.reason === Reason.REENTRY).length),
      stat("Rejected", scans.filter((scan) => scan.status === "invalid").length)
    );
    if (!scans.length) {
      replace(list, h("li", { class: "entries__empty" }, emptyState("No scans yet", allowUndo ? "Scans from every device show up here as they sync." : "Nobody was scanned on this day.")));
      return;
    }
    const canUndo = allowUndo && permissionsFor(getMembership(session.eventId)?.role, state.event).undo;
    replace(list, scans.map((scan) => entryRow(scan, state, session, canUndo)));
  }

  return { el, update };
}
