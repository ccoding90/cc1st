import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "스트레스를 받으면 가장 먼저 하고 싶은 것은?",
    options: [
      { text: "억울함과 화를 바로 표출하거나 대화로 풀어요 🗣️", type: "EXPLODE" },
      { text: "혼자 있고 싶어요. 방에 들어가 조용히 있어요 🐠", type: "WITHDRAW" }
    ]
  },
  {
    id: 2,
    text: "기분이 안 좋을 때 주로?",
    options: [
      { text: "맛있는 거 먹거나 배달 시켜요 🍕", type: "EAT" },
      { text: "운동하거나 몸을 움직여요 🏃", type: "ACTIVE" }
    ]
  },
  {
    id: 3,
    text: "직장/학교에서 억울한 일이 생기면?",
    options: [
      { text: "친한 친구에게 바로 전화해서 털어놓아요 📞", type: "TALK" },
      { text: "감정을 숨기고 혼자 삭혀요 🐠", type: "WITHDRAW" }
    ]
  },
  {
    id: 4,
    text: "극도로 스트레스 받을 때 나는?",
    options: [
      { text: "짜증이나 화가 밖으로 나와요 😤", type: "EXPLODE" },
      { text: "유튜브, 드라마, 게임에 빠져들어요 📱", type: "EAT" }
    ]
  },
  {
    id: 5,
    text: "나만의 스트레스 해소법은?",
    options: [
      { text: "산책, 헬스, 요가 등 신체 활동이에요 💪", type: "ACTIVE" },
      { text: "카페 약속 잡고 수다 떠는 거예요 ☕", type: "TALK" }
    ]
  },
  {
    id: 6,
    text: "힘든 일이 생겼을 때 주변 사람에게?",
    options: [
      { text: "솔직하게 다 얘기하고 공감 받고 싶어요 💬", type: "TALK" },
      { text: "내색하지 않아요. 내 문제는 내가 해결해요 🐠", type: "WITHDRAW" }
    ]
  },
  {
    id: 7,
    text: "스트레스 받은 다음날 나는?",
    options: [
      { text: "어제 일을 잊고 활동적으로 움직여요 🌅", type: "ACTIVE" },
      { text: "어제 일이 계속 생각나고 예민해요 😤", type: "EXPLODE" }
    ]
  },
  {
    id: 8,
    text: "스트레스 해소에 가장 효과적인 것은?",
    options: [
      { text: "맛있는 음식과 달콤한 디저트 🧁", type: "EAT" },
      { text: "친구들과 함께 웃고 떠드는 것 😂", type: "TALK" }
    ]
  },
  {
    id: 9,
    text: "마음이 힘들 때 나의 표현 방식은?",
    options: [
      { text: "감정을 숨기지 못하고 표정이나 말투에 나와요 😤", type: "EXPLODE" },
      { text: "표정 관리하며 괜찮은 척 해요 🐠", type: "WITHDRAW" }
    ]
  },
  {
    id: 10,
    text: "스트레스 해소 후 회복하는 방식은?",
    options: [
      { text: "밥 먹고 드라마 보다 보면 어느새 나아요 🛋️", type: "EAT" },
      { text: "땀 흘리고 나서 개운함을 느껴요 🚿", type: "ACTIVE" }
    ]
  }
];

