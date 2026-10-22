// 구로디지털산 정상 정복 ⛰️ - 등반 레이스 로직 & 드로잉
// create(players, env) => { update(dt), draw(ctx, t), standings(), time }
import { rand, pick, burst } from './coffeeGames.js';
import {
  OW as W, OH as H, BOSS_LOOK, clamp, easeOut, easeInOut, ellipse, rrect,
  drawWorker, drawTag, drawBubble, tagY, say,
} from './officeCommon.js';

// ===== 밸런스 상수 (진도는 0~100%, 확률은 TICK마다 1인당) =====
export const MOUNTAIN_CONFIG = {
  TICK: 0.5,                    // 속도 재추첨·이벤트 판정 주기(초)
  SPEED: [2.1, 4.2],            // 기본 전진 속도 (%/초)
  P_JUMP: 0.018, JUMP: [9, 15], // 🚀 슈퍼점프
  LAG_JUMP_BONUS: 0.035,        //    꼴찌일수록 슈퍼점프 확률 가산 (선두 0 ~ 꼴찌 최대)
  P_SLIP: 0.018, SLIP: [4, 9],  // 🍌 미끄러짐
  P_ELEVATOR: 0.01, ELEVATOR: [12, 18], ELEVATOR_MAX_P: 65, // 🛗 중간 층(65%)까지만
  P_DETOUR: 0.014, DETOUR_SEC: [2, 3], DETOUR_SPEED: 0.35,  // 🚧
  P_BOSS: 0.012, BOSS_SEC: [1.5, 2.5],                      // 👔
  P_PHONE: 0.012, PHONE_SEC: [1.5, 2.5],                    // 📱
  P_RAIN: 0.012, RAIN_SEC: 6, RAIN_SLIP_MULT: 3,            // 🌧️ 전체 (TICK마다)
  P_LUNCH: 0.01, LUNCH_SEC: 4, LUNCH_BOOST: 1.6,            // 🏃 전체
  GLOBAL_MAX: 1,                // 전체 이벤트 종류별 판당 최대 횟수
  END_DELAY: 2.4,               // 꼴찌 확정 후 결과 화면까지(초)
};

const CLIMB = 1200;             // 출발~정상 높이(px)
const LEFT = 62, RIGHT = W - 24;
const MID = (LEFT + RIGHT) / 2;
const CAM_Y = H * 0.44;         // 추적 대상이 놓이는 화면 높이
const CAM_MIN = H - 46 - CAM_Y;
const CAM_MAX = CLIMB + 120 - CAM_Y;
const S = 10;                   // 캐릭터 크기(머리 반지름)

const STATE_ICON = { jump: '🚀', slip: '🍌', elev: '🛗', detour: '🚧', boss: '👔', phone: '📱' };

