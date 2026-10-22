import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "할로윈 파티에 초대받았다! 나의 첫 반응은? 🎃",
    options: [
      { text: "🦊 무슨 옷 입고 갈지부터 벌써 설렘", type: "GUMIHO" },
      { text: "👹 무조건 간다! 분위기는 내가 띄운다", type: "DOKKAEBI" }
    ]
  },
  {
    id: 2,
    text: "파티장에 도착했는데 아는 사람이 별로 없다. 나는? 🕯️",
    options: [
      { text: "🖤 구석에서 조용히 분위기를 관찰함", type: "SAJA" },
      { text: "⚔️ 혼자 온 사람을 찾아가 먼저 말을 걸어줌", type: "HUNTER" }
    ]
  },
  {
    id: 3,
    text: "친구들이 내 첫인상을 말할 때 자주 듣는 말은? 👀",
    options: [
      { text: "✨ \"묘하게 끌리는 매력이 있어\"", type: "GUMIHO" },
      { text: "🧊 \"처음엔 좀 차가워 보였어\"", type: "SAJA" }
    ]
  },
  {
    id: 4,
    text: "단체 사진을 찍을 때 나는? 📸",
    options: [
      { text: "🤪 엽기 포즈 담당, 웃긴 사진 하나는 꼭 남김", type: "DOKKAEBI" },
      { text: "📍 다 같이 나오게 자리 정리하고 구도 잡음", type: "HUNTER" }
    ]
  },
  {
    id: 5,
    text: "공포 영화를 볼 때 나의 모습은? 🎬",
    options: [
      { text: "😐 무표정으로 끝까지 봄. 별로 안 무서움", type: "SAJA" },
      { text: "🙈 소리 지르고 리액션하느라 바쁨", type: "DOKKAEBI" }
    ]
  },
  {
    id: 6,
    text: "친구가 곤란한 상황에 처했다. 나는? 🆘",
    options: [
      { text: "🛡️ 앞뒤 안 가리고 바로 해결하러 출동", type: "HUNTER" },
      { text: "💋 말솜씨로 분위기를 부드럽게 풀어줌", type: "GUMIHO" }
    ]
  },
  {
    id: 7,
    text: "나를 가장 잘 표현하는 소품은? 🧺",
    options: [
      { text: "🪭 은은한 향수와 반짝이는 액세서리", type: "GUMIHO" },
      { text: "📜 일정과 할 일이 빼곡한 다이어리", type: "SAJA" }
    ]
  },
  {
    id: 8,
    text: "파티가 끝나갈 무렵, 나는 어디에? 🌙",
    options: [
      { text: "🎶 마지막 곡까지 춤추며 2차를 외치는 중", type: "DOKKAEBI" },
      { text: "🚕 다들 안전하게 귀가하는지 챙기는 중", type: "HUNTER" }
    ]
  },
  {
    id: 9,
    text: "누군가 나에게 거짓말을 했다는 걸 알았다. 나는? 🔮",
    options: [
      { text: "🕰️ 말없이 지켜보다가 결정적인 순간에 정리함", type: "SAJA" },
      { text: "😏 모르는 척 웃으며 상대가 털어놓게 만듦", type: "GUMIHO" }
    ]
  },
  {
    id: 10,
    text: "올해 할로윈, 내가 가장 원하는 것은? 🎁",
    options: [
      { text: "🔥 잊지 못할 레전드 에피소드 하나", type: "DOKKAEBI" },
      { text: "🌟 소중한 사람들과 안전하고 즐거운 하루", type: "HUNTER" }
    ]
  }
];

