import React, { useState } from 'react';

const questions = [
  { id: 1, text: "주말 데이트, 당신의 취향은?", options: [{ text: "핫플 카페와 맛집 투어! 📸", score: "E" }, { text: "집에서 넷플릭스 보며 뒹굴뒹굴 🍿", score: "I" }] },
  { id: 2, text: "연락 빈도에 대한 당신의 생각은?", options: [{ text: "사귀면 당연히 시도 때도 없이 연락해야지! 💬", score: "F" }, { text: "각자 할 일 하면서 필요할 때만 톡 📱", score: "T" }] },
  { id: 3, text: "기념일을 챙기는 방식은?", options: [{ text: "서프라이즈 파티와 화려한 선물! 🎉", score: "E" }, { text: "조용하고 분위기 있는 곳에서 로맨틱한 저녁 🍷", score: "I" }] },
  { id: 4, text: "크게 다투었을 때 나는?", options: [{ text: "그 자리에서 바로바로 대화로 풀어야 해 🗣️", score: "E" }, { text: "혼자 생각할 시간을 먼저 가져야 해 💭", score: "I" }] },
  { id: 5, text: "애인의 이성 친구, 어디까지 허용?", options: [{ text: "단둘이 만나는 건 절대 안 돼! 🙅‍♀️", score: "F" }, { text: "선만 잘 지키면 밥 먹는 것 정돈 오케이 👌", score: "T" }] },
  { id: 6, text: "나의 애정표현 방식은?", options: [{ text: "사랑해! 보고싶어! 적극적인 애정표현 💕", score: "F" }, { text: "말보다는 행동으로 은근하게 챙겨주는 츤데레 🎁", score: "T" }] },
  { id: 7, text: "데이트 코스를 짤 때 나는?", options: [{ text: "시간대별로 완벽하게 계획된 J의 데이트 📝", score: "J" }, { text: "그날 기분에 따라 발길 닿는 대로 P의 데이트 🚶‍♂️", score: "P" }] },
  { id: 8, text: "함께 보고 싶은 영화 장르는?", options: [{ text: "가슴 몽글몽글해지는 로맨틱 코미디 🥰", score: "F" }, { text: "심장이 쫄깃해지는 스릴러/SF 🤯", score: "T" }] },
  { id: 9, text: "길을 가다 넘어져서 다쳤을 때 원하는 반응은?", options: [{ text: "괜찮아?! 많이 아프겠다 ㅠㅠ (폭풍 공감) 😭", score: "F" }, { text: "얼른 병원부터 가자! 약 발라줄게 (빠른 해결) 🏥", score: "T" }] },
  { id: 10, text: "이상형의 패션 스타일은?", options: [{ text: "깔끔하고 댄디한 꾸안꾸 스타일 👔", score: "J" }, { text: "자유롭고 개성 넘치는 힙한 스타일 🕶️", score: "P" }] },
];

const celebrityResults = [
  {
    name: "차은우",
    emoji: "🌟",
    image: "https://images.unsplash.com/photo-1594744803329-e583d7de0713?auto=format&fit=crop&q=80&w=400&h=400",
    reason: "당신은 따뜻하고 세심한 배려를 중요하게 생각하는군요! 만찢남 비주얼에 다정함까지 갖춘 '차은우' 스타일이 당신과 찰떡궁합입니다. 매일 심쿵하는 로맨틱한 데이트를 기대해 보세요! ✨"
  },
  {
    name: "제니 (JENNIE)",
    emoji: "🖤",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    reason: "당신은 트렌디하고 개성 있는 매력에 끌리는 타입! 힙하고 당당하면서도 귀여운 고양이 같은 매력을 가진 '제니' 스타일이 당신의 마음을 사로잡을 완벽한 이상형입니다. 🖤"
  },
  {
    name: "티모시 샬라메",
    emoji: "🎬",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    reason: "당신은 감수성이 풍부하고 깊은 대화를 나눌 수 있는 사람을 원하네요! 예술적인 영감과 몽환적인 분위기를 가진 '티모시 샬라메' 스타일과 깊은 교감을 나눌 수 있을 거예요. 🎬"
  },
  {
    name: "젠데이아",
    emoji: "⚡",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    reason: "당신은 쿨하고 에너지 넘치는 관계를 선호하는군요! 언제나 자신감 넘치고 유쾌한 바이브를 뿜어내는 '젠데이아' 스타일과 함께라면 매일매일이 시트콤처럼 즐거울 거예요! ⚡"
  }
];

