export function createEvent(type, payload) {
  return {
    type,
    payload,
    ts: new Date().toISOString(),
  };
}
