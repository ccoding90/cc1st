import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "오늘 하루 SNS를 얼마나 봤나요?",
    options: [
      { text: "셀 수도 없이 많이 봤어요 📱 (습관적으로 켜요)", type: "T10" },
      { text: "가끔 확인하는 정도예요 🙂", type: "T40" }
    ]
  },
  {
    id: 2,
    text: "주말 계획은 어떻게 세우나요?",
    options: [
      { text: "그때그때! 즉흥이 최고 🎲", type: "T20" },
      { text: "미리 꼼꼼히 계획을 세워요 📝", type: "T40" }
    ]
  },
  {
    id: 3,
    text: "좋아하는 아이돌이나 배우가 생기면?",
    options: [
      { text: "팬카페 가입하고 굿즈도 사요 🎤", type: "T10" },
      { text: "좋아하긴 하지만 그 정도는 아니에요 😌", type: "T40" }
    ]
  },
  {
    id: 4,
    text: "밤 12시, 지금 무엇을 하고 있나요?",
    options: [
      { text: "유튜브나 릴스 보면서 아직 멀쩡해요 🌙", type: "T20" },
      { text: "이미 잠들었거나 졸려요 😴", type: "T50" }
    ]
  },
  {
    id: 5,
    text: "요즘 유행하는 밈(meme)을 얼마나 아나요?",
    options: [
      { text: "당연히 다 알죠! 나도 써요 😂", type: "T10" },
      { text: "뭔지 찾아봐야 할 때가 있어요 🤔", type: "T40" }
    ]
  },
  {
    id: 6,
    text: "콘서트나 축제, 핫플 방문에 대해?",
    options: [
      { text: "항상 가고 싶고 실제로 자주 가요 🎊", type: "T20" },
      { text: "집이나 조용한 곳이 더 좋아요 🏠", type: "T40" }
    ]
  },
  {
    id: 7,
    text: "갈등이 생기면 나는?",
    options: [
      { text: "감정적으로 바로 표현하거나 힘들어요 😤", type: "T10" },
      { text: "천천히 생각하고 대화로 해결해요 🗣️", type: "T30" }
    ]
  },
  {
    id: 8,
    text: "음식 사진, 인생샷을 남기는 것에 대해?",
    options: [
      { text: "맛있으면 당연히 찍어야죠! 올려요 📸", type: "T20" },
      { text: "맛있으면 먹고 싶지 사진 생각은 별로 🍴", type: "T50" }
    ]
  },
  {
    id: 9,
    text: "새로운 트렌드 음식이나 카페가 생기면?",
    options: [
      { text: "무조건 먹어봐야 직성이 풀려요 🧋", type: "T20" },
      { text: "익숙하고 아는 맛이 더 좋아요 😊", type: "T50" }
    ]
  },
  {
    id: 10,
    text: "미래에 대한 나의 태도는?",
    options: [
      { text: "일단 하고 싶은 거 다 해보고 싶어요 🚀", type: "T20" },
      { text: "안정적이고 계획적인 미래가 중요해요 🏦", type: "T30" }
    ]
  }
];

const RESULTS = {
  T10: {
    title: "심리 나이 10대",
    emoji: "🌟",
    ageRange: "10대 감성",
    description: "당신의 마음은 영원한 10대! 트렌드에 민감하고 새로운 것을 좋아하는 당신은 항상 최신 유행을 선도합니다. 에너지가 넘치고 열정적이지만 때로는 충동적인 면도 있어요. 나이와 관계없이 젊은 감성을 유지하는 것이 당신의 최대 무기입니다!",
    tip: "그 에너지와 열정을 좋아하는 일에 집중해보세요. 젊은 감성은 최고의 자산입니다!",
    shareText: "🌟 나의 심리 나이는 10대!"
  },
  T20: {
    title: "심리 나이 20대",
    emoji: "🚀",
    ageRange: "20대 감성",
    description: "당신의 마음은 활기찬 20대! 도전을 두려워하지 않고 새로운 경험을 추구하는 당신은 삶을 적극적으로 즐깁니다. YOLO 정신으로 매 순간을 최대한 즐기며, 앞으로 나아가는 에너지가 넘칩니다.",
    tip: "지금 이 순간을 즐기는 것도 중요하지만, 미래의 나를 위한 작은 준비도 함께 해보세요!",
    shareText: "🚀 나의 심리 나이는 20대!"
  },
  T30: {
    title: "심리 나이 30대",
    emoji: "⚖️",
    ageRange: "30대 감성",
    description: "당신의 마음은 균형 잡힌 30대! 열정과 이성 사이에서 균형을 잡을 줄 알고 무엇이 중요한지 알고 있습니다. 경험에서 얻은 지혜와 아직 남은 에너지를 잘 조화시키는 현명한 타입입니다.",
    tip: "당신의 균형 감각은 큰 강점입니다. 그 안정감으로 주변 사람들에게도 좋은 영향을 줄 수 있어요!",
    shareText: "⚖️ 나의 심리 나이는 30대!"
  },
  T40: {
    title: "심리 나이 40대",
    emoji: "🌿",
    ageRange: "40대 감성",
    description: "당신의 마음은 성숙한 40대! 인생의 진정한 가치를 알고 있으며 소소한 행복을 소중히 여깁니다. 타인의 시선보다 자신의 가치관에 따라 살아가는 성숙한 안목이 매력입니다.",
    tip: "당신의 성숙함과 여유로움은 주변 사람들에게 큰 위안이 됩니다. 그 가치를 잊지 마세요!",
    shareText: "🌿 나의 심리 나이는 40대!"
  },
  T50: {
    title: "심리 나이 50대+",
    emoji: "🍵",
    ageRange: "50대 이상 감성",
    description: "당신의 마음은 넉넉한 어른! 복잡함보다 단순함을 추구하며 진정한 행복이 무엇인지 알고 있는 성숙한 영혼입니다. 오랜 경험에서 나온 지혜로 세상을 바라보는 특별한 통찰력을 가지고 있습니다.",
    tip: "그 깊은 지혜와 여유는 정말 귀한 자산입니다. 주변 사람들과 그 경험을 나눠보세요!",
    shareText: "🍵 나의 심리 나이는 50대 이상!"
  }
};

