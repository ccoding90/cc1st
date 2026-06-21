import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "팀 프로젝트에서 나의 자연스러운 역할은? ⚽",
    options: [
      { text: "🔥 맨 앞에서 아이디어를 내고 직접 실행한다", type: "STRIKER" },
      { text: "🌐 팀원들을 연결하고 흐름을 만든다", type: "MIDFIELDER" }
    ]
  },
  {
    id: 2,
    text: "위기 상황에서 나의 반응은? 🚨",
    options: [
      { text: "🧤 내가 막겠다! 몸을 던져 상황을 차단한다", type: "GOALKEEPER" },
      { text: "📋 판을 다시 짜자! 전략을 수정하고 지휘한다", type: "COACH" }
    ]
  },
  {
    id: 3,
    text: "실패 후 나의 모습은? 💪",
    options: [
      { text: "⚡ 빠르게 털고 다음 기회를 노린다", type: "STRIKER" },
      { text: "🔍 원인을 분석해 같은 실수를 막는다", type: "DEFENDER" }
    ]
  },
  {
    id: 4,
    text: "팀 분위기가 가라앉을 때 나는? 🎉",
    options: [
      { text: "📣 목소리 높여 응원하며 에너지를 주입한다", type: "SUPPORTER" },
      { text: "💡 냉정하게 해결책을 찾아 제시한다", type: "MIDFIELDER" }
    ]
  },
  {
    id: 5,
    text: "나의 가장 강력한 무기는? 🏆",
    options: [
      { text: "⚡ 순간 판단력과 과감한 실행력", type: "STRIKER" },
      { text: "🧱 집중력과 흔들리지 않는 담대함", type: "GOALKEEPER" }
    ]
  },
  {
    id: 6,
    text: "내가 가장 즐기는 역할은? ✨",
    options: [
      { text: "🗺️ 큰 그림을 그리고 방향을 제시하는 것", type: "COACH" },
      { text: "🛡️ 위험을 감지하고 팀을 지켜내는 것", type: "DEFENDER" }
    ]
  },
  {
    id: 7,
    text: "팀이 성공했을 때 나는? 🥇",
    options: [
      { text: "🌟 팀원들이 빛나게 해주는 것이 보람이다", type: "MIDFIELDER" },
      { text: "🔥 함께 열정적으로 기뻐하며 더 크게 소리친다", type: "SUPPORTER" }
    ]
  },
  {
    id: 8,
    text: "나의 업무 스타일은? 📊",
    options: [
      { text: "🚀 결과 우선! 빠르게 실행하고 피드백을 받는다", type: "STRIKER" },
      { text: "📐 과정 중시! 꼼꼼히 분석하고 빈틈없이 준비한다", type: "DEFENDER" }
    ]
  },
  {
    id: 9,
    text: "혼자 있을 때의 나는? 🌙",
    options: [
      { text: "🔇 조용히 다음을 준비하며 집중한다", type: "GOALKEEPER" },
      { text: "😊 사람들과 함께 있고 싶어진다", type: "SUPPORTER" }
    ]
  },
  {
    id: 10,
    text: "나의 리더십 스타일은? 👑",
    options: [
      { text: "🧠 전략과 판단으로 팀 전체를 이끈다", type: "COACH" },
      { text: "⚡ 앞장서서 도전하며 보여주는 것으로 이끈다", type: "STRIKER" }
    ]
  }
];

