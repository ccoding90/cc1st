import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

// 각 선택지 점수: 0(생기) ~ 2(권태). 총점 0~20
const QUESTIONS = [
  {
    id: 1,
    text: "퇴근(하교) 후 침대에 누웠다. 나의 손은? 📱",
    options: [
      { text: "📖 오늘 하기로 한 취미나 운동을 하러 감", score: 0 },
      { text: "📺 보던 드라마 한두 편 보고 잠", score: 1 },
      { text: "🔁 숏폼을 넘기다 보니 새벽… 근데 기억나는 게 없음", score: 2 }
    ]
  },
  {
    id: 2,
    text: "넷플릭스·유튜브를 켰을 때 나는? 🎬",
    options: [
      { text: "🎯 보고 싶던 걸 바로 틀어서 집중해서 봄", score: 0 },
      { text: "🤔 고르는 데 10분쯤 걸리지만 결국 하나 봄", score: 1 },
      { text: "😶 30분 동안 썸네일만 구경하다 그냥 끔", score: 2 }
    ]
  },
  {
    id: 3,
    text: "요즘 '재밌다'는 감정을 느낀 게 언제인가요? 😄",
    options: [
      { text: "🌈 오늘도 느꼈음", score: 0 },
      { text: "🗓️ 지난주쯤?", score: 1 },
      { text: "🫥 기억이 잘 안 남", score: 2 }
    ]
  },
  {
    id: 4,
    text: "주말 계획을 세울 때 나의 상태는? 🗺️",
    options: [
      { text: "✨ 하고 싶은 게 많아서 고르기 힘듦", score: 0 },
      { text: "🙂 한두 개 정도는 떠오름", score: 1 },
      { text: "🛌 딱히 하고 싶은 게 없어서 그냥 누워 있을 듯", score: 2 }
    ]
  },
  {
    id: 5,
    text: "친구가 새로운 맛집이나 핫플을 추천했다. 나는? 🍜",
    options: [
      { text: "🏃 바로 저장하고 이번 주에 가봄", score: 0 },
      { text: "📌 저장은 해두지만 언제 갈지는 모름", score: 1 },
      { text: "😑 \"거기서 거기지 뭐\" 하고 넘김", score: 2 }
    ]
  },
  {
    id: 6,
    text: "음악을 들을 때 나는? 🎧",
    options: [
      { text: "🆕 새로운 곡을 찾아 듣는 게 즐거움", score: 0 },
      { text: "🔂 늘 듣던 플레이리스트 무한 반복", score: 1 },
      { text: "🔇 귀에 이어폰은 꽂았는데 사실 아무것도 안 들음", score: 2 }
    ]
  },
  {
    id: 7,
    text: "하루 중 '멍때리는' 시간은? 🌫️",
    options: [
      { text: "☁️ 가끔, 일부러 쉬려고 함", score: 0 },
      { text: "🌀 생각보다 자주 정신 차려보면 멍함", score: 1 },
      { text: "🕳️ 하루 대부분이 자동 모드로 흘러감", score: 2 }
    ]
  },
  {
    id: 8,
    text: "누가 \"요즘 뭐 하고 지내?\"라고 물으면? 💬",
    options: [
      { text: "🗣️ 할 얘기가 많아서 신나게 이야기함", score: 0 },
      { text: "🙂 \"그냥 회사(학교) 다니지 뭐\"", score: 1 },
      { text: "😮‍💨 \"…별거 없어\" 하고 대화가 끊김", score: 2 }
    ]
  },
  {
    id: 9,
    text: "새로운 걸 배워보자는 제안을 받았다. 나는? 🧩",
    options: [
      { text: "🔥 오 재밌겠다, 해보자!", score: 0 },
      { text: "🤨 시간 되면 해볼게…", score: 1 },
      { text: "🥱 귀찮음이 먼저 올라옴", score: 2 }
    ]
  },
  {
    id: 10,
    text: "이번 가을, 나의 솔직한 마음은? 🍂",
    options: [
      { text: "🍁 단풍 구경, 가을 축제… 하고 싶은 게 가득!", score: 0 },
      { text: "🍂 날씨는 좋은데 딱히 설레진 않음", score: 1 },
      { text: "🪫 계절이 바뀐 것도 잘 못 느끼겠음", score: 2 }
    ]
  }
];