export function createMountainGame(players, env) {
  const C = MOUNTAIN_CONFIG;
  const n = players.length;
  const spread = Math.min(RIGHT - LEFT, (n - 1) * 46);
  const P = players.map((pl, i) => ({
    ...pl, i,
    p: 0, v: rand(...C.SPEED), state: 'run', t: 0, dur: 0, from: 0, to: 0,
    xOff: 0, dir: 1, deco: 0, rain: false, bubble: null, finishT: 0,
    lane: MID - spread / 2 + (i * spread) / Math.max(1, n - 1),
  }));
  const order = [];
  let time = 0, tickAcc = 0, cam = CAM_MIN;
  let rain = 0, lunch = 0, rainCount = 0, lunchCount = 0;
  let loser = null, endT = 0, reported = false;

  // 배경 소품 (판마다 배치가 달라짐)
  const props = [];
  const types = ['office', 'store', 'crane', 'officetel', 'escalator', 'office', 'officetel', 'store', 'crane', 'office'];
  let k = 0;
  for (let a = 110; a < CLIMB - 130; a += rand(85, 115), k++) {
    if (Math.abs(a - CLIMB * 0.45) < 70) continue; // 지하철 고가 자리
    const left = k % 2 === 0;
    props.push({ a, type: types[k % types.length], x: left ? rand(40, 120) : rand(250, 330), hue: rand(0, 1), seed: rand(0, 9) });
  }
  const skyline = Array.from({ length: 14 }, (_, j) => ({ x: j * 30 + rand(-6, 6), w: rand(18, 30), h: rand(30, 90) }));

  const alt = (p) => (p / 100) * CLIMB;
  const sy = (a) => CAM_Y - (a - cam);

  const racing = () => P.filter((pl) => pl.state !== 'done');

  const startMove = (pl, state, to, dur) => {
    pl.state = state;
    pl.t = 0;
    pl.dur = dur;
    pl.from = pl.p;
    pl.to = to;
  };

  const events = {
    jump(pl) {
      startMove(pl, 'jump', pl.p + rand(...C.JUMP), 0.75);
      say(pl, pick(['에너지 충전! ⚡', '가즈아!!', '날아간다~']));
      env.log(`🚀 ${pl.name} 에너지드링크 원샷! 슈퍼점프`);
      env.sfx.jump();
    },
    slip(pl) {
      const coffee = Math.random() < 0.4;
      pl.deco = pl.p;
      pl.rain = rain > 0;
      startMove(pl, 'slip', Math.max(0, pl.p - rand(...C.SLIP)), 0.9);
      say(pl, rain > 0 ? '으악 미끄러워!' : coffee ? '앗 커피 쏟았다!' : '바나나 껍질?!');
      env.log(`🍌 ${pl.name} ${rain > 0 ? '빗길에' : coffee ? '쏟은 커피 밟고' : '바나나 껍질 밟고'} 주르륵 미끄러짐`);
      env.sfx.slip();
    },
    elev(pl) {
      startMove(pl, 'elev', Math.min(C.ELEVATOR_MAX_P + 5, pl.p + rand(...C.ELEVATOR)), 1.5);
      say(pl, '엘베 개꿀 🛗');
      env.log(`🛗 ${pl.name} 엘리베이터 탑승! 중간 층까지 슝`);
      env.sfx.ding();
    },
    detour(pl) {
      pl.state = 'detour';
      pl.t = 0;
      pl.dur = rand(...C.DETOUR_SEC);
      pl.deco = pl.p;
      pl.dir = pl.lane + 30 > RIGHT ? -1 : pl.lane - 30 < LEFT ? 1 : pick([-1, 1]);
      say(pl, '공사중이라니…');
      env.log(`🚧 ${pl.name} 공사중 구간 우회 중`);
    },
    boss(pl) {
      pl.state = 'boss';
      pl.t = 0;
      pl.dur = rand(...C.BOSS_SEC);
      pl.dir = pl.lane > MID ? -1 : 1;
      say(pl, '안녕하십니까!', pl.dur);
      env.log(`👔 ${pl.name} 부장님 마주침… 90도 인사 중`);
    },
    phone(pl) {
      pl.state = 'phone';
      pl.t = 0;
      pl.dur = rand(...C.PHONE_SEC);
      say(pl, pick(['네 팀장님…', '아 그 건이요?', '네네 확인할게요']), pl.dur);
      env.log(`📱 ${pl.name} 업무 전화 받는 중`);
      env.sfx.ring();
    },
  };

  const tick = () => {
    if (rain <= 0 && lunch <= 0 && time > 5) {
      if (rainCount < C.GLOBAL_MAX && Math.random() < C.P_RAIN) {
        rain = C.RAIN_SEC;
        rainCount++;
        env.banner('🌧️ 소나기!');
        env.log('🌧️ 갑자기 소나기! 산길이 미끄러워졌다');
        env.sfx.rain();
      } else if (lunchCount < C.GLOBAL_MAX && Math.random() < C.P_LUNCH) {
        lunch = C.LUNCH_SEC;
        lunchCount++;
        env.banner('🏃 점심시간 종료 5분 전!');
        env.log('🏃 점심시간 종료 알림! 전원 전력질주');
        env.sfx.alarm();
        racing().forEach((pl) => say(pl, pick(['헉 시간!', '뛰어!!', '늦겠다!'])));
      }
    }
    const sorted = racing().sort((a, b) => b.p - a.p);
    sorted.forEach((pl, rank) => {
      if (pl.state !== 'run') return;
      pl.v = rand(...C.SPEED);
      const lag = sorted.length > 1 ? rank / (sorted.length - 1) : 0;
      const table = [
        ['jump', C.P_JUMP + C.LAG_JUMP_BONUS * lag],
        ['slip', pl.p > 5 ? C.P_SLIP * (rain > 0 ? C.RAIN_SLIP_MULT : 1) : 0],
        ['elev', pl.p < C.ELEVATOR_MAX_P - 10 ? C.P_ELEVATOR : 0],
        ['detour', pl.p < 90 ? C.P_DETOUR : 0],
        ['boss', C.P_BOSS],
        ['phone', C.P_PHONE],
      ];
      let r = Math.random();
      for (const [name, prob] of table) {
        if ((r -= prob) < 0) { events[name](pl); break; }
      }
    });
  };

  const finishPlayer = (pl) => {
    pl.p = 100;
    pl.state = 'done';
    pl.finishT = time;
    order.push(pl.i);
    const rank = order.length;
    say(pl, rank === 1 ? '1등! 🎉' : pick(['도착!', '휴 살았다', '정상이다~']), 2.5);
    env.log(`🏁 ${pl.name} 정상 도착! (${rank}위 · ${time.toFixed(1)}초)`);
    env.sfx.ding();
    burst(env, pos(pl).x, sy(alt(100)) - 20, 30, { colors: ['#FFD166', '#EF476F', '#06D6A0', '#118AB2'], speed: [60, 200], life: 1, size: [2, 4], gravity: 200 });
    if (order.length === n - 1) {
      loser = P.find((q) => q.state !== 'done');
      loser.state = 'lost';
      say(loser, '내가 꼴찌라니…', 4);
      env.log(`☕ ${loser.name} 꼴찌 확정! 오늘 커피 당첨`);
      env.banner('☕ 커피 당첨!');
      env.sfx.doom();
      env.shake = 10;
    }
  };

  const pos = (pl) => {
    if (pl.state === 'done') {
      const rank = order.indexOf(pl.i);
      return { x: W / 2 + 10 + (rank - (n - 2) / 2) * 22, y: sy(CLIMB + 12) };
    }
    const conv = pl.p > 82 ? 1 - ((pl.p - 82) / 18) * 0.8 : 1;
    const a = alt(pl.p);
    return {
      x: MID + (pl.lane - MID) * conv + pl.xOff + Math.sin(a * 0.02 + pl.i) * 5,
      y: sy(a),
    };
  };

  return {
    get time() { return time; },

    update(dt) {
      time += dt;
      if (rain > 0) rain -= dt;
      if (lunch > 0) lunch -= dt;
      if (!loser) {
        tickAcc += dt;
        while (tickAcc >= C.TICK) { tickAcc -= C.TICK; tick(); }
      }
      for (const pl of P) {
        if (pl.bubble && (pl.bubble.t -= dt) <= 0) pl.bubble = null;
        pl.xOff += ((pl.state === 'detour' ? pl.dir * 28 : 0) - pl.xOff) * Math.min(1, dt * 5);
        if (loser || pl.state === 'done') continue;
        pl.t += dt;
        switch (pl.state) {
          case 'run':
            pl.p += pl.v * (lunch > 0 ? C.LUNCH_BOOST : 1) * dt;
            break;
          case 'detour':
            pl.p += pl.v * C.DETOUR_SPEED * dt;
            if (pl.t >= pl.dur) pl.state = 'run';
            break;
          case 'jump': case 'slip': case 'elev': {
            const q = Math.min(1, pl.t / pl.dur);
            pl.p = pl.from + (pl.to - pl.from) * (pl.state === 'slip' ? easeOut(q) : easeInOut(q));
            if (pl.state === 'jump' && Math.random() < 0.5) {
              const ps = pos(pl);
              burst(env, ps.x, ps.y, 1, { colors: ['#FFD60A', '#FF6B00', '#fff'], speed: [10, 50], life: 0.5, size: [1.5, 3], gravity: 60 });
            }
            if (q >= 1) pl.state = 'run';
            break;
          }
          default:
            if (pl.t >= pl.dur) pl.state = 'run';
        }
        if (pl.p >= 100) finishPlayer(pl);
      }
      // 카메라: 아직 오르는 사람 중 선두 → 종료 후에는 꼴찌
      const left = racing();
      const focus = loser || left.reduce((b, q) => (q.p > b.p ? q : b), left[0]);
      if (focus) cam += (clamp(alt(focus.p), CAM_MIN, CAM_MAX) - cam) * Math.min(1, dt * (loser ? 1.6 : 2.5));
      if (loser) {
        endT += dt;
        if (endT > C.END_DELAY && !reported) {
          reported = true;
          env.finish([
            ...order.map((i) => ({ idx: i, detail: `${P[i].finishT.toFixed(1)}초` })),
            { idx: loser.i, detail: `${Math.floor(loser.p)}% 지점` },
          ]);
        }
      }
    },

    standings() {
      const rest = P.filter((pl) => pl.state !== 'done').sort((a, b) => b.p - a.p);
      return [
        ...order.map((i) => ({ idx: i, text: '🏁 정상', done: true })),
        ...rest.map((pl) => ({ idx: pl.i, text: `${STATE_ICON[pl.state] || '🧗'} ${Math.floor(pl.p)}%`, done: false })),
      ];
    },

    draw(ctx, t) {
      drawBackground(ctx, t);
      // 정상에 도착한 사람 먼저, 오르는 사람은 아래쪽일수록 앞에
      const list = [...P].sort((a, b) => pos(a).y - pos(b).y);
      for (const pl of list) {
        const { x, y } = pos(pl);
        if (y < -60 || y > H + 50) continue;
        drawPlayerDeco(ctx, pl, x, t);
        const o = { t, seed: pl.i * 1.7, walk: null, expr: 'idle' };
        switch (pl.state) {
          case 'run': o.walk = t * (lunch > 0 ? 14 : 9) + pl.i; o.expr = lunch > 0 ? 'panic' : 'idle'; break;
          case 'jump': o.hold = 'drink'; o.expr = 'joy'; o.rot = Math.sin((pl.t / pl.dur) * Math.PI) * 0.4; break;
          case 'slip': o.expr = 'dizzy'; o.rot = Math.sin(Math.min(1, pl.t / pl.dur) * Math.PI * 2) * 1.2; break;
          case 'elev': o.expr = 'joy'; break;
          case 'detour': o.walk = t * 9 + pl.i; o.expr = 'sweat'; break;
          case 'boss': o.bow = pl.t < pl.dur - 0.3 ? 0.6 : 0; o.expr = 'sweat'; break;
          case 'phone': o.hold = 'phone'; o.expr = 'talk'; break;
          case 'done': o.hold = 'coffee'; o.expr = 'joy'; break;
          case 'lost': o.expr = 'panic'; break;
          default:
        }
        if (pl.state === 'elev') drawElevator(ctx, x, y, false);
        drawWorker(ctx, x, y, S, pl.look, o);
        if (pl.state === 'elev') drawElevator(ctx, x, y, true);
        const ty = tagY(y, S) - (pl.i % 2) * 11;
        drawTag(ctx, pl.name, x, ty, pl.look.color, pl === loser);
        if (pl.bubble) drawBubble(ctx, pl.bubble.text, x, ty - 8, Math.min(1, pl.bubble.t * 3));
      }
      if (rain > 0) drawRain(ctx, t);
      drawAltimeter(ctx);
      drawOffscreen(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rrect(ctx, W - 66, 8, 58, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱ ${time.toFixed(1)}`, W - 37, 24);
      ctx.textAlign = 'left';
      if (lunch > 0) {
        ctx.fillStyle = `rgba(255,80,80,${0.08 + 0.06 * Math.sin(t * 12)})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  };

  // ---------- 드로잉 ----------

  function mountainHalf(a) {
    if (a <= CLIMB) return 134 + (CLIMB - a) * 0.35;
    const q = (a - CLIMB) / 60;
    return q >= 1 ? 0 : 134 * Math.sqrt(1 - q * q);
  }

  function drawBackground(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rain > 0 ? '#7D8A99' : '#8ECAE6');
    sky.addColorStop(1, rain > 0 ? '#B8C2CC' : '#E0F4FF');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // 원경 도시 (패럴랙스)
    const base = H * 0.8 + cam * 0.12;
    ctx.fillStyle = 'rgba(80,100,130,0.35)';
    for (const b of skyline) ctx.fillRect(b.x, base - b.h, b.w, b.h + 400);

    // 산 몸체
    const cx = W / 2 + 10;
    ctx.fillStyle = '#86C17F';
    ctx.beginPath();
    let started = false;
    for (let y = -10; y <= H + 10; y += 6) {
      const hw = mountainHalf(cam + CAM_Y - y);
      if (hw <= 0) continue;
      if (!started) { ctx.moveTo(cx - hw, y); started = true; } else ctx.lineTo(cx - hw, y);
    }
    for (let y = H + 10; y >= -10; y -= 6) {
      const hw = mountainHalf(cam + CAM_Y - y);
      if (hw > 0) ctx.lineTo(cx + hw, y);
    }
    ctx.closePath();
    ctx.fill();
    // 계단식 능선
    ctx.fillStyle = 'rgba(60,110,60,0.35)';
    for (let a = 40; a < CLIMB; a += 80) {
      const y = sy(a);
      if (y < -10 || y > H + 10) continue;
      const hw = mountainHalf(a);
      ctx.fillRect(cx - hw, y, hw * 2, 5);
    }
    // 출발선
    const gy = sy(0);
    if (gy < H + 40) {
      ctx.fillStyle = '#8D99AE';
      ctx.fillRect(0, gy + 4, W, 60);
      ctx.fillStyle = '#fff';
      for (let x = 0; x < W; x += 30) ctx.fillRect(x, gy + 22, 16, 3);
      signBoard(ctx, 70, gy - 14, '🚇 출발 · 구디역 1번 출구', '#1D3557');
    }
    for (const pr of props) drawProp(ctx, pr, t);
    drawSubway(ctx, t);
    drawSummit(ctx, t, cx);
  }

  function signBoard(ctx, x, y, text, bg) {
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 2, y, 3, 22);
    ctx.fillStyle = bg;
    rrect(ctx, x - w / 2, y - 18, w, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 4);
    ctx.textAlign = 'left';
  }

  function drawProp(ctx, pr, t) {
    const y = sy(pr.a);
    if (y < -20 || y > H + 160) return;
    const x = pr.x;
    ctx.save();
    switch (pr.type) {
      case 'office': {
        const cols = ['#9AA5B1', '#7D8FA3', '#A7B6C2'];
        ctx.fillStyle = cols[Math.floor(pr.hue * 3)];
        ctx.fillRect(x - 36, y - 60, 72, 60);
        ctx.fillRect(x - 24, y - 92, 48, 34);
        ctx.fillStyle = 'rgba(255,240,170,0.85)';
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) ctx.fillRect(x - 30 + c * 11, y - 54 + r * 13, 7, 8);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) ctx.fillRect(x - 19 + c * 11, y - 86 + r * 13, 7, 8);
        break;
      }
      case 'officetel': {
        ctx.fillStyle = pr.hue > 0.5 ? '#C9B79C' : '#B5A88F';
        ctx.fillRect(x - 22, y - 120, 44, 120);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let r = 0; r < 9; r++) ctx.fillRect(x - 18, y - 112 + r * 12, 36, 3);
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 8px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('오피스텔', x, y - 124);
        break;
      }
      case 'store': {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 32, y - 38, 64, 38);
        for (let s = 0; s < 8; s++) {
          ctx.fillStyle = s % 2 ? '#fff' : '#2A9D8F';
          ctx.fillRect(x - 34 + s * 8.5, y - 46, 8.5, 9);
        }
        ctx.fillStyle = '#F4A261';
        ctx.fillRect(x - 32, y - 58, 64, 12);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('편의점 24', x, y - 49);
        ctx.fillStyle = '#A8DADC';
        ctx.fillRect(x - 26, y - 30, 30, 22);
        ctx.fillStyle = '#457B9D';
        ctx.fillRect(x + 10, y - 28, 16, 28);
        break;
      }
      case 'crane': {
        ctx.fillStyle = '#FFB703';
        ctx.fillRect(x - 4, y - 130, 8, 130);
        ctx.fillRect(x - 30, y - 134, 100, 7);
        ctx.strokeStyle = '#E09F00';
        ctx.lineWidth = 1;
        for (let k = 0; k < 13; k++) {
          ctx.beginPath();
          ctx.moveTo(x - 4, y - k * 10);
          ctx.lineTo(x + 4, y - k * 10 - 10);
          ctx.stroke();
        }
        const hx = x + 55 + Math.sin(t * 1.2 + pr.seed) * 6;
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(x + 55, y - 128);
        ctx.lineTo(hx, y - 80);
        ctx.stroke();
        ctx.fillStyle = '#E63946';
        ctx.fillRect(hx - 9, y - 80, 18, 10);
        for (let s = 0; s < 6; s++) {
          ctx.fillStyle = s % 2 ? '#222' : '#FFD60A';
          ctx.fillRect(x - 30 + s * 10, y - 10, 10, 10);
        }
        ctx.fillStyle = '#222';
        ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
        ctx.fillText('공사중', x + 32, y - 2);
        break;
      }
      case 'escalator': {
        ctx.fillStyle = '#ADB5BD';
        ctx.beginPath();
        ctx.moveTo(x - 40, y);
        ctx.lineTo(x - 22, y);
        ctx.lineTo(x + 40, y - 70);
        ctx.lineTo(x + 22, y - 70);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6C757D';
        ctx.lineWidth = 2;
        const off = (t * 0.6) % 1;
        for (let k = 0; k < 8; k++) {
          const q = (k + off) / 8;
          const px = x - 31 + q * 62, py = y - q * 70;
          ctx.beginPath();
          ctx.moveTo(px - 8, py);
          ctx.lineTo(px + 8, py);
          ctx.stroke();
        }
        ctx.strokeStyle = '#343A40';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 40, y - 12);
        ctx.lineTo(x + 22, y - 82);
        ctx.stroke();
        break;
      }
      default:
    }
    ctx.restore();
  }

  function drawSubway(ctx, t) {
    const y = sy(CLIMB * 0.45);
    if (y < -40 || y > H + 60) return;
    ctx.fillStyle = '#6C757D';
    for (let x = 20; x < W; x += 70) ctx.fillRect(x, y, 10, 60);
    ctx.fillStyle = '#495057';
    ctx.fillRect(0, y - 4, W, 10);
    const tx = ((t * 70) % (W + 260)) - 200;
    ctx.fillStyle = '#E9ECEF';
    rrect(ctx, tx, y - 28, 180, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#00A84D';
    ctx.fillRect(tx, y - 12, 180, 5);
    ctx.fillStyle = '#5DADE2';
    for (let k = 0; k < 8; k++) ctx.fillRect(tx + 8 + k * 21, y - 24, 14, 9);
    ctx.fillStyle = '#00A84D';
    ellipse(ctx, W - 40, y - 42, 11, 11);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2', W - 40, y - 38);
    ctx.fillStyle = '#1B4332';
    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.fillText('2호선 고가', W - 40, y - 56);
    ctx.textAlign = 'left';
  }

  function drawSummit(ctx, t, cx) {
    const y = sy(CLIMB);
    if (y < -120 || y > H + 20) return;
    // 결승선
    for (let k = 0; k < 24; k++) {
      ctx.fillStyle = k % 2 ? '#fff' : '#222';
      ctx.fillRect(cx - 120 + k * 10, y + 22, 10, 5);
    }
    // 깃발
    const fy = sy(CLIMB + 52);
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(cx + 70, fy - 50, 3, 52);
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.moveTo(cx + 73, fy - 50);
    for (let k = 0; k <= 8; k++) ctx.lineTo(cx + 73 + k * 4, fy - 50 + Math.sin(t * 6 + k * 0.7) * 2.5 + k * 0.3);
    for (let k = 8; k >= 0; k--) ctx.lineTo(cx + 73 + k * 4, fy - 30 + Math.sin(t * 6 + k * 0.7) * 2.5);
    ctx.closePath();
    ctx.fill();
    signBoard(ctx, cx - 70, sy(CLIMB + 34), '구로디지털산 정상 ☕', '#2D6A4F');
  }

  function drawPlayerDeco(ctx, pl, x, t) {
    if (pl.state === 'slip') {
      const y = sy(alt(pl.deco));
      if (pl.rain) return;
      ctx.fillStyle = '#FFD60A';
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 7, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6B4F1D';
      ellipse(ctx, x + 6, y - 3, 1.5, 1.5);
    } else if (pl.state === 'detour') {
      const y = sy(alt(pl.deco)) - 4;
      const bx = x - pl.xOff;
      for (let s = 0; s < 4; s++) {
        ctx.fillStyle = s % 2 ? '#222' : '#FF9F1C';
        ctx.fillRect(bx - 14 + s * 7, y - 10, 7, 8);
      }
      ctx.fillStyle = '#555';
      ctx.fillRect(bx - 12, y - 2, 2, 6);
      ctx.fillRect(bx + 10, y - 2, 2, 6);
    } else if (pl.state === 'boss') {
      const y = sy(alt(pl.p));
      drawWorker(ctx, x + pl.dir * 22, y, S * 1.05, BOSS_LOOK, { t, expr: 'talk', seed: 3 });
      drawBubble(ctx, '어디 가나?', x + pl.dir * 22, tagY(y, S) - 2, 0.95);
    }
  }

  function drawElevator(ctx, x, y, front) {
    if (!front) {
      ctx.fillStyle = 'rgba(200,230,255,0.55)';
      ctx.fillRect(x - 16, y - 40, 32, 42);
      ctx.fillStyle = '#6C757D';
      ctx.fillRect(x - 2, y - 400, 4, 360);
    } else {
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 16, y - 40, 32, 42);
      ctx.fillStyle = 'rgba(200,230,255,0.25)';
      ctx.fillRect(x - 16, y - 40, 32, 42);
    }
  }

  function drawRain(ctx, t) {
    ctx.fillStyle = 'rgba(40,60,90,0.18)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,220,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < 70; k++) {
      const x = (k * 73.3 + t * 60) % W;
      const y = (k * 151.7 + t * 520) % (H + 20) - 10;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 10);
    }
    ctx.stroke();
  }

  function drawAltimeter(ctx) {
    const top = 46, bot = H - 30, x = 18;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    rrect(ctx, x - 9, top - 22, 18, bot - top + 34, 9);
    ctx.fill();
    ctx.fillStyle = '#CED4DA';
    ctx.fillRect(x - 2, top, 4, bot - top);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⛳', x + 1, top - 6);
    ctx.textAlign = 'left';
    for (const pl of P) {
      const y = bot - (pl.p / 100) * (bot - top);
      ctx.fillStyle = pl.look.color;
      ellipse(ctx, x, y, 5, 5);
      ctx.strokeStyle = pl === loser ? '#E63946' : '#fff';
      ctx.lineWidth = pl === loser ? 2.5 : 1.5;
      ctx.stroke();
    }
  }

  function drawOffscreen(ctx) {
    for (const pl of P) {
      if (pl.state === 'done') continue;
      const { x, y } = pos(pl);
      if (y <= H + 6) continue;
      const gap = Math.round((y - H) / 12);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(x - 5, H - 22);
      ctx.lineTo(x + 5, H - 22);
      ctx.lineTo(x, H - 15);
      ctx.fill();
      drawTag(ctx, pl.name, x, H - 8 - (pl.i % 2) * 14, pl.look.color, pl === loser, ` ↓${gap}m`);
    }
  }
}
