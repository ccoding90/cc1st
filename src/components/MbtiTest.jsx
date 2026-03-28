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
  'INTJ': {
    title: '용의주도한 전략가',
    img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=600',
    desc: '상상력이 풍부하며 전략적 사고에 능한 사색가입니다. 모든 일에 계획이 있으며 독창적인 아이디어를 실현하는 데 탁월합니다.',
    traits: ['분석적이고 논리적임', '높은 자신감', '독립적이고 창의적', '비판적 사고']
  },
  'INTP': {
    title: '논리적인 사색가',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    desc: '끊임없이 새로운 지식을 갈구하는 혁신적인 사색가입니다. 아이디어와 이론에 관심이 많으며 분석적인 해결책을 찾는 것을 좋아합니다.',
    traits: ['객관적인 시각', '지적 호기심', '개방적인 태도', '창의적 문제 해결']
  },
  'ENTJ': {
    title: '대담한 통솔자',
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
    desc: '대담하고 상상력이 풍부하며 강한 의지를 가진 리더입니다. 목표를 달성하기 위해 사람들을 조직하고 이끄는 데 타고난 재능이 있습니다.',
    traits: ['단호하고 결단력 있음', '전략적 계획가', '높은 효율성 추구', '카리스마']
  },
  'ENTP': {
    title: '뜨거운 논쟁을 즐기는 변론가',
    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=600',
    desc: '영리하고 호기심이 많으며 지적 도전을 즐기는 사색가입니다. 복잡한 문제를 해결하는 새로운 방식을 찾아내는 것을 좋아합니다.',
    traits: ['혁신적이고 열정적', '빠른 두뇌 회전', '논리적인 토론 선호', '지적 독립성']
  },
  'INFJ': {
    title: '선의의 옹호자',
    img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600',
    desc: '조용하고 신비로우며 샘솟는 영감으로 지칠 줄 모르는 이상주의자입니다. 자신의 가치관을 실현하기 위해 헌신하며 세상을 돕고 싶어 합니다.',
    traits: ['통찰력이 뛰어남', '강한 도덕관념', '따뜻하고 세심함', '창의적인 영감']
  },
  'INFP': {
    title: '열정적인 중재자',
    img: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=600',
    desc: '상냥하고 이타적인 성격으로 항상 긍정적인 변화를 꿈꾸는 중재자입니다. 자신의 신념에 따라 행동하며 창의적인 자기표현을 중시합니다.',
    traits: ['이타적이고 친절함', '깊은 감수성', '이상주의적 태도', '풍부한 상상력']
  },
  'ENFJ': {
    title: '정의로운 사회운동가',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600',
    desc: '카리스마 있고 영감을 주는 리더로 타인의 성장을 돕는 것을 좋아합니다. 뛰어난 공감 능력으로 조화로운 사회를 만드는 데 기여합니다.',
    traits: ['외교적이고 설득력 있음', '타인의 가능성 발견', '책임감이 강함', '열정적인 조력자']
  },
  'ENFP': {
    title: '재기발랄한 활동가',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
    desc: '자유로운 영혼의 소유자로 열정적이고 창의적인 사교가입니다. 새로운 아이디어를 통해 사람들과 연결되는 것을 즐기며 긍정적입니다.',
    traits: ['사교적이고 친절함', '관찰력이 예리함', '낙천적인 성격', '풍부한 호기심']
  },
  'ISTJ': {
    title: '청렴결백한 논리주의자',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600',
    desc: '실용적이고 사실에 근거해 사고하며 신뢰를 저버리지 않는 성실한 관리자입니다. 질서와 규칙을 중시하며 맡은 책임을 다합니다.',
    traits: ['신중하고 철저함', '책임감이 강함', '객관적인 판단', '조직적인 성격']
  },
  'ISFJ': {
    title: '용감한 수호자',
    img: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=600',
    desc: '아주 헌신적이고 따뜻한 마음을 가진 수호자입니다. 주변 사람들을 돌보는 데 큰 보람을 느끼며 신중하고 세심하게 행동합니다.',
    traits: ['따뜻하고 헌신적', '충성심이 강함', '세심한 관찰력', '조화와 협력']
  },
  'ESTJ': {
    title: '엄격한 관리자',
    img: 'https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=600',
    desc: '사물이나 사람을 관리하는 데 타의 추종을 불허하는 뛰어난 행정가입니다. 명확한 규칙을 세우고 이를 실천하는 데 탁월합니다.',
    traits: ['조직적이고 실용적', '강한 추진력', '정직하고 직설적', '높은 책임감']
  },
  'ESFJ': {
    title: '사교적인 외교관',
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600',
    desc: '타인에게 각별한 관심을 쏟으며 사교적이고 인기가 많은 수호자입니다. 주변 사람들을 돕고 조화로운 분위기를 만드는 데 능숙합니다.',
    traits: ['사교적이고 따뜻함', '강한 공동체 의식', '협조적인 태도', '실질적인 조력']
  },
  'ISTP': {
    title: '만능 재주꾼',
    img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600',
    desc: '대담하고 실용적인 실험가로 모든 도구를 자유자재로 다루는 거장입니다. 관찰력이 뛰어나고 효율적인 해결책을 찾는 데 능합니다.',
    traits: ['냉철한 분석력', '도전적인 성격', '유연한 적응력', '실용적 감각']
  },
  'ISFP': {
    title: '호기심 많은 예술가',
    img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600',
    desc: '유연하고 매력 넘치는 예술가로 항상 새로운 것을 탐험할 준비가 되어 있습니다. 현재의 순간을 즐기며 감각적인 가치를 중시합니다.',
    traits: ['매력적이고 온화함', '예술적 감각', '열린 마음', '현재를 즐기는 삶']
  },
  'ESTP': {
    title: '모험을 즐기는 사업가',
    img: 'https://images.unsplash.com/photo-1512138411829-28146a489603?auto=format&fit=crop&q=80&w=600',
    desc: '명석하고 에너지가 넘치며 관찰력이 뛰어난 행동가입니다. 위험을 감수하는 것을 두려워하지 않으며 역동적인 삶을 즐깁니다.',
    traits: ['대담하고 활동적', '실용적인 태도', '빠른 상황 판단', '사교적 유머']
  },
  'ESFP': {
    title: '자유로운 영혼의 연예인',
    img: 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44?auto=format&fit=crop&q=80&w=600',
    desc: '즉흥적이고 에너지가 넘치며 열정적인 연예인입니다. 주변 사람들을 즐겁게 하고 에너지를 북돋우는 데 큰 재능이 있습니다.',
    traits: ['낙천적이고 열정적', '뛰어난 사교성', '심미적 안목', '따뜻한 공감']
  }
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
      <div className="result-container animate-in" style={{ padding: '0', overflow: 'hidden' }}>
        <img src={result.img} alt={result.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
        <div style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>당신은...</h2>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="type-code">{resKey}</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{result.title}</h3>
          </div>
          <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#444', marginBottom: '25px', wordBreak: 'keep-all' }}>{result.desc}</p>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-main)' }}>핵심 키워드</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.traits.map((trait, idx) => (
                <span key={idx} style={{ background: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid #eee' }}>{trait}</span>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ width: '100%' }}>다시 테스트하기</button>
        </div>
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
        질문 {currentIdx + 1} / {QUESTIONS.length}
      </div>
    </div>
  );
};

export default MbtiTest;
