import React, { useState } from 'react';

const BLOG_POSTS = [
  {
    id: 1,
    title: "MBTI란 무엇인가? 입문자를 위한 완벽 가이드",
    summary: "성격 유형 검사의 대명사가 된 MBTI의 탄생 배경과 4가지 지표의 기본 개념을 알기 쉽게 정리해 드립니다.",
    content: "MBTI(Myers-Briggs Type Indicator)는 마이어스와 브릭스가 융의 심리 유형론을 바탕으로 개발한 성격 유형 지표입니다. 이는 단순한 재미를 넘어 자신과 타인을 이해하는 강력한 도구로 자리 잡았습니다. 외향(E)-내향(I), 감각(S)-직관(N), 사고(T)-감정(F), 판단(J)-인식(P)의 4가지 선호 지표를 통해 총 16가지 성격 유형을 정의합니다.",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    title: "E와 I의 차이: 당신의 에너지는 어디서 충전되나요?",
    summary: "사교적인 사람과 내성적인 사람의 단순한 구분이 아닙니다. 진정한 에너지의 원천이 내부인지 외부인지 확인해보세요.",
    content: "외향형(E)은 사람들과 어울리고 외부 활동을 할 때 활력을 얻는 반면, 내향형(I)은 혼자만의 시간을 가지며 에너지를 재충전합니다. 이는 사회성의 문제가 아니라 '심리적 에너지의 방향'에 관한 것입니다.",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    title: "S와 N의 결정적 차이: 숲을 보느냐 나무를 보느냐",
    summary: "현실의 세부사항에 집중하는 S와 미래의 가능성을 상상하는 N의 서로 다른 세상을 보는 눈.",
    content: "감각형(S)은 오감을 통해 느껴지는 실제적인 사실과 경험을 중시합니다. 반면 직관형(N)은 아이디어, 비유, 그리고 비어있는 행간의 의미와 미래의 가능성을 추구합니다.",
    img: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 4,
    title: "T와 F의 대화법: 해결책인가, 공감인가?",
    summary: "논리적인 분석을 우선하는 T와 인간관계와 감정을 중시하는 F가 갈등을 줄이는 대화 기술.",
    content: "사고형(T)은 진실과 원칙을 바탕으로 객관적인 결정을 내리려 합니다. 감정형(F)은 상황의 특수성과 관계의 화화를 고려하여 사람 중심의 결정을 내립니다.",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 5,
    title: "J와 P의 라이프스타일: 계획적인 삶 vs 자유로운 삶",
    summary: "마감 기한을 대하는 태도부터 여행 계획까지, 완전히 다른 두 유형의 삶의 방식.",
    content: "판단형(J)은 계획적이고 조직적이며 목적의식이 뚜렷합니다. 인식형(P)은 자율적이고 융통성이 있으며 상황에 따라 적응하는 것을 즐깁니다.",
    img: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 6,
    title: "MBTI 궁합 가이드: 환상의 짝꿍과 환장의 짝꿍",
    summary: "서로를 보완해주는 최고의 조합은 누구일까요? 유형별 성격 궁합표를 분석해 드립니다.",
    content: "성격이 비슷하다고 해서 무조건 잘 맞는 것은 아닙니다. 때로는 완전히 반대되는 성향이 서로의 단점을 보완하며 시너지를 내기도 합니다.",
    img: "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 7,
    title: "스트레스 상황에서 MBTI별 반응과 대처법",
    summary: "번아웃이 왔을 때 당신의 유형은 어떻게 변하나요? 건강한 멘탈 관리를 위한 맞춤 처방.",
    content: "극도의 스트레스 상황에서 각 유형은 평소와 다른 모습을 보일 수 있습니다. 이를 이해하면 자신을 더 빨리 회복시킬 수 있습니다.",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 8,
    title: "MBTI별 추천 직업군: 나에게 딱 맞는 일 찾기",
    summary: "성격 강점을 극대화할 수 있는 커리어 방향을 제시합니다. 당신의 유형이 빛나는 직업은?",
    content: "분석적인 NT형은 기획과 전략, 따뜻한 NF형은 교육과 상담 분야에서 자신의 잠재력을 더 잘 발휘할 가능성이 높습니다.",
    img: "https://images.unsplash.com/photo-1454165833767-027ffea70250?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 9,
    title: "연애 스타일로 보는 MBTI: 사랑에 빠진 당신은?",
    summary: "유형별 사랑을 표현하는 방식과 이상적인 데이트 코스를 추천해 드립니다.",
    content: "적극적으로 대시하는 유형부터 묵묵히 뒤에서 챙겨주는 유형까지, MBTI로 보는 흥미진진한 연애 심리학.",
    img: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 10,
    title: "MBTI 결과가 바뀌었다면? 성격의 변화와 성숙",
    summary: "검사할 때마다 결과가 달라지는 이유와 환경이 성격에 미치는 영향에 대해 알아봅니다.",
    content: "인간은 평생에 걸쳐 발달합니다. 핵심 선호는 유지될 수 있지만, 경험을 통해 약점을 보완하며 더 성숙한 인격체로 거듭나게 됩니다.",
    img: "https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=600"
  }
];

const MbtiBlog = () => {
  const [selectedPost, setSelectedPost] = useState(null);

  if (selectedPost) {
    return (
      <div className="blog-detail animate-in">
        <button className="btn-secondary" onClick={() => setSelectedPost(null)} style={{ marginBottom: '20px' }}>← 목록으로</button>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <img src={selectedPost.img} alt={selectedPost.title} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          <div style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px', lineHeight: '1.3' }}>{selectedPost.title}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list animate-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '25px', textAlign: 'center' }}>MBTI 인사이트</h2>
      <div className="blog-grid" style={{ display: 'grid', gap: '20px' }}>
        {BLOG_POSTS.map(post => (
          <div key={post.id} className="post-item card" onClick={() => setSelectedPost(post)} style={{ display: 'flex', flexDirection: 'row', padding: '0', cursor: 'pointer', overflow: 'hidden' }}>
            <img src={post.img} alt={post.title} style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
            <div style={{ padding: '20px', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>{post.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{post.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MbtiBlog;
