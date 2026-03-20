// Synthesized sound effects using Web Audio API — no external dependencies needed

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

export function setVolume(v: number) {
  const gain = getMaster();
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), getCtx().currentTime);
}

export function getVolume(): number {
  return masterGain?.gain.value ?? 0.7;
}

export function resumeAudio() {
  if (audioCtx?.state === "suspended") audioCtx.resume();
}

// Ambient dark drone — loops continuously
let ambientNode: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

export function startAmbient() {
  if (ambientNode) return;
  const ctx = getCtx();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(getMaster());

  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 55; // low A
  const g1 = ctx.createGain();
  g1.gain.value = 0.06;
  osc1.connect(g1).connect(gain);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 82.4; // low E
  const g2 = ctx.createGain();
  g2.gain.value = 0.03;
  osc2.connect(g2).connect(gain);

  // LFO for subtle pulsing
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain).connect(g1.gain);

  osc1.start();
  osc2.start();
  lfo.start();

  // Fade in
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

  ambientNode = { osc1, osc2, gain };
}

export function stopAmbient() {
  if (!ambientNode || !audioCtx) return;
  const { osc1, osc2, gain } = ambientNode;
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
  setTimeout(() => {
    osc1.stop();
    osc2.stop();
  }, 1600);
  ambientNode = null;
}

// Notification blip — timeline entry appears
export function playBlip() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// Agent activation — short ascending chirp
export function playAgentActivate() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

// Phone ring — two-tone alternating
export function playPhoneRing() {
  const ctx = getCtx();
  const playTone = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + start + 0.02);
    gain.gain.setValueAtTime(0.07, ctx.currentTime + start + dur - 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
    osc.connect(gain).connect(getMaster());
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  };
  // Two short rings
  playTone(440, 0, 0.15);
  playTone(520, 0, 0.15);
  playTone(440, 0.25, 0.15);
  playTone(520, 0.25, 0.15);
}

// Call connected — warm confirmation tone
export function playCallConnect() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain).connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// Call ended — descending tone
export function playCallEnd() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.07, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain).connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// SMS received — short double-beep
export function playSMS() {
  const ctx = getCtx();
  [0, 0.1].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.06, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.06);
    osc.connect(gain).connect(getMaster());
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.06);
  });
}

// Mission complete — triumphant chord
export function playMissionComplete() {
  const ctx = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.07, start + 0.03);
    gain.gain.setValueAtTime(0.07, start + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
    osc.connect(gain).connect(getMaster());
    osc.start(start);
    osc.stop(start + 0.8);
  });
}

// Keyboard / typing click — subtle noise burst
export function playTyping() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 0.02;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.03;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  source.connect(filter).connect(gain).connect(getMaster());
  source.start();
}
