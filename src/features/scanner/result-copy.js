import { Reason } from "../../domain/pass-rules.js";
import { formatShortDay, formatTime } from "../../domain/dates.js";

export const REASON_LABELS = Object.freeze({
  [Reason.ENTRY]: "Entered",
  [Reason.REENTRY]: "Re-entry",
  [Reason.UNKNOWN]: "Unknown pass",
  [Reason.OTHER_EVENT]: "Wrong event",
  [Reason.CANCELLED]: "Cancelled pass",
  [Reason.NOT_EVENT_DAY]: "No event today",
  [Reason.NOT_VALID_TODAY]: "Not valid today",
  [Reason.ALREADY_ENTERED]: "Already entered",
  [Reason.DAYS_USED_UP]: "All days used"
});

const dayList = (days) => days.map(formatShortDay).join(", ");

export function resultMessage(result) {
  const { reason, detail } = result;
  switch (reason) {
    case Reason.ENTRY:
      return { title: "Valid entry", detail: `Day ${detail.dayNumber} of ${detail.limit}` };
    case Reason.REENTRY:
      return { title: "Valid re-entry", detail: `Entry ${detail.entryNumber} today` };
    case Reason.UNKNOWN:
      return { title: "Unknown pass", detail: "This pass isn't in the list on this device. If it was created moments ago, connect once to sync, then scan again." };
    case Reason.OTHER_EVENT:
      return { title: "Wrong event", detail: "This pass belongs to a different event." };
    case Reason.CANCELLED:
      return { title: "Pass cancelled", detail: "The organizer cancelled this pass." };
    case Reason.NOT_EVENT_DAY:
      return { title: "No event today", detail: "Today isn't one of this event's days." };
    case Reason.NOT_VALID_TODAY:
      return { title: "Not valid today", detail: `Valid on ${dayList(detail.validDays)}.` };
    case Reason.ALREADY_ENTERED:
      return { title: "Already entered today", detail: `First entry at ${formatTime(detail.firstEntry.at)} on ${detail.firstEntry.deviceName || "another device"}.` };
    case Reason.DAYS_USED_UP:
      return { title: "All days used", detail: `Used ${detail.limit} of ${detail.limit}: ${dayList(detail.usedDays)}.` };
    default:
      return { title: "Not valid", detail: "" };
  }
}
