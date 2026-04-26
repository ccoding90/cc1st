import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "친구들 사이에서 나는 주로?",
    options: [
      { text: "분위기를 주도하고 결정을 내리는 편 🦁", type: "RED" },
      { text: "모두의 의견을 듣고 조율하는 편 🌿", type: "GREEN" }
    ]
  },
  {
    id: 2,
    text: "새로운 정보를 접할 때 나는?",
    options: [
      { text: "논리적으로 분석하고 검증한다 📊", type: "BLUE" },
      { text: "직관적으로 느끼고 받아들인다 ✨", type: "PURPLE" }
    ]
  },
  {
    id: 3,
    text: "주말 오후, 가장 끌리는 활동은?",
    options: [
      { text: "친구들과 신나게 어울리기 🎉", type: "ORANGE" },
      { text: "혼자 좋아하는 음악 들으며 쉬기 🎵", type: "BLUE" }
    ]
  },
  {
    id: 4,
    text: "목표가 생겼을 때 나는?",
    options: [
      { text: "바로 실행! 일단 부딪혀본다 🔥", type: "RED" },
      { text: "밝고 즐거운 방식으로 꾸준히 나아간다 ☀️", type: "YELLOW" }
    ]
  },
  {
    id: 5,
    text: "갈등 상황에서 나는?",
    options: [
      { text: "평화로운 해결책을 찾아 중재한다 🕊️", type: "GREEN" },
      { text: "감성적으로 공감하며 함께 느낀다 💜", type: "PURPLE" }
    ]
  },
  {
    id: 6,
    text: "나를 표현하는 가장 좋은 방법은?",
    options: [
      { text: "유쾌하고 재미있게 웃음을 나누는 것 😄", type: "ORANGE" },
      { text: "진심 어린 말과 행동으로 신뢰를 쌓는 것 💙", type: "BLUE" }
    ]
  },
  {
    id: 7,
    text: "나의 에너지 원천은?",
    options: [
      { text: "목표를 달성하는 성취감 🏆", type: "RED" },
      { text: "소소한 일상의 기쁨과 유머 🌻", type: "YELLOW" }
    ]
  },
  {
    id: 8,
    text: "내가 추구하는 삶의 방식은?",
    options: [
      { text: "창의적인 상상으로 나만의 세계를 만드는 것 🎨", type: "PURPLE" },
      { text: "자연과 함께 균형 잡힌 삶을 사는 것 🌱", type: "GREEN" }
    ]
  },
  {
    id: 9,
    text: "처음 만난 사람에게 나는?",
    options: [
      { text: "먼저 다가가 밝게 인사한다 🌟", type: "ORANGE" },
      { text: "상황을 먼저 파악하고 천천히 다가간다 🔵", type: "BLUE" }
    ]
  },
  {
    id: 10,
    text: "힘든 하루를 보낸 나에게 필요한 것은?",
    options: [
      { text: "강하게 마음을 다잡고 앞으로 나아가기 💪", type: "RED" },
      { text: "좋아하는 음악, 영화로 감성 충전 🎬", type: "PURPLE" }
    ]
  }
];

const RESULTS = {
  RED: {
    title: "열정의 빨간색",
    emoji: "🔴",
    color: "#eb3b5a",
    keyword: "열정 · 리더십 · 도전",
    description: "당신은 붉은 열정의 소유자! 에너지가 넘치고 목표 지향적인 당신은 어떤 상황에서도 앞으로 나아가는 힘을 가지고 있습니다. 강한 의지와 열정으로 주변 사람들을 이끄는 천생 리더입니다.",
    strengths: ["강한 추진력", "명확한 목표 의식", "타고난 리더십"],
    shareText: "🔴 나의 성격 색깔은 열정의 '빨간색'!"
  },
  BLUE: {
    title: "신뢰의 파란색",
    emoji: "🔵",
    color: "#0095f6",
    keyword: "분석 · 신뢰 · 이성",
    description: "당신은 깊은 바다처럼 차분한 분석형! 감정보다 이성을 중시하며 신중하게 생각하고 행동합니다. 신뢰할 수 있는 존재로 주변에서 의지를 많이 받는 안정적인 타입입니다.",
    strengths: ["뛰어난 분석력", "일관된 신뢰성", "침착한 문제 해결"],
    shareText: "🔵 나의 성격 색깔은 신뢰의 '파란색'!"
  },
  YELLOW: {
    title: "활기의 노란색",
    emoji: "💛",
    color: "#f7b731",
    keyword: "긍정 · 창의 · 유머",
    description: "당신은 태양처럼 밝은 낙천주의자! 어디서든 밝은 에너지를 발산하며 주변 분위기를 환하게 만듭니다. 창의적이고 자유로운 영혼의 소유자로 삶의 즐거움을 아는 타입입니다.",
    strengths: ["타고난 긍정 에너지", "유머 감각", "창의적 아이디어"],
    shareText: "💛 나의 성격 색깔은 활기의 '노란색'!"
  },
  GREEN: {
    title: "조화의 초록색",
    emoji: "💚",
    color: "#20bf6b",
    keyword: "균형 · 공감 · 치유",
    description: "당신은 자연처럼 편안한 힐러! 조화와 균형을 추구하며 주변 사람들에게 안정감을 줍니다. 공감 능력이 뛰어나고 배려심 깊은 성격으로 모두에게 사랑받는 존재입니다.",
    strengths: ["탁월한 공감 능력", "갈등 조율 능력", "따뜻한 배려심"],
    shareText: "💚 나의 성격 색깔은 조화의 '초록색'!"
  },
  PURPLE: {
    title: "감성의 보라색",
    emoji: "💜",
    color: "#a55eea",
    keyword: "감수성 · 창의 · 신비",
    description: "당신은 신비로운 보라빛 예술가! 깊은 감수성과 풍부한 상상력을 가지고 있습니다. 독특한 시각으로 세상을 바라보며 창의적인 방식으로 자신을 표현하는 특별한 타입입니다.",
    strengths: ["풍부한 감수성", "독창적인 상상력", "깊이 있는 사고"],
    shareText: "💜 나의 성격 색깔은 감성의 '보라색'!"
  },
  ORANGE: {
    title: "활발한 주황색",
    emoji: "🟠",
    color: "#fd9644",
    keyword: "사교 · 에너지 · 유쾌",
    description: "당신은 넘치는 에너지의 사교왕! 사람들과 어울리는 것을 즐기며 어디서든 즐거운 분위기를 만듭니다. 유쾌하고 친화력이 뛰어나 새로운 사람들과도 금방 친해지는 매력적인 타입입니다.",
    strengths: ["뛰어난 친화력", "활발한 에너지", "분위기 메이커"],
    shareText: "🟠 나의 성격 색깔은 활발한 '주황색'!"
  }
};

