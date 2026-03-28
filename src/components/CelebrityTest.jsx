import React, { useState } from 'react';

const QUESTIONS = [
  // E vs I
  { q: "새로운 사람들과 어울리는 파티에 가면...", a: ["에너지가 솟구친다", "빨리 집에 가고 싶어진다"], type: ["E", "I"] },
  { q: "주말에 약속이 없으면...", a: ["무료하고 답답하다", "여유롭고 행복하다"], type: ["E", "I"] },
  { q: "모임에서 나는 주로...", a: ["대화를 주도하는 편이다", "주로 듣는 편이다"], type: ["E", "I"] },
  // S vs N
  { q: "영화나 소설을 볼 때...", a: ["현실적인 스토리가 좋다", "상상력을 자극하는 판타지가 좋다"], type: ["S", "N"] },
  { q: "길을 찾을 때...", a: ["지도나 표지판을 꼼꼼히 본다", "대략적인 방향만 보고 감으로 간다"], type: ["S", "N"] },
  { q: "사과를 보면 드는 생각은?", a: ["빨갛고 맛있겠다 (사실)", "뉴턴, 스티브 잡스, 백설공주 (연상)"], type: ["S", "N"] },
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
  'INTJ': {
    title: '용의주도한 전략가',
    img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '상상력이 풍부하며 전략적 사고에 능한 사색가입니다.',
    traits: ['분석적', '독립적', '창의적'],
    detail: 'INTJ는 복잡한 문제를 체계적으로 분석하고 장기적인 전략을 세우는 데 탁월합니다. 자신만의 높은 기준을 갖고 있으며 목표를 향해 흔들리지 않고 나아갑니다. 감정보다 논리를 우선하기 때문에 때로는 냉정하게 보일 수 있지만, 가까운 사람에게는 깊은 충성심을 보입니다.',
    pros: '뛰어난 분석력과 장기적 안목, 독립적이고 자기주도적인 실행력, 높은 목표 달성률',
    cons: '지나치게 완벽주의적이어서 스스로를 혹독하게 몰아붙이는 경향, 감정 표현이 서툴러 오해를 사기 쉬움, 타인의 의견을 무시하는 것처럼 보일 수 있음',
    compatibility: {
      love: { types: 'ENFP, ENTP', reason: '자유롭고 에너지 넘치는 ENFP/ENTP는 INTJ의 딱딱한 일상에 생기를 불어넣어 줘요. 서로의 반대되는 매력에 끌리는 교과서적인 끌림! 💘' },
      work: { types: 'ENTJ, INTJ', reason: '목표 지향적인 ENTJ와 만나면 말이 필요 없는 완벽한 드림팀! 둘 다 계획 세우는 걸 좋아하니 프로젝트 성공률 200% 🚀' },
      friend: { types: 'INFJ, INTP', reason: '깊이 있는 대화를 즐기는 INFJ/INTP와는 커피 한 잔으로 새벽 4시까지 대화가 가능한 찐친 케미 ☕' }
    }
  },
  'INTP': {
    title: '논리적인 사색가',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '끊임없이 새로운 지식을 갈구하는 혁신적인 사색가입니다.',
    traits: ['지적 호기심', '객관적', '개방적'],
    detail: 'INTP는 세상의 모든 것에 "왜?"라는 질문을 던지는 타고난 분석가입니다. 아이디어의 세계에서 노는 것을 가장 좋아하며, 복잡한 이론과 시스템을 탐구하는 것에서 큰 기쁨을 얻습니다. 사회적 규범보다 논리적 일관성을 더 중요하게 여기는 독창적인 사고의 소유자입니다.',
    pros: '독창적이고 창의적인 문제 해결 능력, 편견 없이 다양한 가능성을 탐색하는 열린 사고, 깊은 지적 탐구력',
    cons: '아이디어는 넘치지만 실행력이 부족한 경우가 많음, 사회적 상황에서 어색함을 느끼기 쉬움, 결정을 미루는 우유부단함',
    compatibility: {
      love: { types: 'ENTJ, ENFJ', reason: 'ENTJ/ENFJ의 추진력이 INTP의 아이디어에 날개를 달아줘요! 이론가와 실행가의 환상적인 콜라보 💡' },
      work: { types: 'INTJ, ENTJ', reason: '전략적인 INTJ와 만나면 머릿속 천재 아이디어가 실제 결과물로 탄생! 둘이 만나면 특허 하나는 낼 수 있을 것 같음 📋' },
      friend: { types: 'ENTP, INFP', reason: '밤새 철학 토론도 OK인 ENTP, 감수성 풍부한 INFP와는 서로를 완전히 이해하는 소울메이트 관계 🌙' }
    }
  },
  'ENTJ': {
    title: '대담한 통솔자',
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '대담하고 강한 의지를 가진 타고난 리더입니다.',
    traits: ['결단력', '전략적', '카리스마'],
    detail: 'ENTJ는 어디서든 자연스럽게 리더 역할을 맡게 되는 유형입니다. 비효율적인 것을 참지 못하며, 항상 더 나은 방법을 찾아 개선하려 합니다. 목표를 세우고 팀을 이끌어 결과를 만들어내는 과정에서 엄청난 에너지와 만족감을 얻습니다.',
    pros: '탁월한 리더십과 추진력, 복잡한 조직을 효율적으로 운영하는 능력, 강한 자신감과 결단력',
    cons: '지나치게 강압적으로 느껴질 수 있음, 타인의 감정을 간과하는 경향, 휴식 없이 몰아붙이다 번아웃 위험',
    compatibility: {
      love: { types: 'INTP, INFP', reason: '지적인 INTP/INFP는 ENTJ를 유일하게 멈추게 만드는 사람! 강한 사람이 무장해제되는 순간이 바로 이 조합 💝' },
      work: { types: 'INTJ, ESTJ', reason: '목표 지향적인 INTJ/ESTJ와는 말 한마디면 모든 게 통하는 초고효율 드림팀. 함께라면 스타트업도 성공 각 🏆' },
      friend: { types: 'ENTP, ENFP', reason: 'ENTP/ENFP와 함께면 지루할 틈이 없음! 창의적인 아이디어를 ENTJ가 현실로 만들어주는 최강 콤비 ⚡' }
    }
  },
  'ENTP': {
    title: '뜨거운 논쟁을 즐기는 변론가',
    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '영리하고 호기심이 많으며 지적 도전을 즐깁니다.',
    traits: ['혁신적', '빠른 두뇌 회전', '열정적'],
    detail: 'ENTP는 기존의 관념에 도전하고 새로운 가능성을 탐험하는 것을 즐기는 아이디어뱅크입니다. 논쟁을 즐기지만 이기기 위해서가 아니라 진실에 가까워지기 위한 지적 유희로서 즐깁니다. 빠른 두뇌 회전과 재치 있는 말솜씨로 어떤 자리에서든 대화의 중심이 됩니다.',
    pros: '창의적이고 혁신적인 아이디어 생산, 어떤 상황에서도 빠르게 해결책을 찾는 능력, 카리스마 있는 소통 능력',
    cons: '시작은 잘하지만 마무리가 약한 편, 논쟁을 즐기다 보니 관계에서 마찰이 생기기도 함, 루틴한 일상을 지루해하는 경향',
    compatibility: {
      love: { types: 'INFJ, INTJ', reason: 'ENTP의 끊임없는 아이디어를 깊이 이해해주는 INFJ/INTJ! 표면은 달라 보여도 내면에서 완벽하게 통하는 조합 🔥' },
      work: { types: 'ENTJ, INTJ', reason: 'ENTJ/INTJ와 함께라면 브레인스토밍부터 실행까지 완벽한 분업! 아이디어 공장 + 실행 기계의 꿈의 조합 💼' },
      friend: { types: 'ENFP, INTP', reason: '밤새 우주의 진리부터 떡볶이 맛집까지 모든 주제로 토론 가능한 ENFP/INTP! 이 친구들이랑 있으면 시간이 순삭 🌌' }
    }
  },
  'INFJ': {
    title: '선의의 옹호자',
    img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '조용하고 신비로우며 샘솟는 영감을 가진 이상주의자입니다.',
    traits: ['통찰력', '따뜻함', '강한 도덕성'],
    detail: 'INFJ는 전체 MBTI 유형 중 가장 희귀한 유형으로, 깊은 통찰력과 강한 직관으로 타인의 마음을 꿰뚫어 보는 능력이 있습니다. 이상주의적이고 완벽주의적인 성향 덕분에 세상을 더 나은 곳으로 만들고 싶은 강한 욕구를 가지고 있습니다. 내향적이지만 사람들에게 따뜻한 영향력을 미칩니다.',
    pros: '탁월한 공감 능력과 인간 이해, 강한 도덕적 가치관과 목적의식, 깊은 통찰력으로 문제의 본질을 꿰뚫어 보는 능력',
    cons: '지나치게 높은 이상으로 인한 번아웃 위험, 타인의 문제를 자신의 것처럼 짊어지는 경향, 완벽주의로 인한 자기비판',
    compatibility: {
      love: { types: 'ENTP, ENFP', reason: 'INFJ의 깊은 내면을 진심으로 궁금해하는 ENTP/ENFP! 신비로운 INFJ가 마음 문을 여는 몇 안 되는 유형 💫' },
      work: { types: 'INTJ, INFP', reason: '가치를 공유하는 INTJ/INFP와는 방향성부터 실행까지 완벽하게 일치! 일이 즐거워지는 최고의 팀 🌿' },
      friend: { types: 'INFP, ENFJ', reason: 'INFP/ENFJ와는 말하지 않아도 서로를 이해하는 진짜 마음이 통하는 우정. 평생 가는 찐친 각 🤍' }
    }
  },
  'INFP': {
    title: '열정적인 중재자',
    img: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '상냥하고 이타적이며 풍부한 상상력을 지닌 성격의 소유자입니다.',
    traits: ['이타적', '감수성', '이상주의'],
    detail: 'INFP는 내면에 풍부한 감수성과 이상을 품고 있는 낭만적인 몽상가입니다. 겉으로는 조용해 보이지만 내면에는 뜨거운 열정과 깊은 가치관을 품고 있습니다. 자신이 믿는 것을 위해서라면 누구보다 강하게 일어설 수 있는 용기 있는 이상주의자입니다.',
    pros: '탁월한 공감 능력과 섬세한 감수성, 독창적인 창의력과 예술적 표현력, 진심에서 우러나오는 따뜻한 배려심',
    cons: '현실보다 이상에 치우치는 경향, 비판에 예민하게 반응하고 상처를 깊이 받음, 결정을 내리기 어려워하는 우유부단함',
    compatibility: {
      love: { types: 'ENFJ, ENTJ', reason: 'INFP의 이상과 감수성을 진심으로 존중해주는 ENFJ/ENTJ! 이 조합은 INFP가 세상 밖으로 나오게 만드는 마법 같은 관계 ✨' },
      work: { types: 'INFJ, ENFJ', reason: '가치를 공유하는 INFJ/ENFJ와는 의미 있는 일을 함께하는 완벽한 파트너십! 세상을 바꾸고 싶은 두 유형의 만남 🌍' },
      friend: { types: 'ISFP, INTP', reason: 'ISFP/INTP와는 서로를 있는 그대로 받아들이는 편안한 우정. 판단 없이 내 얘기를 들어주는 소중한 친구들 🌸' }
    }
  },
  'ENFJ': {
    title: '정의로운 사회운동가',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '카리스마 있고 영감을 주는 타고난 리더입니다.',
    traits: ['공감 능력', '책임감', '조력자'],
    detail: 'ENFJ는 사람들에게서 최선을 이끌어내는 타고난 멘토입니다. 주변 사람들의 감정을 예민하게 포착하고, 모든 사람이 성장할 수 있도록 돕는 것에서 큰 보람을 찾습니다. 카리스마와 따뜻함을 동시에 갖춘 ENFJ는 어디서든 자연스럽게 중심이 됩니다.',
    pros: '탁월한 공감 능력과 타인을 성장시키는 멘토링 역량, 강한 카리스마와 조화로운 분위기 조성 능력, 목표를 위한 헌신적인 추진력',
    cons: '타인의 필요에 지나치게 집중하다 자신을 돌보지 못하는 경향, 갈등 상황을 극도로 불편해함, 타인의 기대에 부응하려는 압박감',
    compatibility: {
      love: { types: 'INFP, ISFP', reason: 'ENFJ의 따뜻한 리드로 내성적인 INFP/ISFP가 세상 밖으로 나오는 아름다운 시너지! 빛과 그림자처럼 완벽한 균형 💕' },
      work: { types: 'INTJ, INFJ', reason: 'INTJ/INFJ의 깊은 통찰력과 ENFJ의 실행력이 만나면 세상을 바꾸는 프로젝트도 가능! 최고의 변화 메이커 듀오 🌟' },
      friend: { types: 'ENFP, INFJ', reason: 'ENFP/INFJ와는 에너지를 주고받는 완벽한 우정! 서로를 응원하고 성장시키는 인생 최고의 치어리더 📣' }
    }
  },
  'ENFP': {
    title: '재기발랄한 활동가',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '자유로운 영혼의 소유자이며 창의적인 사교가입니다.',
    traits: ['낙천적', '사교적', '호기심'],
    detail: 'ENFP는 삶을 가능성으로 가득 찬 모험으로 보는 영원한 낙천주의자입니다. 새로운 아이디어와 사람들에 대한 끝없는 열정으로 주변을 활기차게 만듭니다. 표면적인 관계보다 깊고 의미 있는 연결을 원하며, 자신이 믿는 것을 위해 거침없이 목소리를 높입니다.',
    pros: '강렬한 창의력과 끝없는 아이디어 샘, 사람들에게 영감을 주는 낙천적인 에너지, 빠른 공감 능력과 따뜻한 소통 방식',
    cons: '열정이 빠르게 식고 새로운 것에 쉽게 주의가 분산됨, 마무리보다 시작에 강한 경향, 일상적인 루틴에 쉽게 지침',
    compatibility: {
      love: { types: 'INTJ, INFJ', reason: 'ENFP의 폭풍 같은 에너지를 깊이 이해하고 받아주는 INTJ/INFJ! 반대끼리 끌리는 전형적인 운명적 만남 🌈' },
      work: { types: 'ENTJ, ENFJ', reason: 'ENFP의 아이디어를 현실로 만들어주는 ENTJ/ENFJ! 아이디어 공급기와 실행기의 최강 조합 ⚡' },
      friend: { types: 'ENTP, ISFJ', reason: 'ENTP와는 밤새 신나는 토론, ISFJ와는 든든한 현실적 지지를! 서로 다른 방식으로 최고의 친구가 되는 신기한 조합 🎉' }
    }
  },
  'ISTJ': {
    title: '청렴결백한 논리주의자',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '실용적이고 사실에 근거해 사고하는 성실한 관리자입니다.',
    traits: ['철저함', '책임감', '객관적'],
    detail: 'ISTJ는 신뢰성과 성실함의 대명사입니다. 한번 맡은 일은 반드시 완수하며, 조직과 사회가 안정적으로 돌아가는 데 없어서는 안 될 든든한 기둥 역할을 합니다. 충동적인 결정보다는 검증된 방법과 경험을 신뢰하며, 책임감이 매우 강합니다.',
    pros: '압도적인 신뢰성과 책임감, 꼼꼼하고 체계적인 업무 처리 능력, 안정적이고 일관된 삶의 태도',
    cons: '변화와 새로운 방식에 적응하는 데 시간이 걸림, 감정 표현이 서툴러 차갑게 오해받기도 함, 융통성 부족으로 갈등이 생기기도 함',
    compatibility: {
      love: { types: 'ESFP, ESTP', reason: 'ISTJ의 안정감에 ESFP/ESTP의 활기가 더해지면 완벽한 균형! 진지한 ISTJ가 처음으로 웃음을 터뜨리게 만드는 유형 😄' },
      work: { types: 'ESTJ, ISFJ', reason: '같은 SJ끼리는 말이 필요 없는 완벽한 호흡! 책임감과 성실함으로 뭉친 최강 업무 파트너십 💪' },
      friend: { types: 'ISFJ, INFJ', reason: 'ISFJ/INFJ와는 오랜 시간을 함께하며 쌓이는 깊은 신뢰의 우정. 10년 지기 친구는 이 조합에서 나옴 🏠' }
    }
  },
  'ISFJ': {
    title: '용감한 수호자',
    img: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '헌신적이고 따뜻한 마음을 가진 든든한 수호자입니다.',
    traits: ['따뜻함', '충성심', '세심함'],
    detail: 'ISFJ는 주변 사람들을 세심하게 보살피고 필요한 것을 미리 챙겨주는 조용한 영웅입니다. 화려한 인정보다 내가 사랑하는 사람들이 행복한 것을 보는 것에서 깊은 만족을 얻습니다. 변화보다 안정을 선호하며, 전통과 약속을 소중히 여깁니다.',
    pros: '탁월한 관찰력으로 타인의 필요를 미리 파악, 강한 충성심과 헌신적인 배려, 꼼꼼하고 실수 없는 업무 처리',
    cons: '자신의 필요보다 타인을 앞세우다 지치는 경향, 변화에 대한 저항감, 갈등을 피하려다 자신의 의견을 묻어두기도 함',
    compatibility: {
      love: { types: 'ESFP, ESTP', reason: 'ISFJ의 헌신에 ESFP/ESTP의 활기가 더해지면 서로를 완벽히 보완! 조용한 수호자가 세상과 연결되게 해주는 소중한 인연 🌻' },
      work: { types: 'ISTJ, ESFJ', reason: '같은 SJ끼리의 협업은 철옹성! 서로의 꼼꼼함이 시너지를 내며 실수 없는 완벽한 팀을 만들어요 📌' },
      friend: { types: 'INFP, ISFP', reason: 'INFP/ISFP와는 조용하지만 깊은 우정. 시끄럽지 않아도 곁에 있는 것만으로 편안한 진짜 친구 사이 🍃' }
    }
  },
  'ESTJ': {
    title: '엄격한 관리자',
    img: 'https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '사람과 사물을 관리하는 데 능숙한 타고난 행정가입니다.',
    traits: ['조직적', '추진력', '정직함'],
    detail: 'ESTJ는 질서와 규칙을 중시하며 조직이 효율적으로 돌아가도록 이끄는 타고난 관리자입니다. 명확한 목표와 기준을 세우고 흔들리지 않고 추진하는 리더십이 강점입니다. 전통과 기존의 검증된 시스템을 신뢰하며 책임감이 매우 강합니다.',
    pros: '강한 조직 관리 능력과 리더십, 결단력 있는 의사결정과 높은 실행력, 명확하고 직접적인 소통 방식',
    cons: '융통성이 부족하고 규칙에 지나치게 집착하는 경향, 타인의 감정보다 효율을 우선시하여 차갑게 보일 수 있음, 자신의 방식이 최선이라고 확신하는 경향',
    compatibility: {
      love: { types: 'ISFP, INFP', reason: 'ESTJ의 강한 리더십 아래 ISFP/INFP가 안심하고 꿈을 펼치는 관계! 강함과 부드러움의 완벽한 균형 ⚖️' },
      work: { types: 'ISTJ, ENTJ', reason: '목표를 향해 흔들리지 않는 ISTJ/ENTJ와의 협업은 최고 효율! 결과를 반드시 만들어내는 드림팀 🎯' },
      friend: { types: 'ESFJ, ESTJ', reason: '같은 가치관과 성실함을 공유하는 ESFJ/ESTJ와는 든든하고 믿음직스러운 우정. 약속은 반드시 지키는 찐친 🤝' }
    }
  },
  'ESFJ': {
    title: '사교적인 외교관',
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '타인에게 각별한 관심을 쏟는 따뜻하고 사교적인 성격입니다.',
    traits: ['따뜻함', '협조적', '조화중시'],
    detail: 'ESFJ는 주변 사람들이 행복하고 편안한지 항상 신경 쓰는 천생 사교가입니다. 모임에서 분위기를 만들고 사람들을 연결하는 역할을 자연스럽게 맡게 됩니다. 인정받고 싶은 욕구가 강하며, 타인에게 도움이 되는 것에서 삶의 의미를 찾습니다.',
    pros: '탁월한 사교 능력과 조화로운 분위기 조성, 타인의 필요에 민감하고 헌신적인 배려, 강한 공동체 의식과 책임감',
    cons: '타인의 평가와 시선에 지나치게 민감함, 자신의 욕구보다 타인을 우선시하다 지치는 경향, 갈등 상황을 극도로 불편해함',
    compatibility: {
      love: { types: 'ISFP, INFP', reason: 'ESFJ의 적극적인 애정 표현에 ISFP/INFP가 마음을 여는 따뜻한 관계! 헌신적인 사랑을 받으며 꽃피우는 아름다운 조합 🌺' },
      work: { types: 'ISFJ, ESTJ', reason: '협력을 중시하는 ISFJ/ESTJ와의 팀워크는 최강! 서로를 배려하면서도 목표를 달성하는 이상적인 팀 🌟' },
      friend: { types: 'ENFJ, ESFP', reason: 'ENFJ/ESFP와는 에너지 넘치는 만남! 함께 있으면 어디서든 파티가 되는 인기 만점 우정 🎊' }
    }
  },
  'ISTP': {
    title: '만능 재주꾼',
    img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '대담하고 실용적인 손재주가 뛰어난 실험가입니다.',
    traits: ['분석력', '적응력', '실용적'],
    detail: 'ISTP는 어떻게 작동하는지 알고 싶어하는 타고난 탐구자이자 장인입니다. 이론보다 직접 분해하고 조립하며 배우는 것을 선호합니다. 위기 상황에서도 냉정하게 최선의 해결책을 찾아내는 뛰어난 문제 해결사이며, 독립적이고 자유로운 삶을 추구합니다.',
    pros: '위기 상황에서 빛나는 냉철한 판단력, 어떤 도구든 자유자재로 다루는 실용적 능력, 독립적이고 자유로운 문제 해결 방식',
    cons: '장기적인 계획보다 현재에 집중하는 경향, 감정 표현이 서툴러 관계에서 오해를 사기도 함, 규칙과 절차를 따르는 것을 답답해함',
    compatibility: {
      love: { types: 'ESFJ, ESTJ', reason: 'ISTP의 독립적인 매력에 ESFJ/ESTJ가 반하는 관계! 말수는 적지만 행동으로 모든 것을 보여주는 쿨한 조합 🔧' },
      work: { types: 'ESTP, ISTJ', reason: '실용적인 ESTP/ISTJ와의 협업은 군더더기 없이 효율적! 말보다 행동, 결과로 증명하는 최강 실행팀 ⚙️' },
      friend: { types: 'ISTP, ESTP', reason: '같은 SP끼리는 말이 없어도 편한 관계! 함께 뭔가 만들거나 모험하면서 쌓이는 묵직한 우정 🏕️' }
    }
  },
  'ISFP': {
    title: '호기심 많은 예술가',
    img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '항상 새로운 것을 탐험할 준비가 된 감성적인 예술가입니다.',
    traits: ['예술적', '온화함', '개방적'],
    detail: 'ISFP는 세상의 아름다움에 예민하게 반응하는 조용한 예술가입니다. 자신의 감정과 가치관을 직접적인 말보다 행동과 창작으로 표현하는 경우가 많습니다. 현재 이 순간의 경험을 충분히 느끼고 즐기는 것을 중요하게 여기며, 강요나 구속을 극도로 싫어합니다.',
    pros: '섬세한 감수성과 뛰어난 예술적 표현력, 열린 마음으로 타인을 있는 그대로 수용하는 능력, 현재의 순간을 충분히 즐기는 삶의 태도',
    cons: '장기 계획보다 즉흥적인 결정을 선호하는 경향, 갈등을 회피하다 문제가 쌓이기도 함, 비판에 매우 민감하게 반응',
    compatibility: {
      love: { types: 'ENFJ, ESFJ', reason: 'ISFP의 섬세한 감성을 온전히 받아주는 ENFJ/ESFJ! 조용히 사랑받고 싶은 ISFP에게 완벽한 파트너 🎨' },
      work: { types: 'ESFP, ISFJ', reason: '자유롭고 창의적인 환경을 함께 만드는 ESFP/ISFJ! 서로의 장점을 살려주는 편안한 협업 스타일 🌈' },
      friend: { types: 'INFP, ISFJ', reason: 'INFP/ISFJ와는 서로의 감수성을 완전히 이해하는 따뜻한 우정. 예술 전시나 카페에서 조용히 빛나는 친구 사이 🍵' }
    }
  },
  'ESTP': {
    title: '모험을 즐기는 사업가',
    img: 'https://images.unsplash.com/photo-1512138411829-28146a489603?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '에너지가 넘치고 관찰력이 뛰어난 타고난 행동가입니다.',
    traits: ['활동적', '실용적', '빠른판단'],
    detail: 'ESTP는 지금 이 순간을 가장 충실하게 사는 행동파입니다. 이론보다 실전, 계획보다 즉각적인 행동을 선호하며 위기 상황에서 빠르게 최선의 해결책을 찾아냅니다. 뛰어난 관찰력과 사람을 읽는 능력으로 어떤 상황에서도 주도권을 갖는 경우가 많습니다.',
    pros: '위기 대처 능력과 즉각적인 실행력, 뛰어난 관찰력과 사람을 파악하는 능력, 어떤 환경에서도 적응하는 유연성',
    cons: '장기적인 결과보다 즉각적인 만족을 추구하는 경향, 감정적 배려보다 팩트를 앞세워 상처를 주기도 함, 루틴한 일상을 지루해하고 쉽게 이탈',
    compatibility: {
      love: { types: 'ISFJ, ISTJ', reason: 'ESTP의 넘치는 에너지를 든든하게 받아주는 ISFJ/ISTJ! 폭풍 같은 ESTP 곁에서 흔들리지 않는 닻 같은 존재 ⚓' },
      work: { types: 'ISTP, ESTJ', reason: '실전에서 빛나는 ISTP/ESTJ와의 협업은 무적! 생각보다 행동, 속도와 결과로 승부하는 최강 콤비 💥' },
      friend: { types: 'ESFP, ENTP', reason: 'ESFP/ENTP와 함께면 매일이 어드벤처! 함께 있으면 어디서든 사건이 터지는 인생 즐거운 친구들 🎢' }
    }
  },
  'ESFP': {
    title: '자유로운 영혼의 연예인',
    img: 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44?auto=format&fit=crop&q=80&w=800&h=400',
    desc: '즉흥적이고 에너지가 넘치는 타고난 엔터테이너입니다.',
    traits: ['낙천적', '사교성', '공감능력'],
    detail: 'ESFP는 어디를 가든 그 자리에 생기를 불어넣는 타고난 엔터테이너입니다. 사람들과 함께할 때 가장 행복하며, 즐거운 순간을 만들고 나누는 것을 삶의 가장 큰 즐거움으로 여깁니다. 지금 이 순간의 기쁨을 충분히 누리는 낙천주의자이며, 상대방의 감정에 빠르게 공감합니다.',
    pros: '어디서든 분위기를 살리는 타고난 에너지, 즉각적인 공감 능력과 따뜻한 배려, 새로운 경험에 대한 두려움 없는 도전 정신',
    cons: '장기적인 계획보다 즉각적인 즐거움을 추구하는 경향, 루틴하고 단조로운 일에 금방 흥미를 잃음, 어려운 결정을 내리는 것을 회피하는 경향',
    compatibility: {
      love: { types: 'ISTJ, ISFJ', reason: 'ESFP의 활기찬 에너지를 든든하게 지켜주는 ISTJ/ISFJ! 마음껏 빛날 수 있게 뒤에서 지원해주는 최고의 파트너 🌟' },
      work: { types: 'ESTP, ESFJ', reason: '에너지 넘치는 ESTP/ESFJ와의 팀은 어떤 현장이든 장악! 함께라면 즐겁게 일하면서도 결과를 만드는 마법 같은 팀 🎪' },
      friend: { types: 'ENFP, ESTP', reason: 'ENFP/ESTP와는 만나면 자동으로 파티 시작! 에너지가 배가 되어 서로를 더 빛나게 해주는 찐친 🥳' }
    }
  }
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
    const result = DESCRIPTIONS[resKey];
    const shareText = `나의 MBTI는 ${resKey} ${result.title}!\n${result.desc}\n너도 테스트 해봐 👉`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `MBTI 결과: ${resKey}`, text: shareText, url: shareUrl });
      } catch (err) {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('✅ 결과가 클립보드에 복사되었습니다! 친구에게 공유해보세요 😊');
      } catch (err) {
        alert('복사에 실패했습니다. URL을 직접 복사해 공유해주세요.');
      }
    }
  };

  if (showResult) {
    const resKey = calculateResult();
    const result = DESCRIPTIONS[resKey];

    return (
      <div className="result-container animate-in" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <img
          src={result.img}
          alt={result.title}
          style={{ width: '100%', height: '250px', objectFit: 'cover' }}
        />
        <div style={{ padding: '30px' }}>
          {/* 유형 코드 & 타이틀 */}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>당신은...</p>
          <span className="type-code" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
            {resKey}
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0 12px' }}>{result.title}</h3>

          {/* 기본 설명 */}
          <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#444', marginBottom: '16px' }}>
            {result.desc}
          </p>

          {/* 상세 성향 평가 */}
          <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.95rem' }}>📊 전반적인 성향 평가</h4>
            <p style={{ fontSize: '0.92rem', lineHeight: '1.7', color: '#333', margin: 0 }}>{result.detail}</p>
          </div>

          {/* 장단점 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#f0fff4', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem', color: '#2d7a4f' }}>✅ 장점</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#333', margin: 0 }}>{result.pros}</p>
            </div>
            <div style={{ background: '#fff4f4', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem', color: '#c0392b' }}>⚠️ 단점</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#333', margin: 0 }}>{result.cons}</p>
            </div>
          </div>

          {/* 특성 태그 */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {result.traits.map((trait, idx) => (
              <span
                key={idx}
                style={{
                  background: '#fff',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  border: '1px solid #ddd',
                  fontWeight: 600
                }}
              >
                {trait}
              </span>
            ))}
          </div>

          {/* 궁합 섹션 */}
          <div style={{ background: '#fffbf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '16px', textAlign: 'center' }}>
              💘 MBTI 궁합 분석
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px', color: '#e74c3c' }}>
                  ❤️ 연애할 때 찰떡인 MBTI: <strong>{result.compatibility.love.types}</strong>
                </p>
                <p style={{ fontSize: '0.83rem', color: '#555', margin: 0, lineHeight: '1.5' }}>
                  {result.compatibility.love.reason}
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px', color: '#2980b9' }}>
                  💼 일할 때 최고의 파트너 MBTI: <strong>{result.compatibility.work.types}</strong>
                </p>
                <p style={{ fontSize: '0.83rem', color: '#555', margin: 0, lineHeight: '1.5' }}>
                  {result.compatibility.work.reason}
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px', color: '#27ae60' }}>
                  🤝 친구로서 잘 맞는 MBTI: <strong>{result.compatibility.friend.types}</strong>
                </p>
                <p style={{ fontSize: '0.83rem', color: '#555', margin: 0, lineHeight: '1.5' }}>
                  {result.compatibility.friend.reason}
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={handleShare}
              style={{ flex: 1, background: '#333' }}
            >
              결과 공유하기 📤
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setAnswers({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
                setCurrentIdx(0);
                setShowResult(false);
              }}
              style={{ flex: 1 }}
            >
              다시 하기 🔄
            </button>
          </div>
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