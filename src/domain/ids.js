const READABLE = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz23456789";
const PAYLOAD_PREFIX = "STUB1";

function randomString(length, alphabet) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export const newEventId = () => randomString(12, LOWER);
export const newPassId = () => randomString(8, READABLE);
export const newCode = () => randomString(6, READABLE);
export const newRecordId = () => `${Date.now().toString(36)}${randomString(8, LOWER)}`;

export const formatPassId = (id) => (id && id.length === 8 ? `${id.slice(0, 4)}-${id.slice(4)}` : id || "");

export function normalizeCode(input) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export const isCompleteCode = (code) => new RegExp(`^[${READABLE}]{6}$`).test(code);

export function encodePassPayload(eventId, passId) {
  return `${PAYLOAD_PREFIX}.${eventId}.${passId}`;
}

export function decodePassPayload(text) {
  const match = /^STUB1\.([a-z0-9]{6,32})\.([A-Z0-9]{8})$/.exec(String(text).trim());
  return match ? { eventId: match[1], passId: match[2] } : null;
}

export function parsePassIdInput(text) {
  const clean = String(text).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{8}$/.test(clean) ? clean : null;
}
