// 커피내기 게임 공용 - Web Audio 절차적 효과음 (외부 음원 없음)

let audioCtx = null;
let muted = false;

export function setMuted(m) {
  muted = m;
}

// 사용자 클릭 시점에 호출해 오디오 잠금 해제
export function unlockAudio() {
  if (muted) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type = 'square', vol = 0.1, slideTo) {
  const ac = unlockAudio();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, vol, filterType, freq) {
  const ac = unlockAudio();
  if (!ac) return;
  const t = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

export const sfx = {
  tick: () => tone(1400, 0.03, 'square', 0.04),
  whoosh: () => noise(0.15, 0.08, 'bandpass', 1600),
  explosion: () => { noise(1.4, 0.6, 'lowpass', 700); tone(90, 0.7, 'sine', 0.5, 30); },
  splash: () => noise(0.5, 0.25, 'bandpass', 800),
  bump: () => tone(150, 0.12, 'triangle', 0.25, 60),
  crack: () => noise(0.25, 0.3, 'highpass', 2000),
  ding: () => { tone(880, 0.12, 'sine', 0.12); setTimeout(() => tone(1320, 0.2, 'sine', 0.12), 90); },
  doom: () => { tone(220, 0.5, 'sawtooth', 0.12, 110); setTimeout(() => tone(147, 1.0, 'sawtooth', 0.12, 60), 420); },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, i === 3 ? 0.5 : 0.18, 'triangle', 0.12), i * 120)),
  jump: () => tone(300, 0.35, 'square', 0.07, 1200),
  slip: () => tone(900, 0.45, 'sawtooth', 0.06, 140),
  stamp: () => { tone(110, 0.18, 'square', 0.2, 45); noise(0.12, 0.3, 'lowpass', 500); },
  paper: () => noise(0.4, 0.12, 'highpass', 3000),
  ring: () => [0, 180, 360].forEach((d) => setTimeout(() => tone(1300, 0.12, 'sine', 0.06), d)),
  rain: () => noise(1.6, 0.1, 'highpass', 4000),
  alarm: () => [0, 160, 320, 480].forEach((d, i) => setTimeout(() => tone(i % 2 ? 660 : 990, 0.12, 'square', 0.06), d)),
};
