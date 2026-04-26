import React, { useState, useEffect } from 'react';

const POSTS = [
  {
    id: 1,
    category: '러브 랭귀지',
    title: '러브 랭귀지 완전 가이드: 5가지 사랑의 언어와 연애 활용법',
    summary: '나는 왜 분명히 사랑받고 있는데 공허함을 느낄까? 5가지 사랑의 언어를 알면 연애의 모든 오해가 풀립니다.',
    img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-02-14',
    readTime: '8분',
    tags: ['연애', '사랑의언어', '커뮤니케이션'],
    content: `"나는 분명히 최선을 다하는데, 왜 상대방은 사랑받지 못한다고 할까?" 이 질문은 수많은 커플 상담에서 반복되는 핵심 갈등입니다. 게리 채프먼 박사의 연구에 따르면, 이 문제의 핵심은 사랑의 부족이 아니라 <strong>사랑의 언어 불일치</strong>입니다.

<strong>왜 사랑받고 있는데도 외로울까?</strong>

당신이 매일 "사랑해"라고 말하지만, 상대방은 그 말보다 함께 앉아 눈을 맞추는 시간을 더 원한다면 어떻게 될까요? 당신은 분명히 사랑을 표현하고 있지만, 상대방이 받아들이는 '채널'이 다르기 때문에 사랑이 전달되지 않습니다. 마치 영어로 아무리 말해도 한국어만 아는 사람에게 전달되지 않는 것과 같습니다.

<img src="https://images.unsplash.com/photo-1573497161161-c3e73707e25c?auto=format&fit=crop&q=80&w=700&h=300" alt="커플이 대화하는 모습" style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>5가지 사랑의 언어 완전 이해</strong>

① <strong>인정하는 말 (Words of Affirmation)</strong>
이 유형은 언어적 표현으로 사랑을 확인합니다. "오늘 정말 수고했어", "네가 있어서 내 삶이 달라졌어" 같은 진심 어린 칭찬과 감사가 이들의 마음을 채웁니다. 반면 비판적인 말이나 무관심한 말투는 다른 유형보다 훨씬 깊은 상처를 남깁니다. 이 유형의 파트너에게 말은 단순한 소통 수단이 아니라 사랑의 증거입니다.

② <strong>봉사 행동 (Acts of Service)</strong>
이 유형은 "말보다 행동"을 믿습니다. 바쁜 날 저녁 식사를 준비해주거나, 힘든 일을 묵묵히 도와주는 것이 이들에게 최고의 사랑 표현입니다. "뭐 도와줄까?"라는 한마디가 "사랑해"보다 더 강력하게 전달됩니다. 이 유형의 파트너가 "그냥 내가 알아서 할게"라고 말한다면, 사실은 도움을 바라고 있을 가능성이 높습니다.

③ <strong>선물 (Receiving Gifts)</strong>
선물형은 물질적 가치보다 "나를 생각했구나"는 마음에서 사랑을 느낍니다. 비싼 선물이 아니어도 됩니다. 지나가다 생각나서 산 작은 간식, 여행에서 가져온 기념품 하나가 이들에게는 "당신은 내 마음속에 항상 있어요"라는 메시지가 됩니다.

④ <strong>함께하는 시간 (Quality Time)</strong>
이 유형에게 중요한 것은 '같이 있음'이 아닌 '함께함'입니다. 핸드폰 없이 서로에게만 집중하는 저녁 한 시간이, 하루 종일 같은 공간에 있지만 각자 화면을 보는 것보다 훨씬 가치 있습니다.

⑤ <strong>스킨십 (Physical Touch)</strong>
스킨십형은 신체적 접촉에서 안정감과 사랑을 느낍니다. 꼭 성적인 의미가 아닙니다. 어깨를 토닥이거나, 손을 잡거나, 지나가다 가볍게 안아주는 것만으로도 이들의 마음이 채워집니다.

<strong>관계에서 활용하는 법</strong>

먼저 자신의 러브 랭귀지를 파악하고, 상대방의 것을 물어보세요. "나는 함께하는 시간이 가장 소중한데, 너는 어떤 방식으로 사랑을 느껴?"라는 대화 하나가 수십 번의 갈등을 예방합니다. 자신의 언어가 아닌 상대방의 언어로 사랑을 표현하는 것, 그것이 성숙한 사랑의 핵심입니다.`,
  },
  {
    id: 2,
    category: '색채 심리학',
    title: '색채 심리학: 내가 좋아하는 색깔이 성격을 말해준다',
    summary: '빨간색을 좋아하는 사람과 파란색을 좋아하는 사람은 정말 다를까? 과학이 말하는 색깔과 성격의 연관성.',
    img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-02-20',
    readTime: '7분',
    tags: ['색채심리', '성격', '심리학'],
    content: `마케팅 연구에 따르면 소비자가 제품을 처음 접할 때 색깔이 구매 결정의 85%를 좌우한다고 합니다. 색깔은 단순한 시각 정보가 아니라 감정, 행동, 심지어 성격과도 깊은 연관이 있습니다.

<strong>색채 심리학의 과학적 배경</strong>

색채 심리학은 색깔이 인간의 심리에 미치는 영향을 연구하는 학문입니다. 스위스 심리학자 막스 뤼셔(Max Lüscher)는 1940년대 색깔 선호도와 성격의 상관관계를 체계적으로 연구해 '뤼셔 색채 테스트'를 개발했습니다.

<img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=700&h=280" alt="다양한 색깔 팔레트" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>6가지 성격 색깔 심층 분석</strong>

<strong>빨간색 — 열정과 리더십의 색</strong>
빨간색을 선호하는 사람들은 대체로 목표 지향적이고 강한 추진력을 가집니다. 위험을 감수하는 것을 두려워하지 않으며, 경쟁적인 상황에서 오히려 에너지가 솟구칩니다. 심리학적으로 빨간색은 교감신경을 자극해 심박수와 혈압을 높이는 효과가 있습니다.

<strong>파란색 — 신뢰와 냉철함의 색</strong>
파란색 선호자들은 분석적이고 차분한 성향을 보입니다. 감정보다 이성을 우선하며, 신뢰와 일관성을 중요하게 여깁니다. 전 세계 대기업과 금융 기관들이 로고에 파란색을 주로 사용하는 이유가 바로 여기에 있습니다.

<strong>노란색 — 낙관주의와 창의성의 색</strong>
노란색은 뇌에서 세로토닌 분비를 자극하는 색으로 알려져 있습니다. 노란색을 좋아하는 사람들은 대체로 긍정적이고 사교적이며, 새로운 아이디어를 쉽게 떠올립니다.

<strong>초록색 — 균형과 치유의 색</strong>
자연의 색인 초록색은 평화와 안정을 상징합니다. 초록색 선호자들은 조화를 중시하고, 갈등보다 타협을 택하는 경향이 있습니다. 초록색 환경이 스트레스 수준을 낮추고 집중력을 향상시킨다는 연구 결과가 반복적으로 보고되고 있습니다.

<strong>보라색 — 영성과 창의성의 색</strong>
보라색은 역사적으로 왕족과 예술가의 색이었습니다. 보라색을 선호하는 사람들은 독창적인 감수성과 깊은 내면 세계를 가진 경우가 많습니다.

<strong>주황색 — 에너지와 사교성의 색</strong>
주황색은 빨간색의 열정과 노란색의 밝음을 결합한 색입니다. 주황색 선호자들은 친화력이 뛰어나고 어디서든 분위기를 만드는 타입입니다.

<strong>색깔은 기분에 따라 달라진다</strong>

중요한 점은 색깔 선호도가 고정불변이 아니라는 것입니다. 스트레스 상태에서는 평소와 다른 색깔에 끌리기도 합니다. 색채 심리학자들은 현재 가장 끌리는 색깔이 지금 당신의 심리적 욕구를 반영한다고 말합니다.`,
  },
  {
    id: 3,
    category: '스트레스 심리학',
    title: '스트레스 해소법의 과학: 나에게 맞는 방식은 따로 있다',
    summary: '운동이 최고라는 사람 옆에서 나는 왜 더 스트레스를 받을까? 심리학이 알려주는 개인 맞춤 스트레스 관리법.',
    img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-01',
    readTime: '9분',
    tags: ['스트레스', '멘탈관리', '번아웃'],
    content: `"스트레스에는 운동이 최고야." "힘들면 친구 만나서 수다 떨어봐." 주변에서 흔히 듣는 조언들입니다. 하지만 운동을 해도 스트레스가 풀리지 않는 사람이 있고, 사람을 만날수록 더 지치는 사람도 있습니다. 스트레스 해소법에도 개인 맞춤이 필요한 이유는 무엇일까요?

<strong>스트레스 대처의 심리학적 분류</strong>

심리학자 리처드 라자러스(Richard Lazarus)는 스트레스 대처 방식을 크게 두 가지로 분류했습니다. <strong>문제 중심 대처(Problem-focused coping)</strong>는 스트레스의 원인을 직접 해결하려는 방식이고, <strong>감정 중심 대처(Emotion-focused coping)</strong>는 감정 자체를 조절하는 방식입니다.

<img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=700&h=280" alt="명상하는 사람" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>5가지 스트레스 해소 유형 분석</strong>

<strong>발산형 — 표출하며 푸는 타입</strong>
감정을 즉각적으로 표현하고 대화로 풀어내는 방식입니다. 이 타입은 감정을 억누르면 오히려 스트레스가 쌓입니다. 충분히 말하고 나면 빠르게 회복되는 강점이 있지만, 주변 사람들에게 감정적으로 영향을 미칠 수 있다는 점을 인식해야 합니다.

<strong>은둔형 — 혼자 삭히는 타입</strong>
혼자만의 공간에서 내면의 감정을 정리하는 타입입니다. 내향적 회복 방식으로, 강제로 사람들과 어울리게 하면 오히려 스트레스가 가중됩니다. 혼자 있는 시간이 게으름이 아니라 이들에게는 필수적인 에너지 충전 과정입니다.

<strong>식욕형 — 먹으며 위로받는 타입</strong>
음식으로 감정을 달래는 방식입니다. 단기적으로는 효과적이지만, 장기적으로는 식습관과 건강에 영향을 미칠 수 있습니다. 이 타입은 건강한 '보상 음식'을 미리 정해두는 것이 도움이 됩니다.

<strong>활동형 — 몸을 움직이며 해소하는 타입</strong>
운동, 산책, 청소 등 신체 활동으로 스트레스를 해소합니다. 과학적으로 가장 근거가 확실한 방식 중 하나로, 운동 중 분비되는 엔도르핀이 실제로 스트레스 호르몬인 코르티솔을 낮춥니다.

<strong>수다형 — 말하며 공감받는 타입</strong>
친한 사람에게 털어놓고 공감받는 것으로 회복되는 타입입니다. "나눠주는 게 반이 된다"는 말이 이 타입에게 딱 맞습니다.

<strong>번아웃을 예방하는 핵심 원칙</strong>

스트레스 연구의 권위자 크리스티나 마슬라크(Christina Maslach)는 번아웃의 반대 개념으로 '인게이지먼트(engagement)'를 제시합니다. 번아웃을 예방하려면 단순히 쉬는 것이 아니라, 의미 있고 회복이 되는 활동을 해야 합니다. 자신의 스트레스 해소 유형을 알고, 그 방식으로 충분히 회복하는 것이 장기적인 멘탈 관리의 핵심입니다.`,
  },
  {
    id: 4,
    category: '투자 심리학',
    title: '투자 심리학: 왜 우리는 좋은 주식을 팔고 나쁜 주식을 들고 있을까',
    summary: '손절을 못하는 이유, 고점에서 사는 이유가 모두 심리학으로 설명됩니다. 내 투자 성향을 알면 손실을 줄일 수 있습니다.',
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-05',
    readTime: '10분',
    tags: ['투자', '행동경제학', '주식'],
    content: `2021년 코인 열풍 때 정점에서 매수한 사람들, 2022년 폭락장에서 공황 매도한 사람들. 이들이 멍청해서가 아닙니다. 인간의 뇌가 원래 투자에 불리하게 설계되어 있기 때문입니다.

<strong>투자 손실을 만드는 심리 편향 5가지</strong>

<strong>① 손실 회피 편향 (Loss Aversion)</strong>
노벨경제학상 수상자 다니엘 카너먼의 연구에 따르면, 인간은 100만 원을 얻는 기쁨보다 100만 원을 잃는 고통을 약 2.5배 더 강하게 느낍니다. 이 때문에 손실 중인 주식을 팔지 못하고 "언젠가 오르겠지"라며 들고 있게 됩니다.

<img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=700&h=280" alt="주식 차트를 분석하는 투자자" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>② 확증 편향 (Confirmation Bias)</strong>
"이 주식 오를 것 같아"라고 생각한 순간부터, 오른다는 정보는 눈에 잘 띄고 내린다는 정보는 무시하게 됩니다. 커뮤니티에서 호재 글만 읽고 악재 글은 "틀렸어"라고 넘기는 경험, 누구나 해본 적 있습니다.

<strong>③ 군중 심리 (Herd Mentality)</strong>
주변 모든 사람이 사고 있으면 나도 사야 할 것 같은 압박감. 이것이 고점 매수의 원인입니다. 반대로 모두가 팔 때 나만 들고 있으면 불안해지는 것이 저점 매도를 만듭니다.

<strong>④ 현재 편향 (Present Bias)</strong>
오늘의 10만 원이 1년 후의 15만 원보다 심리적으로 더 크게 느껴지는 현상입니다. 이 때문에 장기 투자를 결심해도 단기 손실에 흔들려 매도하게 됩니다.

<strong>⑤ 과잉 자신감 편향 (Overconfidence Bias)</strong>
"나는 시장 평균보다 잘할 수 있어"라고 생각하는 투자자가 전체의 80%라는 연구가 있습니다. 물론 수학적으로 불가능한 일입니다.

<strong>나의 투자 유형별 대처 전략</strong>

성장주 투자형이라면 감정적 손절을 예방하기 위해 목표 수익률과 손절선을 미리 정해두세요. 가치 투자형이라면 재무제표 분석 루틴을 만들어 확증 편향을 줄이세요. 트렌드 투자형이라면 "지금 내가 군중을 따라가고 있는가?"를 매수 전 반드시 물어보세요. 투자에서 가장 중요한 것은 시장 지식이 아니라 자기 자신을 아는 것입니다.`,
  },
  {
    id: 5,
    category: '갓생 심리학',
    title: '갓생의 심리학: 자기계발과 번아웃 사이에서 지속 가능한 삶',
    summary: '갓생을 살다 번아웃이 온다면? 심리학이 알려주는 지속 가능한 자기계발의 비밀.',
    img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-10',
    readTime: '9분',
    tags: ['자기계발', '습관', '번아웃'],
    content: `새벽 5시 기상, 운동, 독서, 건강 식단, 자기계발 유튜브. 소셜 미디어에는 완벽한 갓생러들의 하루가 넘쳐납니다. 그런데 이 루틴을 따라 해보려 했다가 3일 만에 포기한 경험이 있으신가요?

<strong>'갓생'이 왜 이렇게 어려울까?</strong>

심리학적으로 볼 때, 모든 새로운 행동은 뇌의 기저핵(basal ganglia)이라는 영역에서 습관으로 자리 잡기까지 평균 66일이 필요합니다(앞서 널리 알려진 '21일의 법칙'은 실제 연구에서 반박되었습니다). 그런데 많은 사람들이 한 번에 5~10가지 새로운 루틴을 도입하려 합니다. 이것이 바로 실패의 첫 번째 원인입니다.

<img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=700&h=280" alt="일찍 일어나 공부하는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>번아웃의 심리학</strong>

심리학자 크리스티나 마슬라크의 번아웃 모델에 따르면, 번아웃은 세 가지 증상으로 나타납니다. 첫째, 정서적 고갈(emotional exhaustion) — 더 이상 아무것도 하고 싶지 않은 무기력함. 둘째, 비인격화(depersonalization) — 내가 하는 일이 의미 없게 느껴지는 냉소. 셋째, 개인 성취감 감소(reduced personal accomplishment) — 아무리 해도 부족하다는 느낌.

갓생을 추구하다 번아웃에 이르는 가장 큰 원인은 <strong>외부 기준을 내면화</strong>하는 것입니다.

<strong>지속 가능한 갓생을 위한 심리학 원칙</strong>

<strong>① 자기 결정 이론 (Self-Determination Theory)</strong>
심리학자 에드워드 데시와 리처드 라이언의 연구에 따르면, 지속되는 동기는 세 가지 심리적 욕구가 충족될 때 생깁니다. 자율성(내가 선택한 것), 유능감(내가 성장하고 있다는 느낌), 관계성(의미 있는 연결). 남이 정한 갓생이 아닌 내가 정한 갓생이어야 오래 갑니다.

<strong>② 작은 습관의 복리 효과</strong>
제임스 클리어의 《아주 작은 습관의 힘》에서 제시된 개념처럼, 매일 1%씩 개선되면 1년 후 37배 성장합니다. 완벽한 루틴을 하루 만에 도입하는 것보다 아주 작은 습관 하나를 꾸준히 유지하는 것이 훨씬 강력합니다.

<strong>③ 회복 시간을 루틴에 포함하라</strong>
최고 수준의 운동선수들은 훈련만큼 회복에 투자합니다. 갓생 루틴에도 의도적인 휴식이 필요합니다. 쉬는 날을 계획하지 않으면, 번아웃이 강제로 쉬게 만듭니다.`,
  },
  {
    id: 6,
    category: '연애 심리학',
    title: '애착 유형이 연애 스타일을 결정한다: 불안형·회피형·안정형',
    summary: '왜 나는 연애만 하면 이렇게 불안해질까? 아동 발달 심리학에서 시작된 애착 이론으로 연애 패턴의 근원을 찾습니다.',
    img: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-15',
    readTime: '10분',
    tags: ['애착이론', '연애', '심리학'],
    content: `"나는 연애를 시작하면 왜 이렇게 집착하게 될까?", "나는 왜 가까워지면 도망가고 싶어질까?" 이 질문들의 답은 어쩌면 어린 시절에 있을지도 모릅니다.

<strong>애착 이론의 탄생</strong>

존 볼비(John Bowlby)가 1950년대에 개발하고 메리 에인스워스(Mary Ainsworth)가 발전시킨 <strong>애착 이론</strong>은 원래 영아와 양육자의 관계를 연구하는 것이었습니다. 하지만 이후 연구자들은 이 패턴이 성인의 연애 관계에서도 그대로 반복된다는 것을 발견했습니다.

<img src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=700&h=280" alt="서로 안아주는 커플" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>3가지 핵심 애착 유형</strong>

<strong>안정형 (Secure Attachment) — 약 55%</strong>
어린 시절 일관되게 반응해주는 양육자 밑에서 자란 경우 형성됩니다. 안정형은 친밀함을 편안하게 받아들이고, 혼자 있는 시간도 불안하지 않습니다. 파트너가 늦게 답장해도 "바쁜가 보다"라고 생각합니다.

<strong>불안형 (Anxious Attachment) — 약 20%</strong>
양육자의 반응이 일관적이지 않았을 때 형성됩니다. 연락이 늦으면 수십 가지 나쁜 시나리오가 머릿속을 가득 채웁니다.

<strong>회피형 (Avoidant Attachment) — 약 25%</strong>
감정 표현이 없거나 거부적인 양육자 밑에서 자란 경우 형성됩니다. 연인이 "우리 더 가까워지자"라고 하면 숨이 막히는 느낌을 받습니다. 차갑게 보이지만, 사실은 친밀함이 두렵기 때문입니다.

<strong>불안형과 회피형이 끌리는 이유</strong>

흥미롭게도 불안형과 회피형은 서로에게 강하게 끌리는 경향이 있습니다. 이 조합은 강렬하지만 소모적인 관계가 되기 쉽습니다.

<strong>애착 유형은 바뀔 수 있다</strong>

중요한 것은, 애착 유형은 고정된 운명이 아니라는 점입니다. 안정적이고 신뢰할 수 있는 파트너와의 관계 경험이 쌓이면 불안형이나 회피형도 점차 안정형으로 이동할 수 있습니다. 자신의 애착 유형을 아는 것 자체가 변화의 첫 걸음입니다.`,
  },
  {
    id: 7,
    category: 'K-POP 문화',
    title: 'K-POP 팬덤 심리학: 덕질이 우리에게 좋은 이유',
    summary: '팬덤 활동이 단순한 취미가 아닌 이유. 심리학이 증명하는 K-POP 덕질의 긍정적 효과.',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-18',
    readTime: '8분',
    tags: ['KPOP', '팬덤', '문화심리'],
    content: `"K-POP 팬들은 왜 저렇게 열정적일까?" 팬 문화를 모르는 사람들은 종종 아이돌에 열광하는 팬들을 이해하지 못합니다. 하지만 심리학의 관점에서 보면, 팬덤 활동은 인간의 기본적인 심리적 욕구를 충족시키는 매우 건강한 활동입니다.

<strong>팬덤이 형성되는 심리학적 원리</strong>

심리학자 에릭 에릭슨의 정체성 발달 이론에 따르면, 특히 청소년기에는 "나는 누구인가?"라는 질문에 대한 답을 찾는 과정이 핵심 발달 과제입니다. 아이돌은 이 과정에서 일종의 <strong>역할 모델</strong>이자 <strong>정체성 탐색의 창구</strong> 역할을 합니다.

<img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=700&h=280" alt="콘서트 현장의 열정적인 팬들" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>K-POP 팬 활동의 심리적 효과</strong>

<strong>① 소속감과 커뮤니티</strong>
인간은 본질적으로 사회적 동물입니다. 팬덤은 비슷한 취향을 가진 사람들이 모인 강력한 커뮤니티입니다. 연구에 따르면 팬덤 커뮤니티 활동은 외로움을 줄이고 사회적 지지감을 높이는 데 효과적입니다.

<strong>② 감정 조절 능력 향상</strong>
아이돌의 음악을 들으며 슬픔, 기쁨, 설렘 등 다양한 감정을 안전하게 경험하는 것은 감정 근육을 키우는 효과가 있습니다. 심리학에서는 이를 '대리 감정 경험'이라고 부릅니다.

<strong>③ 긍정 감정과 도파민</strong>
최애의 신곡 발매, 컴백 무대, 깜짝 브이라이브. 이 모든 이벤트는 뇌에서 도파민이 분비되는 순간입니다. 적절한 도파민 자극은 동기부여와 행복감에 긍정적인 영향을 줍니다.

<strong>④ 생산적 창의성 발현</strong>
K-POP 팬덤에서는 팬픽 창작, 팬아트, 직캠 편집, 팬페이지 운영, 번역 활동 등 다양한 창작 활동이 이루어집니다. 많은 크리에이터들이 팬 활동에서 시작해 전문 창작자로 성장했습니다.

<strong>건강한 팬 활동을 위한 균형</strong>

물론 팬 활동이 일상생활이나 다른 중요한 관계를 방해할 정도가 되면 문제가 생길 수 있습니다. 건강한 덕질의 핵심은 최애의 존재가 내 삶을 더 풍요롭게 만드는 요소여야 한다는 것입니다.`,
  },
  {
    id: 8,
    category: '자기 이해',
    title: '자기 이해의 심리학: 나를 제대로 아는 것이 왜 이렇게 어려울까',
    summary: '심리 테스트는 왜 맞는 것처럼 느껴질까? 자기 인식의 함정과 진짜 자기 이해에 가까워지는 방법.',
    img: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-03-22',
    readTime: '8분',
    tags: ['자기인식', '심리학', '바넘효과'],
    content: `"와, 이거 나 완전 맞아!" MBTI 결과를 처음 봤을 때 많은 사람들이 이런 반응을 보입니다. 그런데 심리학에는 이런 현상을 설명하는 흥미로운 개념이 있습니다.

<strong>바넘 효과 (Barnum Effect)</strong>

1940년대 심리학자 버트럼 포러(Bertram Forer)는 학생들에게 성격 테스트를 실시한 뒤, 실제로는 모든 학생에게 동일한 결과를 나누어주었습니다. 그럼에도 학생들은 평균 85%의 정확도로 결과가 '나를 잘 묘사한다'고 평가했습니다.

<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=700&h=280" alt="거울을 보며 자기를 성찰하는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>그렇다면 심리 테스트는 의미가 없는 걸까?</strong>

그렇지 않습니다. 중요한 것은 테스트를 어떻게 활용하느냐입니다. 잘 설계된 심리 테스트는 자기 인식의 출발점으로 기능합니다. "나는 E야"라는 결론보다, "나는 왜 이 질문에서 이 답을 선택했지?"라는 자기 관찰 과정이 더 가치 있습니다.

<strong>자기 인식의 두 가지 차원</strong>

심리학자 타샤 유리히(Tasha Eurich)는 수년간의 연구를 통해 자기 인식에는 두 가지 독립적인 차원이 있다는 것을 발견했습니다.

<strong>내부 자기 인식</strong>은 자신의 가치관, 열정, 반응 패턴, 감정 등을 아는 것입니다.

<strong>외부 자기 인식</strong>은 타인이 나를 어떻게 보는지 아는 것입니다. 연구에 따르면 내부 자기 인식이 높을수록 자신의 장점을 파악하는 데 강하고, 외부 자기 인식이 높을수록 대인관계와 협업에 유리합니다.

<strong>자기 인식을 방해하는 함정들</strong>

<strong>확증 편향</strong>: 자신에 대한 기존 믿음을 확인해주는 정보만 선택적으로 받아들입니다.

<strong>감정 소음</strong>: 강한 감정 상태에서는 자신을 객관적으로 보기 어렵습니다.

<strong>진짜 자기 이해에 가까워지는 방법</strong>

심리 테스트는 자기 탐색의 도구로만 사용하세요. "이 결과를 통해 내가 발견하지 못했던 나의 어떤 면을 볼 수 있는가?"라고 질문하는 것이 더 가치 있습니다. 그리고 신뢰할 수 있는 사람에게 피드백을 구하는 것, 일기 쓰기, 새로운 환경에 자신을 노출시키는 것도 자기 이해를 깊이 있게 만드는 실천적 방법입니다.`,
  },
  {
    id: 9,
    category: '디지털 심리학',
    title: '소셜미디어가 우리를 불행하게 만드는 5가지 심리 기제',
    summary: '피드를 볼수록 기분이 나빠지는 이유가 있습니다. SNS 앱이 당신의 뇌를 어떻게 조종하는지 심리학이 밝힙니다.',
    img: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-04-01',
    readTime: '9분',
    tags: ['소셜미디어', '디지털디톡스', '비교심리'],
    content: `인스타그램을 20분 보다가 멈췄을 때, 왜 더 행복해지는 것이 아니라 오히려 공허함이나 불안을 느끼는 걸까요? 이 현상은 개인의 의지력 부족이 아닙니다. 소셜미디어 플랫폼은 사용자가 더 오래 머물도록 인간의 심리를 정교하게 활용해 설계되어 있습니다.

<strong>1. 가변 보상 스케줄 (Variable Reward Schedule)</strong>

심리학자 B.F. 스키너의 연구에서 비롯된 이 개념은 슬롯머신의 원리와 동일합니다. 피드를 새로고침할 때마다 "이번엔 재미있는 게 있을까?"라는 기대와 불확실성이 도파민 분비를 자극합니다. 결과가 예측 가능하면 흥미가 줄지만, 예측할 수 없을 때 뇌는 더욱 강하게 반응합니다.

<img src="https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&q=80&w=700&h=280" alt="소셜미디어를 스크롤하는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>2. 상향 비교 (Upward Social Comparison)</strong>

사람들은 SNS에 최고의 순간만 올립니다. 완벽한 여행 사진, 승진 소식, 행복한 커플 사진. 이를 자신의 평범한 일상과 비교하면 열등감이 생깁니다. 연구에 따르면 SNS 사용 시간이 길수록 우울감과 자존감 저하의 상관관계가 높아집니다.

<strong>3. FOMO (Fear of Missing Out)</strong>

놓칠 것 같다는 공포. 친구들이 파티에서 즐거운 시간을 보내는 사진을 보며 나만 소외된 것 같은 불안함이 SNS 이용을 더욱 강박적으로 만듭니다. 흥미롭게도 FOMO가 강할수록 SNS를 더 많이 사용하지만 실제 만족도는 낮아집니다.

<strong>4. 좋아요 경제학의 심리</strong>

게시물에 받은 좋아요 수는 사회적 승인의 지표로 느껴집니다. 좋아요가 많으면 도파민이 분비되고, 적으면 불안해집니다. 인스타그램이 좋아요 수를 숨기는 기능을 실험한 이유도 이 과도한 비교와 불안을 줄이기 위해서였습니다.

<strong>5. 사이버 바디 이미지 왜곡</strong>

필터, 보정 앱, 포토샵으로 가공된 이미지들이 '평균'처럼 느껴지면서 자신의 실제 외모에 대한 왜곡된 인식이 생깁니다. 특히 청소년과 젊은 여성에게서 신체 불만족과 섭식 장애 위험이 SNS 사용량과 비례한다는 연구 결과가 있습니다.

<img src="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&q=80&w=700&h=250" alt="디지털 디톡스, 자연 속에서 쉬는 사람" style="width:100%;height:190px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>건강한 SNS 사용을 위한 심리학 가이드</strong>

알림을 끄고 의도적으로 사용 시간을 정하세요. 팔로우 목록을 정기적으로 검토하고 부정적 감정을 유발하는 계정은 언팔로우하세요. SNS를 보기 전과 후의 감정 상태를 의식적으로 관찰하세요. '비교'가 아닌 '영감'을 주는 콘텐츠 위주로 큐레이션하는 것이 핵심입니다.

디지털 미니멀리즘 운동의 주창자 칼 뉴포트는 "소셜미디어는 사용자의 주의를 팔아 돈을 버는 산업"이라고 말합니다. 이를 인식하는 것만으로도 우리는 더 주체적으로 SNS를 활용할 수 있습니다.`,
  },
  {
    id: 10,
    category: '자기계발 심리학',
    title: '완벽주의의 두 얼굴: 성공의 원동력인가, 불행의 씨앗인가?',
    summary: '높은 기준을 가진 것과 완벽주의는 다릅니다. 심리학이 구분하는 건강한 완벽주의와 병적 완벽주의의 차이.',
    img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-04-05',
    readTime: '8분',
    tags: ['완벽주의', '자기계발', '심리학'],
    content: `"어차피 완벽하게 못 할 것 같아서 시작을 못 하겠어." "90점이면 됐는데 왜 100점이 아닌지 자책이 돼." 완벽주의는 종종 높은 기준을 추구하는 긍정적 특성으로 포장되지만, 심리학적으로 완벽주의에는 두 가지 전혀 다른 형태가 있습니다.

<strong>건강한 완벽주의 vs 병적 완벽주의</strong>

캐나다의 심리학자 폴 휴잇(Paul Hewitt)과 고든 플렛(Gordon Flett)의 연구에 따르면 완벽주의는 크게 세 차원으로 나뉩니다.

<strong>자기 지향적 완벽주의</strong>: 자신에게 높은 기준을 세우는 것. 적절한 수준에서는 성취 동기와 연결되는 긍정적 측면이 있습니다.

<strong>타인 지향적 완벽주의</strong>: 다른 사람에게도 완벽을 기대하는 것. 인간관계에서 갈등을 유발하고, 함께 일하는 사람들을 소진시킵니다.

<strong>사회적으로 규정된 완벽주의</strong>: "다른 사람들이 나에게 완벽을 기대한다"는 인식. 세 가지 중 가장 해롭습니다. 우울증, 불안, 번아웃과 강한 연관이 있습니다.

<img src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?auto=format&fit=crop&q=80&w=700&h=280" alt="완벽하게 정리된 책상과 노트" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>완벽주의가 오히려 성과를 떨어뜨리는 이유</strong>

역설적으로, 심한 완벽주의는 생산성과 창의성을 저하시킵니다. 첫째, 시작 장벽이 높아집니다. 완벽하게 할 자신이 없으면 아예 시작을 못 하는 '분석 마비(analysis paralysis)'가 나타납니다. 둘째, 수정과 개선을 두려워합니다. 초안이 완벽하지 않으면 공개를 미루게 됩니다. 셋째, 실패 경험을 과도하게 처리합니다. 99가지 잘한 것보다 1가지 잘못한 것에 집착하며 에너지를 소진합니다.

<strong>완벽주의의 심리적 뿌리</strong>

완벽주의는 종종 조건부 사랑을 경험한 어린 시절에서 비롯됩니다. "잘해야 사랑받는다"는 내면화된 신념이 기준 미달에 대한 극도의 불안으로 이어집니다.

<strong>건강한 수월주의(Healthy Striving)로 전환하는 법</strong>

심리학자 브레네 브라운(Brené Brown)은 완벽주의 대신 '건강한 수월주의'를 제안합니다. 핵심 차이는 이것입니다. 완벽주의는 "나는 이것을 완벽하게 해야 사람들이 나를 받아들일 것이다"이고, 건강한 수월주의는 "나는 최선을 다하고 싶다, 그 이유는 성장하고 싶기 때문이다"입니다.

실천 방법: 결과가 아닌 과정에 집중하기, 충분히 좋은 것(good enough)의 기준 정하기, 실수를 증거가 아닌 피드백으로 받아들이기.`,
  },
  {
    id: 11,
    category: '사회 심리학',
    title: '첫인상의 심리학: 0.1초가 결정하는 것과 바꿀 수 있는 것',
    summary: '사람을 처음 봤을 때 내리는 판단은 얼마나 정확하고, 또 얼마나 바꿀 수 있을까? 첫인상 형성의 과학.',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-04-10',
    readTime: '7분',
    tags: ['첫인상', '사회심리학', '후광효과'],
    content: `프린스턴대 심리학자 알렉산더 토도로프(Alexander Todorov)의 연구에 따르면, 사람들은 낯선 얼굴을 단 100밀리초(0.1초) 만에 신뢰도, 유능함, 친근함을 판단합니다. 심지어 더 긴 시간을 주어도 처음 판단이 크게 달라지지 않았습니다. 첫인상은 어떻게 형성되며, 우리는 그것을 어떻게 활용하거나 극복할 수 있을까요?

<strong>후광 효과 (Halo Effect)</strong>

외모가 매력적이거나 첫 만남에서 좋은 인상을 주면, 실제로 확인하지 못한 다른 특성들(능력, 성격, 신뢰성)도 긍정적으로 평가하는 경향을 후광 효과라고 합니다. 연구에 따르면 매력적인 외모의 사람은 채용 면접에서, 법정에서, 심지어 선거에서도 실제 능력과 무관하게 유리한 평가를 받습니다.

<img src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&q=80&w=700&h=280" alt="첫 만남에서 악수하는 두 사람" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>첫인상 형성의 두 단계</strong>

<strong>1단계 (자동적/무의식적)</strong>: 외모, 자세, 표정, 목소리 톤에 기반한 즉각적 판단. 이것은 의식적 통제가 거의 불가능합니다.

<strong>2단계 (의식적)</strong>: 대화 내용, 행동 방식에 기반한 보다 합리적인 평가. 이 단계에서 첫인상을 수정할 수 있습니다.

<strong>첫인상에 영향을 주는 요소들</strong>

비언어적 신호가 55%, 음성 톤이 38%, 말의 내용이 7%를 차지한다는 '메라비언의 법칙'은 과장되었다는 비판도 있지만, 비언어적 요소의 중요성 자체는 많은 연구에서 확인됩니다. 자신감 있는 자세(파워 포즈), 진심 어린 미소(뒤쉔 스마일), 적절한 눈맞춤이 긍정적 첫인상을 형성합니다.

<strong>수면자 효과 (Sleeper Effect)</strong>

나쁜 첫인상이 영원한 것은 아닙니다. 처음에는 부정적으로 보였던 정보가 시간이 지나면서 긍정적으로 재평가되는 현상입니다. 첫 만남에서 다소 어색하거나 불안했던 모습보다, 이후의 일관된 행동과 진정성이 장기적으로 인상을 형성합니다.

<strong>첫인상을 개선하는 심리학적 접근</strong>

가장 효과적인 방법은 자신에 대한 긍정적 기대(self-fulfilling prophecy)를 활성화하는 것입니다. "나는 사람들에게 좋은 인상을 줄 것"이라는 믿음이 실제 행동과 표정에 반영됩니다. 또한 상대방에 대한 진정한 관심을 보이는 것이 어떤 기술보다 효과적입니다.`,
  },
  {
    id: 12,
    category: '긍정 심리학',
    title: '감사가 뇌를 바꾼다: 긍정 심리학의 과학적 증거',
    summary: '"감사하세요"는 단순한 조언이 아닙니다. 신경과학이 증명하는 감사 훈련의 실제 효과와 뇌 변화.',
    img: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=800&h=420',
    date: '2025-04-15',
    readTime: '8분',
    tags: ['긍정심리학', '감사일기', '행복'],
    content: `"행복하면 감사하게 됩니다." 우리는 그렇게 생각하지만, 연구에 따르면 인과관계가 반대입니다. "감사하면 행복해집니다." 캘리포니아대 데이비스 캠퍼스의 심리학자 로버트 에먼스(Robert Emmons)의 대규모 연구에서, 감사 일기를 쓴 그룹은 그렇지 않은 그룹보다 25% 높은 삶의 만족도를 보고했습니다.

<strong>감사가 뇌에 미치는 영향</strong>

신경과학 연구에 따르면 감사를 경험할 때 뇌의 보상 회로(특히 복측 선조체와 전전두엽)가 활성화됩니다. 도파민과 세로토닌이 분비되어 기분이 좋아질 뿐 아니라, 이 회로가 반복적으로 활성화될수록 신경 경로가 강화됩니다. 즉, 감사 훈련은 뇌를 물리적으로 변화시킵니다.

또한 감사는 코르티솔(스트레스 호르몬) 수준을 낮추는 효과가 있습니다. UC 데이비스 연구에서 감사 그룹은 대조군보다 23% 낮은 코르티솔 수준을 보였습니다.

<img src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&q=80&w=700&h=280" alt="감사 일기를 쓰는 모습" style="width:100%;height:210px;object-fit:cover;border-radius:12px;margin:8px 0" />

<strong>감사가 어려운 이유: 부정 편향 (Negativity Bias)</strong>

인간의 뇌는 진화적으로 위험을 빠르게 감지하기 위해 부정적 정보에 더 민감하게 반응합니다. 좋은 경험보다 나쁜 경험이 더 강하게 기억되고, 일상에서 좋은 것은 당연하게 여기는 반면 나쁜 것은 과도하게 주목합니다. 감사 훈련은 이 자연스러운 편향에 의식적으로 대응하는 것입니다.

<strong>과학적으로 검증된 감사 실천법</strong>

<strong>① 감사 일기</strong>: 매일 구체적인 감사 3가지를 적습니다. 중요한 것은 구체성입니다. "오늘도 좋은 날이었다"보다 "오늘 동료가 점심을 같이 먹자고 해줘서 외롭지 않았다"가 더 효과적입니다.

<strong>② 감사 편지</strong>: 나에게 중요한 영향을 주었지만 제대로 감사를 표현하지 못한 사람에게 편지를 쓰고 직접 읽어주는 '감사 방문(gratitude visit)'은 당사자와 상대방 모두의 행복감을 장기적으로 높인다는 연구 결과가 있습니다.

<strong>③ 사전 감사(Pre-gratitude)</strong>: 아직 일어나지 않은 좋은 일을 미리 감사하는 상상. 긍정적 기대와 낙관성을 높이는 효과가 있습니다.

<strong>감사 훈련의 주의사항</strong>

과도한 긍정성 강요(toxic positivity)에 빠지지 않도록 주의해야 합니다. 힘든 감정을 무시하고 억지로 감사를 찾는 것은 오히려 역효과를 낳습니다. 감사는 힘든 현실을 부정하는 것이 아니라, 그 안에서도 존재하는 작은 선함을 알아채는 훈련입니다.`,
  },
];

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
};

export default function InsightBlog() {
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    document.title = '심리 인사이트 - 러브 랭귀지·투자 심리·색채 심리학 | CCGG';
  }, []);

  if (selectedPost) {
    const related = POSTS.filter(p => p.id !== selectedPost.id).slice(0, 3);
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

  const [featured, ...rest] = POSTS;

  return (
    <div className="blog-list animate-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '4px', textAlign: 'center' }}>
        심리 인사이트
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '28px' }}>
        러브 랭귀지, 색채 심리학, 투자 심리학, 스트레스 관리 등 — 나를 이해하는 심층 아티클
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

      {/* Grid of remaining posts */}
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
}
