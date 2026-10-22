// 팀장님 결재 받기 📄 - 결재 보고 대작전 로직 & 드로잉
// create(players, env) => { update(dt), draw(ctx, t), standings(), time }
import { rand, pick, burst } from './coffeeGames.js';
import {
  OW as W, OH as H, LEADER_LOOK, ellipse, rrect, drawWorker, drawTag, drawBubble, tagY, say,
} from './officeCommon.js';

// ===== 밸런스 상수 =====
export const REPORT_CONFIG = {
  PASS_BASE: 0.35,          // 기본 통과율
  PASS_STEP: 0.12,          // 빠꾸 1회당 통과율 가산 (무한 빠꾸 방지)
  PASS_MAX: 0.9,
  MOOD_BONUS: 0.25,         // ☕ 팀장님 기분 좋음 동안 통과율 가산
  WALK_SEC: 1.6,            // 자리↔팀장 책상 이동 시간 (자리와 무관하게 동일 → 공정)
  WALK_JITTER: [0.8, 1.25], // 이동할 때마다 걸음 속도 랜덤 배율 (동시 출발 후 자연스럽게 흩어짐)
  REVIEW_SEC: [1.0, 1.8],   // 검토 시간
  WRITE_SEC: [2.5, 4.5],    // 재작성 시간
  PASS_ANIM: 0.9, REJECT_ANIM: 0.9,
  TARGET_SEC: [27, 35],     // 판 길이 목표: 이 시간에 걸쳐 통과 가능 인원이 점점 늘어남
  EVENT_TICK: 1,            // 특수 이벤트 판정 주기(초)
  P_RECALL: 0.08, RECALL_MAX: [2, 3], RECALL_FADE_SEC: 35, // 🔁 시간이 갈수록 확률 감소
  P_AWAY: 0.03, AWAY_SEC: [3, 4], AWAY_MAX: 1,             // 📞
  P_MOOD: 0.04, MOOD_SEC: 6, MOOD_MAX: 1,                  // ☕
  P_CHANGE: 0.03, CHANGE_MAX: 1,                           // 📋
  END_DELAY: 2.2,
};

const REJECT_LINES = ['이게 보고서야?', '결론부터 말해', '폰트가 왜 이래', '숫자 다시 확인해'];
const S = 10;
const LEADER_X = W / 2, LEADER_Y = 118;
const SLOT_Y = 184;

