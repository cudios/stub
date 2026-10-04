import { h, screen } from "../ui/dom.js";
import { appBar } from "../ui/app-bar.js";
import { field, input, errorText, showError } from "../ui/fields.js";
import { toast } from "../ui/toast.js";
import { roleLabel } from "../ui/labels.js";
import { resolveCode } from "../data/events-repo.js";
import { getSession } from "../data/event-session.js";
import { getDevice, setDeviceName, saveMembership, getMembership } from "../core/store.js";
import { isOnline } from "../core/connectivity.js";
import { navigate, goBack } from "../core/router.js";
import { normalizeCode, isCompleteCode } from "../domain/ids.js";
import { spacedCode } from "../features/events/codes.js";

function lookupErrorMessage(error) {
  if (error.code === "permission-denied") return "The database refused access. Check the Firestore rules.";
  return "Couldn't reach the server. Check the connection and try again.";
}

export function joinScreen() {
  const code = input({ class: "input input--code", maxlength: 7, autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "ABC 123", "aria-label": "Event code" });
  const deviceName = input({ value: getDevice().name, maxlength: 40, autocomplete: "off", placeholder: "e.g. Gate 2, Ravi's phone" });
  const error = errorText();
  const submit = h("button", { class: "btn btn--primary btn--block btn--large", type: "submit" }, "Join event");

  code.addEventListener("input", () => {
    const clean = normalizeCode(code.value);
    code.value = clean.length > 3 ? spacedCode(clean) : clean;
  });

  const form = h("form", {
    class: "stack",
    novalidate: true,
    onsubmit: async (event) => {
      event.preventDefault();
      const value = normalizeCode(code.value);
      if (!isCompleteCode(value)) return showError(error, "Codes are 6 letters and numbers, like K7Q 29X.");
      if (!deviceName.value.trim()) return showError(error, "Name this device so scans show where they happened.");
      if (!isOnline()) return showError(error, "Joining needs internet once. After that the event works offline.");
      showError(error, "");
      submit.disabled = true;
      submit.textContent = "Checking code";
      try {
        const found = await resolveCode(value);
        if (!found) return showError(error, "No event uses this code. Check it and try again.");
        setDeviceName(deviceName.value);
        saveMembership(found.eventId, { role: found.role });
        const membership = getMembership(found.eventId);
        if (membership.role === "manager") getSession(found.eventId).watchSecrets();
        toast(`Joined as ${roleLabel(membership.role).toLowerCase()}`, { tone: "ok" });
        navigate(`/e/${found.eventId}`, { replace: true });
      } catch (lookupError) {
        showError(error, lookupErrorMessage(lookupError));
      } finally {
        submit.disabled = false;
        submit.textContent = "Join event";
      }
    }
  },
    h("p", { class: "text-muted" }, "Ask the organizer for a manager or volunteer code."),
    field("Event code", code),
    field("This device's name", deviceName, "Shown on every scan made from this device."),
    error,
    submit
  );

  const el = screen("form-screen", appBar({ title: "Join an event", onBack: () => goBack("/") }).el, h("div", { class: "screen__body" }, form));
  return { el };
}
