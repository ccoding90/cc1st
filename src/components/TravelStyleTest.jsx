import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "황금연휴 여행 계획, 언제쯤 세우나요? 📅",
    options: [
      { text: "📋 몇 달 전부터 숙소·항공·코스 완벽 예약!", type: "CULTURE" },
      { text: "🎲 연휴 직전이나 당일 즉흥적으로 결정", type: "ADVENTURE" }
    ]
  },
  {
    id: 2,
    text: "여행지를 고를 때 가장 중요한 기준은? 🗺️",
    options: [
      { text: "🍽️ 거기서만 먹을 수 있는 맛집·로컬 음식", type: "FOOD" },
      { text: "🛋️ 숙소 퀄리티, 얼마나 편하게 쉴 수 있나", type: "RELAX" }
    ]
  },
  {
    id: 3,
    text: "여행 첫날 아침 일정은? ☀️",
    options: [
      { text: "🧗 일찍 일어나서 활동적인 액티비티 출발!", type: "ADVENTURE" },
      { text: "🛌 늦게 일어나서 느긋하게 브런치부터", type: "RELAX" }
    ]
  },
  {
    id: 4,
    text: "여행 중 SNS 사용은? 📱",
    options: [
      { text: "📸 찍고 바로 업로드, 리얼타임 여행 기록", type: "FOOD" },
      { text: "🔕 폰은 잠시 내려놓고 현재에 집중", type: "RELAX" }
    ]
  },
  {
    id: 5,
    text: "여행 중 예상치 못한 상황이 생겼다면? 🚨",
    options: [
      { text: "😄 오히려 새로운 모험! 즉흥적으로 즐김", type: "ADVENTURE" },
      { text: "🏛️ 근처 박물관·갤러리로 경로 변경", type: "CULTURE" }
    ]
  },
  {
    id: 6,
    text: "여행에서 가장 기억에 남는 순간은? ✨",
    options: [
      { text: "🍜 그 지역 특색 있는 음식을 처음 맛봤을 때", type: "FOOD" },
      { text: "🏔️ 자연 속에서 짜릿한 체험을 했을 때", type: "ADVENTURE" }
    ]
  },
  {
    id: 7,
    text: "숙소 선택 기준은? 🏨",
    options: [
      { text: "🛁 넓은 욕조, 스파, 아늑한 호텔 리조트", type: "RELAX" },
      { text: "🏙️ 핫플레이스·관광지 접근성 최우선", type: "CULTURE" }
    ]
  },
  {
    id: 8,
    text: "여행 예산 사용 방식은? 💰",
    options: [
      { text: "🍴 좋은 레스토랑·로컬 음식에 집중 투자", type: "FOOD" },
      { text: "🎫 특별한 경험·전시·공연 입장에 투자", type: "CULTURE" }
    ]
  },
  {
    id: 9,
    text: "여행 마지막 날 기분은? 🌅",
    options: [
      { text: "😌 몸과 마음이 완전히 충전된 느낌", type: "RELAX" },
      { text: "🔥 더 있고 싶다! 다음 여행 이미 계획 중", type: "ADVENTURE" }
    ]
  },
  {
    id: 10,
    text: "이상적인 동행자는? 👫",
    options: [
      { text: "🤸 어디든 같이 뛰어드는 에너지 넘치는 친구", type: "ADVENTURE" },
      { text: "🍷 함께 맛있는 거 먹으며 수다 떠는 친구", type: "FOOD" }
    ]
  }
];

