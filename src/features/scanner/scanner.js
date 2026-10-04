import { createDecoder } from "./qr-reader.js";
import { startCamera } from "./camera.js";

export function createScanner({ video, onDecode }) {
  let decoder = null;
  let stopCamera = null;
  let running = false;
  let timer = 0;
  let generation = 0;

  async function start() {
    stop();
    const current = ++generation;
    decoder ??= await createDecoder();
    const stopper = await startCamera(video);
    if (current !== generation) {
      stopper();
      return;
    }
    stopCamera = stopper;
    running = true;
    tick();
  }

  async function tick() {
    if (!running) return;
    let text = null;
    try {
      text = await decoder.decode(video);
    } catch {
      text = null;
    }
    if (!running) return;
    if (text && onDecode(text)) {
      stop();
      return;
    }
    timer = setTimeout(tick, 110);
  }

  function stop() {
    generation += 1;
    running = false;
    clearTimeout(timer);
    stopCamera?.();
    stopCamera = null;
  }

  return { start, stop, isRunning: () => running };
}