export default function CelebrityTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ E: 0, I: 0, F: 0, T: 0, J: 0, P: 0 });
  const [showResult, setShowResult] = useState(false);
  const [matchedCeleb, setMatchedCeleb] = useState(null);

  const handleAnswer = (scoreType) => {
    const newScores = { ...scores, [scoreType]: scores[scoreType] + 1 };
    setScores(newScores);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores) => {
    let celebIndex = 0;
    if (finalScores.E > finalScores.I && finalScores.F > finalScores.T) celebIndex = 0;
    else if (finalScores.E > finalScores.I && finalScores.T >= finalScores.F) celebIndex = 1;
    else if (finalScores.I >= finalScores.E && finalScores.F > finalScores.T) celebIndex = 2;
    else celebIndex = 3;
    setMatchedCeleb(celebrityResults[celebIndex]);
    setShowResult(true);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(`💘 나의 찰떡 연예인 이상형은 ${matchedCeleb.name}! 테스트 해봐: ${shareUrl}`);
      alert('✅ 링크가 복사되었습니다! 친구에게 공유해보세요 😊');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  const progressPercent = ((currentQuestion) / questions.length) * 100;

  if (!started) {
    return (
      <div className="test-intro animate-in">
        <h1 className="intro-title">💘 연예인 이상형 테스트</h1>
        <p className="intro-subtitle">나와 찰떡인 연예인 이상형은 누구일까? 10문항으로 알아보는 매력 궁합 검사</p>

        <div className="intro-section">
          <h2>이상형 테스트란?</h2>
          <p>연애에서 끌리는 스타일, 애정 표현 방식, 데이트 취향, 갈등 해결 방법 등을 분석해 나와 가장 잘 맞는 이상형의 유형을 도출합니다. 단순한 외모 취향이 아닌, 관계의 방식과 가치관을 기반으로 매칭 결과를 제시합니다.</p>
          <p>우리는 연애를 시작할 때 종종 "눈에 띄는 외모"나 "첫인상"에 집중하지만, 장기적으로 행복한 관계를 만드는 요소는 성격적 궁합과 소통 방식의 일치에 있습니다. 이 테스트는 당신의 연애 스타일과 가치관을 파악해, 어떤 유형의 이상형과 가장 잘 맞는지를 알려드립니다.</p>
        </div>

        <div className="intro-section">
          <h2>어떤 기준으로 매칭되나요?</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <strong>에너지 스타일 (E/I)</strong>
              <p>활발하고 적극적인 관계를 선호하는지, 차분하고 깊이 있는 연결을 원하는지에 따라 매칭이 달라집니다.</p>
            </div>
            <div className="intro-card">
              <strong>감정 표현 방식 (F/T)</strong>
              <p>감성적이고 공감 넘치는 애정 표현을 원하는지, 실용적이고 든든한 파트너를 원하는지를 분석합니다.</p>
            </div>
            <div className="intro-card">
              <strong>라이프스타일 (J/P)</strong>
              <p>계획적이고 안정적인 관계를 선호하는지, 자유롭고 즉흥적인 만남을 즐기는지를 파악합니다.</p>
            </div>
          </div>
        </div>

        <div className="intro-section">
          <h2>매칭 연예인 유형</h2>
          <p>차은우(따뜻한 로맨티스트), 제니(트렌디한 개성파), 티모시 샬라메(감성적인 예술가), 젠데이아(에너지 넘치는 자유인) 4가지 유형 중 당신과 가장 어울리는 이상형 스타일을 매칭합니다. 실제 특정 연예인을 지칭하는 것이 아닌, 해당 이미지를 가진 이상형 유형을 상징적으로 표현한 것입니다.</p>
          <p>총 10문항이며, 솔직하게 나의 연애 취향과 가치관을 선택해주세요. 소요 시간은 약 2분입니다.</p>
        </div>

        <button className="btn-start" onClick={() => setStarted(true)}>
          테스트 시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">💘 나와 찰떡인 연예인 이상형 테스트</h2>

      {!showResult ? (
        <div className="test-card">
          <div className="progress-bar"><div style={{ width: `${progressPercent}%` }} /></div>
          <p className="progress-text">진행도: {currentQuestion + 1} / {questions.length}</p>
          <h3 className="question-text">{questions[currentQuestion].text}</h3>
          <div className="button-group">
            {questions[currentQuestion].options.map((option, index) => (
              <button key={index} className="option-btn" onClick={() => handleAnswer(option.score)}>
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="result-card">
          <h3 className="result-header">당신의 완벽한 이상형은 바로...</h3>
          <img src={matchedCeleb.image} alt={matchedCeleb.name} className="celeb-img" />
          <h2 className="celeb-name">{matchedCeleb.name} {matchedCeleb.emoji}</h2>
          <p className="reason-text">{matchedCeleb.reason}</p>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>링크 공유하기 🔗</button>
            <button className="retry-btn" onClick={() => window.location.reload()}>다시 하기 🔄</button>
          </div>
        </div>
      )}
    </div>
  );
}