const RESULTS = {
  STRIKER: {
    title: "에이스 공격수형",
    emoji: "⚽",
    color: "#e74c3c",
    star: "손흥민 타입",
    starEmoji: "🇰🇷",
    keyword: "과감함 · 결정력 · 승부사",
    description: "당신은 팀의 에이스! 위기 상황에서도 결정적인 한 방을 만들어내는 공격수형이에요. 아이디어를 즉시 실행에 옮기는 추진력과 실패를 두려워하지 않는 승부사 기질이 최대 강점입니다. 손흥민처럼 어떤 상황에서도 목표를 향해 돌진하는 당신, 2026 월드컵 결정적 순간에 가장 빛날 유형이에요!",
    strengths: ["탁월한 결정력", "강한 추진력", "승부사 기질"],
    worldcup: "결정적 순간에 반드시 골을 터뜨린다! 팀의 에이스로 가장 중요한 한 방을 책임지는 타입.",
    shareText: "나의 월드컵 포지션 유형은 ⚽ 에이스 공격수형 (손흥민 타입)! 결정적 한 방을 노리는 승부사"
  },
  MIDFIELDER: {
    title: "전천후 미드필더형",
    emoji: "🌐",
    color: "#27ae60",
    star: "황희찬 타입",
    starEmoji: "🇰🇷",
    keyword: "균형감 · 연결력 · 넓은 시야",
    description: "당신은 팀의 중심! 공격과 수비를 연결하며 팀 전체의 리듬을 만드는 미드필더형이에요. 사람들을 연결하고 상황을 읽는 넓은 시야가 최대 강점입니다. 황희찬처럼 팀 전체를 위해 헌신하면서도 결정적인 순간엔 직접 해결하는 멀티플레이어, 그게 바로 당신이에요!",
    strengths: ["뛰어난 조율 능력", "넓은 시야", "상황 적응력"],
    worldcup: "공수 연결의 핵심! 팀 흐름을 만들고 결정적 순간에 도움과 득점을 동시에 기여하는 타입.",
    shareText: "나의 월드컵 포지션 유형은 🌐 전천후 미드필더형 (황희찬 타입)! 팀의 심장이자 엔진"
  },
  DEFENDER: {
    title: "철벽 수비수형",
    emoji: "🛡️",
    color: "#2980b9",
    star: "김민재 타입",
    starEmoji: "🇰🇷",
    keyword: "안정감 · 책임감 · 꼼꼼함",
    description: "당신은 팀의 방패! 위험을 미리 감지하고 철저하게 차단하는 수비수형이에요. 실수 후 원인을 분석하는 꼼꼼함과 팀을 지켜내는 강한 책임감이 강점입니다. 김민재처럼 상대의 공격을 원천봉쇄하며 팀의 기반을 만드는 당신, 2026 월드컵에서 팀이 실점하지 않는다면 그건 당신 덕분이에요!",
    strengths: ["철저한 분석력", "강한 책임감", "위기 관리 능력"],
    worldcup: "실점 제로의 철벽! 상대의 공격 패턴을 읽고 미리 차단하는 팀의 방파제 역할을 하는 타입.",
    shareText: "나의 월드컵 포지션 유형은 🛡️ 철벽 수비수형 (김민재 타입)! 팀의 방패이자 든든한 기반"
  },
  GOALKEEPER: {
    title: "수호신 골키퍼형",
    emoji: "🧤",
    color: "#8e44ad",
    star: "조현우 타입",
    starEmoji: "🇰🇷",
    keyword: "집중력 · 담대함 · 정신적 지주",
    description: "당신은 팀의 최후 보루! 어떤 압박에도 흔들리지 않는 집중력과 혼자서 상황을 책임지는 담대함이 강점이에요. 조현우처럼 결정적인 슈팅을 막아내며 팀 전체의 정신적 지주가 되는 타입입니다. 2026 월드컵 16강·8강에서 기적 같은 세이브로 팀을 살리는 영웅이 바로 당신이에요!",
    strengths: ["탁월한 집중력", "위기 상황 담대함", "정신적 리더십"],
    worldcup: "기적의 선방! 불리한 상황에서 오히려 더 강해지며 팀 전체를 지탱하는 정신적 지주 타입.",
    shareText: "나의 월드컵 포지션 유형은 🧤 수호신 골키퍼형 (조현우 타입)! 기적의 선방으로 팀을 구하는 수호신"
  },
  COACH: {
    title: "전략가 감독형",
    emoji: "📋",
    color: "#d35400",
    star: "히딩크 타입",
    starEmoji: "🏆",
    keyword: "전략적 사고 · 통찰력 · 큰 그림",
    description: "당신은 팀의 두뇌! 상황을 분석하고 큰 그림을 그리는 전략가형이에요. 위기에서 판을 뒤집는 전술 변화와 팀 전체를 최적으로 이끄는 통찰력이 강점입니다. 2002 히딩크처럼 불가능해 보이는 상황에서 승리 공식을 찾아내는 전략의 달인이 바로 당신이에요! 4강도 꿈이 아닙니다.",
    strengths: ["전략적 통찰력", "냉철한 판단력", "팀 최적화 능력"],
    worldcup: "판을 뒤집는 감독! 불리한 상황에서도 전술로 승리를 만들어내며 팀 전체를 최고의 컨디션으로 이끄는 타입.",
    shareText: "나의 월드컵 포지션 유형은 📋 전략가 감독형 (히딩크 타입)! 전술로 불가능을 가능으로 만드는 전략가"
  },
  SUPPORTER: {
    title: "열정 서포터형",
    emoji: "📣",
    color: "#e91e63",
    star: "붉은악마 타입",
    starEmoji: "🔴",
    keyword: "열정 · 공동체 · 응원 에너지",
    description: "당신은 팀의 에너지원! 경기장 밖에서도 팀의 사기를 높이는 열정적인 서포터형이에요. 함께 기뻐하고, 함께 슬퍼하며, 팀원들의 에너지를 끌어올리는 것이 특기입니다. 2026 월드컵에서 대한민국 응원전을 이끌며 선수들에게 날개를 달아주는 붉은악마처럼, 당신이 있으면 팀이 더 강해져요!",
    strengths: ["폭발적인 응원 에너지", "팀 결속력", "공동체 리더십"],
    worldcup: "12번째 선수! 응원 에너지로 선수들을 고무시키며 팀이 포기하려 할 때 기적을 만드는 서포터 타입.",
    shareText: "나의 월드컵 포지션 유형은 📣 열정 서포터형 (붉은악마 타입)! 응원으로 기적을 만드는 열정의 상징"
  }
};

