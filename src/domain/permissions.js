export function permissionsFor(role, event) {
  const manager = role === "manager";
  const settings = event?.settings || {};
  return Object.freeze({
    manage: manager,
    settings: manager,
    undo: manager || Boolean(settings.volunteersCanUndo),
    seePhone: manager || Boolean(settings.volunteersSeePhone)
  });
}