const RESULTS = {
  GUMIHO: {
    title: "치명 매력 구미호",
    emoji: "🦊",
    color: "#e84393",
    keyword: "치명적 매력 · 센스 만렙 · 분위기 메이커",
    description: "당신은 어디서든 시선을 사로잡는 '치명 매력 구미호'예요! 말 한마디, 눈빛 하나로 분위기를 내 편으로 만드는 능력자죠. 상대가 원하는 걸 빠르게 읽어내는 센스 덕분에 처음 만난 사람과도 금방 가까워져요. 할로윈 파티에서도 '저 사람 누구야?' 소리를 듣는 주인공이 될 확률 높음!",
    strengths: ["사람을 끄는 매력", "뛰어난 눈치와 센스", "부드러운 화술"],
    tip: "추천 코스튬: 한복 저고리에 여우 귀 머리띠와 꼬리 하나만 더해도 완성! 붉은 아이섀도로 포인트를 주면 분위기 두 배예요. 매력 발산은 좋지만 가끔은 진짜 속마음도 꺼내 보여주세요. 진심이 구미호의 마지막 꼬리랍니다.",
    shareText: "나의 할로윈 캐릭터는 🦊 치명 매력 구미호! 눈빛 하나로 분위기 장악"
  },
  SAJA: {
    title: "시크 카리스마 저승사자",
    emoji: "🖤",
    color: "#2d3436",
    keyword: "냉철한 판단 · 원칙주의 · 반전 다정함",
    description: "당신은 겉보기엔 차갑지만 누구보다 공정한 '시크 카리스마 저승사자'예요! 감정에 휩쓸리기보다 상황을 차분히 꿰뚫어 보고, 결정적인 순간에 정확한 판단을 내리죠. 처음엔 다가가기 어렵다는 말을 듣지만, 알고 보면 맡은 일은 끝까지 책임지는 든든한 사람. 츤데레 매력에 빠지는 사람이 한둘이 아니에요.",
    strengths: ["흔들리지 않는 침착함", "공정한 판단력", "끝까지 지키는 책임감"],
    tip: "추천 코스튬: 검은 도포에 갓, 창백한 메이크업이면 끝! 명부(수첩) 하나 들고 다니면 디테일 완성이에요. 너무 혼자 다 짊어지지 말고, 가끔은 '나도 좀 도와줘'라고 말해보세요.",
    shareText: "나의 할로윈 캐릭터는 🖤 시크 카리스마 저승사자! 차가워 보여도 알고 보면 다정함"
  },
  DOKKAEBI: {
    title: "흥부자 장난꾸러기 도깨비",
    emoji: "👹",
    color: "#e17055",
    keyword: "넘치는 흥 · 장난기 · 에너지 폭발",
    description: "당신은 등장만으로 분위기를 바꾸는 '흥부자 장난꾸러기 도깨비'예요! 지루한 걸 못 참고, 어디서든 재미있는 일을 만들어내는 에너지의 원천이죠. 당신이 있는 자리는 늘 웃음이 끊이지 않아요. 도깨비방망이처럼 '뚝딱' 하고 즐거운 추억을 만들어내는 능력, 그게 당신의 진짜 마법이에요.",
    strengths: ["무한 긍정 에너지", "분위기 반전 능력", "기발한 아이디어"],
    tip: "추천 코스튬: 뿔 머리띠에 호피 무늬 포인트, 장난감 방망이 하나면 끝! 파티 내내 '금 나와라 뚝딱'을 외쳐보세요. 신나게 놀되 다음 날 일정은 미리 체크해두는 것, 잊지 마세요.",
    shareText: "나의 할로윈 캐릭터는 👹 흥부자 장난꾸러기 도깨비! 금 나와라 뚝딱, 흥 나와라 뚝딱"
  },
  HUNTER: {
    title: "정의로운 데몬 헌터",
    emoji: "⚔️",
    color: "#6c5ce7",
    keyword: "리더십 · 의리 · 보호 본능",
    description: "당신은 소중한 사람들을 지키는 '정의로운 데몬 헌터'예요! 문제가 생기면 망설이지 않고 앞장서고, 무리 속에서 소외된 사람이 없는지 늘 살피죠. 친구들은 위기의 순간에 가장 먼저 당신을 떠올려요. 화려한 무대 위 히어로처럼, 당신은 일상 속에서 모두의 든든한 히어로예요.",
    strengths: ["타고난 리더십", "의리와 책임감", "빠른 상황 대처"],
    tip: "추천 코스튬: 땋은 머리에 크롭 재킷, 노리개 같은 한국적인 포인트 소품을 더하면 요즘 가장 핫한 K-헌터 룩 완성! 모두를 지키느라 지친 날엔 당신도 누군가에게 기대도 괜찮아요.",
    shareText: "나의 할로윈 캐릭터는 ⚔️ 정의로운 데몬 헌터! 소중한 사람은 내가 지킨다"
  }
};

