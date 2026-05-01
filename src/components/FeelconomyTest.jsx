import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "일이 너무 힘든 날, 퇴근 후 가장 먼저 하고 싶은 건? 😤",
    options: [
      { text: "🛍️ 온라인 쇼핑앱을 켜서 장바구니를 채움", type: "MOOD" },
      { text: "🍰 맛있는 걸 먹으며 나 자신을 달래줌", type: "COMFORT" }
    ]
  },
  {
    id: 2,
    text: "좋아하는 아이돌·유튜버가 굿즈를 출시했다! 나의 반응은? 🎁",
    options: [
      { text: "⚡ 일단 담기고 봄! 나중에 생각하지 뭐", type: "MOOD" },
      { text: "🤔 정말 필요한지 며칠 더 생각해보고 결정", type: "EXPERIENCE" }
    ]
  },
  {
    id: 3,
    text: "한 달에 예상치 못한 지출이 생기는 주요 원인은? 💸",
    options: [
      { text: "😂 기분이 좋아서 OR 기분이 나빠서 산 것들", type: "MOOD" },
      { text: "🏆 '이 정도 노력했으면 상줘야지' 자기보상 소비", type: "REWARD" }
    ]
  },
  {
    id: 4,
    text: "친구들이 맛집·팝업스토어 간다고 한다! 나는? 🍜",
    options: [
      { text: "🙌 무조건 따라감! 경험이 재산이잖아", type: "EXPERIENCE" },
      { text: "💭 가기 싫은데... 분위기상 따라가는 편", type: "COMFORT" }
    ]
  },
  {
    id: 5,
    text: "쇼핑 후 택배가 왔을 때 느끼는 감정은? 📦",
    options: [
      { text: "😆 두근두근! 뭘 샀는지 잠깐 잊어버리기도 함", type: "MOOD" },
      { text: "🎉 내가 열심히 일해서 번 돈으로 산 선물 같은 느낌", type: "REWARD" }
    ]
  },
  {
    id: 6,
    text: "스트레스를 받을 때 나도 모르게 켜는 앱은? 📱",
    options: [
      { text: "🛒 쿠팡·무신사·올리브영 등 쇼핑 앱", type: "MOOD" },
      { text: "🎫 여행·공연·팝업 예약 앱", type: "EXPERIENCE" }
    ]
  },
  {
    id: 7,
    text: "시험·프로젝트 등 큰 일을 마쳤을 때 나에게 주는 선물은? 🎊",
    options: [
      { text: "🍖 평소에 못 갔던 비싼 레스토랑에서 혼밥or모임", type: "REWARD" },
      { text: "🧴 평소에 아꼈던 고가 스킨케어·뷰티 제품 구매", type: "REWARD" }
    ]
  },
  {
    id: 8,
    text: "충동구매 후 후회할 때 나의 패턴은? 😅",
    options: [
      { text: "🔄 '이번 한 번만...' 하면서 또 비슷한 일이 반복됨", type: "MOOD" },
      { text: "💆 '이게 나한테 위로가 됐으니까 괜찮아'라며 수용", type: "COMFORT" }
    ]
  },
  {
    id: 9,
    text: "같은 금액이라면 어떤 소비가 더 만족스럽나요? 💰",
    options: [
      { text: "✈️ 콘서트·팝업·여행 등 특별한 경험 한 번", type: "EXPERIENCE" },
      { text: "🧸 오래 쓸 수 있는 취향 담긴 물건 하나", type: "COMFORT" }
    ]
  },
  {
    id: 10,
    text: "2026 소비 트렌드 '필코노미' - 기분이 돈이 되는 시대, 나의 소비 모토는? 💭",
    options: [
      { text: "😎 '지금 이 기분을 돈 주고 산다' - 현재 감정이 우선", type: "MOOD" },
      { text: "🌟 '경험이 쌓여야 진짜 삶' - 추억에 투자한다", type: "EXPERIENCE" }
    ]
  }
];

