import { groupBy, byTimeAsc, earliest } from "./collections.js";
import { compareEdits } from "./attendees.js";
import { RuleType } from "./pass-rules.js";
import { dayKeyAt } from "./dates.js";

export const ConflictType = Object.freeze({
  DUPLICATE: "duplicate",
  OVERUSE: "overuse",
  AFTER_CANCEL: "after-cancel",
  EDIT: "edit"
});

export const isLiveEntry = (scan) => scan.status === "valid" && !scan.undone;

function scanConflictsForPass(pass, scans) {
  const found = [];
  const byDay = groupBy(scans, (scan) => scan.day);

  if (!pass.allowReentry) {
    for (const [day, dayScans] of byDay) {
      if (dayScans.length > 1) {
        found.push({ id: `duplicate:${pass.passId}:${day}`, type: ConflictType.DUPLICATE, passId: pass.passId, day, scans: [...dayScans].sort(byTimeAsc) });
      }
    }
  }

  if (pass.rule.type === RuleType.ANY) {
    const days = [...byDay.keys()].sort();
    if (days.length > pass.rule.count) {
      found.push({
        id: `overuse:${pass.passId}:${days.length}`,
        type: ConflictType.OVERUSE,
        passId: pass.passId,
        day: days[days.length - 1],
        limit: pass.rule.count,
        scans: days.map((day) => earliest(byDay.get(day)))
      });
    }
  }

  if (pass.deleted && pass.deletedAt !== null) {
    for (const scan of scans) {
      if (scan.at > pass.deletedAt) {
        found.push({ id: `after-cancel:${scan.id}`, type: ConflictType.AFTER_CANCEL, passId: pass.passId, day: scan.day, cancelledAt: pass.deletedAt, scans: [scan] });
      }
    }
  }

  return found;
}

function editConflicts(edits) {
  const found = [];
  const groups = groupBy(
    edits.filter((edit) => edit.field !== "deleted"),
    (edit) => `${edit.passId}|${edit.field}|${edit.baseEditId || "origin"}`
  );
  for (const [key, group] of groups) {
    if (group.length < 2 || new Set(group.map((edit) => edit.value)).size < 2) continue;
    const sorted = [...group].sort(compareEdits);
    const kept = sorted[sorted.length - 1];
    found.push({ id: `edit:${key}`, type: ConflictType.EDIT, passId: kept.passId, field: kept.field, day: dayKeyAt(kept.editedAt), edits: sorted, keptId: kept.id });
  }
  return found;
}

export const latestMoment = (conflict) =>
  conflict.type === ConflictType.EDIT
    ? Math.max(...conflict.edits.map((edit) => edit.editedAt))
    : Math.max(...conflict.scans.map((scan) => scan.at));

export function detectConflicts({ attendees, scans, edits }) {
  const conflicts = [];
  const liveByPass = groupBy(scans.filter(isLiveEntry), (scan) => scan.passId);
  for (const [passId, passScans] of liveByPass) {
    const pass = attendees.get(passId);
    if (pass) conflicts.push(...scanConflictsForPass(pass, passScans));
  }
  conflicts.push(...editConflicts(edits));
  return conflicts.sort((a, b) => latestMoment(b) - latestMoment(a));
}
