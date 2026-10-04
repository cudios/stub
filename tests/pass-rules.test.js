import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateScan, Reason } from "../src/domain/pass-rules.js";

const days = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"];
const scan = (day, at = 1, id = `${day}-${at}`) => ({ id, day, at, status: "valid", undone: false });
const pass = (rule, extra = {}) => ({ passId: "AAAA2222", name: "Test", rule, allowReentry: false, deleted: false, ...extra });
const run = (p, day, priorScans = []) => evaluateScan({ pass: p, day, eventDayKeys: days, priorScans });

test("unknown pass is rejected", () => {
  assert.equal(run(undefined, days[0]).reason, Reason.UNKNOWN);
});

test("cancelled pass is rejected", () => {
  assert.equal(run(pass({ type: "any", count: 2 }, { deleted: true }), days[0]).reason, Reason.CANCELLED);
});

test("scan outside the event dates is rejected", () => {
  assert.equal(run(pass({ type: "any", count: 2 }), "2026-11-01").reason, Reason.NOT_EVENT_DAY);
});

test("first entry on an any-days pass is valid", () => {
  const result = run(pass({ type: "any", count: 2 }), days[0]);
  assert.equal(result.status, "valid");
  assert.equal(result.detail.dayNumber, 1);
});

test("second entry on the same day is rejected without re-entry", () => {
  const result = run(pass({ type: "any", count: 2 }), days[0], [scan(days[0])]);
  assert.equal(result.reason, Reason.ALREADY_ENTERED);
});

test("second entry on the same day is a re-entry when allowed", () => {
  const result = run(pass({ type: "any", count: 2 }, { allowReentry: true }), days[0], [scan(days[0])]);
  assert.equal(result.reason, Reason.REENTRY);
  assert.equal(result.detail.entryNumber, 2);
});

test("any-days pass runs out after its day count", () => {
  const result = run(pass({ type: "any", count: 2 }), days[2], [scan(days[0]), scan(days[1])]);
  assert.equal(result.reason, Reason.DAYS_USED_UP);
});

test("fixed pass is rejected on a day it does not cover", () => {
  const result = run(pass({ type: "fixed", days: [days[1]] }), days[0]);
  assert.equal(result.reason, Reason.NOT_VALID_TODAY);
});

test("fixed pass is valid on its own day", () => {
  assert.equal(run(pass({ type: "fixed", days: [days[1], days[3]] }), days[3], [scan(days[1])]).status, "valid");
});
