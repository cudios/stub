const pad = (n) => String(n).padStart(2, "0");

export function toDayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toDayKey(new Date());

export const dayKeyAt = (ms) => toDayKey(new Date(ms));

export function eventDays(startKey, endKey) {
  const days = [];
  const cursor = fromDayKey(startKey);
  const end = fromDayKey(endKey);
  while (cursor <= end && days.length < 366) {
    days.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function daysBetween(fromKey, toKey) {
  const a = fromDayKey(fromKey);
  const b = fromDayKey(toKey);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
}

export function addDays(key, amount) {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

export function formatDay(key, { weekday = true, year = false } = {}) {
  return fromDayKey(key).toLocaleDateString("en-IN", {
    weekday: weekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: year ? "numeric" : undefined
  });
}

export function formatShortDay(key) {
  const date = fromDayKey(key);
  return `${date.toLocaleDateString("en-IN", { weekday: "short" })} ${date.getDate()}`;
}

export function formatRange(startKey, endKey) {
  if (startKey === endKey) return formatDay(startKey, { year: true });
  return `${formatDay(startKey, { weekday: false })} to ${formatDay(endKey, { weekday: false, year: true })}`;
}

export function formatNumericDate(key) {
  const [y, m, d] = key.split("-");
  return `${d}-${m}-${y}`;
}

export function formatTime(ms) {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(ms) {
  return `${formatDay(dayKeyAt(ms), { weekday: false })}, ${formatTime(ms)}`;
}
