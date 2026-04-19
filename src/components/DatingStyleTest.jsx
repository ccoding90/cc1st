import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "첫 만남에서 상대방의 어떤 점이 가장 먼저 눈에 들어오나요? 👀",
    options: [
      { text: "💫 눈빛과 미소, 묘한 설렘의 분위기", type: "ROMANTIC" },
      { text: "🗣️ 대화 방식과 유머 감각", type: "PASSIONATE" }
    ]
  },
  {
    id: 2,
    text: "데이트 장소는 주로 어떻게 정하나요? 🗺️",
    options: [
      { text: "📋 미리 완벽하게 코스를 짜서 준비", type: "STRATEGIC" },
      { text: "🌹 상대가 좋아할 분위기 있는 곳 위주로", type: "ROMANTIC" }
    ]
  },
  {
    id: 3,
    text: "연인과 다퉜을 때 나의 첫 반응은? 💬",
    options: [
      { text: "🤐 일단 감정이 가라앉을 때까지 시간이 필요해", type: "OBSERVER" },
      { text: "🔥 바로 솔직하게 감정을 표현하고 해결!", type: "PASSIONATE" }
    ]
  },
  {
    id: 4,
    text: "연인에게 연락하는 스타일은? 📱",
    options: [
      { text: "💭 하고 싶은 말이 있어도 타이밍을 재는 편", type: "OBSERVER" },
      { text: "📊 연락 빈도와 패턴을 자연스럽게 관리", type: "STRATEGIC" }
    ]
  },
  {
    id: 5,
    text: "연인 선물은 어떻게 고르나요? 🎁",
    options: [
      { text: "💝 예전에 지나가다 했던 말을 기억해서 깜짝 선물", type: "ROMANTIC" },
      { text: "🎯 상대가 실제로 필요한 것, 실용적인 선물", type: "STRATEGIC" }
    ]
  },
  {
    id: 6,
    text: "고백은 어떤 스타일로 하나요? 💌",
    options: [
      { text: "⚡ 마음이 생기면 바로 직접적으로 고백!", type: "PASSIONATE" },
      { text: "🌸 분위기가 무르익으면 자연스럽게 전달", type: "OBSERVER" }
    ]
  },
  {
    id: 7,
    text: "장거리 연애를 하게 된다면? ✈️",
    options: [
      { text: "📅 정기적인 만남 일정을 계획적으로 관리", type: "STRATEGIC" },
      { text: "💕 거리가 멀어도 감정의 연결이 중요해", type: "ROMANTIC" }
    ]
  },
  {
    id: 8,
    text: "SNS에 연인 관련 게시물을 어떻게 올리나요? 📸",
    options: [
      { text: "🤫 우리만 아는 은밀한 감정이 더 특별해", type: "OBSERVER" },
      { text: "🎉 좋으면 당연히 자랑해야지! 적극 공개", type: "PASSIONATE" }
    ]
  },
  {
    id: 9,
    text: "만남의 속도는 어떻게 조절하나요? ⏱️",
    options: [
      { text: "🔬 상대방을 충분히 파악한 후 관계를 발전", type: "STRATEGIC" },
      { text: "💨 마음이 통하면 빠르게 가까워지는 게 좋아", type: "PASSIONATE" }
    ]
  },
  {
    id: 10,
    text: "이상적인 연애 관계란? 💑",
    options: [
      { text: "🌟 운명 같은 감정과 깊은 교감이 있는 관계", type: "ROMANTIC" },
      { text: "🤝 서로를 이해하며 조용히 성장하는 관계", type: "OBSERVER" }
    ]
  }
];

