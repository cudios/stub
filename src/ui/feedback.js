let audio = null;

export function primeAudio() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  } catch {
    audio = null;
  }
}

function blip(frequency, start, length, type, volume) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.03);
}

export function playValid() {
  if (!audio) return;
  const t = audio.currentTime;
  blip(1320, t, 0.08, "square", 0.045);
  blip(1760, t + 0.09, 0.09, "square", 0.04);
}

export function playInvalid() {
  if (!audio) return;
  const t = audio.currentTime;
  blip(196, t, 0.17, "sawtooth", 0.07);
  blip(147, t + 0.22, 0.24, "sawtooth", 0.07);
}

export function playAlert() {
  if (!audio) return;
  const t = audio.currentTime;
  blip(880, t, 0.12, "triangle", 0.08);
  blip(660, t + 0.15, 0.16, "triangle", 0.08);
}