const INITIAL_SCORES = { GUMIHO: 0, SAJA: 0, DOKKAEBI: 0, HUNTER: 0 };

export default function HalloweenTypeTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '할로윈 캐릭터 유형 테스트 - 나는 어떤 K-오컬트 캐릭터? | CCGG';
  }, []);

  const handleAnswer = (type) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores) => {
    const topType = Object.keys(finalScores).reduce((a, b) =>
      finalScores[a] >= finalScores[b] ? a : b
    );
    setResult(RESULTS[topType]);
    setShowResult(true);
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setScores(INITIAL_SCORES);
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🎃 할로윈 캐릭터 유형 테스트</h1>
        <p className="intro-subtitle">올해 할로윈, 나와 닮은 K-오컬트 캐릭터는? 성격으로 찾는 나만의 코스튬</p>

        <div className="intro-section">
          <h2>올해 할로윈은 K-오컬트!</h2>
          <p>2026년 할로윈은 10월 31일 토요일이에요. 최근 몇 년 사이 전 세계 할로윈 코스튬 검색 순위에서 K-팝 데몬 헌터 스타일이 상위권을 휩쓸 만큼, 한국적인 요괴와 헌터 콘셉트가 가장 핫한 코스튬이 됐어요.</p>
          <p>이 테스트는 파티와 일상 속 나의 행동 패턴으로 구미호, 저승사자, 도깨비, 데몬 헌터 중 나와 가장 닮은 캐릭터를 찾아주고, 성격에 어울리는 코스튬 아이디어까지 추천해드려요.</p>
        </div>

        <div className="intro-section">
          <h2>4가지 할로윈 캐릭터</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🦊 치명 매력 구미호</strong><p>눈빛 하나로 분위기를 사로잡는 매력 만렙 타입입니다.</p></div>
            <div className="intro-card"><strong>🖤 시크 카리스마 저승사자</strong><p>차가워 보여도 공정하고 책임감 강한 츤데레 타입입니다.</p></div>
            <div className="intro-card"><strong>👹 흥부자 장난꾸러기 도깨비</strong><p>어디서든 재미를 만들어내는 에너지 폭발 타입입니다.</p></div>
            <div className="intro-card"><strong>⚔️ 정의로운 데몬 헌터</strong><p>소중한 사람들을 지키는 의리파 리더 타입입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있어요. 할로윈 파티와 일상 상황에서 나와 더 가까운 답을 골라주세요. 결과와 함께 나에게 어울리는 코스튬 팁도 알려드려요. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🎃 할로윈 캐릭터 유형 테스트</h2>
      <p className="test-subtitle">나와 닮은 K-오컬트 캐릭터는? · 10월 할로윈 특집</p>

      {!showResult ? (
        <div className="test-card">
          <div className="progress-bar">
            <div style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="progress-text">진행 중 {currentQuestion + 1} / {QUESTIONS.length}</p>
          <h3 className="question-text">{QUESTIONS[currentQuestion].text}</h3>
          <div className="button-group">
            {QUESTIONS[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                className="option-btn"
                onClick={() => handleAnswer(option.type)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="result-emoji-big">{result.emoji}</div>
          <h3 className="result-header">나의 할로윈 캐릭터는</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 캐릭터 능력치</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>🎃 코스튬 추천 & 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 할로윈 캐릭터 유형 테스트`} shareUrl={window.location.href} testTitle="할로윈 캐릭터 유형 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
