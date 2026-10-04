import { test } from "node:test";
import assert from "node:assert/strict";
import { detectConflicts, ConflictType } from "../src/domain/conflicts.js";
import { foldAttendee } from "../src/domain/attendees.js";

const day1 = "2026-10-04";
const day2 = "2026-10-05";
const entry = (id, passId, day, at, deviceName, extra = {}) => ({ id, passId, day, at, deviceName, status: "valid", undone: false, ...extra });
const attendee = (passId, rule, extra = {}) => ({ passId, name: "Asha", phone: "", rule, allowReentry: false, ...extra });
const mapOf = (...views) => new Map(views.map((view) => [view.passId, view]));
const view = (record, edits = []) => foldAttendee(record, edits);

test("two gates admitting the same pass on one day is a duplicate", () => {
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 3 })));
  const scans = [entry("a", "P1", day1, 100, "Gate 1"), entry("b", "P1", day1, 200, "Gate 2")];
  const [conflict] = detectConflicts({ attendees, scans, edits: [] });
  assert.equal(conflict.type, ConflictType.DUPLICATE);
  assert.equal(conflict.scans.length, 2);
});

test("an undone scan does not create a conflict", () => {
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 3 })));
  const scans = [entry("a", "P1", day1, 100, "Gate 1"), entry("b", "P1", day1, 200, "Gate 2", { undone: true })];
  assert.equal(detectConflicts({ attendees, scans, edits: [] }).length, 0);
});

test("re-entry passes never produce duplicate conflicts", () => {
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 1 }, { allowReentry: true })));
  const scans = [entry("a", "P1", day1, 100, "Gate 1"), entry("b", "P1", day1, 200, "Gate 2")];
  assert.equal(detectConflicts({ attendees, scans, edits: [] }).length, 0);
});

test("using more days than allowed is an overuse", () => {
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 1 })));
  const scans = [entry("a", "P1", day1, 100, "Gate 1"), entry("b", "P1", day2, 90000000, "Gate 2")];
  const conflicts = detectConflicts({ attendees, scans, edits: [] });
  assert.equal(conflicts[0].type, ConflictType.OVERUSE);
  assert.equal(conflicts[0].day, day2);
});

test("a scan after the pass was cancelled is flagged", () => {
  const record = attendee("P1", { type: "any", count: 3 });
  const attendees = mapOf(view(record, [{ id: "e1", passId: "P1", field: "deleted", value: true, editedAt: 150, baseEditId: null }]));
  const scans = [entry("a", "P1", day1, 200, "Gate 2")];
  assert.equal(detectConflicts({ attendees, scans, edits: [] })[0].type, ConflictType.AFTER_CANCEL);
});

test("two offline edits from the same starting point conflict and the latest is kept", () => {
  const edits = [
    { id: "e1", passId: "P1", field: "name", value: "Asha S", editedAt: 300, baseEditId: null },
    { id: "e2", passId: "P1", field: "name", value: "Asha Shah", editedAt: 400, baseEditId: null }
  ];
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 3 }), edits));
  const [conflict] = detectConflicts({ attendees, scans: [], edits });
  assert.equal(conflict.type, ConflictType.EDIT);
  assert.equal(conflict.keptId, "e2");
  assert.equal(attendees.get("P1").name, "Asha Shah");
});

test("an edit made after seeing the previous one is not a conflict", () => {
  const edits = [
    { id: "e1", passId: "P1", field: "name", value: "Asha S", editedAt: 300, baseEditId: null },
    { id: "e2", passId: "P1", field: "name", value: "Asha Shah", editedAt: 400, baseEditId: "e1" }
  ];
  const attendees = mapOf(view(attendee("P1", { type: "any", count: 3 }), edits));
  assert.equal(detectConflicts({ attendees, scans: [], edits }).length, 0);
});
