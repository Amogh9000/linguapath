/**
 * Lightweight game SFX via Web Audio API (no asset files needed).
 * Sounds unlock on first user gesture in modern browsers.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  {
    freq,
    start,
    duration,
    type = 'sine',
    gain = 0.12,
    slideTo,
  }: {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    slideTo?: number;
  }
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Soft arcade click for buttons / CTAs */
export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, { freq: 520, start: t, duration: 0.06, type: 'triangle', gain: 0.1 });
  tone(ctx, { freq: 780, start: t + 0.02, duration: 0.05, type: 'sine', gain: 0.06 });
}

/** Motivating “you got it!” chime — rising major arpeggio */
export function playCorrect() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  // C5 → E5 → G5 → C6 sparkle
  const notes = [
    { freq: 523.25, at: 0 },
    { freq: 659.25, at: 0.08 },
    { freq: 783.99, at: 0.16 },
    { freq: 1046.5, at: 0.26 },
  ];
  notes.forEach(({ freq, at }) => {
    tone(ctx, {
      freq,
      start: t + at,
      duration: 0.28,
      type: 'sine',
      gain: 0.14,
    });
    // soft harmonic for body
    tone(ctx, {
      freq: freq * 2,
      start: t + at,
      duration: 0.18,
      type: 'triangle',
      gain: 0.04,
    });
  });
}

/** Soft miss thud (optional companion to correct) */
export function playIncorrect() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, {
    freq: 220,
    start: t,
    duration: 0.22,
    type: 'square',
    gain: 0.07,
    slideTo: 140,
  });
}