const RESULTS = {
  MOOD: {
    title: "기분파 즉흥형",
    emoji: "🌊",
    color: "#e74c3c",
    keyword: "감정 주도 소비 · 즉흥적 · 현재 충실",
    description: "당신은 2026 필코노미 트렌드의 대표 주자! 기분이 곧 지갑을 열고, 지갑이 닫힐 때 기분이 풀리는 '감정 주도 소비형'이에요. 힘든 날 쇼핑앱을 켜는 건 당신만의 감정 처리 방식이에요. 이 소비 패턴은 일시적 스트레스 해소에 효과적이지만, '감정 지출 일기'를 써보면 감정과 소비 패턴을 더 잘 이해할 수 있어요. 필코노미 시대, 당신의 감정을 존중하되 지갑도 존중해보세요!",
    strengths: ["현재 충실", "감정 표현력", "트렌드 민감도"],
    tip: "충동구매를 완전히 막는 것보다 '24시간 장바구니 법칙'을 써보세요! 장바구니에 담고 하루 후에도 사고 싶다면 구매하는 거예요. 감정이 사그라든 후에도 원하는 물건이라면 진짜 필요한 거니까요.",
    shareText: "나의 소비 유형은 🌊 기분파 즉흥형! 감정이 지갑을 여는 필코노미 대표주자"
  },
  REWARD: {
    title: "자기보상형",
    emoji: "🏆",
    color: "#f39c12",
    keyword: "노력 인정 · 자기 투자 · 건강한 소비",
    description: "당신은 내가 수고한 만큼 나에게 줄 자격이 있다는 걸 아는 자기보상형이에요! 노력 후의 선물은 단순한 소비가 아니라 자기 존중의 표현이죠. 2026 필코노미 트렌드에서 가장 건강한 소비 패턴 중 하나예요. '오늘 수고한 나'를 위한 소비는 심리적 회복에도 큰 도움을 줍니다. 다만, 보상 기준이 너무 낮아지지 않도록 주의가 필요해요.",
    strengths: ["자기 효능감", "건강한 동기부여", "목표 지향성"],
    tip: "자기보상의 질을 높여보세요! 물건 대신 경험형 보상(마사지, 클래스 수강, 맛집)으로 대체하면 더 오래 남는 행복을 얻을 수 있어요. 경험은 반드시 시간이 지나도 기억으로 남거든요.",
    shareText: "나의 소비 유형은 🏆 자기보상형! 열심히 살았으니 나에게 선물하는 스타일"
  },
  COMFORT: {
    title: "위로 힐링형",
    emoji: "🧸",
    color: "#3498db",
    keyword: "감정 위로 · 안정 추구 · 취향 소비",
    description: "당신은 소비를 통해 마음의 위로와 안정을 찾는 힐링형이에요! 비싸고 화려한 것보다 '나를 기분 좋게 해주는 것'에 집중하죠. 향초, 취향 있는 소품, 좋아하는 음식 — 이런 작은 것들이 당신의 일상을 풍요롭게 만들어요. 2026 트렌드에서 '감정 경제(Feelconomy)'가 뜨는 이유는 바로 당신 같은 사람들 덕분이에요. 나를 아끼는 소비, 정말 멋져요!",
    strengths: ["자기 이해력", "취향 발굴 능력", "감성 소비 안목"],
    tip: "힐링 소비를 더 알차게 하려면 '취향 큐레이션'을 만들어보세요. 나를 기분 좋게 해주는 물건·경험 리스트를 메모해두면 충동적으로 필요없는 것을 사는 대신 진짜 나를 위한 소비에 집중할 수 있어요.",
    shareText: "나의 소비 유형은 🧸 위로 힐링형! 취향 가득한 소비로 일상을 풍요롭게"
  },
  EXPERIENCE: {
    title: "경험 수집형",
    emoji: "✈️",
    color: "#2ecc71",
    keyword: "추억 투자 · 경험 우선 · 풍요로운 삶",
    description: "당신은 물건보다 경험에 투자하는 경험 수집가예요! 콘서트, 팝업스토어, 여행, 맛집 — 이 모든 것이 당신의 '경험 포트폴리오'를 쌓죠. 2026 픽셀라이프 트렌드 — 짧고 강렬한 순간에 몰입하는 소비 방식이 딱 당신이에요. 경험은 시간이 지나도 기억으로 남고, 심리 연구에서도 경험 소비가 물질 소비보다 장기적 행복에 더 효과적이라고 해요!",
    strengths: ["삶의 풍요로움", "추억 자산 형성", "새로운 도전"],
    tip: "경험 수집의 꿀팁은 '미리 예약'이에요! 2026 인기 팝업스토어·콘서트는 몇 시간 만에 마감되는 경우가 많아요. 알림 설정과 얼리버드 예약으로 원하는 경험을 놓치지 마세요.",
    shareText: "나의 소비 유형은 ✈️ 경험 수집형! 물건보다 추억에 투자하는 2026 픽셀라이프 실천자"
  }
};

