import { groupBy } from "./collections.js";

export const EDITABLE_FIELDS = Object.freeze(["name", "phone"]);

export const compareEdits = (a, b) => a.editedAt - b.editedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function foldAttendee(attendee, edits) {
  const view = { ...attendee, deleted: false, deletedAt: null, heads: {} };
  for (const edit of [...edits].sort(compareEdits)) {
    view[edit.field] = edit.value;
    view.heads[edit.field] = edit.id;
    if (edit.field === "deleted" && edit.value === true && view.deletedAt === null) view.deletedAt = edit.editedAt;
  }
  return view;
}

export function buildAttendeeViews(attendees, edits) {
  const editsByPass = groupBy(edits, (edit) => edit.passId);
  return attendees.map((attendee) => foldAttendee(attendee, editsByPass.get(attendee.passId) || []));
}

export function sortAttendees(views) {
  return [...views].sort((a, b) => Number(a.deleted) - Number(b.deleted) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
