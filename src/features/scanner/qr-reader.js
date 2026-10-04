async function nativeDecoder() {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    if (!formats.includes("qr_code")) return null;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    return {
      kind: "native",
      decode: async (video) => (await detector.detect(video))[0]?.rawValue || null
    };
  } catch {
    return null;
  }
}

async function fallbackDecoder() {
  const { default: jsQR } = await import("../../../vendor/jsqr.js");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return {
    kind: "fallback",
    decode: async (video) => {
      const { videoWidth: vw, videoHeight: vh } = video;
      if (!vw || !vh) return null;
      const side = Math.min(vw, vh);
      const target = Math.min(side, 640);
      canvas.width = target;
      canvas.height = target;
      ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, target, target);
      const frame = ctx.getImageData(0, 0, target, target);
      return jsQR(frame.data, target, target, { inversionAttempts: "dontInvert" })?.data || null;
    }
  };
}

export async function createDecoder() {
  return (await nativeDecoder()) || fallbackDecoder();
}
