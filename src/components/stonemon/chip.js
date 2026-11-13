// 🎵 스톤몬스터 v3.0 레트로 8비트 효과음 (Web Audio API 합성, 외부 음원 없음)
// 음소거 상태면 unlockAudio() 가 null 을 돌려주므로 아무 소리도 나지 않는다.
import { unlockAudio } from '../coffee/sound';

function note(freq, dur, { type = 'square', vol = 0.06, slide = 0, delay = 0, duty = false } = {}) {
  const ac = unlockAudio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  if (duty) { // 8비트 느낌의 빠른 비브라토
    const lfo = ac.createOscillator(); const lg = ac.createGain();
    lfo.frequency.value = 18; lg.gain.value = freq * 0.03;
    lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.02);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

// 8비트 노이즈 (LFSR 풍 계단형 노이즈)
function crunch(dur, { vol = 0.08, rate = 8, delay = 0, lp = 4000 } = {}) {
  const ac = unlockAudio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let v = 0;
  for (let i = 0; i < len; i++) { if (i % rate === 0) v = Math.random() < 0.5 ? -1 : 1; d[i] = v * (1 - i / len); }
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

const seq = (notes, step = 0.07, opts = {}) => notes.forEach((f, i) => f && note(f, step * 1.3, { ...opts, delay: i * step }));

// 속성별 타격음
const HIT = {
  primal: () => { crunch(0.12, { rate: 6, vol: 0.1 }); note(180, 0.1, { slide: 70 }); },
  fire: () => { crunch(0.25, { rate: 3, vol: 0.07, lp: 2500 }); note(420, 0.18, { type: 'sawtooth', slide: 120, vol: 0.04 }); },
  water: () => { note(900, 0.08, { type: 'triangle', slide: 300, vol: 0.08 }); note(600, 0.1, { type: 'triangle', slide: 200, vol: 0.06, delay: 0.06 }); },
  grass: () => { note(700, 0.06, { vol: 0.05 }); note(980, 0.08, { vol: 0.04, delay: 0.05 }); crunch(0.08, { rate: 12, vol: 0.05 }); },
  thunder: () => { crunch(0.2, { rate: 2, vol: 0.09, lp: 8000 }); note(1500, 0.15, { slide: 200, vol: 0.05 }); },
  wind: () => { crunch(0.22, { rate: 20, vol: 0.06, lp: 1800 }); note(500, 0.18, { type: 'triangle', slide: 900, vol: 0.04 }); },
  earth: () => { crunch(0.2, { rate: 16, vol: 0.12, lp: 900 }); note(110, 0.2, { slide: 45, vol: 0.1 }); },
  ice: () => { note(1800, 0.06, { type: 'triangle', vol: 0.06 }); note(2400, 0.08, { type: 'triangle', vol: 0.05, delay: 0.05 }); crunch(0.1, { rate: 1, vol: 0.04, lp: 9000 }); },
  poison: () => { note(260, 0.2, { type: 'sawtooth', slide: 140, vol: 0.05, duty: true }); note(330, 0.12, { vol: 0.04, delay: 0.08 }); },
};

export const chip = {
  hit(el, big) { (HIT[el] || HIT.primal)(); if (big) note(90, 0.18, { type: 'square', slide: 40, vol: 0.08 }); },
  // "효과가 굉장했다!" — 상승 아르페지오
  superEff() { seq([523, 659, 784, 1047], 0.05, { vol: 0.06 }); },
  // "천적의 일격!" — 두 번 울리는 강한 팡파레
  superEff2() { seq([392, 523, 659, 784, 1047, 1319], 0.045, { vol: 0.07 }); crunch(0.3, { rate: 4, vol: 0.06, delay: 0.1 }); },
  // "급소에 맞았다!" — 날카로운 금속성 쨍
  crit() { note(2093, 0.06, { vol: 0.07 }); note(1568, 0.12, { vol: 0.06, delay: 0.04 }); crunch(0.12, { rate: 1, vol: 0.06, lp: 10000, delay: 0.02 }); },
  weak() { seq([330, 262], 0.08, { type: 'triangle', vol: 0.05 }); },
  synergy() { seq([659, 784, 988, 1319, 988, 1319], 0.05, { vol: 0.05, duty: true }); },
  awaken() { seq([523, 659, 784, 1047, 0, 1047, 1319, 1568], 0.07, { vol: 0.06 }); },
  achieve() { seq([784, 988, 1175, 1568], 0.08, { type: 'triangle', vol: 0.09 }); seq([392, 494, 587, 784], 0.08, { vol: 0.03 }); },
  shiny() { seq([1568, 2093, 1568, 2637, 2093, 3136], 0.045, { type: 'triangle', vol: 0.05 }); },
  freeze() { seq([2093, 1760, 1397, 1047], 0.04, { type: 'triangle', vol: 0.05 }); },
  dig() { crunch(0.18, { rate: 14, vol: 0.09, lp: 1200 }); note(220, 0.1, { slide: 120, delay: 0.08 }); },
  hatch() { seq([523, 0, 523, 0, 659, 784, 1047], 0.08, { vol: 0.06 }); },
  arena() { seq([196, 262, 330, 392, 523, 392, 523, 659], 0.09, { vol: 0.06 }); },
  rival() { seq([330, 311, 330, 247, 294, 262, 220], 0.09, { type: 'sawtooth', vol: 0.04 }); },
};