const RESULTS = {
  EXPLODE: {
    title: "즉각 표출형",
    emoji: "🔥",
    color: "#eb3b5a",
    keyword: "솔직 · 감정적 · 즉각 반응",
    description: "당신은 스트레스를 즉각적으로 표출하는 타입! 감정을 숨기지 않고 바로 표현합니다. 솔직함이 장점이지만, 감정적인 상황에서 말이나 행동이 과해질 수 있어요. 감정을 충분히 느낀 후 조금 식히고 표현하는 연습을 해보세요.",
    tip: "화가 날 때 잠깐 심호흡하고 10을 세는 습관이 관계 유지에 큰 도움이 됩니다!",
    shareText: "🔥 나의 스트레스 유형은 '즉각 표출형'!"
  },
  WITHDRAW: {
    title: "잠수 혼자만의 시간형",
    emoji: "🐠",
    color: "#0095f6",
    keyword: "내면 · 독립적 · 혼자 처리",
    description: "당신은 스트레스를 혼자 조용히 처리하는 타입! 혼자만의 공간에서 감정을 정리하고 나서야 비로소 회복됩니다. 자립적이지만 때로는 혼자 너무 많은 것을 담고 있어 힘들 수 있어요.",
    tip: "신뢰하는 한 사람에게만이라도 가끔 털어놓는 연습을 해보세요. 혼자서 다 짊어질 필요 없어요!",
    shareText: "🐠 나의 스트레스 유형은 '잠수 혼자만의 시간형'!"
  },
  EAT: {
    title: "먹방 힐링형",
    emoji: "🍕",
    color: "#f7b731",
    keyword: "위로 · 감각 · 즉각적 행복",
    description: "당신은 먹방과 콘텐츠로 스트레스를 해소하는 힐링파! 맛있는 음식이나 좋아하는 콘텐츠가 최고의 위로입니다. 즉각적인 즐거움을 찾는 당신은 소소한 행복을 잘 아는 타입이에요.",
    tip: "감정적 먹방이 습관이 되지 않도록 주의하세요. 운동이나 산책을 먹방과 함께 루틴으로 만들어봐요!",
    shareText: "🍕 나의 스트레스 유형은 '먹방 힐링형'!"
  },
  ACTIVE: {
    title: "활동 발산형",
    emoji: "💪",
    color: "#20bf6b",
    keyword: "에너지 · 건강 · 긍정 발산",
    description: "당신은 몸을 움직여 스트레스를 발산하는 활동파! 운동, 산책, 청소 등 신체 활동으로 에너지를 소모하며 스트레스를 해소합니다. 건강한 해소 방식을 가진 당신은 심신이 균형 잡혀 있어요.",
    tip: "이미 훌륭한 스트레스 해소법을 갖고 있어요! 다만 너무 무리하지 않도록 몸 상태도 체크하세요!",
    shareText: "💪 나의 스트레스 유형은 '활동 발산형'!"
  },
  TALK: {
    title: "수다 공감형",
    emoji: "💬",
    color: "#a55eea",
    keyword: "공감 · 소통 · 감정 나눔",
    description: "당신은 말하면서 스트레스를 푸는 수다 치료사! 신뢰하는 사람에게 속 이야기를 털어놓으면서 에너지를 회복합니다. 공감과 소통을 통해 관계가 깊어지는 사교적인 타입이에요.",
    tip: "항상 들어주는 친구에게 감사의 말을 잊지 마세요! 가끔은 상대방의 이야기도 들어주는 균형이 필요해요 😊",
    shareText: "💬 나의 스트레스 유형은 '수다 공감형'!"
  }
};

export default function StressTypeTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ EXPLODE: 0, WITHDRAW: 0, EAT: 0, ACTIVE: 0, TALK: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '스트레스 대처 유형 테스트 - 나는 어떻게 스트레스를 풀까? | CCGG';
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
      await navigator.clipboard.writeText(`${result.shareText}\n너는 어떤 스트레스 유형인지 테스트해봐 👉 ${shareUrl}`);
      alert('✅ 링크가 복사되었습니다! 친구에게 공유해보세요 😊');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">😤 스트레스 대처 유형 테스트</h2>
      <p className="test-subtitle">나는 스트레스를 어떻게 해소하나요?</p>

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
          <h3 className="result-header">당신의 스트레스 대처 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>{result.title}</h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-tip-box">
            <strong>💡 스트레스 관리 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>결과 공유하기 🔗</button>
            <button className="retry-btn" onClick={() => { setCurrentQuestion(0); setScores({ EXPLODE: 0, WITHDRAW: 0, EAT: 0, ACTIVE: 0, TALK: 0 }); setShowResult(false); setResult(null); }}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
