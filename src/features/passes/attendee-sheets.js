import { h, replace } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { openSheet, confirmSheet } from "../../ui/sheet.js";
import { field, input, toggle, segmented, stepper, errorText, showError } from "../../ui/fields.js";
import { toast } from "../../ui/toast.js";
import { passCard } from "./pass-card.js";
import { downloadPass, sharePass, canSharePasses } from "./pass-image.js";
import { addAttendee, editAttendee, cancelPass } from "../../data/attendees-repo.js";
import { foldAttendee } from "../../domain/attendees.js";
import { RuleType, usedDays, allowedDayCount } from "../../domain/pass-rules.js";
import { permissionsFor } from "../../domain/permissions.js";
import { formatShortDay, formatDateTime } from "../../domain/dates.js";
import { formatPassId } from "../../domain/ids.js";
import { getDevice, getMembership } from "../../core/store.js";

const role = (session) => getMembership(session.eventId)?.role || "volunteer";

function dayPicker(days, selected) {
  const toggleAll = h("button", { class: "link-btn", type: "button" });
  const chips = days.map((day) =>
    h("button", {
      class: "chip",
      type: "button",
      "aria-pressed": String(selected.has(day)),
      onclick: (event) => {
        if (selected.has(day)) selected.delete(day);
        else selected.add(day);
        event.currentTarget.setAttribute("aria-pressed", String(selected.has(day)));
        refresh();
      }
    }, formatShortDay(day))
  );
  function refresh() {
    toggleAll.textContent = selected.size === days.length ? "Clear all" : "Select all";
    chips.forEach((chip, i) => chip.setAttribute("aria-pressed", String(selected.has(days[i]))));
  }
  toggleAll.addEventListener("click", () => {
    const allSelected = selected.size === days.length;
    selected.clear();
    if (!allSelected) days.forEach((day) => selected.add(day));
    refresh();
  });
  refresh();
  return h("div", { class: "field" },
    h("div", { class: "field__row" }, h("span", { class: "field__label" }, "Valid on"), toggleAll),
    h("div", { class: "chips" }, chips),
    h("span", { class: "field__hint" }, "Select every day for a full-event pass.")
  );
}

function passActions(context) {
  const run = (task, label) => async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await task(context);
    } catch {
      toast(`Couldn't ${label} the pass.`, { tone: "bad" });
    } finally {
      button.disabled = false;
    }
  };
  return h("div", { class: "button-row" },
    h("button", { class: "btn btn--ghost", type: "button", onclick: run(downloadPass, "download") }, icon("download", { size: 18 }), "Download"),
    canSharePasses() ? h("button", { class: "btn btn--ghost", type: "button", onclick: run(sharePass, "share") }, icon("share", { size: 18 }), "Share") : null
  );
}

export function openAddAttendee(session) {
  const state = session.state;
  if (!state?.event) return toast("Event details are still loading.");
  const days = state.days;
  let ruleType = RuleType.ANY;
  let count = 1;
  let allowReentry = false;
  const fixedDays = new Set();

  const name = input({ name: "name", autocomplete: "off", maxlength: 80, placeholder: "Full name", enterkeyhint: "next" });
  const phone = input({ name: "phone", type: "tel", inputmode: "tel", autocomplete: "off", maxlength: 20, placeholder: "Optional" });
  const ruleSlot = h("div");
  const error = errorText();

  const renderRule = () => {
    if (ruleType === RuleType.ANY) {
      replace(ruleSlot, h("div", { class: "field" },
        h("span", { class: "field__label" }, "Number of days"),
        stepper({ value: count, min: 1, max: days.length, label: "days", onchange: (value) => { count = value; } }),
        h("span", { class: "field__hint" }, `Works on any ${days.length > 1 ? "of the event's days" : "event day"}. Each day it's used counts once.`)
      ));
    } else {
      replace(ruleSlot, dayPicker(days, fixedDays));
    }
  };

  const form = h("form", { class: "stack", novalidate: true, onsubmit: submit },
    field("Name", name),
    field("Phone", phone),
    h("div", { class: "field" },
      h("span", { class: "field__label" }, "Pass type"),
      segmented({
        name: "rule-type",
        value: ruleType,
        options: [{ value: RuleType.ANY, label: "Any X days" }, { value: RuleType.FIXED, label: "Fixed days" }],
        onchange: (value) => { ruleType = value; renderRule(); }
      })
    ),
    ruleSlot,
    toggle({ label: "Allow re-entry after exit", description: "Lets this pass in more than once on the same day.", onchange: (value) => { allowReentry = value; } }),
    error,
    h("p", { class: "field__hint" }, "Pass rules can't be changed after the pass is created."),
    h("button", { class: "btn btn--primary btn--block", type: "submit" }, "Create pass")
  );
  renderRule();

  const sheet = openSheet({ title: "New attendee", content: form });
  name.focus();

  function submit(event) {
    event.preventDefault();
    const cleanName = name.value.trim();
    if (!cleanName) return showError(error, "Enter the attendee's name.");
    if (ruleType === RuleType.FIXED && fixedDays.size === 0) return showError(error, "Pick at least one day.");
    const rule = ruleType === RuleType.ANY ? { type: RuleType.ANY, count } : { type: RuleType.FIXED, days: [...fixedDays].sort() };
    const record = addAttendee(session.eventId, { name: cleanName, phone: phone.value.trim(), rule, allowReentry }, getDevice());
    const context = { pass: foldAttendee(record, []), event: state.event, eventId: session.eventId, totalDays: days.length };
    sheet.setTitle("Pass created");
    sheet.setContent(h("div", { class: "stack" },
      passCard(context),
      passActions(context),
      h("div", { class: "button-row" },
        h("button", { class: "btn btn--ghost", type: "button", onclick: () => { sheet.close(); openAddAttendee(session); } }, icon("plus", { size: 18 }), "Add another"),
        h("button", { class: "btn btn--primary", type: "button", onclick: () => sheet.close() }, "Done")
      )
    ));
  }
}

