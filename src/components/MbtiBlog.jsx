import React, { useState } from 'react';

const BLOG_POSTS = [
  {
    id: 1,
    category: 'MBTI 기초',
    title: 'MBTI란 무엇인가? 입문자를 위한 완벽 가이드',
    summary: '성격 유형 검사의 대명사가 된 MBTI의 탄생 배경과 4가지 지표의 기본 개념을 알기 쉽게 정리해 드립니다.',
    date: '2025-01-10',
    readTime: '8분',
    tags: ['MBTI기초', '성격유형', '자기이해'],
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800&h=420',
    content: `MBTI(Myers-Briggs Type Indicator)는 캐서린 쿡 브릭스와 이사벨 브릭스 마이어스 모녀가 스위스의 심리학자 칼 구스타프 융의 심리 유형론을 기반으로 개발한 성격 유형 지표입니다. 1940년대에 처음 개발되었으며, 이후 수십 년간 지속적으로 연구되고 개선되어 오늘날 전 세계에서 가장 널리 사용되는 성격 유형 검사 중 하나가 되었습니다.

MBTI는 단순한 '심리테스트'를 넘어 자기 이해와 타인 이해를 돕는 강력한 도구로 자리매김했습니다. 기업의 팀빌딩, 커리어 상담, 연애 궁합 분석까지 다양한 분야에서 활용되고 있죠.

<img src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=700&h=280" alt="성격 유형 검사를 받는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>MBTI의 4가지 선호 지표</strong>

MBTI는 다음 4가지 이분법적 선호 지표를 조합하여 총 16가지 성격 유형을 도출합니다.

① <strong>에너지 방향: 외향(E) vs 내향(I)</strong>
심리적 에너지가 외부 세계를 향하는지, 내부 세계를 향하는지에 관한 지표입니다. E는 외부 활동과 사람들과의 교류에서 활력을 얻고, I는 혼자만의 사색과 내면의 활동에서 에너지를 충전합니다.

② <strong>인식 기능: 감각(S) vs 직관(N)</strong>
정보를 수집하고 인식하는 방식의 차이입니다. S는 현재의 구체적인 사실과 오감으로 느껴지는 정보를 신뢰하고, N은 패턴과 가능성, 미래의 의미와 맥락에 주목합니다.

③ <strong>판단 기능: 사고(T) vs 감정(F)</strong>
수집한 정보를 바탕으로 결론을 내리는 방식입니다. T는 논리와 분석을 통해 객관적으로 판단하고, F는 인간적 가치와 관계의 조화를 고려하여 결정을 내립니다.

④ <strong>생활 양식: 판단(J) vs 인식(P)</strong>
외부 세계에 대처하는 방식과 생활 양식에 관한 지표입니다. J는 계획적이고 체계적인 삶을 선호하며, P는 유연하고 개방적인 태도로 상황에 적응하는 것을 즐깁니다.

<strong>MBTI를 활용하는 올바른 방법</strong>

중요한 것은 MBTI가 사람을 '틀'에 가두는 도구가 아니라는 점입니다. 결과는 절대적인 판단이 아니라 자신의 선호 경향을 이해하는 출발점으로 삼아야 합니다. 같은 INFP라도 성장 환경, 경험, 의지에 따라 전혀 다른 사람이 될 수 있습니다.`,
  },
  {
    id: 2,
    category: 'E vs I',
    title: 'E와 I의 차이: 당신의 에너지는 어디서 충전되나요?',
    summary: '사교적인 사람과 내성적인 사람의 단순한 구분이 아닙니다. 진정한 에너지의 원천이 내부인지 외부인지 확인해보세요.',
    date: '2025-01-20',
    readTime: '7분',
    tags: ['외향형', '내향형', '에너지'],
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800&h=420',
    content: `많은 사람들이 외향형(E)과 내향형(I)을 단순히 '사교적인 사람 vs 내성적인 사람'으로 오해합니다. 하지만 MBTI에서 이 지표는 훨씬 더 근본적인 차원, 바로 <strong>심리적 에너지의 원천과 방향</strong>에 관한 것입니다.

<strong>외향형(E): 세상을 향해 열려 있는 에너지</strong>

외향형은 외부 세계—사람들, 활동, 사물—와 상호작용할 때 에너지가 충전됩니다. 오랫동안 혼자 있으면 오히려 무기력하고 지루함을 느끼는 경우가 많습니다. 생각을 정리할 때도 말로 내뱉으면서 정리하는 경향이 있어 "입 밖으로 꺼내봐야 내 생각을 알 수 있어"라고 표현하기도 합니다.

E 유형의 대표적인 특징으로는 ▲많은 사람들과 넓은 인간관계 형성 ▲팀 활동 선호 ▲빠른 실행력과 적극적 소통 ▲새로운 환경에 대한 빠른 적응력이 있습니다.

<img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=700&h=280" alt="활발하게 대화하는 그룹" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>내향형(I): 내면 세계를 향한 깊은 에너지</strong>

내향형은 혼자만의 시간, 즉 내면 세계에서 에너지를 충전합니다. 사람을 싫어하거나 사회성이 없는 것이 아니라, 사람들과의 긴 만남 이후에는 반드시 혼자만의 회복 시간이 필요합니다. 깊이 있는 소수의 관계를 선호하며, 생각을 충분히 정리한 후에 말하는 경향이 있습니다.

I 유형의 특징으로는 ▲깊고 의미 있는 소수의 관계 ▲집중력과 사색의 깊이 ▲독립적인 업무 처리 선호 ▲신중하고 차분한 의사결정이 있습니다.

<strong>직장과 연애에서 E와 I의 차이</strong>

직장에서 E는 브레인스토밍 회의, 팀 프로젝트, 발표 등에서 빛을 발합니다. 반면 I는 집중이 필요한 분석적 업무, 글쓰기, 심층 연구에서 강점을 드러냅니다. 연애에서도 E는 자주 만나고 적극적으로 표현하는 방식을 선호하는 반면, I는 깊은 대화와 소수의 단둘만의 시간을 더 소중히 여깁니다.

<strong>E와 I가 서로를 이해하려면</strong>

E는 I에게 "혼자 있고 싶다"는 말이 거절이나 싫다는 신호가 아님을 이해해야 합니다. I는 E에게 "왜 항상 밖에서 에너지를 소비하려 하는지" 판단하지 않아야 합니다. 이 차이를 이해하는 것만으로도 수많은 오해와 갈등이 해소될 수 있습니다.`,
  },
  {
    id: 3,
    category: 'S vs N',
    title: 'S와 N의 결정적 차이: 숲을 보느냐 나무를 보느냐',
    summary: '현실의 세부사항에 집중하는 S와 미래의 가능성을 상상하는 N의 서로 다른 세상을 보는 눈.',
    date: '2025-01-28',
    readTime: '8분',
    tags: ['감각형', '직관형', '인지방식'],
    img: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=800&h=420',
    content: `MBTI의 두 번째 지표인 감각(S)과 직관(N)은 우리가 <strong>정보를 인식하고 세상을 받아들이는 방식</strong>의 차이입니다. 이 지표는 단순한 취향의 차이를 넘어, 같은 상황을 보고도 전혀 다른 것을 '보는' 근본적인 인지 방식의 차이를 보여줍니다.

<strong>감각형(S): 지금 이 순간, 현실에 발을 딛다</strong>

감각형은 오감(시각, 청각, 촉각, 미각, 후각)을 통해 직접적으로 경험하고 확인할 수 있는 것을 신뢰합니다. 구체적인 사실, 세부 사항, 지금 현재 일어나는 일에 주의를 기울이며, 과거의 경험을 토대로 현실적인 판단을 내립니다.

S 유형의 강점은 ▲정확하고 세밀한 관찰력 ▲현실적이고 실용적인 문제 해결 ▲꼼꼼한 디테일 처리 ▲검증된 방법과 절차를 신뢰하는 안정성입니다.

<img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=700&h=280" alt="별이 가득한 밤하늘과 우주" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>직관형(N): 보이지 않는 가능성의 세계를 탐험하다</strong>

직관형은 눈앞에 보이는 것 너머의 패턴, 의미, 가능성, 그리고 미래에 집중합니다. 정보들 사이의 연결고리를 직관적으로 포착하고, '이 사실이 의미하는 바가 무엇인가?', '앞으로 어떻게 될까?'를 끊임없이 생각합니다.

N 유형의 강점은 ▲창의적이고 혁신적인 아이디어 발상 ▲복잡한 개념 간의 연결고리 파악 ▲미래 지향적 사고와 전략 수립 ▲영감과 직관에 기반한 빠른 통찰입니다.

<strong>일상에서 드러나는 S와 N의 차이</strong>

"사과"를 봤을 때: S는 '빨갛고, 향긋하고, 먹음직스럽다'고 인식합니다. N은 '뉴턴의 만유인력, 스티브 잡스의 애플 로고, 백설공주의 독사과'를 연상합니다.

여행 준비 시: S는 숙소, 교통편, 맛집 예약을 철저히 준비합니다. N은 '대충 가면 뭔가 재미있는 일이 생기겠지'라며 틀만 잡아두고 떠납니다.

<strong>S와 N이 함께 일할 때</strong>

S와 N이 균형을 이루면 최강의 팀이 됩니다. N이 혁신적인 아이디어를 내놓으면, S가 그것을 현실에서 구현 가능한 계획으로 구체화합니다. 서로의 차이를 단점으로 보지 않고 보완 관계로 이해할 때, 팀의 역량은 배가됩니다.`,
  },
  {
    id: 4,
    category: 'T vs F',
    title: 'T와 F의 대화법: 해결책인가, 공감인가?',
    summary: '논리적인 분석을 우선하는 T와 인간관계와 감정을 중시하는 F가 갈등을 줄이는 대화 기술.',
    date: '2025-02-05',
    readTime: '8분',
    tags: ['사고형', '감정형', '소통법'],
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800&h=420',
    content: `"내가 힘들다고 했더니 해결책만 줬어." "내가 도움이 되려고 했는데 왜 상처를 받는 거지?" T(사고형)와 F(감정형) 사이에서 가장 자주 발생하는 오해입니다. MBTI의 세 번째 지표인 사고(T)와 감정(F)은 수집한 정보를 바탕으로 <strong>결론을 내리고 결정하는 방식</strong>의 차이를 나타냅니다.

<strong>사고형(T): 진실과 논리를 따라가다</strong>

사고형은 결정을 내릴 때 감정적 요소를 최대한 배제하고, 객관적인 사실과 논리적 원칙에 따르려 합니다. 친구가 고민을 털어놓을 때 T는 자연스럽게 "그럼 이렇게 해봐", "그건 네가 잘못한 거야"라는 식의 직접적인 조언을 건넵니다.

T 유형의 강점은 ▲냉철하고 공정한 판단력 ▲감정에 휘둘리지 않는 안정감 ▲효율적인 문제 해결 ▲직접적이고 명확한 소통입니다.

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=700&h=280" alt="마주보고 진지하게 대화하는 두 사람" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>감정형(F): 사람과 관계를 먼저 생각하다</strong>

감정형은 결정을 내릴 때 관련된 사람들의 감정, 상황의 특수성, 인간적 가치를 중요하게 고려합니다. 친구의 고민을 들을 때 F는 먼저 "많이 힘들었겠다"라며 공감해주고, 상대가 원할 때만 조언을 건넵니다.

F 유형의 강점은 ▲탁월한 공감 능력과 정서적 지지 ▲조화로운 인간관계 유지 ▲타인의 감정과 욕구를 섬세하게 파악 ▲갈등 상황에서의 중재 능력입니다.

<strong>T와 F가 서로에게 오해받는 순간들</strong>

T가 F에게 상처 주는 말: "그래서 결론이 뭔데?", "감정 말고 팩트로 얘기해", "그게 왜 상처야? 맞는 말이잖아."
F가 T를 힘들게 하는 상황: 논리적인 제안을 감정적으로 받아들이기, 명확한 답 대신 계속 공감만 원하기.

<strong>갈등을 줄이는 실전 대화법</strong>

T가 F에게 말할 때: 조언 전에 반드시 "많이 힘들었겠다"는 공감을 먼저 표현하세요. "조언해줄까, 아니면 그냥 들어줄까?"라고 먼저 물어보는 것만으로도 갈등의 80%가 예방됩니다.

F가 T에게 말할 때: "공감해줘"라고 직접 요청해보세요. T는 당신이 원하는 게 무엇인지 명확히 알 때 훨씬 잘 대응합니다. T의 해결책 제시는 무관심이 아니라 그들 나름의 최선의 배려임을 기억하세요.`,
  },
  {
    id: 5,
    category: 'J vs P',
    title: 'J와 P의 라이프스타일: 계획적인 삶 vs 자유로운 삶',
    summary: '마감 기한을 대하는 태도부터 여행 계획까지, 완전히 다른 두 유형의 삶의 방식.',
    date: '2025-02-12',
    readTime: '7분',
    tags: ['판단형', '인식형', '생활방식'],
    img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800&h=420',
    content: `판단형(J)과 인식형(P)은 우리가 외부 세계를 대하는 태도와 생활 방식의 차이입니다. J는 계획적이고 체계적인 삶을 선호하며, P는 유연하고 즉흥적인 삶을 즐깁니다.

<strong>판단형(J): 계획이 있어야 마음이 편하다</strong>

J 유형은 일과 생활에 명확한 구조와 질서를 추구합니다. 마감일보다 훨씬 전에 일을 끝내놔야 안심이 되고, 갑작스러운 변화나 계획 취소를 매우 불편하게 느낍니다. 할 일 목록을 작성하고 하나씩 완료해 나가는 것에서 큰 만족감을 얻습니다.

J의 강점: ▲높은 목표 달성률 ▲신뢰할 수 있는 책임감 ▲체계적인 시간 관리 ▲결단력 있는 의사결정.

<img src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=700&h=280" alt="플래너와 체크리스트로 계획을 세우는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>인식형(P): 가능성은 항상 열어두자</strong>

P 유형은 유연성과 자유를 사랑합니다. 마감 직전의 압박이 오히려 집중력을 높여준다고 느끼며, 계획이 너무 촘촘하면 숨막힌다고 표현합니다. 새로운 정보나 상황이 생기면 언제든 방향을 바꿀 준비가 되어 있습니다.

P의 강점: ▲뛰어난 적응력과 유연성 ▲다양한 가능성에 열린 태도 ▲창의적이고 즉흥적인 문제 해결 ▲스트레스 상황에서의 여유로운 대처.

<strong>J와 P가 함께 살거나 일할 때</strong>

J는 P에게 "왜 항상 마지막에 하냐"며 답답해하고, P는 J에게 "왜 그렇게 빡빡하게 계획하냐"며 부담을 느낍니다. 서로의 방식이 게으름이나 강박이 아니라 타고난 선호 방식임을 이해하는 것이 함께하는 첫걸음입니다.`,
  },
  {
    id: 6,
    category: 'MBTI 궁합',
    title: 'MBTI 궁합 가이드: 환상의 짝꿍과 환장의 짝꿍',
    summary: '서로를 보완해주는 최고의 조합은 누구일까요? 유형별 성격 궁합표를 분석해 드립니다.',
    date: '2025-02-18',
    readTime: '9분',
    tags: ['궁합', '연애', 'MBTI'],
    img: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&q=80&w=800&h=420',
    content: `성격이 비슷하다고 해서 무조건 잘 맞는 것은 아닙니다. 때로는 완전히 반대되는 성향이 서로의 단점을 보완하며 강력한 시너지를 내기도 합니다. MBTI 궁합을 이해하면 연애, 우정, 직장 관계 모두에서 훨씬 스마트한 선택을 할 수 있습니다.

<strong>보완형 궁합: 반대이기에 완벽한 조합</strong>

가장 유명한 보완형 궁합은 <strong>INTJ + ENFP</strong>, <strong>INFJ + ENTP</strong>입니다. 전략가와 활동가, 통찰자와 논쟁가의 만남은 서로가 가지지 못한 부분을 채워주며 강렬한 지적 교감을 나눕니다. INTJ는 ENFP의 자유로운 에너지에 영감을 받고, ENFP는 INTJ의 깊이 있는 통찰에 매력을 느낍니다.

<img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=700&h=280" alt="서로 잘 맞는 커플" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>유사형 궁합: 나를 이해해주는 느낌</strong>

비슷한 유형끼리는 서로를 즉각적으로 이해하는 편안함이 있습니다. <strong>INFP + INFJ</strong>, <strong>ENTP + ENTJ</strong> 조합은 가치관과 사고방식이 유사해 갈등이 적습니다. 다만, 같은 약점을 공유하기 때문에 특정 상황에서 함께 취약해질 수 있다는 점을 주의해야 합니다.

<strong>도전형 궁합: 성장을 부르는 불꽃 튀는 관계</strong>

<strong>ISTJ + ENFP</strong>, <strong>ESTJ + INFP</strong> 조합은 가장 큰 차이를 보이는 유형들입니다. 초반에는 잦은 충돌이 생길 수 있지만, 서로를 이해하려는 노력이 있다면 가장 큰 성장을 이끌어내는 관계가 될 수 있습니다.

궁합은 참고 자료일 뿐, 어떤 두 유형도 노력과 이해가 있다면 멋진 관계를 만들 수 있습니다.`,
  },
  {
    id: 7,
    category: '멘탈 관리',
    title: '스트레스 상황에서 MBTI별 반응과 대처법',
    summary: '번아웃이 왔을 때 당신의 유형은 어떻게 변하나요? 건강한 멘탈 관리를 위한 맞춤 처방.',
    date: '2025-02-25',
    readTime: '8분',
    tags: ['스트레스', '번아웃', '멘탈관리'],
    img: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?auto=format&fit=crop&q=80&w=800&h=420',
    content: `극도의 스트레스 상황에서 각 MBTI 유형은 평소와 전혀 다른 모습을 보일 수 있습니다. 이를 '그림자'라고도 부르는데, 자신과 반대 유형의 가장 미숙한 형태로 나타납니다. 이 현상을 이해하면 자신을 훨씬 빠르게 회복시킬 수 있습니다.

<strong>NT형(INTJ, INTP, ENTJ, ENTP)의 스트레스 반응</strong>

평소 냉철하고 논리적인 NT형은 번아웃이 오면 갑자기 감정적이고 예민해집니다. 사소한 일에 과민하게 반응하거나, 평소와 달리 피해의식에 빠지기도 합니다. <strong>처방: 판단을 잠시 내려두고 몸을 움직이세요.</strong> 산책, 운동, 요리처럼 머리보다 몸을 사용하는 활동이 에너지를 회복시켜 줍니다.

<img src="https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=700&h=280" alt="번아웃으로 지쳐있는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>NF형(INFJ, INFP, ENFJ, ENFP)의 스트레스 반응</strong>

이상주의적인 NF형은 심한 스트레스 상황에서 갑자기 지나치게 사실에 집착하거나, 과식·과음 같은 즉각적 감각 자극을 추구하는 행동을 보일 수 있습니다. <strong>처방: 신뢰할 수 있는 한두 명과 충분히 대화하세요.</strong> 감정을 언어로 표현하는 것이 NF형 회복의 핵심입니다.

<strong>SJ형(ISTJ, ISFJ, ESTJ, ESFJ)의 스트레스 반응</strong>

책임감이 강한 SJ형은 번아웃 상태에서도 '해야 한다'는 의무감에 계속 일을 놓지 못해 상태가 악화됩니다. <strong>처방: 허락하세요, 쉬어도 된다고.</strong> 완벽하게 마무리되지 않아도 괜찮다는 것을 받아들이는 연습이 필요합니다.

<strong>SP형(ISTP, ISFP, ESTP, ESFP)의 스트레스 반응</strong>

자유로운 SP형은 극도의 스트레스 상황에서 갑자기 강박적으로 미래를 걱정하거나 지나치게 비관적이 됩니다. <strong>처방: 현재의 즐거움으로 돌아오세요.</strong> 좋아하는 취미 활동, 자연 속 산책이 가장 빠른 회복제입니다.`,
  },
  {
    id: 8,
    category: '커리어',
    title: 'MBTI별 추천 직업군: 나에게 딱 맞는 일 찾기',
    summary: '성격 강점을 극대화할 수 있는 커리어 방향을 제시합니다. 당신의 유형이 빛나는 직업은?',
    date: '2025-03-03',
    readTime: '9분',
    tags: ['직업', '커리어', 'MBTI'],
    img: 'https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=800&h=420',
    content: `MBTI가 진로를 결정짓는 절대적 기준은 아니지만, 자신의 성격 강점이 극대화되는 환경을 이해하는 데 매우 유용한 참고 자료가 됩니다. 아래는 각 유형 그룹별로 강점을 발휘하기 좋은 직업군을 정리한 것입니다.

<strong>NT형(분석가 그룹): INTJ, INTP, ENTJ, ENTP</strong>

논리적 분석과 전략적 사고가 강점인 NT형은 복잡한 시스템을 설계하고 혁신을 이끄는 분야에서 빛납니다. 추천 직업군: 소프트웨어 엔지니어, 데이터 과학자, 전략 컨설턴트, 법조인, 연구원, 기업가. 특히 ENTJ는 리더십이 필요한 경영 분야에서, INTP는 깊은 사색이 필요한 학문 연구 분야에서 두각을 나타냅니다.

<img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=700&h=280" alt="다양한 직업군의 사람들이 함께 일하는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>NF형(외교관 그룹): INFJ, INFP, ENFJ, ENFP</strong>

공감 능력과 이상주의적 가치관이 강점인 NF형은 사람을 돕고 의미 있는 변화를 만드는 분야에 끌립니다. 추천 직업군: 심리상담사, 사회복지사, 작가, 교육자, 마케터, 비영리단체 활동가. ENFJ는 교육과 코칭 분야에서, INFP는 창작 분야에서 높은 만족도를 보입니다.

<strong>SJ형(관리자 그룹): ISTJ, ISFJ, ESTJ, ESFJ</strong>

체계와 책임감이 강점인 SJ형은 규칙과 절차가 중요한 안정적인 조직에서 강점을 발휘합니다. 추천 직업군: 공무원, 회계사, 의료인, 군인·경찰, 교사, 행정관리자. SJ형은 어떤 조직이든 든든한 기둥 역할을 합니다.

<strong>SP형(탐험가 그룹): ISTP, ISFP, ESTP, ESFP</strong>

현재에 집중하고 즉각적 행동이 강점인 SP형은 역동적이고 유연한 환경에서 최고의 성과를 냅니다. 추천 직업군: 운동선수, 소방관·응급구조사, 요리사, 디자이너, 예술가, 영업직.`,
  },
  {
    id: 9,
    category: '연애',
    title: '연애 스타일로 보는 MBTI: 사랑에 빠진 당신은?',
    summary: '유형별 사랑을 표현하는 방식과 이상적인 데이트 코스를 추천해 드립니다.',
    date: '2025-03-10',
    readTime: '7분',
    tags: ['연애', '데이트', 'MBTI'],
    img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800&h=420',
    content: `연애를 하면 각 유형의 성격이 가장 선명하게 드러납니다. 내가 어떤 방식으로 사랑하고, 어떤 방식의 사랑을 받고 싶은지 아는 것은 건강한 연애의 시작입니다.

<strong>E 유형의 연애: 적극적이고 표현이 넘치는 사랑</strong>
E는 감정을 즉각적으로 표현하고 함께하는 시간을 매우 중요하게 여깁니다. 데이트도 활동적이고 새로운 장소를 탐험하는 것을 즐깁니다. 연락도 자주 하고 싶어하며, 애인이 자신의 사회적 공간에 함께해주길 원합니다.

<strong>I 유형의 연애: 깊고 조용한 사랑</strong>
I는 감정을 언어보다 행동으로 표현하는 경우가 많습니다. 조용한 카페에서의 깊은 대화, 함께 영화를 보며 보내는 조용한 시간을 최고의 데이트로 꼽습니다. 표현이 적다고 사랑이 적은 것이 절대 아닙니다.

<img src="https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&q=80&w=700&h=280" alt="함께 카페에서 대화하는 커플" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>T 유형의 연애: 실용적이고 든든한 사랑</strong>
T는 애인이 어려운 상황에 처했을 때 즉각 해결책을 찾아주는 방식으로 사랑을 표현합니다. "사랑해"라는 말보다 새벽에 데리러 오거나 현실적인 도움을 주는 것이 T의 언어입니다.

<strong>F 유형의 연애: 감성적이고 공감으로 가득한 사랑</strong>
F는 애인의 감정 변화에 민감하게 반응하고, 기념일 서프라이즈나 감성적인 편지 등 감정을 풍부하게 표현합니다. 다만 상처도 깊이 받기 때문에, 배려 있는 소통이 중요합니다.`,
  },
  {
    id: 10,
    category: '자기 성장',
    title: 'MBTI 결과가 바뀌었다면? 성격의 변화와 성숙',
    summary: '검사할 때마다 결과가 달라지는 이유와 환경이 성격에 미치는 영향에 대해 알아봅니다.',
    date: '2025-03-17',
    readTime: '7분',
    tags: ['성장', '변화', 'MBTI'],
    img: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800&h=420',
    content: `MBTI를 처음 했을 때는 ENFP였는데, 몇 년 후 다시 하니 INFJ가 나왔다면? 내 성격이 바뀐 걸까요, 아니면 처음 결과가 틀렸던 걸까요? 사실 두 경우 모두 가능합니다.

<strong>결과가 바뀌는 이유 ①: 처음 결과가 부정확했다</strong>
처음 검사할 때 충분히 자신을 이해하지 못한 상태에서 "이랬으면 좋겠다"는 이상적인 자아로 답했을 가능성이 있습니다. 특히 10대, 20대 초반에는 사회적 기대에 맞춰 답하는 경우가 많습니다.

<strong>결과가 바뀌는 이유 ②: 실제로 성장했다</strong>
인간은 경험과 의지를 통해 성장합니다. 극도로 내향적이었던 사람이 발표 경험을 반복하며 외향적 역량을 키울 수 있습니다. 이것은 유형이 바뀐 것이 아니라, 열등 기능을 발달시킨 것입니다.

<img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=700&h=280" alt="성장과 변화를 상징하는 이미지" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>결과가 바뀌는 이유 ③: 환경의 영향</strong>
극도의 스트레스 상황, 큰 상실, 새로운 환경(유학, 이직 등)은 일시적으로 평소와 다른 모습을 이끌어냅니다. 직장에서는 J처럼 행동하지만 집에서는 P인 사람도 많습니다.

<strong>결론: MBTI는 나침반이지 감옥이 아닙니다</strong>
중요한 것은 결과의 알파벳이 아니라, 그 탐색 과정에서 자신을 얼마나 깊이 이해했느냐입니다. 결과가 바뀌었다면 당황하지 말고, "나는 어떤 방향으로 성장하고 있는가?"를 물어보세요.`,
  },
  {
    id: 11,
    category: '학습',
    title: 'MBTI 유형별 최적의 공부법: 내 성격에 맞는 학습 전략',
    summary: '같은 방법으로 공부해도 효과가 다른 이유? MBTI의 인지 기능이 학습 스타일과 어떻게 연결되는지 알아봅니다.',
    date: '2025-03-24',
    readTime: '8분',
    tags: ['공부법', '학습', '자기계발'],
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800&h=420',
    content: `학습 방법은 하나의 정답이 없습니다. MBTI 연구에서 도출된 인지 기능 이론은 왜 어떤 사람은 혼자 공부할 때 더 잘하고, 어떤 사람은 스터디 그룹에서 더 잘 흡수하는지를 설명합니다.

<strong>S형 vs N형의 학습 접근법</strong>

<strong>감각형(S)</strong>: S는 구체적이고 단계적인 학습에 강점이 있습니다. 교과서를 처음부터 끝까지 읽으며 기초를 쌓고, 연습 문제를 반복해서 풀며 확실하게 익히는 방식을 선호합니다. 예제와 실용적 적용이 많을수록 학습 효율이 높아집니다.

<strong>직관형(N)</strong>: N은 전체 그림을 먼저 파악한 뒤 세부사항을 채워 나가는 하향식(top-down) 학습에 강합니다. 목차와 결론을 먼저 훑어보고 왜 이것을 배우는지 맥락을 이해할 때 동기가 생깁니다.

<img src="https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&q=80&w=700&h=280" alt="스터디 그룹에서 함께 공부하는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>E형 vs I형의 공부 환경</strong>

<strong>외향형(E)</strong>: 스터디 그룹이나 토론식 학습에서 효과적입니다. 배운 내용을 다른 사람에게 설명하면서("가르치면서 배운다") 개념이 정리됩니다.

<strong>내향형(I)</strong>: 혼자 조용한 환경에서 집중 학습할 때 최고의 효율이 나옵니다. 인터럽션 없이 깊이 파고드는 딥 워크(deep work)가 I에게는 가장 효과적인 학습 방식입니다.

<strong>T형 vs F형의 학습 동기</strong>

<strong>사고형(T)</strong>: 논리적 구조와 원칙이 명확한 과목을 좋아합니다. "왜 이 공식이 성립하는가?"를 이해하면 응용력이 급격히 늘어납니다.

<strong>감정형(F)</strong>: 학습 내용이 사람이나 사회에 미치는 의미와 연결될 때 동기가 올라갑니다. 역사적 인물 이야기, 사례 연구, 스토리텔링이 들어간 교재가 더 효과적입니다.

<strong>J형 vs P형의 공부 계획</strong>

<strong>판단형(J)</strong>: 계획표를 세우고 체계적으로 공부할 때 불안이 줄어듭니다. 시험 일정을 역산해서 계획을 짜고, 하루 분량을 정해 완료하는 것에서 만족감을 얻습니다.

<strong>인식형(P)</strong>: 촉박한 마감이 오히려 집중력을 높이는 타입입니다. 포모도로 테크닉처럼 짧은 집중 + 휴식 사이클이 효과적입니다.`,
  },
  {
    id: 12,
    category: '재테크',
    title: 'MBTI로 보는 나의 소비 패턴과 재테크 스타일',
    summary: '충동구매가 잦다면, 저축만 하다 지친다면? 내 MBTI 유형이 돈을 쓰고 모으는 방식에 어떤 영향을 미치는지 알아봅니다.',
    date: '2025-04-01',
    readTime: '8분',
    tags: ['재테크', '소비심리', '투자'],
    img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800&h=420',
    content: `행동경제학자들은 인간이 '합리적 경제인'이 아님을 오래전부터 알았습니다. 우리의 소비와 저축 결정은 성격 유형과 깊이 연결되어 있습니다. MBTI가 재정 습관을 완전히 결정하지는 않지만, 자신의 성향을 이해하면 돈 관련 약점을 예방할 수 있습니다.

<strong>감각형(S) vs 직관형(N)의 소비 패턴</strong>

<strong>감각형(S)의 재정 강점</strong>은 현실적 예산 관리입니다. 지금 필요한 것, 가격 대비 실용성을 꼼꼼히 따지며 소비합니다. 단점은 미래를 위한 투자에 소극적일 수 있습니다.

<strong>직관형(N)</strong>은 미래를 위한 투자(교육, 자기계발, 트렌드 선도)에 지갑을 아낌없이 엽니다. 하지만 지금 당장 필요 없는 것에 충동적으로 소비하거나 현실적 예산을 간과하는 경향이 있습니다.

<img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=700&h=280" alt="가계부와 저축 계획을 세우는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>외향형(E) vs 내향형(I)의 소비 유발 요인</strong>

<strong>외향형(E)</strong>: 사회적 활동과 경험 소비(여행, 콘서트, 외식)에 돈을 씁니다. "사람들이 다 사는 것"에 영향을 받는 동조 소비도 강한 편입니다.

<strong>내향형(I)</strong>: 혼자 즐길 수 있는 것(책, 취미용품, 온라인 구독)에 투자합니다. 충동 구매보다는 신중하게 리뷰를 검토하고 구매하는 편입니다.

<strong>사고형(T) vs 감정형(F)의 구매 의사결정</strong>

<strong>사고형(T)</strong>: 가격 대비 성능을 철저히 비교하고 구매합니다. 감정적인 마케팅에는 잘 흔들리지 않습니다.

<strong>감정형(F)</strong>: 구매 결정에 감정이 크게 작용합니다. 스트레스 쇼핑, 기분 전환을 위한 충동 구매가 잦을 수 있습니다.

<strong>J형 vs P형의 저축 스타일</strong>

<strong>판단형(J)</strong>: 재정 관리의 왕입니다. 월별 예산 시트를 만들고 지출을 카테고리별로 관리합니다.

<strong>인식형(P)</strong>: 예산 계획을 세워도 즉흥적으로 무너지기 쉽습니다. 자동이체 저축이 가장 효과적인 재정 관리법입니다.`,
  },
  {
    id: 13,
    category: '직장생활',
    title: '직장에서 살아남는 MBTI 활용법: 상사·동료와의 관계 전략',
    summary: '팀장이 ESTJ이고 나는 INFP라면? 동료가 INTP인데 왜 항상 혼자 일할까? MBTI로 직장 관계를 이해하는 법.',
    date: '2025-04-08',
    readTime: '9분',
    tags: ['직장생활', '인간관계', 'MBTI'],
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800&h=420',
    content: `직장 내 갈등의 상당수는 성격 차이에서 비롯됩니다. 나쁜 사람이 아니라 다른 사람. 이 차이를 MBTI로 이해하면, 소통 방식을 조정해서 갈등을 줄이고 시너지를 만들 수 있습니다.

<strong>상사 유형별 소통 전략</strong>

<strong>ENTJ 상사</strong>: 결과 중심적이고 효율을 중시합니다. 보고할 때는 결론부터 먼저 말하고, 구체적인 수치와 계획을 제시하세요. "이렇게 하면 매출이 X% 오를 것 같습니다"가 "열심히 해보겠습니다"보다 훨씬 효과적입니다.

<strong>ENFJ 상사</strong>: 팀의 화합과 구성원의 성장을 중요하게 생각합니다. 정기적으로 근황을 공유하고, 업무 이외의 대화도 적극적으로 참여하세요.

<strong>ISTJ 상사</strong>: 규칙과 절차를 중시하고, 예상치 못한 변수를 싫어합니다. 정해진 보고 형식을 따르고, 기한을 철저히 지키는 것이 신뢰 구축의 핵심입니다.

<img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=700&h=280" alt="직장 팀 미팅 장면" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>팀원 유형별 협업 포인트</strong>

<strong>INTP 동료</strong>: 대화 중 가끔 멍하거나 느리게 반응하더라도, 실제로는 깊이 생각하고 있는 중입니다. 즉각적인 답변을 강요하지 말고 충분한 숙고 시간을 주세요.

<strong>ESFJ 동료</strong>: 팀 분위기와 인간관계를 매우 중요하게 여깁니다. 피드백을 줄 때 직접적인 비판보다 감사 표현을 먼저 하고 부드럽게 전달하세요.

<strong>ENFP 동료</strong>: 창의적인 아이디어가 넘치지만 실행력이 약할 수 있습니다. 아이디어를 충분히 인정하고 구체적 실행 계획을 함께 만들어주면 시너지가 폭발합니다.

<strong>MBTI 활용의 한계와 주의사항</strong>

MBTI는 한 사람을 완전히 설명하지 않습니다. 같은 ISTJ라도 업무 스타일이 크게 다를 수 있습니다. MBTI를 "저 사람은 원래 저래"라는 고정관념의 틀로 사용하면 오히려 소통이 경직됩니다. 어디까지나 "나는 이런 경향이 있고, 상대방은 저런 경향이 있을 수 있다"는 가설로 활용하는 것이 건강합니다.`,
  },
  {
    id: 14,
    category: 'MBTI 오해와 진실',
    title: 'MBTI에 대한 7가지 오해와 진실: 심리학자가 말하는 올바른 이해',
    summary: '"MBTI는 유사과학이다", "MBTI로 사람을 판단해도 된다" — 자주 듣는 MBTI 관련 주장들의 진실은?',
    date: '2025-04-15',
    readTime: '9분',
    tags: ['MBTI진실', '심리학', '팩트체크'],
    img: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800&h=420',
    content: `MBTI는 지금 가장 뜨거운 심리 도구이자, 가장 오해받는 도구이기도 합니다. "나 INFP야"라는 한마디가 자기소개의 일부가 된 시대에, 우리는 MBTI에 대해 얼마나 제대로 알고 있을까요?

<strong>오해 1: "MBTI는 유사과학이다"</strong>
진실: 반은 맞고 반은 틀립니다. MBTI의 이론적 토대(칼 융의 심리 유형론)는 검증된 심리학 이론입니다. 하지만 16가지 이분법적 분류 방식은 학술적으로 비판이 있습니다. MBTI는 임상 진단 도구가 아니라 자기 이해 도구로서 활용할 때 가장 가치가 있습니다.

<strong>오해 2: "같은 유형이면 잘 맞는다"</strong>
진실: 꼭 그렇지 않습니다. 같은 INFP도 성장 환경, 문화적 배경, 개인 경험에 따라 전혀 다른 사람이 될 수 있습니다.

<img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=700&h=280" alt="심리학 책들이 쌓여있는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>오해 3: "MBTI 결과는 영원히 바뀌지 않는다"</strong>
진실: MBTI 공식 연구에서도 동일인이 5주 후 재검사했을 때 50% 이상이 최소 하나의 지표에서 다른 결과가 나왔습니다. 유형은 현재의 선호 경향을 보여주는 스냅샷입니다.

<strong>오해 4: "특정 유형이 다른 유형보다 우월하다"</strong>
진실: MBTI의 기본 원칙 중 하나는 '어떤 유형도 다른 유형보다 낫거나 못하지 않다'입니다. 세상에는 다양한 역할이 필요하고, 모든 유형은 그 역할에서 빛을 발합니다.

<strong>오해 5: "내향형은 사회성이 없다"</strong>
진실: 내향형은 사회적 활동을 싫어하는 것이 아니라, 내면 세계에서 에너지를 충전합니다. '낯을 가린다'와 '내향적이다'는 완전히 다른 개념입니다.

<strong>오해 6: "T형은 차갑고 F형은 약하다"</strong>
진실: T형은 감정이 없는 것이 아니라, 결정 과정에서 논리를 우선한다는 뜻입니다. T형도 감정이 풍부하고 따뜻한 사람이 많습니다. 통계적으로 여성에게 F가, 남성에게 T가 더 많이 나오는데, 이것은 사회화의 영향이기도 합니다.

<strong>오해 7: "MBTI를 알면 사람을 다 안다"</strong>
진실: MBTI는 성격의 일부 측면만을 다룹니다. 지능, 가치관, 경험, 정서적 성숙도, 문화적 배경 등 수많은 요소가 사람을 형성합니다. MBTI를 모든 것을 설명하는 절대 기준으로 삼는 것은 오히려 진정한 이해를 방해합니다.`,
  },
];

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
};

