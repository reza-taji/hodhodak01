/**
 * Synthesized sound effects via Web Audio API.
 * No audio files → zero network, zero storage, works fully offline.
 * Every player respects the user's audio setting (pass `enabled`).
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Browsers suspend AudioContext until a user gesture — resume defensively
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone({ freq, start, duration, type = 'triangle', volume = 0.25 }) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Cheerful rising arpeggio (C5–E5–G5–C6) — the "آفرین!" jingle. */
export function playSuccess(enabled = true) {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => tone({ freq, start: i * 0.12, duration: 0.35 }));
}

/** Gentle low blip — "almost, try again" without feeling punishing. */
export function playTryAgain(enabled = true) {
  if (!enabled) return;
  tone({ freq: 392, start: 0, duration: 0.2, type: 'sine', volume: 0.15 });
  tone({ freq: 329.63, start: 0.18, duration: 0.3, type: 'sine', volume: 0.15 });
}
