import { ConflictType } from "../../domain/conflicts.js";
import { formatTime, formatShortDay } from "../../domain/dates.js";

export const CONFLICT_TITLES = Object.freeze({
  [ConflictType.DUPLICATE]: "Same pass entered twice",
  [ConflictType.OVERUSE]: "More days used than allowed",
  [ConflictType.AFTER_CANCEL]: "Cancelled pass let in",
  [ConflictType.EDIT]: "Conflicting edits"
});

const devices = (items) => [...new Set(items.map((item) => item.deviceName || "Unnamed device"))].join(" and ");

export function conflictSummary(conflict) {
  switch (conflict.type) {
    case ConflictType.DUPLICATE:
      return `${conflict.scans.length} entries today, on ${devices(conflict.scans)}`;
    case ConflictType.OVERUSE:
      return `Used on ${conflict.scans.length} days (${conflict.scans.map((scan) => formatShortDay(scan.day)).join(", ")}), allowed ${conflict.limit}`;
    case ConflictType.AFTER_CANCEL:
      return `Let in at ${formatTime(conflict.scans[0].at)} on ${devices(conflict.scans)}, after it was cancelled`;
    case ConflictType.EDIT:
      return `${conflict.field === "name" ? "Name" : "Phone"} changed on ${devices(conflict.edits)} at the same time`;
    default:
      return "";
  }
}
