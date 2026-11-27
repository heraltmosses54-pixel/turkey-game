// Gobble Run — all sound is synthesised with WebAudio. No audio files,
// no network: every gobble, chime and thud is built from oscillators.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function context() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const ac = context();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, when = 0, lowpass = 1200) {
    if (muted) return;
    const ac = context();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() { context(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },

    // The turkey's signature: three quick descending gobbles.
    gobble() {
      tone(420, 0.09, 'sawtooth', 0.16, 0, 260);
      tone(380, 0.09, 'sawtooth', 0.16, 0.1, 230);
      tone(340, 0.14, 'sawtooth', 0.18, 0.2, 180);
    },
    jump() { noise(0.14, 0.1, 0, 2400); tone(300, 0.12, 'sine', 0.1, 0, 560); },
    land() { noise(0.08, 0.12, 0, 700); },
    corn() {
      tone(880, 0.09, 'sine', 0.16);
      tone(1318, 0.14, 'sine', 0.14, 0.07);
    },
    hit() {
      noise(0.25, 0.3, 0, 900);
      tone(140, 0.3, 'square', 0.2, 0, 60);
    },
    slide() { noise(0.18, 0.08, 0, 1600); },
    // The farmer's angry shout when he gets close.
    farmerShout() {
      tone(180, 0.16, 'square', 0.14, 0, 120);
      tone(220, 0.16, 'square', 0.14, 0.14, 140);
    },
    caught() {
      tone(392, 0.22, 'triangle', 0.2);
      tone(311, 0.22, 'triangle', 0.2, 0.2);
      tone(233, 0.5, 'triangle', 0.22, 0.4);
      noise(0.4, 0.15, 0.1, 500);
    },
    escaped() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 0.28, 'triangle', 0.18, i * 0.13));
      tone(1319, 0.5, 'sine', 0.12, 0.55);
    },
    click() { tone(700, 0.05, 'sine', 0.12); },
    stage() {
      tone(660, 0.1, 'triangle', 0.14);
      tone(880, 0.16, 'triangle', 0.14, 0.09);
    },
  };
}
