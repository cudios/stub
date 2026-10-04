import { route, startRouter, navigate } from "./core/router.js";
import { on } from "./core/bus.js";
import { startConnectivityWatch } from "./core/connectivity.js";
import { registerServiceWorker, watchInstallPrompt } from "./core/pwa.js";
import { isConfigured } from "./core/firebase.js";
import { initToasts, toast } from "./ui/toast.js";
import { playAlert } from "./ui/feedback.js";
import { CONFLICT_TITLES } from "./features/conflicts/conflict-copy.js";
import { homeScreen } from "./screens/home.js";
import { createScreen } from "./screens/create.js";
import { joinScreen } from "./screens/join.js";
import { eventScreen } from "./screens/event.js";
import { dayScreen } from "./screens/day.js";
import { setupScreen } from "./screens/setup.js";
import { todayKey } from "./domain/dates.js";

function announceConflicts({ eventId, conflicts, state }) {
  const first = conflicts[0];
  const name = state.attendees.get(first.passId)?.name;
  const message = conflicts.length === 1
    ? `${CONFLICT_TITLES[first.type]}${name ? `: ${name}` : ""}`
    : `${conflicts.length} new conflicts found after syncing`;
  playAlert();
  toast(message, { tone: "warn", duration: 8000, action: { label: "Review", run: () => navigate(`/e/${eventId}/d/${todayKey()}/conflicts`) } });
}

function announceConnectivity(online) {
  toast(online ? "Back online. Syncing changes." : "You're offline. Everything keeps working and syncs later.", { tone: online ? "ok" : "neutral" });
}

registerServiceWorker();
watchInstallPrompt();
startConnectivityWatch();
initToasts(document.getElementById("toasts"));

if (isConfigured()) {
  route("/", homeScreen);
  route("/create", createScreen);
  route("/join", joinScreen);
  route("/e/:eventId", eventScreen);
  route("/e/:eventId/:tab", eventScreen);
  route("/e/:eventId/d/:day", dayScreen);
  route("/e/:eventId/d/:day/:tab", dayScreen);
  on("conflict:new", announceConflicts);
  on("connectivity", announceConnectivity);
} else {
  route("/", setupScreen);
}

startRouter(document.getElementById("app"));