const RESULTS = {
  ROMANTIC: {
    title: "순수 로맨티스트형",
    emoji: "🌹",
    color: "#eb3b5a",
    keyword: "감성 충만 · 설렘 추구 · 운명적 사랑",
    description: "당신은 Heart Signal 속 주인공 같은 순수 로맨티스트예요! 상대방의 사소한 말 한마디를 기억하고 특별한 순간을 만들어내는 것을 즐기죠. 감성적이고 섬세한 당신은 연애에서 '설렘'을 가장 중요하게 여겨요. 2026년 하트시그널 5가 딱 당신을 위한 프로그램인 것처럼, 진심 어린 감정 표현이 최강 무기입니다!",
    strengths: ["섬세한 감수성", "상대 배려 능력", "분위기 메이커"],
    tip: "감성이 넘치는 당신이지만, 때로는 상대방에게 직접 마음을 말로 표현해보세요. 눈치 보지 않고 솔직하게 전하는 고백이 더 강력한 임팩트를 줄 수 있어요!",
    shareText: "나의 연애 스타일은 🌹 순수 로맨티스트형! 설렘을 사랑하는 감성파"
  },
  STRATEGIC: {
    title: "두뇌파 전략가형",
    emoji: "♟️",
    color: "#0095f6",
    keyword: "계획적 · 이성적 판단 · 완벽한 준비",
    description: "당신은 연애도 전략적으로 접근하는 두뇌파예요! 데이트 코스부터 선물까지 완벽하게 준비하고, 관계의 흐름을 자연스럽게 관리하는 능력이 탁월하죠. 감정에 휩쓸리기보다는 이성적으로 상황을 파악하는 스타일이에요. 상대에게 신뢰감을 주는 든든한 파트너가 될 수 있습니다!",
    strengths: ["완벽한 준비성", "안정감 제공 능력", "장기적 관계 유지력"],
    tip: "계획도 좋지만, 가끔은 즉흥적인 모습을 보여주는 것도 매력이에요! 완벽한 준비보다 진심에서 우러나오는 작은 행동 하나가 상대의 마음을 더 크게 움직일 수 있어요.",
    shareText: "나의 연애 스타일은 ♟️ 두뇌파 전략가형! 완벽하게 준비하는 이성적 연애"
  },
  PASSIONATE: {
    title: "열정 직진형",
    emoji: "🔥",
    color: "#fd9644",
    keyword: "직진 본능 · 솔직 담백 · 뜨거운 열정",
    description: "당신은 마음이 가면 바로 직진하는 열정 직진형이에요! 감정을 솔직하게 표현하고 관계에 적극적으로 다가가는 스타일이죠. 돌직구 같은 고백도 두렵지 않고, 좋아하면 당당하게 표현하는 것이 당신의 매력이에요. 2026년 연애 리얼리티 속 '직진남·직진녀' 캐릭터가 딱 당신입니다!",
    strengths: ["솔직한 감정 표현", "적극적인 추진력", "활발한 에너지"],
    tip: "직진도 좋지만 상대방의 페이스도 존중해보세요! 너무 빠른 전진보다 상대가 편안하게 따라올 수 있도록 속도를 맞추면 더 좋은 관계가 만들어질 거예요.",
    shareText: "나의 연애 스타일은 🔥 열정 직진형! 마음이 가면 바로 돌직구 솔직파"
  },
  OBSERVER: {
    title: "감성 관찰형",
    emoji: "🌙",
    color: "#a55eea",
    keyword: "깊은 이해 · 조용한 관심 · 감성적 교감",
    description: "당신은 상대방을 천천히 깊게 이해하는 감성 관찰형이에요! 말하지 않아도 상대의 감정을 느끼고, 조용히 곁에서 응원하는 스타일이죠. 처음에는 조용해 보여도 깊어지면 그 누구보다 세심하게 상대를 챙기는 진국 스타일이에요. 2026년 하트시그널 속 '조용한 매력남·매력녀'가 딱 당신입니다!",
    strengths: ["공감 능력", "세심한 배려", "깊은 감성적 교감"],
    tip: "당신의 감성과 세심함은 정말 특별한 매력이에요! 가끔은 먼저 다가가 작은 관심을 표현해보세요. 당신의 진심이 전달될 때 상대방은 크게 감동받을 거예요.",
    shareText: "나의 연애 스타일은 🌙 감성 관찰형! 조용하지만 깊은 교감을 나누는 진국"
  }
};

export default function DatingStyleTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ ROMANTIC: 0, STRATEGIC: 0, PASSIONATE: 0, OBSERVER: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '연애 리얼리티 유형 테스트 - 나의 연애 스타일은? | CCGG';
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(`${result.shareText}\n테스트 링크: ${shareUrl}`);
      alert('✅ 링크가 복사됐어요! 친구들에게 공유해보세요 😊');
    } catch {
      alert('복사에 실패했습니다');
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setScores({ ROMANTIC: 0, STRATEGIC: 0, PASSIONATE: 0, OBSERVER: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">💘 연애 리얼리티 유형 테스트</h2>
      <p className="test-subtitle">나의 연애 스타일은? · 하트시그널 5 기념 특집</p>

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
          <h3 className="result-header">나의 연애 스타일은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 연애 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 연애 업그레이드 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>결과 공유하기 🔗</button>
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
