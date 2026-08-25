const MUTE_KEY = "nova-command-muted";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let drone: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

function mutedFromStorage() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function isNovaAudioMuted() {
  return mutedFromStorage();
}

export function setNovaAudioMuted(muted: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  }
  if (master && context) {
    master.gain.setTargetAtTime(muted ? 0 : 0.22, context.currentTime, 0.05);
  }
  if (muted) window.speechSynthesis?.cancel();
}

export async function unlockNovaAudio() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  context = context ?? new AudioCtx();
  if (!master) {
    master = context.createGain();
    master.gain.value = mutedFromStorage() ? 0 : 0.22;
    master.connect(context.destination);
  }
  if (context.state === "suspended") await context.resume();
}

function beep(freq: number, duration: number, type: OscillatorType, gain = 0.08) {
  if (!context || !master || mutedFromStorage()) return;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  amp.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  osc.connect(amp);
  amp.connect(master);
  osc.start();
  osc.stop(context.currentTime + duration);
}

export function playNovaBoot() {
  beep(140, 0.35, "sine", 0.12);
  setTimeout(() => beep(220, 0.22, "triangle", 0.07), 120);
  setTimeout(() => beep(440, 0.18, "sine", 0.05), 280);
}

export function playNovaTick() {
  beep(880, 0.05, "square", 0.03);
}

export function playNovaHover() {
  beep(620, 0.04, "sine", 0.025);
}

export function playNovaSelect() {
  beep(320, 0.12, "triangle", 0.07);
  setTimeout(() => beep(640, 0.1, "sine", 0.05), 80);
}

export function startNovaDrone() {
  if (!context || !master || drone) return;
  drone = context.createOscillator();
  droneGain = context.createGain();
  drone.type = "sine";
  drone.frequency.value = 52;
  droneGain.gain.value = 0.035;
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start();
}

export function stopNovaDrone() {
  try {
    drone?.stop();
  } catch {
    /* already stopped */
  }
  drone = null;
  droneGain = null;
}

export function speakNova(text: string) {
  if (typeof window === "undefined" || mutedFromStorage() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 0.7;
  utterance.volume = 0.85;
  const voice = window.speechSynthesis.getVoices().find((item) => /en/i.test(item.lang) && /male|daniel|alex|fred/i.test(item.name));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function silenceNovaVoice() {
  window.speechSynthesis?.cancel();
}
