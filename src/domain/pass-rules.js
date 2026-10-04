import { earliest } from "./collections.js";

export const RuleType = Object.freeze({ ANY: "any", FIXED: "fixed" });

export const Reason = Object.freeze({
  ENTRY: "entry",
  REENTRY: "reentry",
  UNKNOWN: "unknown",
  OTHER_EVENT: "other-event",
  CANCELLED: "cancelled",
  NOT_EVENT_DAY: "not-event-day",
  NOT_VALID_TODAY: "not-valid-today",
  ALREADY_ENTERED: "already-entered",
  DAYS_USED_UP: "days-used-up"
});

export const allowedDayCount = (rule) => (rule.type === RuleType.FIXED ? rule.days.length : rule.count);

export function describeRule(rule, totalDays) {
  if (rule.type === RuleType.FIXED) {
    if (totalDays > 1 && rule.days.length === totalDays) return "Every day";
    return rule.days.length === 1 ? "1 fixed day" : `${rule.days.length} fixed days`;
  }
  return rule.count === 1 ? "Any 1 day" : `Any ${rule.count} days`;
}

export function usedDays(liveScans) {
  return [...new Set(liveScans.map((scan) => scan.day))].sort();
}

const valid = (reason, detail = {}) => ({ status: "valid", reason, detail });
const invalid = (reason, detail = {}) => ({ status: "invalid", reason, detail });

export function evaluateScan({ pass, day, eventDayKeys, priorScans }) {
  if (!pass) return invalid(Reason.UNKNOWN);
  if (pass.deleted) return invalid(Reason.CANCELLED);
  if (!eventDayKeys.includes(day)) return invalid(Reason.NOT_EVENT_DAY);

  const { rule } = pass;
  if (rule.type === RuleType.FIXED && !rule.days.includes(day)) {
    return invalid(Reason.NOT_VALID_TODAY, { validDays: [...rule.days].sort() });
  }

  const todays = priorScans.filter((scan) => scan.day === day);
  const otherDays = new Set(priorScans.filter((scan) => scan.day !== day).map((scan) => scan.day));
  const limit = allowedDayCount(rule);

  if (todays.length > 0) {
    if (!pass.allowReentry) return invalid(Reason.ALREADY_ENTERED, { firstEntry: earliest(todays) });
    return valid(Reason.REENTRY, { entryNumber: todays.length + 1, dayNumber: otherDays.size + 1, limit });
  }

  if (rule.type === RuleType.ANY && otherDays.size >= limit) {
    return invalid(Reason.DAYS_USED_UP, { limit, usedDays: [...otherDays].sort() });
  }

  return valid(Reason.ENTRY, { dayNumber: otherDays.size + 1, limit });
}
