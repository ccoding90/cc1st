import React, { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  {
    id: 1,
    text: "주말에 새로 생긴 팝업스토어 소식을 봤다. 나는? 🛍️",
    options: [
      { text: "⏱️ 웨이팅 시간 대비 얻는 게 있는지 먼저 따져봄", type: "ROI" },
      { text: "🏃 일단 가보고 별로면 그때 나오면 됨", type: "HAEBOM" }
    ]
  },
  {
    id: 2,
    text: "친구가 \"요즘 뭐 좋은 거 없어?\"라고 묻는다. 나의 반응은? 💬",
    options: [
      { text: "🎯 내가 고르고 골라 아끼는 리스트를 꺼내 추천", type: "EYE" },
      { text: "🤗 \"너 요즘 어때?\" 친구 얘기부터 먼저 들어줌", type: "HUMAN" }
    ]
  },
  {
    id: 3,
    text: "새로운 AI 툴이 나왔다는 소식! 나는? 🤖",
    options: [
      { text: "🚀 바로 가입해서 이것저것 만들어봄", type: "HAEBOM" },
      { text: "📊 내 시간을 얼마나 아껴주는지 비교해보고 결정", type: "ROI" }
    ]
  },
  {
    id: 4,
    text: "AI가 다 써주는 시대, 생일 축하 메시지는? 🎂",
    options: [
      { text: "✍️ 서툴러도 내가 직접 쓴 손편지가 최고", type: "HUMAN" },
      { text: "🖼️ 받는 사람 취향에 딱 맞는 카드와 선물을 신중히 고름", type: "EYE" }
    ]
  },
  {
    id: 5,
    text: "모임 약속이 잡혔다. 내가 제일 먼저 생각하는 것은? 📅",
    options: [
      { text: "💸 이동 시간·비용 대비 만족도가 나올까?", type: "ROI" },
      { text: "💛 오랜만에 그 사람들 얼굴 보는 게 좋음", type: "HUMAN" }
    ]
  },
  {
    id: 6,
    text: "배우고 싶은 게 생겼다. 나의 시작 방식은? 🎨",
    options: [
      { text: "🔥 원데이 클래스부터 바로 신청! 해봐야 알지", type: "HAEBOM" },
      { text: "🔍 후기와 커리큘럼을 꼼꼼히 비교하고 제일 좋은 곳으로", type: "EYE" }
    ]
  },
  {
    id: 7,
    text: "SNS 피드를 볼 때 내가 저장 버튼을 누르는 게시물은? 📌",
    options: [
      { text: "🧠 나중에 써먹을 수 있는 꿀팁·정보", type: "ROI" },
      { text: "✨ 감도 높은 사진·공간·디자인 레퍼런스", type: "EYE" }
    ]
  },
  {
    id: 8,
    text: "회사에서 새 프로젝트를 맡았다. 나의 첫 행동은? 💼",
    options: [
      { text: "🛠️ 초안부터 빠르게 만들어 보고 고쳐나감", type: "HAEBOM" },
      { text: "☕ 같이 일할 동료들과 먼저 이야기를 나눔", type: "HUMAN" }
    ]
  },
  {
    id: 9,
    text: "요즘 나를 가장 잘 설명하는 말은? 🪞",
    options: [
      { text: "🧮 시간도 돈도 관계도 '가성비'가 중요함", type: "ROI" },
      { text: "🎲 실패해도 괜찮아, 일단 해봄!", type: "HAEBOM" }
    ]
  },
  {
    id: 10,
    text: "AI 시대에 내가 가장 지키고 싶은 나만의 무기는? 🛡️",
    options: [
      { text: "👁️ 좋은 것을 알아보는 눈, 안목", type: "EYE" },
      { text: "🫶 사람 냄새 나는 따뜻함과 진심", type: "HUMAN" }
    ]
  }
];

