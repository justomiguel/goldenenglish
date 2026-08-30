/**
 * Short berimbau-inspired signature: dry plucked string + muted gourd.
 * 0.15–0.40s. Never autoplays — the caller decides.
 */
export function playNagoBerimbauSignature(): void {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(620, now + 0.28);
  filter.Q.value = 1.1;
  filter.connect(master);

  const pluck = ctx.createOscillator();
  pluck.type = "triangle";
  pluck.frequency.setValueAtTime(233.08, now);
  pluck.frequency.exponentialRampToValueAtTime(196, now + 0.26);
  pluck.connect(filter);
  pluck.start(now);
  pluck.stop(now + 0.34);

  const harmonic = ctx.createOscillator();
  harmonic.type = "sine";
  harmonic.frequency.setValueAtTime(466.16, now);
  const harmGain = ctx.createGain();
  harmGain.gain.setValueAtTime(0.12, now);
  harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  harmonic.connect(harmGain);
  harmGain.connect(filter);
  harmonic.start(now);
  harmonic.stop(now + 0.2);

  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  noise.start(now);

  window.setTimeout(() => {
    void ctx.close();
  }, 500);
}
