import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "화가 많이 났을 때, 나의 첫 반응은? 😠",
    options: [
      { text: "🗣️ 바로 말하거나 표현해야 직성이 풀림", type: "EXPRESS" },
      { text: "📓 왜 화가 났는지 생각하며 혼자 정리함", type: "ANALYSIS" }
    ]
  },
  {
    id: 2,
    text: "슬픔이나 우울함을 느낄 때 주로 하는 행동은? 😢",
    options: [
      { text: "🎵 음악 들으며 감정을 흠뻑 느끼고 흘려보냄", type: "FLOW" },
      { text: "🏃 운동하거나 바깥에 나가서 리셋함", type: "RESET" }
    ]
  },
  {
    id: 3,
    text: "친구가 고민 상담을 해왔다. 나는? 💬",
    options: [
      { text: "🤝 공감을 먼저 충분히 해주고 함께 울어줌", type: "EXPRESS" },
      { text: "🔍 원인을 분석해서 실질적 해결책을 제시함", type: "ANALYSIS" }
    ]
  },
  {
    id: 4,
    text: "기쁜 일이 생겼을 때 나는? 🎉",
    options: [
      { text: "📢 바로 친구·가족에게 공유하고 함께 기뻐함", type: "EXPRESS" },
      { text: "🌸 혼자 조용히 그 감정을 음미하는 걸 좋아함", type: "FLOW" }
    ]
  },
  {
    id: 5,
    text: "감정이 복잡하게 뒤엉켰을 때 나만의 해소법은? 🌀",
    options: [
      { text: "✍️ 일기나 메모로 감정을 글로 써내려감", type: "ANALYSIS" },
      { text: "🎮 게임·드라마·유튜브로 집중을 다른 곳에 돌림", type: "RESET" }
    ]
  },
  {
    id: 6,
    text: "누군가 나에게 상처 주는 말을 했다. 나의 반응은? 😔",
    options: [
      { text: "🌊 당장은 흘리지만 가끔 다시 떠오름 (곱씹음형)", type: "FLOW" },
      { text: "💨 빠르게 다른 걸 해서 머릿속에서 지워버림", type: "RESET" }
    ]
  },
  {
    id: 7,
    text: "감정 표현이 잘 안 되는 상황(직장, 공식 자리)에서 쌓인 감정을 어떻게 처리하나요? 🏢",
    options: [
      { text: "🎤 퇴근 후 친구한테 전화해서 폭풍 토로", type: "EXPRESS" },
      { text: "📊 '왜 이 상황이 나를 이렇게 만드는가' 분석함", type: "ANALYSIS" }
    ]
  },
  {
    id: 8,
    text: "오늘 하루가 끝난 뒤 감정 정리 방식은? 🌙",
    options: [
      { text: "🛁 따뜻한 목욕이나 음악으로 자연스럽게 흘려보냄", type: "FLOW" },
      { text: "🧹 씻고 자면 리셋! 내일은 새 날이니까", type: "RESET" }
    ]
  },
  {
    id: 9,
    text: "AI 시대, 감정 관리가 중요한 역량이 됐다. 나의 감정 관리 스타일은? 🤖",
    options: [
      { text: "💪 감정을 숨기지 않고 솔직하게 표현하는 게 건강함", type: "EXPRESS" },
      { text: "🔬 감정을 객관적으로 분석하고 패턴을 파악하는 게 중요함", type: "ANALYSIS" }
    ]
  },
  {
    id: 10,
    text: "이상적인 감정 상태란? 💆",
    options: [
      { text: "🌈 감정의 파도를 자유롭게 타며 충분히 느끼는 것", type: "FLOW" },
      { text: "⚡ 빠르게 전환하고 다시 에너지를 충전하는 것", type: "RESET" }
    ]
  }
];

