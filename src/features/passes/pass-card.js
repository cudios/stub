import { h } from "../../ui/dom.js";
import { qrSvg } from "./qr.js";
import { encodePassPayload, formatPassId } from "../../domain/ids.js";
import { describeRule, RuleType } from "../../domain/pass-rules.js";
import { formatRange, formatShortDay } from "../../domain/dates.js";

export function fixedDaysLabel(rule, totalDays) {
  if (rule.type !== RuleType.FIXED || rule.days.length === totalDays) return "";
  const sorted = [...rule.days].sort();
  const shown = sorted.slice(0, 4).map(formatShortDay).join(", ");
  return sorted.length > 4 ? `${shown} +${sorted.length - 4}` : shown;
}

export function passCard({ pass, event, eventId, totalDays }) {
  const fixedDays = fixedDaysLabel(pass.rule, totalDays);
  return h("article", { class: ["pass", pass.deleted && "pass--void"], "aria-label": `Pass for ${pass.name}` },
    h("div", { class: "pass__top" },
      h("p", { class: "pass__event" }, event?.name || "Event"),
      event ? h("p", { class: "pass__dates" }, formatRange(event.startDate, event.endDate)) : null,
      h("div", { class: "pass__qr", role: "img", "aria-label": `QR code for pass ${formatPassId(pass.passId)}`, html: qrSvg(encodePassPayload(eventId, pass.passId)) }),
      pass.deleted ? h("p", { class: "pass__void-label" }, "Cancelled") : null
    ),
    h("div", { class: "pass__stub" },
      h("p", { class: "pass__name" }, pass.name),
      h("p", { class: "pass__rule" },
        describeRule(pass.rule, totalDays),
        pass.allowReentry ? h("span", { class: "pass__tag" }, "Re-entry allowed") : null
      ),
      fixedDays ? h("p", { class: "pass__days" }, fixedDays) : null,
      h("p", { class: "pass__id" }, formatPassId(pass.passId))
    )
  );
}
