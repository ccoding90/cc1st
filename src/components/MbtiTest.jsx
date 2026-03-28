import React, { useState } from 'react';

const QUESTIONS = [
  { q: "새로운 사람들과 어울리는 파티에 가면...", a: ["에너지가 솟구친다", "빨리 집에 가고 싶어진다"], type: ["E", "I"] },
  { q: "주말에 약속이 없으면...", a: ["무료하고 답답하다", "여유롭고 행복하다"], type: ["E", "I"] },
  { q: "모임에서 나는 주로...", a: ["대화를 주도하는 편이다", "주로 듣는 편이다"], type: ["E", "I"] },
  { q: "영화나 소설을 볼 때...", a: ["현실적인 스토리가 좋다", "상상력을 자극하는 판타지가 좋다"], type: ["S", "N"] },
  { q: "길을 찾을 때...", a: ["지도나 표지판을 꼼꼼히 본다", "대략적인 방향만 보고 감으로 간다"], type: ["S", "N"] },
  { q: "사과를 보면 드는 생각은?", a: ["빨갛고 맛있겠다 (사실)", "뉴턴, 스티브 잡스, 백설공주 (연상)"], type: ["S", "N"] },
  { q: "친구가 고민을 털어놓을 때...", a: ["해결책을 제시해준다", "공감해주고 위로해준다"], type: ["T", "F"] },
  { q: "결정을 내릴 때 중요한 건...", a: ["객관적인 사실과 논리", "상황과 사람들의 감정"], type: ["T", "F"] },
  { q: "나를 더 기쁘게 하는 말은?", a: ["'너 진짜 똑똑하다'", "'너 진짜 따뜻한 사람이다'"], type: ["T", "F"] },
  { q: "여행을 갈 때...", a: ["시간 단위로 계획을 짠다", "비행기 표만 끊고 떠난다"], type: ["J", "P"] },
  { q: "과제를 할 때...", a: ["미리미리 계획적으로 한다", "마감 직전에 몰아서 한다"], type: ["J", "P"] },
  { q: "일과 후의 계획은...", a: ["대략이라도 정해져 있다", "그때그때 내키는 대로 한다"], type: ["J", "P"] }
];

const DESCRIPTIONS = {
  'INTJ': { title: '용의주도한 전략가', img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800&h=400', desc: '상상력이 풍부하며 전략적 사고에 능한 사색가입니다.' },
  'INTP': { title: '논리적인 사색가', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800&h=400', desc: '끊임없이 새로운 지식을 갈구하는 혁신적인 사색가입니다.' },
  'ENTJ': { title: '대담한 통솔자', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=400', desc: '대담하고 강한 의지를 가진 타고난 리더입니다.' },
  'ENTP': { title: '뜨거운 논쟁을 즐기는 변론가', img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800&h=400', desc: '영리하고 호기심이 많으며 지적 도전을 즐깁니다.' },
  'INFJ': { title: '선의의 옹호자', img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800&h=400', desc: '조용하고 신비로우며 샘솟는 영감을 가진 이상주의자입니다.' },
  'INFP': { title: '열정적인 중재자', img: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800&h=400', desc: '상냥하고 이타적이며 풍부한 상상력을 지닌 성격의 소유자입니다.' },
  'ENFJ': { title: '정의로운 사회운동가', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800&h=400', desc: '카리스마 있고 영감을 주는 타고난 리더입니다.' },
  'ENFP': { title: '재기발랄한 활동가', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800&h=400', desc: '자유로운 영혼의 소유자이며 창의적인 사교가입니다.' },
  'ISTJ': { title: '청렴결백한 논리주의자', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800&h=400', desc: '실용적이고 사실에 근거해 사고하는 성실한 관리자입니다.' },
  'ISFJ': { title: '용감한 수호자', img: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800&h=400', desc: '헌신적이고 따뜻한 마음을 가진 든든한 수호자입니다.' },
  'ESTJ': { title: '엄격한 관리자', img: 'https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=800&h=400', desc: '사람과 사물을 관리하는 데 능숙한 타고난 행정가입니다.' },
  'ESFJ': { title: '사교적인 외교관', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800&h=400', desc: '타인에게 각별한 관심을 쏟는 따뜻하고 사교적인 성격입니다.' },
  'ISTP': { title: '만능 재주꾼', img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800&h=400', desc: '대담하고 실용적인 손재주가 뛰어난 실험가입니다.' },
  'ISFP': { title: '호기심 많은 예술가', img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800&h=400', desc: '항상 새로운 것을 탐험할 준비가 된 감성적인 예술가입니다.' },
  'ESTP': { title: '모험을 즐기는 사업가', img: 'https://images.unsplash.com/photo-1512138411829-28146a489603?auto=format&fit=crop&q=80&w=800&h=400', desc: '에너지가 넘치고 관찰력이 뛰어난 타고난 행동가입니다.' },
  'ESFP': { title: '자유로운 영혼의 연예인', img: 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44?auto=format&fit=crop&q=80&w=800&h=400', desc: '즉흥적이고 에너지가 넘치는 타고난 엔터테이너입니다.' }
};

const MbtiTest = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [showResult, setShowResult] = useState(false);

  const calculateResult = (ans = answers) => {
    return (
      (ans.E >= ans.I ? 'E' : 'I') +
      (ans.S >= ans.N ? 'S' : 'N') +
      (ans.T >= ans.F ? 'T' : 'F') +
      (ans.J >= ans.P ? 'J' : 'P')
    );
  };

  const handleAnswer = (type) => {
    const newAnswers = { ...answers, [type]: answers[type] + 1 };
    setAnswers(newAnswers);
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleShare = async () => {
    const resKey = calculateResult();
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(`나의 MBTI는 ${resKey}! 테스트 해보기: ${shareUrl}`);
      alert('✅ 링크가 복사되었습니다!');
    } catch (err) { alert('복사에 실패했습니다.'); }
  };

  if (showResult) {
    const resKey = calculateResult();
    const result = DESCRIPTIONS[resKey];
    return (
      <div className="test-wrapper animate-in">
        <div className="result-card">
          <h2 className="type-code">{resKey}</h2>
          <h3 className="celeb-name">{result.title}</h3>
          <p className="reason-text">{result.desc}</p>
          <div className="btn-group">
            <button className="share-btn" onClick={handleShare}>결과 공유하기 🔗</button>
            <button className="retry-btn" onClick={() => window.location.reload()}>다시 하기 🔄</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-wrapper animate-in">
      <h2 className="test-title">MBTI를 빠르게 알아보자!</h2>
      <div className="test-card">
        <div className="progress-bar"><div style={{ width: `${(currentIdx / QUESTIONS.length) * 100}%` }} /></div>
        <h3 className="question-text">{QUESTIONS[currentIdx].q}</h3>
        <div className="button-group">
          {QUESTIONS[currentIdx].a.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => handleAnswer(QUESTIONS[currentIdx].type[i])}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MbtiTest;
