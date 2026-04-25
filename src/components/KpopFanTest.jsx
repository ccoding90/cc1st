import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "최애 그룹의 멤버 생일을 얼마나 아나요?",
    options: [
      { text: "전원 다 외우고 있어요! 당연하죠 🎂", type: "LOYAL" },
      { text: "몇 명만 알거나 잘 몰라요 🤷", type: "MUSIC" }
    ]
  },
  {
    id: 2,
    text: "K-pop 콘텐츠를 소비하는 방식은?",
    options: [
      { text: "뮤직비디오, 무대 영상 위주로 봐요 🎬", type: "MUSIC" },
      { text: "예능, 브이라이브, 일상 콘텐츠도 다 챙겨요 📺", type: "LOYAL" }
    ]
  },
  {
    id: 3,
    text: "좋아하는 아이돌 굿즈에 대해?",
    options: [
      { text: "포토카드, 앨범 다 모아요! 컬렉션이 있어요 🖼️", type: "LOYAL" },
      { text: "음악으로만 즐겨요. 굿즈는 별로 관심 없어요 🎵", type: "MUSIC" }
    ]
  },
  {
    id: 4,
    text: "한 그룹만 좋아하나요, 여러 그룹을 좋아하나요?",
    options: [
      { text: "내 최애는 하나! 다른 그룹에 마음 안 뺏겨요 💎", type: "LOYAL" },
      { text: "좋은 음악 내는 그룹은 다 좋아요 🌈", type: "MULTI" }
    ]
  },
  {
    id: 5,
    text: "K-pop에 빠지게 된 계기는?",
    options: [
      { text: "어떤 멤버의 비주얼/매력에 반해서 🌟", type: "VISUAL" },
      { text: "귀에 꽂히는 노래를 듣고 나서 🎧", type: "MUSIC" }
    ]
  },
  {
    id: 6,
    text: "좋아하는 그룹이 컴백하면?",
    options: [
      { text: "음원 스트리밍 돌리고 차트 순위 체크해요 📊", type: "LOYAL" },
      { text: "음악 즐겁게 듣고 끝이에요 😊", type: "MULTI" }
    ]
  },
  {
    id: 7,
    text: "K-pop 팬덤 문화(총공, 총력 등)에 대해?",
    options: [
      { text: "당연한 거 아닌가요? 같이 해야 의미 있죠 🤝", type: "LOYAL" },
      { text: "조금 부담스럽고 음악만 즐기고 싶어요 🎵", type: "MUSIC" }
    ]
  },
  {
    id: 8,
    text: "여러 장르의 음악을 듣나요?",
    options: [
      { text: "K-pop 위주지만 다양한 그룹 골고루 들어요 🌈", type: "MULTI" },
      { text: "특정 그룹 음악만 집중해서 들어요 💎", type: "LOYAL" }
    ]
  },
  {
    id: 9,
    text: "K-pop 아이돌 무대 영상 볼 때 집중하는 것은?",
    options: [
      { text: "비주얼, 표정, 스타일링이 먼저 눈에 들어와요 👀", type: "VISUAL" },
      { text: "퍼포먼스, 가사, 하모니를 분석해요 🎤", type: "MUSIC" }
    ]
  },
  {
    id: 10,
    text: "K-pop 굿즈나 콘서트 티켓 가격에 대해?",
    options: [
      { text: "최애라면 당연히 투자해야죠! 아깝지 않아요 💸", type: "LOYAL" },
      { text: "조금 부담스럽고 합리적인 선에서 즐기고 싶어요 🤔", type: "MULTI" }
    ]
  }
];

