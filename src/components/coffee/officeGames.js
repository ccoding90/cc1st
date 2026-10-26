// 회사원 내기 게임 목록 (/coffee-bet/:key)
import { createReportGame } from './reportGame.js';

export const OFFICE_GAMES = {
  mountain: {
    title: '⛰️ 커피내기 산악 레이스',
    desc: '랜덤 산을 오르는 등반 레이스! 신의 손·낙석·호랑이 추격, 꼴찌로 정상에 오른 사람이 커피',
    // 단독 정적 페이지(public/coffee-bet/mountain/index.html)라 SPA 라우터 대신 전체 페이지 이동
    href: '/coffee-bet/mountain/',
  },
  report: {
    title: '📄 실장님 결재 받기',
    desc: '빠꾸 지옥을 뚫고 결재 도장을 받아라! 가장 늦게 끝낸 사람이 커피',
    path: '/coffee-bet/report',
    rules: [
      '전원 동시에 보고! 기본 통과율은 약 35%',
      '❌ 빠꾸 당하면 자리로 돌아가 다시 작성 후 재보고',
      '🔁 다시 써와 · 📞 상무님 호출 · ☕ 기분 좋음 · 📋 지시사항 변경',
      '결과 화면에서 개인별 빠꾸 횟수 공개',
    ],
    create: createReportGame,
  },
};
