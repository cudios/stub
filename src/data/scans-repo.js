import { setDoc, updateDoc } from "../../vendor/firebase.js";
import { refs } from "./refs.js";
import { commit } from "./commit.js";
import { newRecordId } from "../domain/ids.js";

export function recordScan(eventId, { passId, scannedEventId, day, result }, device) {
  const scan = {
    id: newRecordId(),
    passId: passId || null,
    scannedEventId: scannedEventId || eventId,
    day,
    at: Date.now(),
    deviceId: device.id,
    deviceName: device.name,
    status: result.status,
    reason: result.reason,
    undone: false
  };
  commit(setDoc(refs.scan(eventId, scan.id), scan), "Couldn't save the scan");
  return scan;
}

export function undoScan(eventId, scanId, device) {
  commit(updateDoc(refs.scan(eventId, scanId), { undone: true, undoneAt: Date.now(), undoneBy: device.name }), "Couldn't undo the scan");
}

export function markReviewed(eventId, conflictId, device) {
  const docId = conflictId.replace(/[/]/g, "_");
  commit(setDoc(refs.review(eventId, docId), { conflictId, reviewedAt: Date.now(), reviewedBy: device.name }), "Couldn't mark as reviewed");
}
