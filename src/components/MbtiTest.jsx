import React, { useState } from 'react';

const QUESTIONS = [
  // E vs I
  { q: "새로운 사람들과 어울리는 파티에 가면...", a: ["에너지가 솟구친다", "빨리 집에 가고 싶어진다"], type: ["E", "I"] },
  { q: "주말에 약속이 없으면...", a: ["무료하고 답답하다", "여유롭고 행복하다"], type: ["E", "I"] },
  { q: "생각을 표현할 때...", a: ["말이 먼저 나가는 편이다", "충분히 생각하고 말한다"], type: ["E", "I"] },
  { q: "문제 해결이 필요할 때...", a: ["사람들과 상의하며 해결한다", "혼자 깊이 고민하며 해결한다"], type: ["E", "I"] },
  { q: "모임에서 나는 주로...", a: ["대화를 주도하는 편이다", "주로 듣는 편이다"], type: ["E", "I"] },
  // S vs N
  { q: "영화나 소설을 볼 때...", a: ["현실적인 스토리가 좋다", "상상력을 자극하는 판타지가 좋다"], type: ["S", "N"] },
  { q: "길을 찾을 때...", a: ["지도나 표지판을 꼼꼼히 본다", "대략적인 방향만 보고 감으로 간다"], type: ["S", "N"] },
  { q: "일을 할 때...", a: ["설명서대로 차근차근 한다", "나만의 새로운 방식을 시도한다"], type: ["S", "N"] },
  { q: "미래에 대해 생각할 때...", a: ["당장 눈앞의 계획이 중요하다", "먼 미래의 가능성을 상상한다"], type: ["S", "N"] },
  { q: "사과를 보면 드는 생각은?", a: ["빨갛고 맛있겠다 (사실)", "뉴턴, 스티브 잡스, 백설공주 (연상)"], type: ["S", "N"] },
  // T vs F
  { q: "친구가 고민을 털어놓을 때...", a: ["해결책을 제시해준다", "공감해주고 위로해준다"], type: ["T", "F"] },
  { q: "결정을 내릴 때 중요한 건...", a: ["객관적인 사실과 논리", "상황과 사람들의 감정"], type: ["T", "F"] },
  { q: "비판을 받았을 때...", a: ["내용이 맞으면 수긍한다", "말투나 감정이 먼저 상한다"], type: ["T", "F"] },
  { q: "나를 더 기쁘게 하는 말은?", a: ["'너 진짜 똑똑하다'", "'너 진짜 따뜻한 사람이다'"], type: ["T", "F"] },
  { q: "논쟁이 벌어지면...", a: ["누가 맞는지 따지는 게 중요하다", "서로의 기분을 상하지 않게 하는 게 중요하다"], type: ["T", "F"] },
  // J vs P
  { q: "여행을 갈 때...", a: ["시간 단위로 계획을 짠다", "비행기 표만 끊고 떠난다"], type: ["J", "P"] },
  { q: "과제를 할 때...", a: ["미리미리 계획적으로 한다", "마감 직전에 몰아서 한다"], type: ["J", "P"] },
  { q: "책상 위 상태는 주로...", a: ["항상 정돈되어 있다", "자유롭게 어질러져 있다"], type: ["J", "P"] },
  { q: "약속 시간이 다가오면...", a: ["5분 전에 미리 도착해 있다", "정각에 맞춰가거나 조금 늦는다"], type: ["J", "P"] },
  { q: "일과 후의 계획은...", a: ["대략이라도 정해져 있다", "그때그때 내키는 대로 한다"], type: ["J", "P"] }
];

const DESCRIPTIONS = {
  'INTJ': '용의주도한 전략가: 모든 일에 계획이 있는 상상력 풍부한 사색가.',
  'INTP': '논리적인 사색가: 지식을 갈구하는 혁신적인 발명가.',
  'ENTJ': '대담한 통솔자: 길을 찾아내거나 만들어내는 강한 의지의 리더.',
  'ENTP': '뜨거운 논쟁을 즐기는 변론가: 지적 도전을 즐기는 영리한 사색가.',
  'INFJ': '선의의 옹호자: 조용하지만 영감을 주는 이상주의자.',
  'INFP': '열정적인 중재자: 이타주의적인 시적인 영혼.',
  'ENFJ': '정의로운 사회운동가: 청중을 사로잡는 카리스마 리더.',
  'ENFP': '재기발랄한 활동가: 자유로운 영혼의 낙천주의자.',
  'ISTJ': '청렴결백한 논리주의자: 사실에 근거한 헌신적인 관리자.',
  'ISFJ': '용감한 수호자: 소중한 사람을 보호하는 헌신적인 사람.',
  'ESTJ': '엄격한 관리자: 사람과 사물을 관리하는 데 능숙한 행정가.',
  'ESFJ': '사교적인 외교관: 타인에게 각별한 관심을 쏟는 수호자.',
  'ISTP': '만능 재주꾼: 도구 사용에 능한 대담한 실험가.',
  'ISFP': '호기심 많은 예술가: 새로운 것을 시도하는 매력적인 예술가.',
  'ESTP': '모험을 즐기는 사업가: 에너지가 넘치고 직관적인 사업가.',
  'ESFP': '자유로운 영혼의 연예인: 즉흥적이고 에너지가 넘치는 연예인.'
};

const MbtiTest = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (type) => {
    setAnswers(prev => ({ ...prev, [type]: prev[type] + 1 }));
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateResult = () => {
    const res = 
      (answers.E >= answers.I ? 'E' : 'I') +
      (answers.S >= answers.N ? 'S' : 'N') +
      (answers.T >= answers.F ? 'T' : 'F') +
      (answers.J >= answers.P ? 'J' : 'P');
    return res;
  };

  if (showResult) {
    const result = calculateResult();
    return (
      <div className="result-container animate-in">
        <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>당신의 성격 유형은</h2>
        <span className="type-code">{result}</span>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>{DESCRIPTIONS[result]}</p>
        <button className="btn-primary" onClick={() => window.location.reload()} style={{ width: '100%' }}>다시 테스트하기</button>
      </div>
    );
  }

  const progress = ((currentIdx) / QUESTIONS.length) * 100;

  return (
    <div className="test-container animate-in">
      <div className="progress-bar-container">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="question-content">
        <h3 className="mbti-question">{QUESTIONS[currentIdx].q}</h3>
        <button className="btn-option" onClick={() => handleAnswer(QUESTIONS[currentIdx].type[0])}>
          {QUESTIONS[currentIdx].a[0]}
        </button>
        <button className="btn-option" onClick={() => handleAnswer(QUESTIONS[currentIdx].type[1])}>
          {QUESTIONS[currentIdx].a[1]}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        {currentIdx + 1} / {QUESTIONS.length}
      </div>
    </div>
  );
};

export default MbtiTest;