const RESULTS = {
  ROI: {
    title: "라이프 ROI 계산러",
    emoji: "🧮",
    color: "#2980b9",
    keyword: "효율 추구 · 합리적 선택 · 손익 감각",
    description: "당신은 시간과 돈은 물론 인간관계까지 '투자 대비 효과'를 따져보는 '라이프 ROI 계산러'예요! 트렌드 코리아 2027이 꼽은 '라이프 ROI' 키워드의 대표 주자죠. 무엇을 하든 내가 쓰는 자원이 아깝지 않은지 먼저 계산하기 때문에 후회할 선택을 잘 하지 않아요. 정보를 모으고 비교하는 능력이 뛰어나 주변에서 '똑똑한 소비'의 상담 창구가 되기도 해요.",
    strengths: ["합리적 의사결정", "시간 관리 능력", "후회 없는 소비"],
    tip: "모든 걸 계산하다 보면 '측정할 수 없는 즐거움'을 놓칠 수 있어요. 한 달에 한 번은 ROI를 따지지 않는 '그냥 하는 날'을 만들어보세요. 계산 밖에서 의외의 수익이 나기도 하거든요!",
    shareText: "나의 2027 트렌드 유형은 🧮 라이프 ROI 계산러! 시간도 돈도 관계도 효율 최우선"
  },
  HAEBOM: {
    title: "해봄경제 실행러",
    emoji: "🚀",
    color: "#e67e22",
    keyword: "빠른 실행 · 도전 정신 · 수정하며 성장",
    description: "당신은 완벽하게 준비하기보다 '일단 해보고 고치는' 해봄경제 실행러예요! 트렌드 코리아 2027은 AI 도구 덕분에 시도 비용이 낮아지면서 완벽한 준비보다 실행과 수정이 더 중요해진다고 봤는데, 당신이 바로 그 흐름의 주인공이에요. 생각만 하는 사람보다 열 배는 더 많은 경험을 쌓고, 그 경험이 결국 실력이 되죠.",
    strengths: ["압도적 실행력", "실패 내성", "빠른 학습 속도"],
    tip: "시작은 잘하지만 마무리가 흐지부지될 수 있어요. 새로운 걸 시작할 때 '어디까지 해보면 성공'인지 작은 결승선을 먼저 정해보세요. 해봄 + 끝냄이 만나면 무적이에요!",
    shareText: "나의 2027 트렌드 유형은 🚀 해봄경제 실행러! 완벽보다 실행, 일단 해봄"
  },
  EYE: {
    title: "안목자본 큐레이터",
    emoji: "👁️",
    color: "#8e44ad",
    keyword: "높은 감도 · 취향 큐레이션 · 선별의 힘",
    description: "당신은 좋은 것을 알아보는 눈이 남다른 '안목자본 큐레이터'예요! 트렌드 코리아 2027에서 김난도 교수는 AI 시대 인간에게 가장 필요한 역량으로 '안목'을 꼽았고, 이것이 사회적 영향력과 경제적 기회로 쌓여 '자본'이 될 것이라 전망했어요. 수많은 선택지 속에서 진짜를 골라내는 당신의 취향은 이미 주변 사람들에게 믿고 보는 레퍼런스예요.",
    strengths: ["뛰어난 심미안", "정보 선별 능력", "취향의 일관성"],
    tip: "안목이 높아질수록 기준도 함께 높아져 만족하기 어려워질 수 있어요. 가끔은 내 기준에 안 맞는 것도 열린 마음으로 즐겨보세요. 안목은 다양한 경험에서 더 깊어지거든요!",
    shareText: "나의 2027 트렌드 유형은 👁️ 안목자본 큐레이터! 좋은 걸 알아보는 눈이 곧 자본"
  },
  HUMAN: {
    title: "휴먼엣지 따뜻러",
    emoji: "🫶",
    color: "#e74c3c",
    keyword: "인간미 · 진정성 · 관계의 온기",
    description: "당신은 AI가 대신할 수 없는 '사람의 온기'를 가진 휴먼엣지 따뜻러예요! 트렌드 코리아 2027은 AI 자동화 시대일수록 인간의 흔적 자체가 차별화 요소가 된다고 봤어요. 서툴러도 직접 쓴 메시지, 먼저 건네는 안부, 상대를 진심으로 대하는 태도까지, 당신이 가진 것들이 점점 더 귀해지는 시대가 오고 있어요.",
    strengths: ["깊은 공감 능력", "신뢰를 주는 진정성", "관계 회복력"],
    tip: "다른 사람을 챙기느라 정작 나를 챙기는 건 뒷전이 되기 쉬워요. 남에게 주는 따뜻함의 10%만이라도 나 자신에게 돌려주세요. 나를 아끼는 사람이 남도 오래 아낄 수 있어요.",
    shareText: "나의 2027 트렌드 유형은 🫶 휴먼엣지 따뜻러! AI 시대에 더 빛나는 사람 냄새"
  }
};

