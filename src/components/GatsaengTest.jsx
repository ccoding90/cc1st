import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "오늘 아침, 당신이 일어난 시간은? 🌅",
    options: [
      { text: "☀️ 오전 6시 이전에 상쾌하게 기상!", type: "PERFECT" },
      { text: "😴 알람을 3번 이상 끄고 간신히 일어남", type: "FREE" }
    ]
  },
  {
    id: 2,
    text: "운동은 얼마나 자주 하나요? 💪",
    options: [
      { text: "🏋️ 주 4회 이상, 루틴대로 빠짐없이!", type: "PERFECT" },
      { text: "🧘 가끔 산책 정도는 하는 편", type: "BALANCED" }
    ]
  },
  {
    id: 3,
    text: "식사 관리는 어떻게 하나요? 🥗",
    options: [
      { text: "📋 영양 균형 맞춰 직접 준비해서 먹음", type: "ACHIEVER" },
      { text: "🍕 그날그날 먹고 싶은 것을 자유롭게", type: "FREE" }
    ]
  },
  {
    id: 4,
    text: "내일 하루 계획은 언제 세우나요? 📝",
    options: [
      { text: "🌙 전날 밤에 내일 스케줄을 미리 정리", type: "PERFECT" },
      { text: "🎲 즉흥적으로 그날 아침에 결정", type: "FREE" }
    ]
  },
  {
    id: 5,
    text: "SNS는 주로 어떻게 활용하나요? 📱",
    options: [
      { text: "📚 자기계발·정보 콘텐츠 위주로 시청", type: "ACHIEVER" },
      { text: "🎬 재미있는 영상 보다 보면 시간이 훌쩍", type: "FREE" }
    ]
  },
  {
    id: 6,
    text: "취침 시간은 보통 언제인가요? 😴",
    options: [
      { text: "🌟 밤 11시 이전에 꼭 잠자리에 들기", type: "PERFECT" },
      { text: "🌙 새벽 1~2시 이후에 잠드는 편", type: "BALANCED" }
    ]
  },
  {
    id: 7,
    text: "자기계발 목표가 있나요? 🎯",
    options: [
      { text: "📌 구체적인 목표와 데드라인이 명확히 있음", type: "ACHIEVER" },
      { text: "💭 막연한 바람은 있지만 구체적이진 않아", type: "BALANCED" }
    ]
  },
  {
    id: 8,
    text: "주말에는 주로 어떻게 보내나요? 📅",
    options: [
      { text: "⚡ 평일보다 더 알차게 계획을 세워서 실천", type: "PERFECT" },
      { text: "☕ 충분한 휴식도 성공적인 삶의 일부!", type: "BALANCED" }
    ]
  },
  {
    id: 9,
    text: "한 달에 책이나 강의는 얼마나 하나요? 📖",
    options: [
      { text: "🔖 책 2권 이상 또는 온라인 강의 완강", type: "ACHIEVER" },
      { text: "😅 사두고 안 읽는 책들이 쌓여있음", type: "FREE" }
    ]
  },
  {
    id: 10,
    text: "'갓생'에 대한 나의 솔직한 생각은? 🌈",
    options: [
      { text: "💪 매일 최선을 다하는 삶, 나의 가치관!", type: "ACHIEVER" },
      { text: "🛋️ 가끔은 그냥 쉬고 싶다... 현생도 소중해", type: "BALANCED" }
    ]
  }
];

