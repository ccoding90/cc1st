// 회사원 내기 게임 목록 (/coffee-bet/:key)
import { createMountainGame } from './mountainGame.js';
import { createReportGame } from './reportGame.js';

export const OFFICE_GAMES = {
  mountain: {
    title: '⛰️ 구로디지털산 정상 정복',
    desc: '빌딩 숲 산을 오르는 등반 레이스! 가장 늦게 정상에 도착한 사람이 커피',
    path: '/coffee-bet/mountain',
    rules: [
      '🚀 에너지드링크 슈퍼점프 · 🛗 엘리베이터 탑승으로 역전 가능',
      '🍌 미끄러짐 · 🚧 공사중 우회 · 👔 부장님 · 📱 업무 전화로 지체',
      '🌧️ 소나기, 🏃 점심시간 종료 알림 같은 전체 이벤트도 있어요',
      '뒤처질수록 슈퍼점프 확률이 조금 올라가요',
    ],
    create: createMountainGame,
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
