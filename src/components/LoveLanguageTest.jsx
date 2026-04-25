import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "상대방이 나를 행복하게 하는 방법은?",
    options: [
      { text: "\"정말 대단해, 네가 최고야\" 진심 담긴 칭찬 💬", type: "WA" },
      { text: "아무 말 없이 꼭 안아주는 것 🤗", type: "PT" }
    ]
  },
  {
    id: 2,
    text: "사랑받는다고 느끼는 순간은?",
    options: [
      { text: "깜짝 선물을 받았을 때 🎁", type: "RG" },
      { text: "핸드폰 내려놓고 나에게만 집중해줄 때 👁️", type: "QT" }
    ]
  },
  {
    id: 3,
    text: "힘들 때 가장 원하는 것은?",
    options: [
      { text: "\"고생했어, 진짜 잘 버텼어\" 따뜻한 말 한마디 💕", type: "WA" },
      { text: "내 일을 묵묵히 도와주는 것 🛠️", type: "AS" }
    ]
  },
  {
    id: 4,
    text: "애정 표현이 느껴지는 행동은?",
    options: [
      { text: "가볍게 어깨를 토닥이거나 손을 잡아주는 것 🖐️", type: "PT" },
      { text: "생각지 못한 작은 선물로 놀라게 하는 것 🎀", type: "RG" }
    ]
  },
  {
    id: 5,
    text: "관계에서 가장 소중하게 여기는 것은?",
    options: [
      { text: "나를 위해 시간을 내어주는 것 ⏰", type: "QT" },
      { text: "나를 위해 불편함을 감수하며 행동해주는 것 💪", type: "AS" }
    ]
  },
  {
    id: 6,
    text: "가장 감동받는 순간은?",
    options: [
      { text: "\"네가 있어서 내 삶이 달라졌어\" 진심 어린 고백 🌟", type: "WA" },
      { text: "오랜 시간 눈 마주치며 깊은 대화를 나눌 때 💫", type: "QT" }
    ]
  },
  {
    id: 7,
    text: "스트레스 받을 때 원하는 위로는?",
    options: [
      { text: "꽉 안아주거나 머리를 쓰다듬어 주는 것 💆", type: "PT" },
      { text: "집안일이나 내 할 일을 대신 해주는 것 🏠", type: "AS" }
    ]
  },
  {
    id: 8,
    text: "기념일에 가장 바라는 것은?",
    options: [
      { text: "마음을 담아 고른 선물 🎁", type: "RG" },
      { text: "\"항상 고마워, 사랑해\" 진심 가득한 편지 💌", type: "WA" }
    ]
  },
  {
    id: 9,
    text: "함께 있을 때 가장 행복한 순간은?",
    options: [
      { text: "아무것도 안 해도 그냥 옆에 있어줄 때 🛋️", type: "QT" },
      { text: "손을 잡거나 팔짱을 끼고 걸을 때 🚶", type: "PT" }
    ]
  },
  {
    id: 10,
    text: "나를 정말 이해한다는 느낌을 주는 것은?",
    options: [
      { text: "말 안 해도 내 상황을 파악하고 먼저 도와주는 것 🤝", type: "AS" },
      { text: "언제든지 나를 위한 특별한 선물을 준비하는 것 🎊", type: "RG" }
    ]
  }
];

const RESULTS = {
  WA: {
    title: "인정의 말형",
    emoji: "💬",
    color: "#0095f6",
    description: "당신은 언어를 통해 사랑을 느끼는 타입입니다. 진심 담긴 칭찬, 응원의 메시지, \"사랑해\"라는 말 한마디가 그 어떤 것보다 큰 의미를 가집니다.",
    tip: "상대방에게도 자주 진심 어린 말로 표현해주세요. 당신이 원하는 방식으로 상대방도 사랑받기를 원할 수 있습니다.",
    shareText: "💬 나의 러브 랭귀지는 '인정의 말'!"
  },
  AS: {
    title: "봉사 행동형",
    emoji: "🛠️",
    color: "#20bf6b",
    description: "당신은 행동으로 사랑을 느끼는 타입입니다. \"내가 뭐 도와줄까?\"라는 말보다 실제로 행동으로 보여주는 사람에게 마음이 열립니다.",
    tip: "말보다 행동을 중요하게 여기는 당신. 상대방이 당신을 위해 노력하고 있다는 것을 기억해주세요.",
    shareText: "🛠️ 나의 러브 랭귀지는 '봉사 행동'!"
  },
  RG: {
    title: "선물형",
    emoji: "🎁",
    color: "#eb3b5a",
    description: "당신은 물질적 표현을 통해 사랑을 느끼는 타입입니다. 선물의 크기보다 \"나를 생각하며 골랐구나\"라는 마음이 중요합니다.",
    tip: "선물에 담긴 마음을 소중히 여기는 당신. 상대방에게도 작은 선물로 자주 마음을 전해보세요.",
    shareText: "🎁 나의 러브 랭귀지는 '선물'!"
  },
  QT: {
    title: "함께하는 시간형",
    emoji: "⏰",
    color: "#f7b731",
    description: "당신은 질 높은 시간을 통해 사랑을 느끼는 타입입니다. 그냥 같은 공간에 있는 것이 아니라, 서로에게 온전히 집중하는 시간이 필요합니다.",
    tip: "핸드폰 없이 눈을 맞추며 나누는 대화, 그것이 당신에게 최고의 사랑 표현입니다.",
    shareText: "⏰ 나의 러브 랭귀지는 '함께하는 시간'!"
  },
  PT: {
    title: "스킨십형",
    emoji: "🤗",
    color: "#a55eea",
    description: "당신은 신체적 접촉을 통해 사랑을 느끼는 타입입니다. 가벼운 포옹, 손잡기, 어깨에 기대기 등 물리적인 온기가 당신의 마음을 채워줍니다.",
    tip: "언어나 선물보다 직접적인 신체 접촉이 당신에게 가장 강력한 사랑의 메시지입니다.",
    shareText: "🤗 나의 러브 랭귀지는 '스킨십'!"
  }
};

