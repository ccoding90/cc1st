import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    text: "월급이 들어왔다! 가장 먼저 드는 생각은? 💰",
    options: [
      { text: "📈 이번엔 어느 성장주를 담을까?", type: "GROWTH" },
      { text: "🏦 일단 예적금부터 안전하게 넣어야지", type: "SAFE" }
    ]
  },
  {
    id: 2,
    text: "보유 주식이 갑자기 15% 하락했다. 나의 반응은? 📉",
    options: [
      { text: "💎 오히려 좋아, 저점 매수 기회!", type: "VALUE" },
      { text: "🚨 손절하고 다른 종목으로 갈아타야 해", type: "TREND" }
    ]
  },
  {
    id: 3,
    text: "투자 정보를 주로 얻는 곳은? 📱",
    options: [
      { text: "📊 재무제표, 기업 분석 리포트", type: "VALUE" },
      { text: "🔥 유튜브·커뮤니티 핫이슈", type: "TREND" }
    ]
  },
  {
    id: 4,
    text: "이상적인 투자 포트폴리오는? 🗂️",
    options: [
      { text: "🤖 AI·반도체 성장주 집중 투자", type: "GROWTH" },
      { text: "🌍 국내외 ETF로 분산 투자", type: "SAFE" }
    ]
  },
  {
    id: 5,
    text: "주식 차트를 볼 때 가장 먼저 보는 것은? 🔍",
    options: [
      { text: "📈 이평선, 거래량 등 기술적 지표", type: "TREND" },
      { text: "📋 PER·PBR 같은 밸류에이션 지표", type: "VALUE" }
    ]
  },
  {
    id: 6,
    text: "친구가 '이 주식 지금 엄청 핫해!'라고 알려줬다. 나는?",
    options: [
      { text: "🤔 일단 기업 실적부터 직접 분석해봐야지", type: "VALUE" },
      { text: "⚡ 일단 소액이라도 먼저 사보자!", type: "TREND" }
    ]
  },
  {
    id: 7,
    text: "투자에서 가장 중요하게 생각하는 것은? 🎯",
    options: [
      { text: "🚀 미래 성장성과 기술 혁신", type: "GROWTH" },
      { text: "🛡️ 원금 보전과 안정적인 수익", type: "SAFE" }
    ]
  },
  {
    id: 8,
    text: "나의 투자 기간 선호도는? ⏰",
    options: [
      { text: "📅 10년 이상 장기 보유", type: "VALUE" },
      { text: "⚡ 수익 나면 빠르게 수익 실현", type: "TREND" }
    ]
  },
  {
    id: 9,
    text: "KOSPI 5,000 돌파 뉴스가 떴다! 나의 반응은? 🎉",
    options: [
      { text: "🤑 지금이라도 AI·반도체주 더 담아야지", type: "GROWTH" },
      { text: "🧘 이미 충분히 올랐으니 리밸런싱할 때", type: "SAFE" }
    ]
  },
  {
    id: 10,
    text: "주식 투자의 궁극적인 목표는? 🏆",
    options: [
      { text: "💰 노후 준비·경제적 자유", type: "VALUE" },
      { text: "🎢 짜릿한 수익 경험과 재미", type: "TREND" }
    ]
  }
];