const RESULTS = {
  PERFECT: {
    title: "완벽한 갓생러",
    emoji: "👑",
    color: "#f7b731",
    keyword: "루틴의 왕 · 자기계발 최강자 · 갓생 100%",
    description: "당신은 진정한 갓생러입니다! 이른 기상부터 철저한 루틴 관리까지, MZ세대가 꿈꾸는 이상적인 라이프스타일을 실천하고 있어요. 2026년 '갓생' 트렌드의 중심에 있는 당신! 규칙적인 생활 습관과 꾸준한 자기계발이 당신의 최강 무기입니다. 주변에서 '저 사람 어떻게 저렇게 살아?'라는 말 자주 듣지 않나요?",
    strengths: ["철저한 루틴 관리", "강한 자기통제력", "목표 달성 능력"],
    tip: "완벽한 갓생러도 번아웃에 주의하세요! 가끔은 '아무것도 안 하는 날'을 의도적으로 만들어 에너지를 재충전하는 것도 더 나은 갓생의 일부랍니다.",
    shareText: "나의 갓생 레벨은 👑 완벽한 갓생러! 루틴의 왕, 자기계발 최강자 🔥"
  },
  ACHIEVER: {
    title: "성장형 갓생러",
    emoji: "🌱",
    color: "#20bf6b",
    keyword: "노력파 · 꾸준한 성장 · 자기계발 중",
    description: "당신은 열심히 성장 중인 갓생러입니다! 완벽하진 않지만 꾸준히 자기계발을 위해 노력하는 모습이 진짜 멋있어요. 정보 습득과 목표 설정에서 강점을 보이고, 한 걸음씩 발전해나가는 스타일이죠. 2026년 '나다움'을 찾아가는 여정 중에 있는 당신을 응원합니다!",
    strengths: ["꾸준한 학습 습관", "목표 지향적 사고", "자기인식 능력"],
    tip: "지금 잘하고 있어요! 하루에 단 한 가지 작은 목표라도 달성하는 습관을 만들어보세요. '완벽한 갓생' 보다 '어제보다 나은 나'가 더 중요합니다.",
    shareText: "나의 갓생 레벨은 🌱 성장형 갓생러! 꾸준히 발전하는 중 💪"
  },
  BALANCED: {
    title: "균형형 갓생러",
    emoji: "⚖️",
    color: "#0095f6",
    keyword: "워라밸 · 현명한 선택 · 지속 가능한 삶",
    description: "당신은 일과 휴식의 균형을 아는 현명한 갓생러입니다! 무리하지 않으면서도 중요한 것들을 챙기는 스타일이에요. 2026년 트렌드인 '지속 가능한 갓생'을 실천하고 있는 셈이죠. 완벽한 루틴보다 자신만의 페이스로 꾸준히 나아가는 것이 더 오래 갈 수 있는 방법임을 알고 있어요!",
    strengths: ["워라밸 감각", "지속 가능한 실천력", "자기 이해도"],
    tip: "지금의 균형 감각이 최고의 무기예요! 딱 한 가지, 매일 30분씩 자신을 위한 루틴을 추가해보세요. 작은 변화가 큰 갓생의 시작입니다.",
    shareText: "나의 갓생 레벨은 ⚖️ 균형형 갓생러! 워라밸을 아는 현명한 삶 🌿"
  },
  FREE: {
    title: "자유로운 현생파",
    emoji: "🦋",
    color: "#eb3b5a",
    keyword: "자유로운 영혼 · 즉흥적 · 현생 충실",
    description: "당신은 자유로운 현생파입니다! 갓생보다는 지금 이 순간 행복을 추구하는 스타일이에요. 즉흥성과 자유로움이 당신의 매력이죠. 2026년에는 '나다움(Na-Da-Eum)' 트렌드처럼 개성 있는 삶이 각광받고 있어요. 갓생도 좋지만, 지금 내가 행복한 삶이 진짜 갓생 아닐까요?",
    strengths: ["자유로운 사고방식", "즉흥적 창의력", "현재에 집중하는 능력"],
    tip: "갓생이 전부가 아니에요! 단, 딱 한 가지 작은 습관만 만들어보세요. 매일 물 한 잔 마시기, 5분 스트레칭 등 아주 작은 것부터 시작해봐요.",
    shareText: "나의 갓생 레벨은 🦋 자유로운 현생파! 나답게 사는 것이 최고의 갓생 ✨"
  }
};

export default function GatsaengTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ PERFECT: 0, ACHIEVER: 0, BALANCED: 0, FREE: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '갓생 레벨 테스트 - 나는 얼마나 갓생살고 있을까? | CCGG';
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
    setScores({ PERFECT: 0, ACHIEVER: 0, BALANCED: 0, FREE: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">🔥 갓생 레벨 테스트</h1>
        <p className="intro-subtitle">나는 얼마나 갓생살고 있을까? 10문항으로 알아보는 나의 갓생 유형</p>

        <div className="intro-section">
          <h2>'갓생'이란 무엇인가?</h2>
          <p>'갓생(God生)'은 신(God)과 인생(生)의 합성어로, 2020년대 MZ세대가 만들어낸 신조어입니다. 매일 아침 일찍 일어나고, 운동하고, 독서하고, 건강한 식사를 챙기며 자기관리를 철저히 하는 삶을 뜻합니다. 소셜 미디어를 통해 자신의 루틴을 공유하는 '갓생 챌린지'가 큰 인기를 끌며 하나의 라이프스타일 트렌드로 자리잡았습니다.</p>
          <p>그러나 갓생은 단순히 빡빡한 루틴을 소화하는 것이 아닙니다. 자신만의 속도로 조금씩 나아가는 것, 번아웃 없이 지속 가능한 성장을 추구하는 것도 갓생입니다. 이 테스트는 당신의 생활 패턴을 분석해 4가지 갓생 유형 중 어디에 속하는지 알려드립니다.</p>
        </div>

        <div className="intro-section">
          <h2>4가지 갓생 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>👑 갓생 마스터</strong><p>루틴이 완벽하게 자리 잡힌 진정한 갓생러. 기상, 운동, 식단, 계획이 모두 최적화되어 있습니다.</p></div>
            <div className="intro-card"><strong>🚀 갓생 어치버</strong><p>목표 지향적이고 성취욕이 강한 타입. 완벽하진 않지만 꾸준히 성장을 향해 나아가는 중입니다.</p></div>
            <div className="intro-card"><strong>⚖️ 균형 추구형</strong><p>갓생과 자유 사이에서 균형을 잡는 타입. 무리하지 않고 지속 가능한 삶을 추구합니다.</p></div>
            <div className="intro-card"><strong>🌊 자유 영혼형</strong><p>계획보다 현재의 즐거움을 중시하는 타입. 나만의 방식으로 행복을 찾는 자유로운 삶입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 현재 자신의 실제 생활 패턴에 가장 가까운 답을 선택해주세요. 이상적인 모습이 아닌 오늘의 나를 기준으로 솔직하게 선택하는 것이 가장 정확합니다. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">🔥 갓생 레벨 테스트</h2>
      <p className="test-subtitle">나는 얼마나 갓생살고 있을까? · 2026 MZ 트렌드</p>

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
          <h3 className="result-header">나의 갓생 레벨은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 나의 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 갓생 업그레이드 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 갓생 레벨 테스트`} shareUrl={window.location.href} testTitle="갓생 레벨 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