export default function FeelconomyTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ MOOD: 0, REWARD: 0, COMFORT: 0, EXPERIENCE: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '필코노미 소비 유형 테스트 - 감정이 지갑을 여는 나의 소비 스타일 | CCGG';
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
    setScores({ MOOD: 0, REWARD: 0, COMFORT: 0, EXPERIENCE: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🛍️ 필코노미 소비 유형 테스트</h1>
        <p className="intro-subtitle">기분이 지갑을 연다? 2026 최신 트렌드 '필코노미'로 나의 소비 심리 분석!</p>

        <div className="intro-section">
          <h2>필코노미(Feelconomy)란?</h2>
          <p>'필코노미'는 감정(Feel)과 경제(Economy)의 합성어로, 2026 트렌드코리아가 선정한 핵심 키워드예요. 기분이 좋을 때, 또는 기분이 나쁠 때 소비를 통해 감정을 조절하는 행동이 현대인의 주요 소비 패턴이 됐죠.</p>
          <p>"우울해서 빵 샀어", "오늘 고생했으니까 이거 하나만 살게", "기분 전환용으로 쇼핑했어" — 이런 말을 해본 적 있나요? 그게 바로 필코노미예요. 이 테스트로 나의 감정 소비 유형을 알고, 더 현명한 소비를 시작해보세요!</p>
        </div>

        <div className="intro-section">
          <h2>4가지 필코노미 소비 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🌊 기분파 즉흥형</strong><p>감정이 곧 소비 신호. 기쁠 때도, 슬플 때도 쇼핑으로 해소합니다.</p></div>
            <div className="intro-card"><strong>🏆 자기보상형</strong><p>노력한 나에게 선물하는 건강한 자기 투자 소비 패턴입니다.</p></div>
            <div className="intro-card"><strong>🧸 위로 힐링형</strong><p>취향 있는 소비로 마음의 안정과 위로를 찾는 감성 소비자입니다.</p></div>
            <div className="intro-card"><strong>✈️ 경험 수집형</strong><p>물건보다 경험에 투자. 추억이 진짜 자산이라고 믿습니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 실제 소비 경험에서 가장 자신에게 가까운 답을 골라주세요. 정답은 없으며, 솔직하게 답할수록 정확한 결과가 나옵니다. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🛍️ 필코노미 소비 유형 테스트</h2>
      <p className="test-subtitle">감정이 지갑을 여는 나만의 방식 · 2026 트렌드코리아 필코노미 특집</p>

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
          <h3 className="result-header">나의 필코노미 소비 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 소비 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 현명한 소비 업그레이드 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 필코노미 소비 유형 테스트`} shareUrl={window.location.href} testTitle="필코노미 소비 유형 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