const RESULTS = {
  ADVENTURE: {
    title: "액티브 탐험형",
    emoji: "🧗",
    color: "#e67e22",
    keyword: "즉흥적 · 도전적 · 에너지 넘침",
    description: "당신은 여행에서 짜릿함과 새로운 도전을 찾는 액티브 탐험가예요! 계획보다는 현장에서 즉흥적으로 움직이며 예상치 못한 모험을 즐기죠. 2026 황금연휴엔 제주 올레길 트레킹, 강원도 래프팅, 해외라면 베트남 하롱베이 카약킹 같은 활동형 여행이 딱 맞아요! 에너지를 쏟아붓고 돌아오면 오히려 더 충전된 느낌이 드는 타입이에요.",
    strengths: ["즉흥 적응력", "높은 활동성", "현장 몰입감"],
    tip: "짜릿함도 좋지만 황금연휴엔 조기 예약 필수! 인기 액티비티는 몇 주 전에 마감되는 경우가 많아요. 최소한 숙소와 주요 액티비티만 미리 잡아두면 즉흥의 자유도 함께 즐길 수 있답니다.",
    spots: ["제주 한라산 등반", "강원 번지점프·래프팅", "경주 야간 자전거 투어"],
    shareText: "나의 황금연휴 여행 스타일은 🧗 액티브 탐험형! 즉흥과 도전을 즐기는 여행가"
  },
  RELAX: {
    title: "완전 힐링형",
    emoji: "🛋️",
    color: "#2ecc71",
    keyword: "여유 · 재충전 · 몸과 마음 리셋",
    description: "당신에게 여행은 일상의 피로를 완전히 녹여내는 힐링의 시간이에요! 화려한 관광지보다 넓은 욕조, 룸서비스, 테라스에서의 여유로운 아침이 더 소중하죠. 2026 황금연휴엔 전남 순천만 자연휴양림, 양평 스파 리조트, 또는 일본 온천 료칸 여행이 완벽한 선택이에요. 여행 후 '아, 정말 쉬었다!'라는 느낌을 받는 것이 목표인 타입이에요.",
    strengths: ["자기 돌봄 능력", "현재 몰입력", "회복 탄력성"],
    tip: "힐링 여행의 핵심은 '아무것도 안 해도 되는 허락'을 자신에게 주는 것이에요. 일정표 없이 그냥 느끼는 대로 움직여보세요. SNS도 잠깐 내려놓으면 진짜 휴식이 시작됩니다.",
    spots: ["충북 수안보 온천 리조트", "전남 담양 리조트 스테이", "일본 하코네 온천 료칸"],
    shareText: "나의 황금연휴 여행 스타일은 🛋️ 완전 힐링형! 몸과 마음을 완전히 충전하는 여행가"
  },
  CULTURE: {
    title: "문화 탐방형",
    emoji: "🏛️",
    color: "#9b59b6",
    keyword: "지식 탐구 · 감성 충만 · 깊이 있는 여행",
    description: "당신은 여행지의 역사, 예술, 문화를 깊이 탐구하는 문화 탐방가예요! 유명 관광지보다 현지 갤러리, 전통 마을, 특색 있는 공연이 더 끌리죠. 2026 황금연휴엔 경주 불국사·첨성대 나이트 투어, 서울 국립박물관 특별전, 또는 일본 교토의 역사 거리 탐방이 딱 맞아요. 여행 후 사진보다 새로 배운 지식과 감동이 더 오래 남는 타입이에요.",
    strengths: ["깊이 있는 탐구", "감수성", "풍부한 배경 지식"],
    tip: "문화 탐방 여행의 꿀팁은 '큐레이터 투어' 예약이에요! 혼자 보는 것보다 전문 해설과 함께하면 같은 장소가 전혀 다른 경험이 됩니다. 5월엔 특별 전시가 많으니 미리 체크해보세요.",
    spots: ["경주 야간 역사 투어", "전주 한옥마을 전통 체험", "서울 DDP 특별 전시"],
    shareText: "나의 황금연휴 여행 스타일은 🏛️ 문화 탐방형! 역사와 예술을 찾아 떠나는 여행가"
  },
  FOOD: {
    title: "미식 탐험형",
    emoji: "🍜",
    color: "#e74c3c",
    keyword: "로컬 맛집 · 미식 모험 · 먹을 것이 곧 여행",
    description: "당신에게 여행의 핵심은 그 지역에서만 먹을 수 있는 음식이에요! 맛집 리스트 없이는 여행 계획 자체가 시작되지 않죠. 2026 황금연휴엔 전주 한정식·비빔밥 투어, 부산 해운대 해산물 코스, 오사카 도톤보리 야식 투어가 최고의 선택이에요. 여행 사진의 절반 이상이 음식 사진인 타입이에요!",
    strengths: ["미식 안목", "지역 문화 이해", "열린 도전 정신"],
    tip: "미식 여행의 진짜 꿀팁은 '로컬이 가는 곳'을 찾는 것이에요! 관광객용 맛집보다 현지 주민들이 줄서는 골목 식당이 진짜입니다. 5월 황금연휴엔 예약 필수 음식점도 많으니 미리 예약해두세요.",
    spots: ["전주 남부시장 야시장", "부산 자갈치시장 회 코스", "강릉 커피거리 카페 투어"],
    shareText: "나의 황금연휴 여행 스타일은 🍜 미식 탐험형! 먹방이 곧 여행인 미식가 여행자"
  }
};

