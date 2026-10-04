import { setDoc } from "../../vendor/firebase.js";
import { refs } from "./refs.js";
import { commit } from "./commit.js";
import { newPassId, newRecordId } from "../domain/ids.js";

export function addAttendee(eventId, { name, phone, rule, allowReentry }, device) {
  const record = {
    passId: newPassId(),
    name,
    phone,
    rule,
    allowReentry,
    createdAt: Date.now(),
    createdBy: device.id,
    createdByName: device.name
  };
  commit(setDoc(refs.attendee(eventId, record.passId), record), "Couldn't save the pass");
  return record;
}

export function editAttendee(eventId, view, field, value, device) {
  const edit = {
    id: newRecordId(),
    passId: view.passId,
    field,
    value,
    baseEditId: view.heads[field] || null,
    editedAt: Date.now(),
    deviceId: device.id,
    deviceName: device.name
  };
  commit(setDoc(refs.edit(eventId, edit.id), edit), "Couldn't save the change");
  return edit;
}

export const cancelPass = (eventId, view, device) => editAttendee(eventId, view, "deleted", true, device);