const INITIAL_SCORES = { ROI: 0, HAEBOM: 0, EYE: 0, HUMAN: 0 };

export default function Trend2027Test() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = '트렌드 코리아 2027 유형 테스트 - 나는 어떤 2027 트렌드형 인간? | CCGG';
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
    setScores(INITIAL_SCORES);
    setShowResult(false);
    setResult(null);
  };

  const progressPercent = (currentQuestion / QUESTIONS.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">📘 트렌드 코리아 2027 유형 테스트</h1>
        <p className="intro-subtitle">2027년을 이끌 트렌드 키워드 중, 나는 어떤 유형의 사람일까?</p>

        <div className="intro-section">
          <h2>트렌드 코리아 2027이란?</h2>
          <p>서울대 소비트렌드분석센터 김난도 교수 연구팀이 매년 가을 발표하는 『트렌드 코리아』의 2027년판이 출간됐어요. 올해 슬로건은 무리에서 먼저 뛰쳐나오는 한 마리 양, 'ALPHA SHEEP'. 권태사회, 라이프 ROI, 폼팩터 시프트, 해봄경제, 저장인류, 바이브 워킹, 리:텐션 전략, 휴먼엣지, 하프 시그널, 안목자본까지 10대 키워드를 제시했어요.</p>
          <p>이 테스트는 그중 개인의 성향과 가장 맞닿아 있는 4가지 키워드를 골라, 지금 나의 선택 방식이 어떤 트렌드에 가까운지 알아보는 재미용 테스트예요. (도서·출판사와 무관한 비공식 테스트입니다.)</p>
        </div>

        <div className="intro-section">
          <h2>4가지 2027 트렌드 유형</h2>
          <div className="intro-grid">
            <div className="intro-card"><strong>🧮 라이프 ROI 계산러</strong><p>시간·돈·관계까지 투자 대비 효과를 따지는 효율파입니다.</p></div>
            <div className="intro-card"><strong>🚀 해봄경제 실행러</strong><p>완벽한 준비보다 일단 해보고 고치는 실행파입니다.</p></div>
            <div className="intro-card"><strong>👁️ 안목자본 큐레이터</strong><p>좋은 것을 알아보는 눈이 남다른 취향파입니다.</p></div>
            <div className="intro-card"><strong>🫶 휴먼엣지 따뜻러</strong><p>AI가 대신할 수 없는 사람의 온기를 가진 진심파입니다.</p></div>
          </div>
        </div>

        <div className="intro-section">
          <h2>검사 방법</h2>
          <p>총 10문항으로 구성되어 있으며, 일상 속 선택 상황에서 나와 더 가까운 답을 골라주세요. 정답은 없으니 솔직하게 답할수록 정확해요. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">📘 트렌드 코리아 2027 유형 테스트</h2>
      <p className="test-subtitle">나는 어떤 2027 트렌드형 인간? · 10월 신규 테스트</p>

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
          <h3 className="result-header">나의 2027 트렌드 유형은</h3>
          <h2 className="result-type-title" style={{ color: result.color }}>
            {result.title}
          </h2>
          <p className="result-keyword">{result.keyword}</p>
          <p className="result-description">{result.description}</p>
          <div className="result-strengths">
            <strong>✨ 나의 2027 무기</strong>
            <div className="strength-tags">
              {result.strengths.map((s, i) => (
                <span key={i} className="strength-tag">{s}</span>
              ))}
            </div>
          </div>
          <div className="result-tip-box">
            <strong>💡 2027을 위한 한 줄 팁</strong>
            <p>{result.tip}</p>
          </div>
          <div className="btn-group">
            <ShareButtons shareText={`${result.shareText} - CCGG 트렌드 코리아 2027 유형 테스트`} shareUrl={window.location.href} testTitle="트렌드 코리아 2027 유형 테스트 결과" />
            <button className="retry-btn" onClick={handleRetry}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}
