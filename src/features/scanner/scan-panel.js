import { h, replace } from "../../ui/dom.js";
import { icon } from "../../ui/icons.js";
import { input, errorText, showError } from "../../ui/fields.js";
import { primeAudio, playValid, playInvalid } from "../../ui/feedback.js";
import { createScanner } from "./scanner.js";
import { cameraErrorMessage } from "./camera.js";
import { resultMessage } from "./result-copy.js";
import { passCard } from "../passes/pass-card.js";
import { decodePassPayload, parsePassIdInput, formatPassId } from "../../domain/ids.js";
import { evaluateScan, Reason } from "../../domain/pass-rules.js";
import { todayKey } from "../../domain/dates.js";
import { recordScan } from "../../data/scans-repo.js";
import { getDevice } from "../../core/store.js";

export function createScanPanel({ session }) {
  const el = h("section", { class: "panel scan-panel" });
  const video = h("video", { class: "scanner__video", playsinline: "", muted: true, autoplay: true });
  const placeholder = h("div", { class: "scanner__placeholder" }, icon("camera", { size: 34 }), h("span", {}, "Point the camera at the QR on a pass"));
  const frame = h("div", { class: "scanner__frame" }, video, placeholder, h("div", { class: "scanner__corners", "aria-hidden": "true" }));
  const hint = h("p", { class: "scanner__hint", "aria-live": "polite" });
  const scanner = createScanner({ video, onDecode: handleDecoded });

  function showIdle(message = "") {
    scanner.stop();
    frame.classList.remove("is-live");
    hint.textContent = message;
    hint.classList.toggle("is-error", Boolean(message));
    replace(el,
      frame,
      hint,
      h("button", { class: "btn btn--primary btn--block btn--large", type: "button", onclick: startScanning }, icon("scan"), "Scan pass"),
      h("button", { class: "link-btn link-btn--center", type: "button", onclick: showManual }, icon("keyboard", { size: 18 }), "Enter pass ID instead")
    );
  }

  async function startScanning() {
    primeAudio();
    hint.classList.remove("is-error");
    hint.textContent = "Starting camera";
    frame.classList.add("is-live");
    replace(el,
      frame,
      hint,
      h("button", { class: "btn btn--ghost btn--block", type: "button", onclick: () => showIdle() }, "Stop camera")
    );
    try {
      await scanner.start();
      if (scanner.isRunning()) hint.textContent = "Looking for a pass";
    } catch (error) {
      showIdle(cameraErrorMessage(error));
    }
  }

  function handleDecoded(text) {
    const parsed = decodePassPayload(text);
    if (!parsed) {
      hint.textContent = "That QR code isn't a pass from this app.";
      return false;
    }
    processPass(parsed.eventId, parsed.passId);
    return true;
  }

  function processPass(scannedEventId, passId) {
    const state = session.state;
    if (!state) return;
    const day = todayKey();
    const sameEvent = scannedEventId === session.eventId;
    const pass = sameEvent ? state.attendees.get(passId) : null;
    const result = sameEvent
      ? evaluateScan({ pass, day, eventDayKeys: state.days, priorScans: session.liveScansFor(passId) })
      : { status: "invalid", reason: Reason.OTHER_EVENT, detail: {} };
    recordScan(session.eventId, { passId, scannedEventId, day, result }, getDevice());
    if (result.status === "valid") playValid();
    else playInvalid();
    showResult({ result, pass, passId });
  }

  function showResult({ result, pass, passId }) {
    scanner.stop();
    const state = session.state;
    const ok = result.status === "valid";
    const message = resultMessage(result);
    const actions = [
      h("button", { class: "btn btn--primary btn--block btn--large", type: "button", onclick: startScanning }, icon("scan"), "Scan another pass"),
      h("button", { class: "link-btn link-btn--center", type: "button", onclick: () => showIdle() }, "Done")
    ];

    replace(el,
      h("div", { class: ["result", ok ? "result--ok" : "result--bad"], role: "status" },
        h("span", { class: "result__icon" }, icon(ok ? "check" : "close", { size: 30 })),
        h("div", { class: "result__text" },
          h("p", { class: "result__title" }, message.title),
          h("p", { class: "result__detail" }, message.detail)
        )
      ),
      pass
        ? passCard({ pass, event: state.event, eventId: session.eventId, totalDays: state.days.length })
        : h("div", { class: "unknown-pass" }, h("span", { class: "text-muted" }, "Pass ID"), h("span", { class: "mono" }, formatPassId(passId))),
      h("div", { class: "scan-actions" }, actions)
    );
    el.querySelector(".result")?.focus?.();
  }

  function showManual() {
    scanner.stop();
    const field = input({ placeholder: "e.g. K7Q2-9XMT", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", "aria-label": "Pass ID", class: "input input--code" });
    const error = errorText();
    const form = h("form", {
      class: "stack",
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        const passId = parsePassIdInput(field.value);
        if (!passId) return showError(error, "Pass IDs have 8 letters and numbers, like K7Q2-9XMT.");
        primeAudio();
        processPass(session.eventId, passId);
      }
    },
      h("p", { class: "text-muted" }, "Type the ID printed under the attendee's name on their pass."),
      field,
      error,
      h("button", { class: "btn btn--primary btn--block", type: "submit" }, "Check pass"),
      h("button", { class: "link-btn link-btn--center", type: "button", onclick: () => showIdle() }, "Back to camera")
    );
    replace(el, form);
    field.focus();
  }

  const onVisibility = () => {
    if (document.hidden && scanner.isRunning()) showIdle("Camera paused while the app was in the background.");
  };
  document.addEventListener("visibilitychange", onVisibility);

  showIdle();

  return {
    el,
    pause: () => {
      if (scanner.isRunning()) showIdle();
    },
    destroy: () => {
      scanner.stop();
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}
