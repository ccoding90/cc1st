import React, { useState } from 'react';

const QUESTIONS = [
  // E vs I
  { q: "새로운 사람들과 어울리는 파티에 가면...", a: ["에너지가 솟구친다", "빨리 집에 가고 싶어진다"], type: ["E", "I"] },
  { q: "주말에 약속이 없으면...", a: ["무료하고 답답하다", "여유롭고 행복하다"], type: ["E", "I"] },
  { q: "모임에서 나는 주로...", a: ["대화를 주도하는 편이다", "주로 듣는 편이다"], type: ["E", "I"] },
  // S vs N
  { q: "영화나 소설을 볼 때...", a: ["현실적인 스토리가 좋다", "상상력을 자극하는 판타지가 좋다"], type: ["S", "N"] },
  { q: "길을 찾을 때...", a: ["지도나 표지판을 꼼꼼히 본다", "대략적인 방향만 보고 감으로 간다"], type: ["S", "N"] },
  { q: "사과를 보면 드는 생각은?", a: ["빨갛고 맛있겠다 (사실)", "뉴턴, 스티브 잡스 (연상)"], type: ["S", "N"] },
  // T vs F
  { q: "친구가 고민을 털어놓을 때...", a: ["해결책을 제시해준다", "공감해주고 위로해준다"], type: ["T", "F"] },
  { q: "결정을 내릴 때 중요한 건...", a: ["객관적인 사실과 논리", "상황과 사람들의 감정"], type: ["T", "F"] },
  { q: "나를 더 기쁘게 하는 말은?", a: ["'너 진짜 똑똑하다'", "'너 진짜 따뜻한 사람이다'"], type: ["T", "F"] },
  // J vs P
  { q: "여행을 갈 때...", a: ["시간 단위로 계획을 짠다", "비행기 표만 끊고 떠난다"], type: ["J", "P"] },
  { q: "과제를 할 때...", a: ["미리미리 계획적으로 한다", "마감 직전에 몰아서 한다"], type: ["J", "P"] },
  { q: "일과 후의 계획은...", a: ["대략이라도 정해져 있다", "그때그때 내키는 대로 한다"], type: ["J", "P"] }
];

const DESCRIPTIONS = {
  'INTJ': { title: '용의주도한 전략가', img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=600', desc: '상상력이 풍부하며 전략적 사고에 능한 사색가입니다.', traits: ['분석적', '독립적', '창의적'] },
  'INTP': { title: '논리적인 사색가', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600', desc: '끊임없이 새로운 지식을 갈구하는 혁신적인 사색가입니다.', traits: ['지적 호기심', '객관적', '개방적'] },
  'ENTJ': { title: '대담한 통솔자', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600', desc: '대담하고 강한 의지를 가진 리더입니다.', traits: ['결단력', '전략적', '카리스마'] },
  'ENTP': { title: '뜨거운 논쟁을 즐기는 변론가', img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=600', desc: '영리하고 호기심이 많으며 지적 도전을 즐깁니다.', traits: ['혁신적', '빠른 두뇌 회전', '열정적'] },
  'INFJ': { title: '선의의 옹호자', img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600', desc: '조용하고 신비로우며 샘솟는 영감을 가진 이상주의자입니다.', traits: ['통찰력', '따뜻함', '강한 도덕성'] },
  'INFP': { title: '열정적인 중재자', img: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=600', desc: '상냥하고 이타적인 성격의 소유자입니다.', traits: ['이타적', '감수성', '이상주의'] },
  'ENFJ': { title: '정의로운 사회운동가', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600', desc: '카리스마 있고 영감을 주는 리더입니다.', traits: ['공감 능력', '책임감', '조력자'] },
  'ENFP': { title: '재기발랄한 활동가', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600', desc: '자유로운 영혼의 소유자이며 창의적인 사교가입니다.', traits: ['낙천적', '사교적', '호기심'] },
  'ISTJ': { title: '청렴결백한 논리주의자', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600', desc: '실용적이고 사실에 근거해 사고하는 성실한 관리자입니다.', traits: ['철저함', '책임감', '객관적'] },
  'ISFJ': { title: '용감한 수호자', img: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=600', desc: '헌신적이고 따뜻한 마음을 가진 수호자입니다.', traits: ['따뜻함', '충성심', '세심함'] },
  'ESTJ': { title: '엄격한 관리자', img: 'https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=600', desc: '사람과 사물을 관리하는 데 능숙한 행정가입니다.', traits: ['조직적', '추진력', '정직함'] },
  'ESFJ': { title: '사교적인 외교관', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600', desc: '타인에게 각별한 관심을 쏟는 사교적인 성격입니다.', traits: ['따뜻함', '협조적', '조화중시'] },
  'ISTP': { title: '만능 재주꾼', img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600', desc: '대담하고 실용적인 실험가입니다.', traits: ['분석력', '적응력', '실용적'] },
  'ISFP': { title: '호기심 많은 예술가', img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600', desc: '항상 새로운 것을 탐험할 준비가 된 예술가입니다.', traits: ['예술적', '온화함', '개방적'] },
  'ESTP': { title: '모험을 즐기는 사업가', img: 'https://images.unsplash.com/photo-1512138411829-28146a489603?auto=format&fit=crop&q=80&w=600', desc: '에너지가 넘치고 관찰력이 뛰어난 행동가입니다.', traits: ['활동적', '실용적', '빠른판단'] },
  'ESFP': { title: '자유로운 영혼의 연예인', img: 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44?auto=format&fit=crop&q=80&w=600', desc: '즉흥적이고 에너지가 넘치는 연예인입니다.', traits: ['낙천적', '사교성', '공감능력'] }
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
    return (answers.E >= answers.I ? 'E' : 'I') +
           (answers.S >= answers.N ? 'S' : 'N') +
           (answers.T >= answers.F ? 'T' : 'F') +
           (answers.J >= answers.P ? 'J' : 'P');
  };

  if (showResult) {
    const resKey = calculateResult();
    const result = DESCRIPTIONS[resKey];
    return (
      <div className="result-container animate-in">
        <img src={result.img} alt={result.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
        <div style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>당신은...</h2>
          <span className="type-code">{resKey}</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px' }}>{result.title}</h3>
          <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#444', marginBottom: '25px' }}>{result.desc}</p>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '30px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {result.traits.map((trait, idx) => (
              <span key={idx} style={{ background: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid #eee' }}>{trait}</span>
            ))}
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()}>다시 테스트하기</button>
        </div>
      </div>
    );
  }

  const progress = (currentIdx / QUESTIONS.length) * 100;

  return (
    <div className="test-page animate-in">
      <div className="progress-bar-container">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="question-container" style={{ border: 'none', boxShadow: 'none', padding: '0' }}>
        <h3 className="mbti-question">{QUESTIONS[currentIdx].q}</h3>
        <div className="options">
          <button className="btn-option" onClick={() => handleAnswer(QUESTIONS[currentIdx].type[0])}>
            {QUESTIONS[currentIdx].a[0]}
          </button>
          <button className="btn-option" onClick={() => handleAnswer(QUESTIONS[currentIdx].type[1])}>
            {QUESTIONS[currentIdx].a[1]}
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        질문 {currentIdx + 1} / {QUESTIONS.length}
      </div>
    </div>
  );
};

export default MbtiTest;