const RESULTS = {
  EXPRESS: {
    title: "감정 표현 발산형",
    emoji: "🗣️",
    color: "#e74c3c",
    keyword: "솔직한 표현 · 공감 능력 · 감정 개방형",
    description: "당신은 감정을 솔직하게 표현하고 발산하는 것이 자연스러운 '감정 표현 발산형'이에요! 감정을 억누르지 않고 말이나 행동으로 표현할 때 가장 건강한 상태가 되죠. 2026 메타센싱(Meta-Sensing) 트렌드에서 가장 주목받는 유형이기도 해요 — 감정을 민감하게 포착하고 표현하는 능력이 AI 시대에 희소한 역량이 됐거든요! 다만 너무 강한 즉각 표현이 상대방에게 부담이 될 수 있으니 유의하세요.",
    strengths: ["높은 공감 능력", "진정성 있는 표현", "감정 누적 없음"],
    tip: "표현하기 전에 3초 pause를 연습해보세요. 감정을 바로 뱉기보다 '나는 지금 무엇을 느끼고 있나'를 한 박자 생각한 후 표현하면, 같은 감정도 훨씬 효과적으로 전달됩니다. 표현 타이밍이 감정의 무게를 결정해요.",
    shareText: "나의 감정 루틴 유형은 🗣️ 감정 표현 발산형! 솔직한 표현이 최강 힐링"
  },
  ANALYSIS: {
    title: "분석 관리형",
    emoji: "🔍",
    color: "#3498db",
    keyword: "이성적 처리 · 패턴 파악 · 감정 지성",
    description: "당신은 감정을 이성적으로 분석하고 관리하는 '분석 관리형'이에요! '왜 나는 이런 감정이 드는 걸까?'를 끊임없이 탐구하죠. 2026 메타센싱 트렌드에서 Z세대가 가장 주목하는 유형이에요 — 감정을 객관화하고 패턴을 파악하는 능력이 진정한 '감정 지성(EQ)'의 핵심이거든요. 심리학 연구에서도 감정을 분석하는 능력이 정신 건강과 높은 상관관계를 보인다고 해요!",
    strengths: ["높은 자기 인식", "패턴 파악 능력", "감정적 성숙함"],
    tip: "분석이 너무 깊어지면 '감정 과분석'으로 피로해질 수 있어요. 분석은 하되 '결론 없이도 괜찮다'는 여유를 가져보세요. 모든 감정에 이유가 있을 필요는 없고, 그냥 느끼고 흘려보내는 것도 충분히 건강한 방식이에요.",
    shareText: "나의 감정 루틴 유형은 🔍 분석 관리형! 감정을 객관화하는 메타센싱 실천자"
  },
  RESET: {
    title: "리셋 전환형",
    emoji: "⚡",
    color: "#2ecc71",
    keyword: "빠른 전환 · 회복 탄력성 · 현실 집중",
    description: "당신은 감정을 빠르게 전환하고 다시 앞으로 나아가는 '리셋 전환형'이에요! 쓸데없이 감정에 오래 머물기보다 실질적인 행동으로 기분을 바꾸는 편이죠. 회복 탄력성(Resilience)이 뛰어난 타입으로, 어떤 상황에서도 금방 일어서는 능력이 강점이에요. 2026 AI 시대에 변화 속도가 빨라질수록 이 능력은 더욱 빛을 발할 거예요!",
    strengths: ["높은 회복 탄력성", "빠른 행동력", "현실 지향적"],
    tip: "리셋이 습관이 되다 보면 감정을 '처리'보다 '회피'하는 패턴이 생길 수 있어요. 가끔은 불편한 감정을 충분히 느끼는 시간을 의도적으로 가져보세요. 감정을 외면하지 않고 마주하는 것, 그게 진짜 리셋의 시작이에요.",
    shareText: "나의 감정 루틴 유형은 ⚡ 리셋 전환형! 빠르게 털고 앞으로 나아가는 회복력 강자"
  },
  FLOW: {
    title: "자연 흐름형",
    emoji: "🌊",
    color: "#9b59b6",
    keyword: "감정 수용 · 자연스러운 흐름 · 깊은 감수성",
    description: "당신은 감정을 억압하거나 분석하기보다 자연스럽게 느끼고 흘려보내는 '자연 흐름형'이에요! 감정의 파도를 타듯 충분히 느끼고, 그 감정이 스스로 지나가도록 내버려 두죠. 깊은 감수성을 가진 이 유형은 예술·음악·문학에서 더 풍부한 감동을 느끼는 경우가 많아요. 2026 메타센싱 트렌드에서 말하는 '감정을 있는 그대로 포착하는 능력'의 대표 유형이에요!",
    strengths: ["깊은 감수성", "감정 수용력", "자기 공감 능력"],
    tip: "흐름형의 함정은 감정이 지나가길 기다리다 너무 오래 머무는 것이에요. '5분 감정 타임'을 만들어보세요. 알람을 맞추고 그 5분 동안 마음껏 느끼되, 알람이 울리면 일부러 다른 활동으로 전환하는 거예요. 감정에 경계를 만드는 연습이 도움이 돼요.",
    shareText: "나의 감정 루틴 유형은 🌊 자연 흐름형! 감정의 파도를 타는 깊은 감수성 소유자"
  }
};

