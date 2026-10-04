import { h } from "../../ui/dom.js";
import { openSheet, confirmSheet } from "../../ui/sheet.js";
import { field, input, toggle } from "../../ui/fields.js";
import { toast } from "../../ui/toast.js";
import { codeRow, MANAGER_HINT, VOLUNTEER_HINT } from "./codes.js";
import { updateSettings } from "../../data/events-repo.js";
import { closeSession } from "../../data/event-session.js";
import { getDevice, setDeviceName, getMembership, removeMembership } from "../../core/store.js";
import { navigate } from "../../core/router.js";

export function openEventSettings(session) {
  const isManager = getMembership(session.eventId)?.role === "manager";
  const state = session.state;
  const settings = state?.event?.settings || {};
  const unsubscribers = [];
  const sections = [];

  if (isManager) {
    const managerRow = codeRow("Manager code", state?.secrets?.managerCode, MANAGER_HINT);
    const volunteerRow = codeRow("Volunteer code", state?.secrets?.volunteerCode, VOLUNTEER_HINT);
    unsubscribers.push(session.subscribe((next) => {
      managerRow.set(next.secrets?.managerCode);
      volunteerRow.set(next.secrets?.volunteerCode);
    }));
    sections.push(
      h("section", { class: "stack stack--tight" }, h("h3", { class: "subhead" }, "Event codes"), managerRow.el, volunteerRow.el),
      h("section", { class: "stack stack--tight" },
        h("h3", { class: "subhead" }, "Volunteer permissions"),
        toggle({ label: "Volunteers can undo scans", description: "Managers can always undo.", checked: Boolean(settings.volunteersCanUndo), onchange: (value) => updateSettings(session.eventId, { volunteersCanUndo: value }) }),
        toggle({ label: "Volunteers can see phone numbers", description: "Useful for finding someone after a conflict.", checked: Boolean(settings.volunteersSeePhone), onchange: (value) => updateSettings(session.eventId, { volunteersSeePhone: value }) })
      )
    );
  }

  const deviceName = input({ value: getDevice().name, maxlength: 40, autocomplete: "off" });
  sections.push(
    h("section", { class: "stack stack--tight" },
      h("h3", { class: "subhead" }, "This device"),
      field("Device name", deviceName, "Shown on every scan made here."),
      h("button", {
        class: "btn btn--ghost",
        type: "button",
        onclick: () => {
          if (!deviceName.value.trim()) return toast("Enter a device name first.");
          setDeviceName(deviceName.value);
          toast("Device name saved");
        }
      }, "Save device name")
    ),
    h("section", { class: "stack stack--tight" },
      h("button", {
        class: "btn btn--ghost btn--danger-text",
        type: "button",
        onclick: async () => {
          const confirmed = await confirmSheet({
            title: "Remove from this device?",
            message: "The event stays on the server and on other devices. You can rejoin later with a code.",
            confirmLabel: "Remove",
            danger: true
          });
          if (!confirmed) return;
          sheet.close();
          closeSession(session.eventId);
          removeMembership(session.eventId);
          navigate("/", { replace: true });
        }
      }, "Remove event from this device")
    )
  );

  const sheet = openSheet({
    title: isManager ? "Event settings" : "Settings",
    content: h("div", { class: "stack stack--loose" }, sections),
    onClose: () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  });
}