export default function MentalAgeTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ T10: 0, T20: 0, T30: 0, T40: 0, T50: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '심리 나이 테스트 - 당신의 마음의 나이는? | CCGG';
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

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🧠 심리 나이 테스트</h1>
        <p className="intro-subtitle">당신의 마음은 몇 살인가요? 생각과 행동 패턴으로 알아보는 심리적 나이</p>

        <div className="intro-section">
          <h2>심리 나이란 무엇인가요?</h2>
          <p>심리 나이(Mental Age)는 실제 나이와 무관하게 일상적인 사고방식, 감정 반응, 행동 패턴이 몇 살에 가까운지를 나타내는 심리학적 개념입니다. 20대이지만 노련하고 안정적인 40대의 사고방식을 가진 사람이 있는가 하면, 50대임에도 10대처럼 호기심 넘치고 자유로운 마음으로 사는 사람도 있습니다.</p>
          <p>심리 나이는 좋고 나쁨의 문제가 아닙니다. 각 심리 나이마다 고유한 매력과 강점이 있으며, 자신의 심리 나이를 이해하면 왜 특정 상황에서 특정한 반응을 보이는지, 어떤 환경에서 가장 편안함을 느끼는지를 파악하는 데 도움이 됩니다.</p>
        </div>

        <div className="intro-section">
          <h2>심리 나이별 특징</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>10대 마음</strong><p>열정적이고 즉흥적. 새로운 것에 빠르게 흥미를 느끼고, 현재의 감정에 충실하게 반응합니다.</p></div>
            <div className="intro-card"><strong>20대 마음</strong><p>자유롭고 탐험적. 다양한 경험을 추구하며, 변화와 도전을 두려워하지 않는 에너지가 있습니다.</p></div>
            <div className="intro-card"><strong>30대 마음</strong><p>균형과 성취를 중시. 현실적이면서도 꿈을 포기하지 않는, 가장 활동적인 심리 연령대입니다.</p></div>
            <div className="intro-card"><strong>40대 마음</strong><p>안정과 깊이를 추구. 인간관계의 질을 중시하고, 쉽게 흔들리지 않는 단단한 내면을 가집니다.</p></div>
            <div className="intro-card"><strong>50대+ 마음</strong><p>여유와 지혜. 사소한 것에 흔들리지 않고, 삶을 넓은 시각으로 바라보는 성숙한 태도를 가집니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 일상에서 자신의 실제 행동과 생각에 가장 가까운 답을 선택해주세요. 소요 시간은 약 2분입니다. 결과는 참고용이며 절대적인 기준이 아닙니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🧠 심리 나이 테스트</h2>
      <p className="test-subtitle">당신의 마음은 몇 살인가요?</p>

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
          <h3 className="result-header">당신의 심리 나이는</h3>
          <h2 className="result-type-title" style={{ color: '#0095f6' }}>{result.ageRange}</h2>
          <p className="result-description">{result.description}</p>
          <div className="result-tip-box">
            <strong>✨ 한마디</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 심리 나이 테스트`} shareUrl={window.location.href} testTitle="심리 나이 테스트 결과" />
            <button className="retry-btn" onClick={() => { setCurrentQuestion(0); setScores({ T10: 0, T20: 0, T30: 0, T40: 0, T50: 0 }); setShowResult(false); setResult(null); }}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