const RESULTS = {
  GROWTH: {
    title: "성장주 투자형",
    emoji: "🚀",
    color: "#0095f6",
    keyword: "미래 지향 · AI/반도체 · 고위험 고수익",
    description: "당신은 미래 기술에 베팅하는 성장주 투자자예요! AI, 반도체, 2차전지 등 차세대 산업을 이끌 기업에 투자하는 것을 선호하죠. 2026년 KOSPI 5,000 시대를 이끄는 AI·반도체 섹터가 딱 맞아요. 단기 변동성은 감수하더라도 장기적으로 큰 수익을 추구하는 스타일입니다.",
    strengths: ["트렌드 파악 능력", "미래 산업 이해도", "높은 위험 감수성"],
    tip: "삼성전자·SK하이닉스 같은 반도체 대장주와 AI 관련 ETF를 함께 담아 리스크를 분산해보세요. 성장주는 변동성이 크니 분할 매수 전략을 꼭 활용하세요!",
    shareText: "나의 주식 투자 유형은 🚀 성장주 투자형! AI·반도체에 올라타는 미래 지향 투자자"
  },
  VALUE: {
    title: "가치투자형",
    emoji: "💎",
    color: "#20bf6b",
    keyword: "장기 투자 · 내재가치 분석 · 워런버핏 스타일",
    description: "당신은 기업의 진짜 가치를 찾아내는 가치투자자예요! PER·PBR 등 지표를 꼼꼼히 분석하고 저평가된 우량주를 발굴하는 것을 즐기죠. 현재 KOSPI의 PER 8.2배는 역사적 저점 수준 — 당신 같은 가치투자자에겐 딱 좋은 환경이에요. 단기 변동에 흔들리지 않는 든든한 투자자입니다!",
    strengths: ["재무제표 분석 능력", "감정 통제력", "장기적 시야"],
    tip: "배당 성장주와 기업지배구조 개선 테마를 주목해보세요. 정부의 코리아 디스카운트 해소 정책 수혜 기업들도 훌륭한 선택이 될 수 있어요!",
    shareText: "나의 주식 투자 유형은 💎 가치투자형! 저평가 우량주를 발굴하는 워런버핏 스타일"
  },
  SAFE: {
    title: "안정형 투자자",
    emoji: "🛡️",
    color: "#a55eea",
    keyword: "원금 보전 · ETF · 리스크 최소화",
    description: "당신은 안전하고 꾸준한 수익을 추구하는 안정형 투자자예요! 국내외 ETF와 인덱스 펀드를 통한 분산 투자를 선호하며 변동성보다 예측 가능한 수익을 중시하죠. '잘 자는 투자'가 최고라는 철학을 갖고 있어요. 2026년 활황장에서도 흔들리지 않는 현명한 자산 배분 전략가!",
    strengths: ["리스크 관리 능력", "꾸준한 투자 습관", "감정에 휘둘리지 않음"],
    tip: "KODEX 200, S&P500 ETF 같은 지수 추종 상품에 정기 적립식 투자를 고려해보세요. 채권 ETF를 20~30% 편입해 포트폴리오 안정성을 높이는 것도 좋아요!",
    shareText: "나의 주식 투자 유형은 🛡️ 안정형 투자자! ETF로 꾸준히 쌓아가는 현명한 투자자"
  },
  TREND: {
    title: "트렌드 투자형",
    emoji: "⚡",
    color: "#fd9644",
    keyword: "테마주 · 이슈 추종 · 빠른 판단력",
    description: "당신은 시장의 흐름을 빠르게 포착하는 트렌드 투자형이에요! 핫한 테마와 이슈를 재빠르게 파악해 타이밍에 맞게 투자하는 것을 즐기죠. K-컬처·AI·정치 테마주 등 트렌드에 민감하게 반응해요. 빠른 정보 수집 능력과 결단력이 강점이지만, 손절 규칙을 철저히 지키는 게 핵심입니다!",
    strengths: ["시장 트렌드 포착", "빠른 결단력", "정보 수집 능력"],
    tip: "테마주는 등락이 크므로 절대 몰빵하지 마세요! 전체 포트폴리오의 20% 이내로 제한하고, 반드시 손절 기준선(-10~15%)을 사전에 설정하는 습관을 들이세요.",
    shareText: "나의 주식 투자 유형은 ⚡ 트렌드 투자형! 시장 흐름을 빠르게 포착하는 기민한 투자자"
  }
};

export default function InvestmentTypeTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ GROWTH: 0, VALUE: 0, SAFE: 0, TREND: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '주식 투자 유형 테스트 - 나의 투자 성향은? | CCGG';
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
    setScores({ GROWTH: 0, VALUE: 0, SAFE: 0, TREND: 0 });
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">📈 주식 투자 유형 테스트</h2>
      <p className="test-subtitle">나의 투자 성향을 알아보세요 · 2026 주식 트렌드 반영</p>

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
          <h3 className="result-header">나의 주식 투자 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 나의 투자 강점</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 2026 투자 전략 팁</strong>
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
