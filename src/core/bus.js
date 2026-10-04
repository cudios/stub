const listeners = new Map();

export function on(topic, handler) {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic).add(handler);
  return () => listeners.get(topic)?.delete(handler);
}

export function emit(topic, payload) {
  for (const handler of listeners.get(topic) || []) handler(payload);
}