export default function TravelStyleTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ ADVENTURE: 0, RELAX: 0, CULTURE: 0, FOOD: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '황금연휴 여행 유형 테스트 - 나의 여행 스타일은? | CCGG';
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
    setScores({ ADVENTURE: 0, RELAX: 0, CULTURE: 0, FOOD: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🌏 황금연휴 여행 유형 테스트</h1>
        <p className="intro-subtitle">5월 황금연휴, 나에게 딱 맞는 여행 스타일은? 10문항으로 알아보세요</p>

        <div className="intro-section">
          <h2>왜 여행 유형을 알아야 할까요?</h2>
          <p>2026년 5월, 어린이날(5/5)과 연휴가 이어지는 황금연휴를 앞두고 많은 분들이 여행을 계획 중입니다. 하지만 함께 여행하는 사람들의 스타일이 다르면 오히려 스트레스가 될 수 있어요.</p>
          <p>나의 여행 유형을 알면 나에게 맞는 목적지 선택, 동행자와의 갈등 예방, 그리고 진짜 내가 원하는 휴식을 찾을 수 있습니다. 2026 트렌드인 '픽셀라이프(Pixelated Life)' — 짧지만 강렬한 순간에 몰입하는 여행이 화두인 지금, 내 스타일을 알고 떠나세요!</p>
        </div>

        <div className="intro-section">
          <h2>4가지 여행 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🧗 액티브 탐험형</strong><p>즉흥적이고 에너지 넘치는 여행. 계획보다 현장의 짜릿함을 즐깁니다.</p></div>
            <div className="intro-card"><strong>🛋️ 완전 힐링형</strong><p>몸과 마음을 완전히 리셋하는 여행. 아무것도 안 해도 행복합니다.</p></div>
            <div className="intro-card"><strong>🏛️ 문화 탐방형</strong><p>역사·예술·전통을 깊이 탐구하는 여행. 지식과 감동이 남습니다.</p></div>
            <div className="intro-card"><strong>🍜 미식 탐험형</strong><p>맛집·로컬 음식이 여행의 핵심. 먹방이 곧 문화 체험입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 실제 여행 또는 이상적인 여행 상황에서 자신에게 가장 가까운 답을 선택해주세요. 솔직하게 답할수록 정확한 결과가 나옵니다. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🌏 황금연휴 여행 유형 테스트</h2>
      <p className="test-subtitle">5월 황금연휴 여행 스타일 진단 · 2026 픽셀라이프 특집</p>

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
          <h3 className="result-header">나의 황금연휴 여행 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 여행 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-strengths" style={{ marginTop: '12px' }}>
            <strong>📍 추천 여행지</strong>
            <div className="strength-tags">
              {result.spots.map((s, i) => (
                <span key={i} className="strength-tag" style={{ background: '#f0f8ff', color: '#2c7be5' }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 여행 꿀팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 황금연휴 여행 테스트`} shareUrl={window.location.href} testTitle="황금연휴 여행 유형 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