export function createReportGame(players, env) {
  const C = REPORT_CONFIG;
  const n = players.length;
  const cols = n <= 5 ? n : Math.ceil(n / 2);
  const rowsY = n <= 5 ? [430] : [372, 482];
  const colW = W / cols;
  const deskW = Math.min(70, colW - 20);
  const gaps = [12, W - 12];
  for (let c = 1; c < cols; c++) gaps.push(c * colW);
  const slotGap = Math.min(60, 330 / Math.max(1, n - 1));

  const P = players.map((pl, i) => {
    const row = i < cols ? 0 : 1;
    const inRow = row === 0 ? cols : n - cols;
    const c = row === 0 ? i : i - cols;
    const seatX = ((cols - inRow) / 2 + c + 0.5) * colW;
    const seatY = rowsY[row];
    const aisleX = gaps.reduce((b, g) => (Math.abs(g - seatX) < Math.abs(b - seatX) ? g : b), gaps[0]);
    const slotX = W / 2 + (i - (n - 1) / 2) * slotGap;
    const pts = [
      { x: seatX, y: seatY }, { x: aisleX, y: seatY + 8 },
      { x: aisleX, y: SLOT_Y + 46 }, { x: slotX, y: SLOT_Y },
    ];
    return {
      ...pl, i, seatX, seatY, slotX, path: makePath(pts),
      state: 'up', t: 0, dur: 0, d: 0, pace: rand(...C.WALK_JITTER), rejects: 0, recalled: 0, passed: false,
      bubble: null, frozen: null,
    };
  });
  const order = [];
  const sheets = [];
  let time = 0, tickAcc = 0;
  let away = 0, mood = 0, angry = 0, leaderBubble = null;
  let awayCount = 0, moodCount = 0, changeCount = 0, recalls = 0;
  const maxRecalls = Math.round(rand(C.RECALL_MAX[0], C.RECALL_MAX[1]));
  let loser = null, endT = 0, reported = false;
  const target = rand(...C.TARGET_SEC);
  // 진행 시간 대비 허용 통과 인원 (인원수와 무관하게 판 길이를 30~45초로 맞춤)
  const passQuota = () => Math.floor((n - 1) * Math.min(1, time / target) + 1e-6);

  const leaderSay = (text, dur = 1.6) => { leaderBubble = { text, t: dur }; };
  const writeDur = () => rand(...C.WRITE_SEC);

  env.log(`📄 전원 서류 들고 팀장님께 출발! (참가자 ${n}명)`);

  const pos = (pl) => {
    if (pl.frozen) return pl.frozen;
    switch (pl.state) {
      case 'up': return pathAt(pl.path, pl.d);
      case 'down': return pathAt(pl.path, pl.path.total - pl.d);
      case 'review': case 'pass': case 'reject': return { x: pl.slotX, y: SLOT_Y, dy: -1 };
      default: return { x: pl.seatX, y: pl.seatY, dy: -1 };
    }
  };

  const endGame = () => {
    loser = P.find((q) => !q.passed);
    loser.frozen = pos(loser);
    loser.state = 'lost';
    say(loser, '제가 커피 살게요…', 4);
    env.log(`☕ ${loser.name} 마지막까지 결재 실패! 커피 당첨 (빠꾸 ${loser.rejects}회)`);
    env.banner('☕ 커피 당첨!');
    env.sfx.doom();
    env.shake = 10;
  };

  const verdict = (pl) => {
    const prob = Math.min(C.PASS_MAX, C.PASS_BASE + C.PASS_STEP * pl.rejects + (mood > 0 ? C.MOOD_BONUS : 0));
    pl.t = 0;
    if (order.length < passQuota() && Math.random() < prob) {
      pl.passed = true;
      pl.state = 'pass';
      order.push(pl.i);
      leaderSay('좋네, 통과');
      say(pl, pick(['앗싸!', '감사합니다!', '살았다…']));
      env.log(`✅ ${pl.name} 결재 통과! 도장 쾅 (${order.length}위)`);
      env.sfx.stamp();
      env.shake = Math.max(env.shake, 4);
      if (order.length === n - 1) endGame();
    } else {
      pl.rejects++;
      pl.state = 'reject';
      const line = pick(REJECT_LINES);
      leaderSay(line);
      angry = 1;
      say(pl, pick(['흑…', '넵… 다시…', '😭']));
      env.log(`❌ ${pl.name} 빠꾸! "${line}" (누적 ${pl.rejects}회)`);
      env.sfx.paper();
      for (let k = 0; k < 7; k++) {
        sheets.push({ x: LEADER_X + rand(-20, 20), y: 104, vx: rand(-110, 110), vy: rand(-250, -130), r: rand(0, 6), vr: rand(-6, 6), life: 0, seed: rand(0, 9) });
      }
    }
  };

  const specialTick = () => {
    if (time < 4) return;
    const seated = P.filter((q) => q.state === 'done');
    const writers = P.filter((q) => q.state === 'write');
    if (recalls < maxRecalls && seated.length && Math.random() < C.P_RECALL * Math.max(0, 1 - time / C.RECALL_FADE_SEC)) {
      const pl = pick(seated);
      recalls++;
      pl.passed = false;
      order.splice(order.indexOf(pl.i), 1);
      pl.rejects++;
      pl.recalled++;
      pl.state = 'write';
      pl.t = 0;
      pl.dur = writeDur();
      leaderSay(`${pl.name.slice(0, 4)}씨, 다시 써와!`, 2);
      say(pl, '네?! 😱', 2);
      env.banner('🔁 다시 써와!');
      env.log(`🔁 ${pl.name} 이미 통과했는데 다시 불려감… 재작성!`);
      env.sfx.doom();
    } else if (away <= 0 && awayCount < C.AWAY_MAX && Math.random() < C.P_AWAY) {
      away = rand(...C.AWAY_SEC);
      awayCount++;
      leaderBubble = null;
      env.banner('📞 상무님 호출!');
      env.log('📞 상무님 호출! 팀장님 잠시 자리 비움… 전원 대기');
      env.sfx.ring();
    } else if (away <= 0 && mood <= 0 && moodCount < C.MOOD_MAX && Math.random() < C.P_MOOD) {
      mood = C.MOOD_SEC;
      moodCount++;
      leaderSay('오늘 커피 맛있네~ ☕', 2);
      env.banner('☕ 팀장님 기분 좋음!');
      env.log('☕ 팀장님 기분 좋음! 잠시 통과율 상승');
      env.sfx.ding();
    } else if (changeCount < C.CHANGE_MAX && writers.length && Math.random() < C.P_CHANGE) {
      changeCount++;
      writers.forEach((q) => { q.t = 0; q.dur = writeDur(); say(q, '네…?'); });
      if (away <= 0) leaderSay('아, 방향 바꾸자. 처음부터!', 2);
      env.banner('📋 지시사항 변경!');
      env.log(`📋 지시사항 변경! 작성 중이던 ${writers.length}명 처음부터 다시`);
      env.sfx.crack();
    }
  };

  return {
    get time() { return time; },

    update(dt) {
      time += dt;
      if (mood > 0) mood -= dt;
      if (angry > 0) angry -= dt;
      if (leaderBubble && (leaderBubble.t -= dt) <= 0) leaderBubble = null;
      if (away > 0 && (away -= dt) <= 0) {
        leaderSay('자, 다시 보자');
        env.log('🧑‍💼 팀장님 복귀! 검토 재개');
      }
      if (!loser) {
        tickAcc += dt;
        while (tickAcc >= C.EVENT_TICK) { tickAcc -= C.EVENT_TICK; specialTick(); }
      }
      for (const pl of P) {
        if (pl.bubble && (pl.bubble.t -= dt) <= 0) pl.bubble = null;
        switch (pl.state) {
          case 'up':
            pl.d += (pl.path.total / (C.WALK_SEC * pl.pace)) * dt;
            if (pl.d >= pl.path.total) { pl.state = 'review'; pl.t = 0; pl.dur = rand(...C.REVIEW_SEC); }
            break;
          case 'review':
            if (away <= 0 && !loser) {
              pl.t += dt;
              if (pl.t >= pl.dur) verdict(pl);
            }
            break;
          case 'pass': case 'reject':
            pl.t += dt;
            if (pl.t >= (pl.state === 'pass' ? C.PASS_ANIM : C.REJECT_ANIM)) { pl.state = 'down'; pl.d = 0; pl.pace = rand(...C.WALK_JITTER); }
            break;
          case 'down':
            pl.d += (pl.path.total / (C.WALK_SEC * pl.pace)) * dt;
            if (pl.d >= pl.path.total) {
              pl.t = 0;
              if (pl.passed) pl.state = 'done';
              else { pl.state = 'write'; pl.dur = writeDur(); }
            }
            break;
          case 'write':
            if (!loser) {
              pl.t += dt;
              if (pl.t >= pl.dur) { pl.state = 'up'; pl.d = 0; pl.pace = rand(...C.WALK_JITTER); say(pl, pick(['다 썼다!', '이번엔 된다', '제발…'])); }
            }
            break;
          default:
        }
      }
      for (let k = sheets.length - 1; k >= 0; k--) {
        const s = sheets[k];
        s.life += dt;
        s.vy = Math.min(s.vy + 300 * dt, 55);
        s.vx *= Math.pow(0.4, dt);
        s.x += (s.vx + Math.sin(s.life * 7 + s.seed) * 40) * dt;
        s.y += s.vy * dt;
        s.r += s.vr * dt;
        if (s.life > 2.4) sheets.splice(k, 1);
      }
      if (loser) {
        endT += dt;
        if (endT > C.END_DELAY && !reported) {
          reported = true;
          const detail = (pl) => `빠꾸 ${pl.rejects}회${pl.recalled ? ` (재소환 ${pl.recalled})` : ''}`;
          env.finish([...order.map((i) => ({ idx: i, detail: detail(P[i]) })), { idx: loser.i, detail: detail(loser) }]);
        }
      }
    },

    standings() {
      const score = (pl) => ({ review: 4, up: 3 + pl.d / pl.path.total, reject: 2, down: 1, write: pl.t / (pl.dur || 1) })[pl.state] ?? 0;
      const rest = P.filter((pl) => !pl.passed).sort((a, b) => score(b) - score(a) || a.rejects - b.rejects);
      const label = (pl) => {
        const st = {
          up: '🚶 보고하러 가는 중', review: away > 0 ? '⏳ 대기 중' : '👀 검토 중', pass: '✅ 통과!', reject: '❌ 빠꾸!',
          down: pl.passed ? '✅ 복귀 중' : '😭 복귀 중', write: `✍️ 재작성 ${Math.floor((pl.t / (pl.dur || 1)) * 100)}%`,
          done: '✅ 완료', lost: '☕ 당첨',
        }[pl.state];
        return pl.rejects ? `${st} · 빠꾸${pl.rejects}` : st;
      };
      return [
        ...order.map((i) => ({ idx: i, text: label(P[i]), done: true })),
        ...rest.map((pl) => ({ idx: pl.i, text: label(pl), done: false })),
      ];
    },

    draw(ctx, t) {
      drawOffice(ctx, t);
      drawLeader(ctx, t);
      for (const pl of P) drawDesk(ctx, pl, t);
      const list = P.map((pl) => ({ pl, p: pos(pl) })).sort((a, b) => a.p.y - b.p.y);
      for (const { pl, p } of list) {
        const seated = pl.state === 'write' || pl.state === 'done' || (pl.state === 'lost' && p.y === pl.seatY);
        const o = { t, seed: pl.i * 1.3, back: p.dy < 0, sit: seated };
        switch (pl.state) {
          case 'up': o.walk = t * 10 + pl.i; o.hold = 'paper'; break;
          case 'down': o.walk = t * 10 + pl.i; o.expr = pl.passed ? 'joy' : 'sweat'; o.back = false; break;
          case 'review': o.hold = 'paper'; o.back = true; break;
          case 'pass': o.back = false; o.expr = 'joy'; break;
          case 'reject': o.back = false; o.expr = 'panic'; break;
          case 'write': o.typing = true; o.back = true; break;
          case 'done': o.back = true; break;
          case 'lost': o.back = false; o.expr = 'panic'; break;
          default:
        }
        if (seated) {
          ctx.fillStyle = '#495057';
          ellipse(ctx, p.x, p.y - 2, S * 0.9, S * 0.35);
        }
        drawWorker(ctx, p.x, p.y, S, pl.look, o);
        const ty = tagY(p.y, S) + (seated ? 4 : 0);
        drawTag(ctx, pl.name, p.x, ty, pl.look.color, pl === loser, pl.state === 'done' ? ' ✅' : '');
        if (pl.state === 'pass') drawStamp(ctx, p.x, SLOT_Y - 52, pl.t);
        if (pl.bubble) drawBubble(ctx, pl.bubble.text, p.x, ty - 8, Math.min(1, pl.bubble.t * 3));
      }
      for (const s of sheets) {
        ctx.save();
        ctx.globalAlpha = s.life > 1.8 ? (2.4 - s.life) / 0.6 : 1;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r);
        ctx.scale(Math.cos(s.life * 5 + s.seed), 1);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 1;
        ctx.fillRect(-6, -8, 12, 16);
        ctx.strokeRect(-6, -8, 12, 16);
        ctx.fillStyle = '#ced4da';
        for (let k = 0; k < 4; k++) ctx.fillRect(-4, -5 + k * 3.5, 8, 1.2);
        ctx.restore();
      }
      if (leaderBubble && away <= 0) drawBubble(ctx, leaderBubble.text, LEADER_X, 78, Math.min(1, leaderBubble.t * 3));
      if (mood > 0) {
        ctx.fillStyle = `rgba(255,200,120,${0.08 + 0.04 * Math.sin(t * 4)})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rrect(ctx, W - 66, 34, 58, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱ ${time.toFixed(1)}`, W - 37, 50);
      ctx.textAlign = 'left';
    },
  };

  // ---------- 드로잉 ----------

  function drawOffice(ctx) {
    for (let y = 28; y < H; y += 40) {
      for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = ((x + y) / 40) % 2 ? '#E3E9EF' : '#EBF0F4';
        ctx.fillRect(x, y, 40, 40);
      }
    }
    // 벽 + 창문
    ctx.fillStyle = '#B8C4D0';
    ctx.fillRect(0, 0, W, 28);
    ctx.fillStyle = '#CFE8FF';
    for (let x = 150; x < W - 20; x += 64) ctx.fillRect(x, 5, 50, 16);
    // 화이트보드
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#868E96';
    ctx.lineWidth = 3;
    ctx.fillRect(10, 8, 96, 54);
    ctx.strokeRect(10, 8, 96, 54);
    ctx.fillStyle = '#1D3557';
    ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
    ctx.fillText('Q4 매출 목표!', 18, 24);
    ctx.strokeStyle = '#E63946';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 52); ctx.lineTo(38, 44); ctx.lineTo(56, 48); ctx.lineTo(80, 32); ctx.lineTo(96, 34);
    ctx.stroke();
    // 복합기
    ctx.fillStyle = '#CED4DA';
    rrect(ctx, 8, 222, 46, 42, 4);
    ctx.fill();
    ctx.fillStyle = '#495057';
    ctx.fillRect(12, 226, 38, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(16, 244, 30, 6);
    ctx.fillStyle = '#06D6A0';
    ellipse(ctx, 46, 230, 2, 2);
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 8px "Noto Sans KR", sans-serif';
    ctx.fillText('복합기', 17, 274);
    // 화분
    for (const [px, py] of [[W - 22, 250], [30, H - 26], [W - 24, H - 26]]) {
      ctx.fillStyle = '#2D6A4F';
      ellipse(ctx, px - 6, py - 14, 9, 7, -0.5);
      ellipse(ctx, px + 6, py - 14, 9, 7, 0.5);
      ellipse(ctx, px, py - 20, 8, 9);
      ctx.fillStyle = '#BC6C25';
      rrect(ctx, px - 9, py - 8, 18, 14, 3);
      ctx.fill();
    }
  }

  function drawLeader(ctx, t) {
    if (away > 0) {
      ctx.fillStyle = '#343A40';
      rrect(ctx, LEADER_X - 14, 82, 28, 26, 6);
      ctx.fill();
    } else {
      const reviewing = P.some((pl) => pl.state === 'review');
      drawWorker(ctx, LEADER_X, LEADER_Y, 11, LEADER_LOOK, {
        t, expr: angry > 0 ? 'angry' : mood > 0 ? 'joy' : reviewing ? 'idle' : 'talk', hold: mood > 0 ? 'coffee' : null,
      });
    }
    // 책상
    ctx.fillStyle = '#A47148';
    rrect(ctx, 118, 100, 164, 36, 4);
    ctx.fill();
    ctx.fillStyle = '#C68B59';
    ctx.fillRect(118, 100, 164, 8);
    // 모니터
    ctx.fillStyle = '#343A40';
    rrect(ctx, 236, 78, 38, 26, 3);
    ctx.fill();
    ctx.fillRect(252, 104, 6, 4);
    // 명패
    ctx.fillStyle = '#212529';
    rrect(ctx, LEADER_X - 20, 120, 40, 13, 2);
    ctx.fill();
    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('팀장', LEADER_X, 130);
    // 서류 더미 (검토 중이면 넘기는 모션)
    const pile = P.filter((pl) => pl.state === 'review').length;
    for (let k = 0; k < Math.min(pile, 5); k++) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 1;
      ctx.fillRect(150 - k, 106 - k * 2, 22, 14);
      ctx.strokeRect(150 - k, 106 - k * 2, 22, 14);
    }
    if (pile && away <= 0) {
      const f = Math.cos(t * 7);
      ctx.save();
      ctx.translate(161, 104 - pile * 2);
      ctx.scale(1, f);
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(-11, -14, 22, 14);
      ctx.restore();
    }
    if (away > 0) {
      ctx.fillStyle = '#fff';
      rrect(ctx, LEADER_X - 46, 84, 92, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#E63946';
      ctx.fillText('📞 상무님 호출 중', LEADER_X, 97);
    }
    ctx.textAlign = 'left';
  }

  function drawDesk(ctx, pl, t) {
    const x = pl.seatX, y = pl.seatY;
    ctx.fillStyle = '#C9A27E';
    rrect(ctx, x - deskW / 2, y - 62, deskW, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#495057';
    ctx.fillRect(x - 2, y - 64, 4, 4);
    // 모니터 화면 (작성 진행도 / 완료)
    ctx.fillStyle = '#343A40';
    rrect(ctx, x - 19, y - 86, 38, 24, 3);
    ctx.fill();
    const done = pl.passed && pl.state === 'done';
    ctx.fillStyle = done ? '#D8F3DC' : '#F8F9FA';
    ctx.fillRect(x - 16, y - 83, 32, 18);
    if (done) {
      ctx.fillStyle = '#2D6A4F';
      ctx.font = 'bold 8px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('결재완료', x, y - 71);
      ctx.textAlign = 'left';
    } else if (pl.state === 'write') {
      const k = pl.t / (pl.dur || 1);
      ctx.fillStyle = '#ADB5BD';
      const lines = Math.floor(k * 5);
      for (let l = 0; l < lines; l++) ctx.fillRect(x - 13, y - 80 + l * 3, l === lines - 1 ? 10 + Math.sin(t * 9) * 4 : 26, 1.6);
      if (Math.random() < 0.04) burst(env, x + rand(-8, 8), y - 50, 1, { colors: ['#495057'], speed: [10, 30], life: 0.3, size: [1, 1.6] });
    }
    // 키보드
    ctx.fillStyle = '#DEE2E6';
    ctx.fillRect(x - 12, y - 56, 24, 6);
  }

  function drawStamp(ctx, x, y, k) {
    const sc = 1 + Math.max(0, 0.18 - k) * 9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2);
    ctx.scale(sc, sc);
    ctx.globalAlpha = Math.min(1, k * 8);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(ctx, 0, 0, 17, 17);
    ctx.strokeStyle = '#D00000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#D00000';
    ctx.font = '900 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('결재', 0, 1);
    ctx.restore();
  }
}

function makePath(pts) {
  const segs = [];
  let total = 0;
  for (let k = 1; k < pts.length; k++) {
    const len = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    segs.push({ a: pts[k - 1], b: pts[k], len, start: total });
    total += len;
  }
  return { segs, total };
}

function pathAt(path, d) {
  for (const s of path.segs) {
    if (d <= s.start + s.len || s === path.segs[path.segs.length - 1]) {
      const k = s.len ? Math.min(1, Math.max(0, (d - s.start) / s.len)) : 1;
      return { x: s.a.x + (s.b.x - s.a.x) * k, y: s.a.y + (s.b.y - s.a.y) * k, dy: s.b.y - s.a.y };
    }
  }
  return { ...path.segs[0].a, dy: 0 };
}