export default function LoveLanguageTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ WA: 0, AS: 0, RG: 0, QT: 0, PT: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '러브 랭귀지 테스트 - 내가 사랑받는 방식은? | CCGG';
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
      await navigator.clipboard.writeText(`${result.shareText}\n나의 사랑 언어를 테스트해봐 👉 ${shareUrl}`);
      alert('✅ 링크가 복사되었습니다! 친구에게 공유해보세요 😊');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">💕 러브 랭귀지 테스트</h1>
        <p className="intro-subtitle">내가 사랑을 주고받는 방식은? 5가지 사랑의 언어로 알아보는 나의 애정 유형</p>

        <div className="intro-section">
          <h2>러브 랭귀지(Love Language)란?</h2>
          <p>러브 랭귀지는 심리학자이자 결혼 상담가인 게리 채프먼(Gary Chapman) 박사가 1992년 저서 《5가지 사랑의 언어》에서 제안한 이론입니다. 그는 수십 년간 상담을 통해 사람마다 사랑을 표현하고 받아들이는 방식이 근본적으로 다르다는 것을 발견했습니다.</p>
          <p>많은 커플이 서로를 충분히 사랑하면서도 갈등을 겪는 이유가 바로 여기에 있습니다. A는 B에게 매일 "사랑해"라고 말하지만, B는 말보다 함께 있는 시간을 더 소중히 여기기 때문에 충분히 사랑받는다고 느끼지 못합니다. 상대의 언어가 아닌 내 언어로만 사랑을 표현한다면, 아무리 노력해도 마음이 전달되지 않을 수 있습니다.</p>
        </div>

        <div className="intro-section">
          <h2>5가지 사랑의 언어</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <strong>💬 인정하는 말 (Words of Affirmation)</strong>
              <p>진심 어린 칭찬, 감사 표현, "사랑해"라는 말로 사랑을 확인합니다. 부정적인 말에 특히 상처를 받는 유형입니다.</p>
            </div>
            <div className="intro-card">
              <strong>🛠️ 봉사 행동 (Acts of Service)</strong>
              <p>말보다 행동으로 사랑을 느낍니다. 상대가 나를 위해 무언가를 해줄 때 가장 사랑받는다고 느낍니다.</p>
            </div>
            <div className="intro-card">
              <strong>🎁 선물 (Receiving Gifts)</strong>
              <p>물질적 크기가 아닌 "나를 생각했구나"는 마음이 담긴 선물에서 사랑을 느낍니다.</p>
            </div>
            <div className="intro-card">
              <strong>⏰ 함께하는 시간 (Quality Time)</strong>
              <p>방해 없이 온전히 서로에게 집중하는 시간에서 사랑을 확인합니다. 같은 공간에 있어도 각자 핸드폰을 보면 외로움을 느낍니다.</p>
            </div>
            <div className="intro-card">
              <strong>🤗 스킨십 (Physical Touch)</strong>
              <p>포옹, 손잡기, 가벼운 터치 등 신체적 온기를 통해 사랑을 느끼고 표현합니다.</p>
            </div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 활용 방법</h2>
          <p>자신의 러브 랭귀지를 파악하면 연인·가족·친구에게 내가 필요한 것을 더 명확히 전달할 수 있습니다. 또한 상대방의 러브 랭귀지를 이해하면 더 효과적으로 사랑을 표현할 수 있습니다. 총 10문항이며 소요 시간은 약 2분입니다.</p>
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
      <h2 className="test-title">💕 나의 러브 랭귀지 테스트</h2>
      <p className="test-subtitle">내가 사랑을 주고받는 방식을 알아보세요</p>

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
          <div className="result-emoji-big">{result.emoji}</div>
          <h3 className="result-header">당신의 러브 랭귀지는</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>{result.title}</h2>
          <p className="result-description">{result.description}</p>
          <div className="result-tip-box">
            <strong>💡 관계 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>결과 공유하기 🔗</button>
            <button className="retry-btn" onClick={() => { setCurrentQuestion(0); setScores({ WA: 0, AS: 0, RG: 0, QT: 0, PT: 0 }); setShowResult(false); setResult(null); }}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