const MbtiBlog = () => {
  const [selectedPost, setSelectedPost] = useState(null);

  if (selectedPost) {
    const related = BLOG_POSTS.filter(p => p.id !== selectedPost.id).slice(0, 3);
    return (
      <div className="blog-detail animate-in">
        <button
          className="btn-secondary"
          onClick={() => { setSelectedPost(null); window.scrollTo(0, 0); }}
          style={{ marginBottom: '20px' }}
        >
          ← 목록으로
        </button>

        <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <img
            src={selectedPost.img}
            alt={selectedPost.title}
            style={{ width: '100%', height: '280px', objectFit: 'cover' }}
          />
          <div style={{ padding: '24px 24px 0' }}>
            <span style={{
              background: '#f0f4ff',
              color: 'var(--accent-color)',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '12px',
            }}>
              {selectedPost.category}
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '14px', lineHeight: 1.35, color: 'var(--text-main)' }}>
              {selectedPost.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📅 {formatDate(selectedPost.date)}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>⏱ 읽는 시간 {selectedPost.readTime}</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedPost.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.72rem', background: '#f5f5f5', color: '#666', padding: '2px 8px', borderRadius: '10px' }}>#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            <div
              style={{ fontSize: '1rem', lineHeight: '1.95', color: '#333' }}
              dangerouslySetInnerHTML={{
                __html: selectedPost.content
                  .split('\n\n')
                  .map(p => {
                    const t = p.trim();
                    if (t.startsWith('<img')) return t;
                    return `<p style="margin-bottom:1.3em">${t}</p>`;
                  })
                  .join('')
              }}
            />
          </div>
        </article>

        <div style={{ marginTop: '36px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>관련 아티클</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {related.map(post => (
              <div
                key={post.id}
                className="card"
                onClick={() => { setSelectedPost(post); window.scrollTo(0, 0); }}
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
              >
                <img src={post.img} alt={post.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                <div style={{ padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 700 }}>{post.category}</span>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.4 }}>{post.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="blog-list animate-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', textAlign: 'center' }}>
        MBTI 인사이트
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '28px' }}>
        E·I·S·N·T·F·J·P — MBTI 16유형의 모든 것을 깊게 파헤칩니다
      </p>

      {/* Featured post */}
      <div
        className="card"
        onClick={() => setSelectedPost(featured)}
        style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', marginBottom: '20px' }}
      >
        <img src={featured.img} alt={featured.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
        <div style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ background: '#f0f4ff', color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>{featured.category}</span>
            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{featured.readTime} 읽기</span>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.35 }}>{featured.title}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{featured.summary}</p>
          <p style={{ fontSize: '0.78rem', color: '#bbb', marginTop: '10px' }}>{formatDate(featured.date)}</p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {rest.map(post => (
          <div
            key={post.id}
            className="card"
            onClick={() => setSelectedPost(post)}
            style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
          >
            <img src={post.img} alt={post.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ background: '#f0f4ff', color: 'var(--accent-color)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{post.category}</span>
                <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{post.readTime}</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.4 }}>{post.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>{post.summary}</p>
              <p style={{ fontSize: '0.75rem', color: '#ccc', margin: 0 }}>{formatDate(post.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MbtiBlog;
