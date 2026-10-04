import { makeQr } from "./qr.js";
import { encodePassPayload, formatPassId } from "../../domain/ids.js";
import { describeRule } from "../../domain/pass-rules.js";
import { formatRange } from "../../domain/dates.js";
import { fixedDaysLabel } from "./pass-card.js";

const W = 720;
const H = 1080;
const INK = "#0a0a0a";
const MUTED = "#6b6b6b";
const BODY = '"Geist", system-ui, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

function fitText(ctx, text, maxWidth, weight, size, family, minSize = 22) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > minSize) {
    current -= 2;
    ctx.font = `${weight} ${current}px ${family}`;
  }
  let output = text;
  while (ctx.measureText(output).width > maxWidth && output.length > 1) output = `${output.slice(0, -2)}…`;
  return output;
}

async function ensureFonts() {
  await Promise.allSettled([
    document.fonts.load(`600 48px ${BODY}`),
    document.fonts.load(`500 28px ${BODY}`),
    document.fonts.load(`500 30px ${MONO}`)
  ]);
}

export async function renderPassImage({ pass, event, eventId, totalDays }) {
  await ensureFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const x = 28;
  const y = 28;
  const w = W - 56;
  const h = H - 56;
  const tearY = y + 690;
  const pad = 64;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 56);
  ctx.fill();
  ctx.stroke();

  for (const cx of [x, x + w]) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, tearY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, tearY, 26, cx === x ? -Math.PI / 2 : Math.PI / 2, cx === x ? Math.PI / 2 : (Math.PI * 3) / 2);
    ctx.stroke();
  }

  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(x + 44, tearY);
  ctx.lineTo(x + w - 44, tearY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(fitText(ctx, event?.name || "Event", w - pad * 2, 600, 38, BODY), x + pad, y + 92);
  ctx.fillStyle = MUTED;
  ctx.font = `500 26px ${BODY}`;
  if (event) ctx.fillText(formatRange(event.startDate, event.endDate), x + pad, y + 132);

  const qr = makeQr(encodePassPayload(eventId, pass.passId));
  const count = qr.getModuleCount();
  const cell = Math.floor(470 / count);
  const size = cell * count;
  const qx = Math.round((W - size) / 2);
  const qy = y + 170 + Math.round((470 - size) / 2);
  ctx.fillStyle = INK;
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) ctx.fillRect(qx + col * cell, qy + row * cell, cell, cell);
    }
  }

  ctx.fillStyle = INK;
  ctx.fillText(fitText(ctx, pass.name, w - pad * 2, 600, 50, BODY), x + pad, tearY + 100);
  ctx.font = `500 28px ${BODY}`;
  const ruleLine = [describeRule(pass.rule, totalDays), pass.allowReentry ? "re-entry allowed" : ""].filter(Boolean).join(", ");
  ctx.fillText(ruleLine, x + pad, tearY + 148);
  const days = fixedDaysLabel(pass.rule, totalDays);
  if (days) {
    ctx.fillStyle = MUTED;
    ctx.fillText(fitText(ctx, days, w - pad * 2, 500, 26, BODY), x + pad, tearY + 190);
  }
  ctx.fillStyle = INK;
  ctx.font = `500 32px ${MONO}`;
  ctx.fillText(formatPassId(pass.passId), x + pad, y + h - 64);
  ctx.fillStyle = MUTED;
  ctx.font = `500 24px ${BODY}`;
  ctx.textAlign = "right";
  ctx.fillText("Show this at the entry", x + w - pad, y + h - 66);
  ctx.textAlign = "left";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

const fileName = (pass) => `pass-${pass.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "attendee"}-${pass.passId}.png`;

export async function downloadPass(context) {
  const blob = await renderPassImage(context);
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName(context.pass) });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const canSharePasses = () => typeof navigator.canShare === "function";

export async function sharePass(context) {
  const blob = await renderPassImage(context);
  const file = new File([blob], fileName(context.pass), { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Pass for ${context.pass.name}`, text: `Your entry pass for ${context.event?.name || "the event"}.` });
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    }
    return;
  }
  await downloadPass(context);
}