function openEditAttendee(session, view) {
  const name = input({ value: view.name, maxlength: 80, autocomplete: "off" });
  const phone = input({ value: view.phone || "", type: "tel", inputmode: "tel", maxlength: 20, autocomplete: "off" });
  const error = errorText();
  const sheet = openSheet({
    title: "Edit details",
    content: h("form", {
      class: "stack",
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        const nextName = name.value.trim();
        const nextPhone = phone.value.trim();
        if (!nextName) return showError(error, "The name can't be empty.");
        const device = getDevice();
        const changed = [];
        if (nextName !== view.name) changed.push(editAttendee(session.eventId, view, "name", nextName, device));
        if (nextPhone !== (view.phone || "")) changed.push(editAttendee(session.eventId, view, "phone", nextPhone, device));
        sheet.close();
        toast(changed.length ? "Changes saved" : "Nothing changed");
      }
    },
      field("Name", name),
      field("Phone", phone),
      error,
      h("p", { class: "field__hint" }, "Pass rules are locked. To change them, cancel this pass and create a new one."),
      h("button", { class: "btn btn--primary btn--block", type: "submit" }, "Save changes")
    )
  });
}

function detailRow(label, value) {
  return h("div", { class: "stats__item" }, h("dt", {}, label), h("dd", {}, value));
}

export function openPassDetail(session, passId) {
  const body = h("div", { class: "stack" });
  let sheet = null;

  const render = (state) => {
    const view = state.attendees.get(passId);
    if (!view) {
      replace(body, h("p", { class: "text-muted" }, "This pass isn't on this device yet."));
      return;
    }
    const perms = permissionsFor(role(session), state.event);
    const context = { pass: view, event: state.event, eventId: session.eventId, totalDays: state.days.length };
    const entries = session.liveScansFor(passId).sort((a, b) => a.at - b.at);
    const used = usedDays(entries).length;
    const limit = allowedDayCount(view.rule);

    replace(body,
      view.deleted ? h("p", { class: "notice notice--bad" }, "This pass is cancelled. Gates reject it once they sync.") : null,
      state.pendingPasses.has(passId) ? h("p", { class: "notice" }, "Saved on this device. Waiting to sync.") : null,
      passCard(context),
      passActions(context),
      h("dl", { class: "stats" },
        detailRow("Days used", `${used} of ${limit}`),
        detailRow("Pass ID", formatPassId(view.passId)),
        perms.seePhone && view.phone ? detailRow("Phone", view.phone) : null
      ),
      entries.length
        ? h("div", { class: "stack stack--tight" },
            h("h3", { class: "subhead" }, "Entries"),
            h("ul", { class: "timeline" }, entries.map((scan) => h("li", {}, h("span", {}, formatDateTime(scan.at)), h("span", { class: "text-muted" }, scan.deviceName || "Unnamed device"))))
          )
        : null,
      perms.manage && !view.deleted
        ? h("div", { class: "button-row" },
            h("button", { class: "btn btn--ghost", type: "button", onclick: () => openEditAttendee(session, view) }, icon("edit", { size: 18 }), "Edit details"),
            h("button", {
              class: "btn btn--ghost btn--danger-text",
              type: "button",
              onclick: async () => {
                const confirmed = await confirmSheet({
                  title: "Cancel this pass?",
                  message: `${view.name}'s pass will stop working at every gate once devices sync. This can't be undone.`,
                  confirmLabel: "Cancel pass",
                  danger: true
                });
                if (confirmed) {
                  cancelPass(session.eventId, view, getDevice());
                  toast("Pass cancelled");
                }
              }
            }, icon("cancel", { size: 18 }), "Cancel pass")
          )
        : null
    );
  };

  const unsubscribe = session.subscribe(render);
  sheet = openSheet({ title: "Pass", content: body, onClose: unsubscribe });
  return sheet;
}
