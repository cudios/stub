import { newRecordId } from "../domain/ids.js";

const KEYS = Object.freeze({
  device: "stub.device",
  memberships: "stub.memberships",
  seenConflicts: (eventId) => `stub.seen.${eventId}`
});

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getDevice() {
  let device = read(KEYS.device, null);
  if (!device?.id) {
    device = { id: newRecordId(), name: "" };
    write(KEYS.device, device);
  }
  return device;
}

export function setDeviceName(name) {
  write(KEYS.device, { ...getDevice(), name: name.trim() });
}

export const listMemberships = () => read(KEYS.memberships, []).sort((a, b) => b.joinedAt - a.joinedAt);

export const getMembership = (eventId) => listMemberships().find((m) => m.eventId === eventId) || null;

const ROLE_RANK = { volunteer: 1, manager: 2 };

export function saveMembership(eventId, patch) {
  const all = read(KEYS.memberships, []);
  const existing = all.find((m) => m.eventId === eventId);
  if (existing) {
    const role = patch.role && ROLE_RANK[patch.role] > ROLE_RANK[existing.role] ? patch.role : existing.role;
    Object.assign(existing, patch, { role });
  } else {
    all.push({ eventId, joinedAt: Date.now(), role: "volunteer", ...patch });
  }
  write(KEYS.memberships, all);
}

export function removeMembership(eventId) {
  write(KEYS.memberships, read(KEYS.memberships, []).filter((m) => m.eventId !== eventId));
  localStorage.removeItem(KEYS.seenConflicts(eventId));
}

export const getSeenConflicts = (eventId) => new Set(read(KEYS.seenConflicts(eventId), []));

export function addSeenConflicts(eventId, ids) {
  const seen = getSeenConflicts(eventId);
  ids.forEach((id) => seen.add(id));
  write(KEYS.seenConflicts(eventId), [...seen].slice(-500));
}
