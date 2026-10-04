import qrcode from "../../../vendor/qrcode.js";

export function makeQr(text) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr;
}

export const qrSvg = (text) => makeQr(text).createSvgTag({ cellSize: 4, margin: 0, scalable: true });
