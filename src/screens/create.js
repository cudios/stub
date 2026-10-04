import { h, screen } from "../ui/dom.js";
import { appBar } from "../ui/app-bar.js";
import { field, input, textarea, dateField, errorText, showError } from "../ui/fields.js";
import { openSheet } from "../ui/sheet.js";
import { codeRow, MANAGER_HINT, VOLUNTEER_HINT } from "../features/events/codes.js";
import { createEvent } from "../data/events-repo.js";
import { getSession } from "../data/event-session.js";
import { getDevice, setDeviceName, saveMembership } from "../core/store.js";
import { navigate, goBack } from "../core/router.js";
import { todayKey, daysBetween } from "../domain/dates.js";

const MAX_DAYS = 60;

function showCodes({ eventId, managerCode, volunteerCode }) {
  const open = () => navigate(`/e/${eventId}`, { replace: true });
  const sheet = openSheet({
    title: "Event created",
    onClose: open,
    content: h("div", { class: "stack" },
      h("p", { class: "text-muted" }, "Share these codes with your team. Anyone with a code can join from their own phone. You can find them later in event settings."),
      codeRow("Manager code", managerCode, MANAGER_HINT).el,
      codeRow("Volunteer code", volunteerCode, VOLUNTEER_HINT).el,
      h("button", { class: "btn btn--primary btn--block", type: "button", onclick: () => sheet.close() }, "Open event")
    )
  });
}

export function createScreen() {
  const device = getDevice();
  const today = todayKey();
  const name = input({ maxlength: 80, autocomplete: "off", placeholder: "e.g. Riverside Music Week" });
  const description = textarea({ maxlength: 240, placeholder: "Optional. Visible to everyone on the event." });
  const end = dateField({ value: today, min: today, label: "End date" });
  const start = dateField({
    value: today,
    label: "Start date",
    onchange: (next) => {
      end.setMin(next);
      if (end.value < next) end.value = next;
    }
  });
  const deviceName = input({ value: device.name, maxlength: 40, autocomplete: "off", placeholder: "e.g. Main gate, Asha's phone" });
  const error = errorText();

  const form = h("form", {
    class: "stack",
    novalidate: true,
    onsubmit: (event) => {
      event.preventDefault();
      const values = { name: name.value.trim(), description: description.value.trim(), startDate: start.value, endDate: end.value };
      if (!values.name) return showError(error, "Give the event a name.");
      if (!values.startDate || !values.endDate) return showError(error, "Pick the start and end dates.");
      if (values.endDate < values.startDate) return showError(error, "The event can't end before it starts.");
      if (daysBetween(values.startDate, values.endDate) >= MAX_DAYS) return showError(error, `Events can run for up to ${MAX_DAYS} days.`);
      if (!deviceName.value.trim()) return showError(error, "Name this device so scans show where they happened.");
      setDeviceName(deviceName.value);
      const created = createEvent(values, getDevice());
      saveMembership(created.eventId, { role: "manager", name: values.name, startDate: values.startDate, endDate: values.endDate });
      getSession(created.eventId);
      showCodes(created);
    }
  },
    field("Event name", name),
    field("Short description", description),
    h("div", { class: "field-pair" }, field("Starts", start.el), field("Ends", end.el)),
    field("This device's name", deviceName, "Shown on every scan made from this device."),
    error,
    h("button", { class: "btn btn--primary btn--block btn--large", type: "submit" }, "Create event")
  );

  const el = screen("form-screen", appBar({ title: "Create event", onBack: () => goBack("/") }).el, h("div", { class: "screen__body" }, form));
  return { el };
}