const INIT_SCORES = { STRIKER: 0, MIDFIELDER: 0, DEFENDER: 0, GOALKEEPER: 0, COACH: 0, SUPPORTER: 0 };

export default function SoccerTypeTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(INIT_SCORES);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '나는 어떤 축구 포지션 유형? 2026 월드컵 테스트 | CCGG';
  }, []);

  const handleAnswer = (type) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const topType = Object.keys(newScores).reduce((a, b) =>
        newScores[a] >= newScores[b] ? a : b
      );
      setResult(RESULTS[topType]);
      setShowResult(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setScores(INIT_SCORES);
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">⚽ 나는 어떤 축구 포지션 유형?</h1>
        <p className="intro-subtitle">2026 FIFA 월드컵 특집! 10문항으로 알아보는 나의 포지션 유형</p>

        <div className="intro-section">
          <h2>2026 FIFA 월드컵이 열렸다!</h2>
          <p>2026년 6월, 미국·캐나다·멕시코에서 역대 최대 규모(48개국)의 FIFA 월드컵이 진행 중입니다. 대한민국도 출전하며 전 국민의 응원이 뜨겁게 달아오르고 있죠!</p>
          <p>월드컵 시즌, 나는 어떤 포지션 유형일까요? 손흥민처럼 골을 향해 돌진하는 공격수형? 김민재처럼 철저하게 수비하는 수비수형? 아니면 팀을 이끄는 감독형? 10문항으로 알아보세요!</p>
        </div>

        <div className="intro-section">
          <h2>6가지 포지션 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>⚽ 공격수형</strong><p>손흥민 타입. 결정적 한 방을 노리는 과감한 승부사.</p></div>
            <div className="intro-card"><strong>🌐 미드필더형</strong><p>황희찬 타입. 팀의 흐름을 만드는 전천후 연결자.</p></div>
            <div className="intro-card"><strong>🛡️ 수비수형</strong><p>김민재 타입. 팀을 지키는 철벽 방어의 안정감.</p></div>
            <div className="intro-card"><strong>🧤 골키퍼형</strong><p>조현우 타입. 최후의 보루, 기적의 선방 수호신.</p></div>
            <div className="intro-card"><strong>📋 감독형</strong><p>히딩크 타입. 전략으로 불가능을 가능케 하는 두뇌.</p></div>
            <div className="intro-card"><strong>📣 서포터형</strong><p>붉은악마 타입. 응원으로 기적을 만드는 열정.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있습니다. 팀 상황이나 일상에서 나에게 가장 가까운 답을 선택해주세요. 솔직하게 답할수록 정확한 결과가 나옵니다. 소요 시간 약 2분!</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">⚽ 나는 어떤 축구 포지션 유형?</h2>
      <p className="test-subtitle">2026 FIFA 월드컵 특집 · 6가지 포지션 유형 진단</p>

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
          <h3 className="result-header">나의 월드컵 포지션 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
            {result.starEmoji} {result.star}
          </p>
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
            <strong>⚽ 2026 월드컵에서 나의 역할</strong>
            <p>{result.worldcup}</p>
          </div>
          <div className="btn-group">
            <ShareButtons
              shareText={`${result.shareText} - CCGG 2026 월드컵 포지션 테스트`}
              shareUrl={window.location.href}
              testTitle="나는 어떤 축구 포지션 유형?"
            />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