const MAX_SCORE = QUESTIONS.length * 2;

const LEVELS = [
  {
    max: 5,
    title: "생기 충만 가을 다람쥐",
    emoji: "🐿️",
    color: "#27ae60",
    keyword: "권태 지수 LOW · 호기심 만땅 · 일상 탐험가",
    description: "당신은 권태라는 단어와 거리가 먼 '생기 충만 가을 다람쥐'예요! 일상 속에서 재미를 찾아내는 능력이 뛰어나고, 새로운 걸 마주하면 피하기보다 먼저 손을 내밀죠. 넘쳐나는 콘텐츠 속에서도 '내가 진짜 좋아하는 것'을 분명히 알고 있어서 지루할 틈이 없어요.",
    strengths: ["높은 호기심", "일상 속 재미 발견", "적극적인 실행력"],
    tip: "지금의 생기를 오래 유지하려면 '쉼'도 일정에 넣어주세요. 하고 싶은 게 많은 사람일수록 갑자기 방전되기 쉬워요. 가을 다람쥐도 도토리를 모은 뒤엔 꼭 쉬어 간답니다."
  },
  {
    max: 10,
    title: "살짝 권태 가을 고양이",
    emoji: "🐈",
    color: "#f39c12",
    keyword: "권태 지수 MID · 루틴 안정형 · 설렘 충전 필요",
    description: "당신은 일상은 무난하게 굴러가지만 설렘이 조금 부족한 '살짝 권태 가을 고양이'예요. 크게 불만은 없지만, 비슷한 하루가 반복되면서 '뭔가 재밌는 일 없나?' 하는 마음이 슬며시 올라오는 단계죠. 이 정도 권태는 누구나 겪는 자연스러운 신호예요.",
    strengths: ["안정적인 생활 리듬", "현실 감각", "회복 가능성 높음"],
    tip: "작은 '처음'을 하나 만들어보세요. 안 가본 동네 카페, 한 번도 안 들어본 장르의 음악, 퇴근길 한 정거장 일찍 내려 걷기처럼 아주 사소한 새로움이 권태를 깨는 데 생각보다 큰 힘이 있어요."
  },
  {
    max: 15,
    title: "권태 경보 가을 나무늘보",
    emoji: "🦥",
    color: "#e67e22",
    keyword: "권태 지수 HIGH · 무료함 누적 · 자극 피로",
    description: "당신은 볼 것도 할 것도 많은데 이상하게 다 시큰둥한 '권태 경보 가을 나무늘보'예요. 트렌드 코리아 2027이 짚은 '권태사회', 즉 자극이 넘쳐나는데도 무료함을 느끼는 '과잉형 권태'에 가까운 상태예요. 콘텐츠를 계속 소비하지만 정작 마음은 채워지지 않는 느낌, 익숙하지 않나요?",
    strengths: ["자기 상태를 돌아보는 힘", "변화가 필요하다는 인식", "작은 계기로 반등 가능"],
    tip: "자극을 더하기보다 '빼기'부터 해보세요. 하루 30분만 휴대폰을 다른 방에 두고 산책하거나 손으로 무언가를 만들어보는 거예요. 자극이 줄어들어야 작은 재미가 다시 느껴지기 시작해요."
  },
  {
    max: MAX_SCORE,
    title: "권태사회 대표 가을 곰",
    emoji: "🐻",
    color: "#c0392b",
    keyword: "권태 지수 MAX · 의욕 방전 · 리셋 필요",
    description: "당신은 지금 의욕 배터리가 거의 바닥난 '권태사회 대표 가을 곰'이에요. 무엇을 봐도 무엇을 해도 별 감흥이 없고, 하루가 자동 모드로 흘러가는 느낌일 수 있어요. 그만큼 그동안 많이 달려왔다는 뜻이기도 해요. 지금은 나를 탓하기보다 잠시 겨울잠 준비하듯 충분히 쉬어갈 때예요.",
    strengths: ["솔직한 자기 인식", "리셋 타이밍 포착", "회복 후 큰 반등 가능성"],
    tip: "충분한 수면과 햇빛 아래 짧은 산책처럼 몸부터 돌보는 것이 첫걸음이에요. 무기력한 상태가 2주 이상 계속되고 일상생활이 힘들 정도라면, 단순한 권태가 아닐 수 있으니 가까운 사람이나 전문가와 이야기를 나눠보세요."
  }
];

