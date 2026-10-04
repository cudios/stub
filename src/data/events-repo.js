import { setDoc, updateDoc, getDoc } from "../../vendor/firebase.js";
import { refs } from "./refs.js";
import { commit } from "./commit.js";
import { newEventId, newCode } from "../domain/ids.js";

export function createEvent({ name, description, startDate, endDate }, device) {
  const eventId = newEventId();
  const managerCode = newCode();
  let volunteerCode = newCode();
  while (volunteerCode === managerCode) volunteerCode = newCode();

  const event = {
    name,
    description,
    startDate,
    endDate,
    createdAt: Date.now(),
    createdBy: device.id,
    settings: { volunteersCanUndo: false, volunteersSeePhone: false }
  };

  commit(setDoc(refs.event(eventId), event), "Couldn't save the event");
  commit(setDoc(refs.secrets(eventId), { managerCode, volunteerCode }), "Couldn't save the event codes");
  commit(setDoc(refs.code(managerCode), { eventId, role: "manager" }), "Couldn't save the manager code");
  commit(setDoc(refs.code(volunteerCode), { eventId, role: "volunteer" }), "Couldn't save the volunteer code");

  return { eventId, managerCode, volunteerCode, event };
}

export async function resolveCode(code, timeoutMs = 9000) {
  const lookup = getDoc(refs.code(code));
  const timeout = new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), timeoutMs));
  const snap = await Promise.race([lookup, timeout]);
  return snap.exists() ? snap.data() : null;
}

export function updateSettings(eventId, patch) {
  const fields = Object.fromEntries(Object.entries(patch).map(([key, value]) => [`settings.${key}`, value]));
  commit(updateDoc(refs.event(eventId), fields), "Couldn't update settings");
}