export default function ColorTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ RED: 0, BLUE: 0, YELLOW: 0, GREEN: 0, PURPLE: 0, ORANGE: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '색깔 심리 테스트 - 내 성격을 색깔로? | CCGG';
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

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🎨 색깔 심리 테스트</h1>
        <p className="intro-subtitle">내 성격을 색깔로 표현한다면? 10문항으로 알아보는 나의 성격 컬러</p>

        <div className="intro-section">
          <h2>색깔 심리학이란?</h2>
          <p>색채 심리학(Color Psychology)은 색깔이 인간의 감정, 행동, 성격에 미치는 영향을 연구하는 심리학의 한 분야입니다. 각 색깔은 고유한 심리적 연상과 감정적 반응을 유발하며, 이를 통해 개인의 성격 유형을 상징적으로 표현할 수 있습니다.</p>
          <p>이 테스트는 당신의 대인관계 방식, 에너지 레벨, 의사결정 스타일, 감정 표현 방식 등을 분석해 6가지 성격 색깔 중 하나를 도출합니다. 색깔은 단순한 취향이 아닌, 당신의 핵심 성격 강점과 특징을 시각적으로 표현한 상징입니다.</p>
        </div>

        <div className="intro-section">
          <h2>6가지 성격 색깔</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🔴 빨간색</strong><p>열정적이고 강한 리더십. 목표를 향해 강하게 나아가는 행동파 유형입니다.</p></div>
            <div className="intro-card"><strong>💙 파란색</strong><p>냉철하고 논리적인 분석가. 신뢰와 일관성을 중요하게 여기는 이성적 유형입니다.</p></div>
            <div className="intro-card"><strong>💛 노란색</strong><p>밝고 긍정적인 낙천주의자. 유머와 창의성으로 주변에 활기를 불어넣는 유형입니다.</p></div>
            <div className="intro-card"><strong>💚 초록색</strong><p>균형과 조화를 추구하는 평화주의자. 배려심이 깊고 안정적인 관계를 중시합니다.</p></div>
            <div className="intro-card"><strong>💜 보라색</strong><p>감수성이 풍부한 예술가 기질. 독창적이고 깊은 내면 세계를 가진 유형입니다.</p></div>
            <div className="intro-card"><strong>🟠 주황색</strong><p>에너지 넘치는 사교왕. 친화력이 뛰어나고 어디서든 분위기를 만드는 유형입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>각 문항에서 지금의 나에게 더 가까운 답을 선택해주세요. 총 10문항이며 소요 시간은 약 2분입니다. 결과는 여러 선택지의 합산으로 도출되므로, 솔직하게 답하는 것이 가장 정확합니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🎨 색깔 심리 테스트</h2>
      <p className="test-subtitle">내 성격을 색깔로 표현한다면?</p>

      {!showResult ? (
        <div className="test-card">
          <div className="progress-bar"><div style={{ width: `${progressPercent}%` }} /></div>
          <p className="progress-text">진행도: {currentQuestion + 1} / {QUESTIONS.length}</p>
          <h3 className="question-text">{QUESTIONS[currentQuestion].text}</h3>
          <div className="button-group">
            {QUESTIONS[currentQuestion].options.map((option, index) => (
              <button key={index} className="option-btn" onClick={() => handleAnswer(option.type)}>
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="color-result-circle" style={{ background: result.color }}>
            <span style={{ fontSize: '3rem' }}>{result.emoji}</span>
          </div>
          <h3 className="result-header">당신의 성격 색깔은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>{result.title}</h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 나의 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag" style={{ borderColor: result.color, color: result.color }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 색깔 테스트`} shareUrl={window.location.href} testTitle="색깔 성격 테스트 결과" />
            <button className="retry-btn" onClick={() => { setCurrentQuestion(0); setScores({ RED: 0, BLUE: 0, YELLOW: 0, GREEN: 0, PURPLE: 0, ORANGE: 0 }); setShowResult(false); setResult(null); }}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