export default function BoredomTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [total, setTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '가을 권태 지수 테스트 - 나의 권태 레벨은? | CCGG';
  }, []);

  const handleAnswer = (score) => {
    const newTotal = total + score;
    setTotal(newTotal);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setResult(LEVELS.find((l) => newTotal <= l.max));
      setShowResult(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setTotal(0);
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;
  const boredomPercent = Math.round((total / MAX_SCORE) * 100);

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🍂 가을 권태 지수 테스트</h1>
        <p className="intro-subtitle">볼 건 많은데 왜 이렇게 다 지루할까? 나의 권태 레벨 진단</p>

        <div className="intro-section">
          <h2>권태사회란?</h2>
          <p>『트렌드 코리아 2027』이 첫 번째로 꼽은 키워드는 '권태사회'예요. 자극적인 콘텐츠가 넘쳐나는데도 오히려 무료함을 느끼는 현상으로, 무언가가 부족해서 지루했던 '결핍형 권태'에서 너무 많아서 지루한 '과잉형 권태'로 바뀌었다는 진단이에요.</p>
          <p>숏폼을 몇 시간씩 넘겨도 기억에 남는 게 없고, 고르기만 하다 아무것도 안 보고 끄는 경험, 한 번쯤 있으시죠? 선선해진 가을, 나의 권태 지수는 몇 점일지 확인해보세요.</p>
        </div>

        <div className="intro-section">
          <h2>4단계 권태 레벨</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🐿️ 생기 충만 (0~5점)</strong><p>일상 속 재미를 잘 찾아내는 호기심 만땅 상태입니다.</p></div>
            <div className="intro-card"><strong>🐈 살짝 권태 (6~10점)</strong><p>무난하지만 설렘 충전이 필요한 상태입니다.</p></div>
            <div className="intro-card"><strong>🦥 권태 경보 (11~15점)</strong><p>자극은 많은데 다 시큰둥한 과잉형 권태 상태입니다.</p></div>
            <div className="intro-card"><strong>🐻 권태 MAX (16~20점)</strong><p>의욕 배터리 방전, 충분한 리셋이 필요한 상태입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항, 문항마다 요즘의 나와 가장 가까운 답을 골라주세요. 답변에 따라 0~20점의 권태 지수가 계산됩니다. 재미로 보는 자가 점검이며 의학적 진단을 대신하지 않아요. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🍂 가을 권태 지수 테스트</h2>
      <p className="test-subtitle">나의 권태 레벨은? · 트렌드 코리아 2027 '권태사회' 특집</p>

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
                onClick={() => handleAnswer(option.score)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="result-emoji-big">{result.emoji}</div>
          <h3 className="result-header">나의 가을 권태 지수는 <strong style={{ color: result.color }}>{total}점</strong> / {MAX_SCORE}점</h3>
          <div className="progress-bar" style={{ margin: '8px 0 16px' }}>
            <div style={{ width: `${boredomPercent}%`, background: result.color }} />
          </div>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 지금 나의 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 권태 탈출 처방전</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`나의 가을 권태 지수는 ${total}점! ${result.emoji} ${result.title} - CCGG 가을 권태 지수 테스트`} shareUrl={window.location.href} testTitle="가을 권태 지수 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