export default function EmotionTypeTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ EXPRESS: 0, ANALYSIS: 0, RESET: 0, FLOW: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '감정 루틴 유형 테스트 - 나의 감정 처리 방식은? | CCGG';
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
    setScores({ EXPRESS: 0, ANALYSIS: 0, RESET: 0, FLOW: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">💆 감정 루틴 유형 테스트</h1>
        <p className="intro-subtitle">나는 감정을 어떻게 처리할까? 2026 메타센싱 트렌드로 나의 감정 관리 유형 진단</p>

        <div className="intro-section">
          <h2>메타센싱(Meta-Sensing)이란?</h2>
          <p>'메타센싱'은 2026 트렌드코리아 핵심 키워드로, Z세대가 자신의 감정을 민감하게 포착하고 적극적으로 관리하는 태도를 말해요. AI가 효율을 담당하는 시대에, 인간만이 할 수 있는 '감정의 섬세한 처리'가 새로운 역량이 된 거예요.</p>
          <p>심리학 연구에 따르면 감정 처리 방식은 크게 4가지 패턴으로 나뉩니다. 나의 패턴을 알면 스트레스 관리, 인간관계, 심리 건강 모두에 도움이 됩니다. 내가 어떻게 감정을 다루는지 알아보세요!</p>
        </div>

        <div className="intro-section">
          <h2>4가지 감정 루틴 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🗣️ 감정 표현 발산형</strong><p>감정을 솔직하게 말하고 표현하는 것이 최고의 해소법입니다.</p></div>
            <div className="intro-card"><strong>🔍 분석 관리형</strong><p>감정의 원인을 파악하고 이성적으로 처리하는 스타일입니다.</p></div>
            <div className="intro-card"><strong>⚡ 리셋 전환형</strong><p>다른 행동으로 빠르게 전환해 감정을 털어내는 회복력 강자입니다.</p></div>
            <div className="intro-card"><strong>🌊 자연 흐름형</strong><p>감정의 파도를 타며 자연스럽게 느끼고 흘려보내는 감수성 깊은 타입입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 실제 감정 상황에서 나의 반응에 가장 가까운 답을 골라주세요. 솔직하게 답할수록 정확한 결과가 나옵니다. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">💆 감정 루틴 유형 테스트</h2>
      <p className="test-subtitle">나의 감정 관리 방식 · 2026 메타센싱 트렌드 특집</p>

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
          <h3 className="result-header">나의 감정 루틴 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 감정 관리 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 감정 루틴 업그레이드 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 감정 루틴 유형 테스트`} shareUrl={window.location.href} testTitle="감정 루틴 유형 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