const RESULTS = {
  LOYAL: {
    title: "충성 팬덤파",
    emoji: "💎",
    color: "#0095f6",
    keyword: "헌신 · 충성 · 진정한 팬",
    description: "당신은 찐팬 중의 찐팬! 최애 그룹에 대한 사랑이 남다릅니다. 생일, 컴백 일정, 팬덤 활동까지 빠지지 않는 당신은 아이돌에게 최고의 힘이 되는 든든한 팬입니다. 팬덤의 중심축 같은 존재예요!",
    tip: "그 열정 대단해요! 다만 팬 활동이 스트레스가 되지 않도록 자신도 챙겨주세요 💙",
    shareText: "💎 나의 K-pop 팬 유형은 '충성 팬덤파'!"
  },
  MUSIC: {
    title: "음악 감상파",
    emoji: "🎵",
    color: "#20bf6b",
    keyword: "음악 · 퀄리티 · 순수한 팬",
    description: "당신은 음악으로 K-pop을 즐기는 순수파! 특정 그룹에 집착하기보다 좋은 음악이 나오면 자연스럽게 빠져드는 타입입니다. 음악적 퀄리티를 가장 중요하게 여기는 감성적인 감상자예요.",
    tip: "당신이 좋아하는 음악들로 플레이리스트 만들면 정말 퀄리티 높을 것 같아요! 🎶",
    shareText: "🎵 나의 K-pop 팬 유형은 '음악 감상파'!"
  },
  VISUAL: {
    title: "비주얼 덕후",
    emoji: "👀",
    color: "#eb3b5a",
    keyword: "비주얼 · 스타일 · 외모",
    description: "당신은 눈으로 K-pop을 즐기는 비주얼파! 멤버들의 외모, 패션, 무대 위 퍼포먼스 비주얼에 빠져드는 타입입니다. 아이돌의 스타일과 콘셉트에 큰 관심을 가지고 있어요.",
    tip: "비주얼에서 시작한 관심이 음악과 무대 실력 감상으로 이어지면 K-pop이 더 재미있어져요! 🌟",
    shareText: "👀 나의 K-pop 팬 유형은 '비주얼 덕후'!"
  },
  MULTI: {
    title: "무지개 팬 (멀티 팬)",
    emoji: "🌈",
    color: "#a55eea",
    keyword: "다양성 · 개방적 · 자유로운 팬",
    description: "당신은 장르 불문, 그룹 불문으로 K-pop을 즐기는 무지개 팬! 어느 한 그룹에 얽매이지 않고 좋은 음악이라면 다 사랑하는 자유로운 팬입니다. 다양한 그룹의 매력을 모두 알고 있는 트렌드 세터예요.",
    tip: "다양한 그룹을 아는 당신은 K-pop 전문가! 그 폭넓은 취향으로 좋은 음악을 주변에 소개해주세요 🌈",
    shareText: "🌈 나의 K-pop 팬 유형은 '무지개 팬'!"
  }
};

export default function KpopFanTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ LOYAL: 0, MUSIC: 0, VISUAL: 0, MULTI: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = 'K-POP 팬 유형 테스트 - 나는 어떤 팬일까? | CCGG';
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
      await navigator.clipboard.writeText(`${result.shareText}\n너는 어떤 팬 유형인지 테스트해봐 👉 ${shareUrl}`);
      alert('✅ 링크가 복사되었습니다! 친구에게 공유해보세요 😊');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🎤 K-POP 팬 유형 테스트</h1>
        <p className="intro-subtitle">나는 어떤 스타일의 팬일까? 덕질 방식으로 알아보는 나의 K-POP 팬 유형</p>

        <div className="intro-section">
          <h2>K-POP 팬 문화의 다양성</h2>
          <p>K-POP은 음악을 넘어 하나의 문화 현상이 되었습니다. 전 세계 수억 명의 팬들이 각자의 방식으로 K-POP을 즐기고 있으며, 팬마다 덕질 스타일이 매우 다릅니다. 어떤 팬은 아이돌의 모든 일정을 꿰차고 있는 충성 팬인 반면, 어떤 팬은 음악만 즐기는 라이트 팬이기도 합니다. 어느 쪽이 더 진짜 팬인 것은 아닙니다. 각자의 방식으로 K-POP을 즐기는 모든 것이 팬 문화의 일부입니다.</p>
          <p>이 테스트는 당신의 덕질 패턴, 콘텐츠 소비 방식, 굿즈 수집 성향 등을 분석해 4가지 K-POP 팬 유형 중 어디에 속하는지 알려드립니다.</p>
        </div>

        <div className="intro-section">
          <h2>4가지 K-POP 팬 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🏆 충성 팬 (Loyal Fan)</strong><p>최애의 모든 것을 알고, 앨범·굿즈 수집과 팬 활동에 적극적으로 참여하는 코어 팬입니다.</p></div>
            <div className="intro-card"><strong>🎵 음악 팬 (Music Fan)</strong><p>굿즈나 팬 활동보다 음악 자체를 즐기는 타입. 뮤직비디오와 무대 영상 위주로 K-POP을 즐깁니다.</p></div>
            <div className="intro-card"><strong>👁️ 비주얼 팬 (Visual Fan)</strong><p>아이돌의 외모와 패션, 비주얼에 매력을 느끼는 타입. 화보나 직캠을 즐겨봅니다.</p></div>
            <div className="intro-card"><strong>🌈 멀티 팬 (Multi Fan)</strong><p>특정 그룹에 집중하지 않고 여러 그룹을 폭넓게 즐기는 유형. K-POP 트렌드에 밝습니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항이며, 평소 K-POP을 즐기는 방식에 가장 가까운 답을 선택해주세요. K-POP에 익숙하지 않아도 참여할 수 있습니다. 소요 시간은 약 2분입니다.</p>
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
      <h2 className="test-title">🎤 K-POP 팬 유형 테스트</h2>
      <p className="test-subtitle">나는 어떤 스타일의 팬일까요?</p>

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
          <h3 className="result-header">당신의 K-POP 팬 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>{result.title}</h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-tip-box">
            <strong>💡 팬 생활 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>결과 공유하기 🔗</button>
            <button className="retry-btn" onClick={() => { setCurrentQuestion(0); setScores({ LOYAL: 0, MUSIC: 0, VISUAL: 0, MULTI: 0 }); setShowResult(false); setResult(null); }}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
