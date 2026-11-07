// 커피내기 게임 5종 공통 목록 (/coffee-bet/:gameId)
// 모든 게임이 같은 포맷: 설정(참가자 2~10명·옵션·규칙) → 플레이(배속·결과 바로보기·실시간 현황·중계) → 결과(전체 순위·커피 당첨자)
// 캔버스 게임: create(players, env, opts) => { update(dt), draw(ctx, t), standings() } — env 규격은 coffeeGames.js 상단 참고
import { W, H, BOMB_TIMES, timeLabel, createBombGame, createLadderGame, createBridgeGame } from './coffeeGames.js';
import { OW, OH } from './officeCommon.js';
import { createReportGame } from './reportGame.js';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

export const COFFEE_GAMES = {
  bomb: {
    emoji: '💣',
    title: '시한폭탄 패스',
    desc: '폭탄이 점점 빨라진다! 터지는 순간 들고 있는 사람이 커피',
    duration: '30초·1분',
    chars: 'hanbok',
    size: [W, H],
    bannerY: 70,
    boardTitle: '💣 폭탄 현황',
    rules: [
      '폭탄이 랜덤으로 오가며 갈수록 패스가 빨라져요',
      '⏱ 제한 시간이 끝나는 순간 폭탄을 들고 있는 사람이 커피',
      '날아가는 중에 터지면 절반 이상 날아간 쪽이 당첨',
      '결과 화면에서 개인별 폭탄 받은 횟수 공개',
    ],
    options: [{ key: 'fuse', label: '⏱ 폭탄 시간', choices: BOMB_TIMES.map((v) => ({ value: v, label: timeLabel(v) })) }],
    create: createBombGame,
  },
  ladder: {
    emoji: '🪜',
    title: '조선 사다리 타기',
    desc: '안개 속 사다리, 단 한 칸만 커피 당첨!',
    duration: '10~30초',
    chars: 'hanbok',
    size: [W, H],
    bannerY: 70,
    boardTitle: '🪜 도착 현황',
    rules: [
      '랜덤 순서로 한 명씩 사다리를 내려가요',
      '도착 칸 중 단 하나만 ☕ 커피 당첨',
      '🌫️ 가운데는 안개! 지나간 자리만 걷혀요',
      '당첨자가 나오면 남은 사람은 타지 않고 면제',
    ],
    create: createLadderGame,
  },
  bridge: {
    emoji: '🌊',
    title: '외나무다리 밀치기',
    desc: '밀고 밀리는 배틀로얄! 최후의 결투에서 빠지는 사람이 커피',
    duration: '약 30초',
    chars: 'hanbok',
    size: [W, H],
    bannerY: 70,
    boardTitle: '🌊 생존 현황',
    rules: [
      '전원이 다리 위에서 서로를 밀쳐요',
      '먼저 빠진 사람은 커피 면제! 2명 남으면 ⚔️ 최후의 결투',
      '결투에서 빠지는 사람이 커피, 끝까지 버틴 사람이 1등',
      '🪵 다리 좁아짐 · 🌪️ 돌풍 · 🐟 잉어 습격 이벤트',
    ],
    create: createBridgeGame,
  },
  report: {
    emoji: '📄',
    title: '실장님 결재 받기',
    desc: '빠꾸 지옥을 뚫고 결재 도장을 받아라! 가장 늦게 끝낸 사람이 커피',
    duration: '약 40초',
    chars: 'office',
    size: [OW, OH],
    bannerY: 92,
    boardTitle: '🏆 실시간 순위',
    rules: [
      '전원 동시에 보고! 기본 통과율은 약 35%',
      '❌ 빠꾸 당하면 자리로 돌아가 다시 작성 후 재보고',
      '🔁 다시 써와 · 📞 상무님 호출 · ☕ 기분 좋음 · 📋 지시사항 변경',
      '결과 화면에서 개인별 빠꾸 횟수 공개',
    ],
    create: createReportGame,
  },
  mountain: {
    emoji: '⛰️',
    title: '커피내기 산악 레이스',
    desc: '랜덤 산을 오르는 등반 레이스! 신의 손·낙석·호랑이 추격, 꼴찌로 정상에 오른 사람이 커피',
    duration: '약 50초',
    // 단독 정적 페이지(public/coffee-bet/mountain/index.html)라 SPA 라우터 대신 전체 페이지 이동
    href: '/coffee-bet/mountain/',
  },
};

export const gameTitle = (g) => `${g.emoji} ${g.title}`;
