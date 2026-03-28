import React, { useState } from 'react';

// 1. 재밌는 10가지 연애 성향 질문 데이터
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

// 2. 연예인 매칭 결과 데이터 (Unsplash 고화질 Placeholder 사용)
const celebrityResults = [
  {
    name: "차은우",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    reason: "당신은 따뜻하고 세심한 배려를 중요하게 생각하는군요! 만찢남 비주얼에 다정함까지 갖춘 '차은우' 스타일이 당신과 찰떡궁합입니다. 로맨틱한 데이트를 기대해 보세요! ✨"
  },
  {
    name: "제니 (JENNIE)",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    reason: "당신은 트렌디하고 개성 있는 매력에 끌리는 타입! 힙하고 당당하면서도 귀여운 고양이 같은 매력을 가진 '제니' 스타일이 당신의 마음을 사로잡을 완벽한 이상형입니다. 🖤"
  },
  {
    name: "티모시 샬라메",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop",
    reason: "당신은 감수성이 풍부하고 깊은 대화를 나눌 수 있는 사람을 원하네요! 예술적인 영감과 몽환적인 분위기를 가진 '티모시 샬라메' 스타일과 깊은 교감을 나눌 수 있을 거예요. 🎬"
  },
  {
    name: "젠데이아",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
    reason: "당신은 쿨하고 에너지 넘치는 관계를 선호하는군요! 언제나 자신감 넘치고 유쾌한 바이브를 뿜어내는 '젠데이아' 스타일과 함께라면 매일매일이 시트콤처럼 즐거울 거예요! ⚡"
  }
];

export default function CelebrityTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ E: 0, I: 0, F: 0, T: 0, J: 0, P: 0 });
  const [showResult, setShowResult] = useState(false);
  const [matchedCeleb, setMatchedCeleb] = useState(null);

  const handleAnswer = (scoreType) => {
    // 점수 누적
    const newScores = { ...scores, [scoreType]: scores[scoreType] + 1 };
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores) => {
    // 간단한 매칭 로직 (점수 조합에 따라 연예인 배정)
    let celebIndex = 0;
    if (finalScores.E > finalScores.I && finalScores.F > finalScores.T) celebIndex = 0; // 차은우
    else if (finalScores.E > finalScores.I && finalScores.T >= finalScores.F) celebIndex = 1; // 제니
    else if (finalScores.I >= finalScores.E && finalScores.F > finalScores.T) celebIndex = 2; // 티모시
    else celebIndex = 3; // 젠데이아

    setMatchedCeleb(celebrityResults[celebIndex]);
    setShowResult(true);
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setScores({ E: 0, I: 0, F: 0, T: 0, J: 0, P: 0 });
    setShowResult(false);
    setMatchedCeleb(null);
  };

  const handleShare = async () => {
    const shareText = `나의 찰떡 이상형은 ${matchedCeleb.name}! ${matchedCeleb.reason} 너도 테스트 해봐!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '이상형 테스트 결과',
          text: shareText,
          url: shareUrl,
        });
        console.log('결과 공유 성공');
      } catch (error) {
        console.error('결과 공유 실패:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('결과가 클립보드에 복사되었습니다! 친구들에게 공유해보세요.');
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💘 나와 찰떡인 연예인 이상형 테스트</h2>
      
      {!showResult ? (
        <div style={styles.card}>
          <p style={styles.progress}>진행도: {currentQuestion + 1} / {questions.length}</p>
          <h3 style={styles.questionText}>{questions[currentQuestion].text}</h3>
          <div style={styles.buttonContainer}>
            {questions[currentQuestion].options.map((option, index) => (
              <button 
                key={index} 
                style={styles.optionButton} 
                onClick={() => handleAnswer(option.score)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.resultCard}>
          <h3 style={styles.resultTitle}>당신의 완벽한 이상형은 바로...</h3>
          <img 
            src={matchedCeleb.image} 
            alt={matchedCeleb.name} 
            style={styles.image} 
          />
          <h2 style={styles.celebName}>{matchedCeleb.name}</h2>
          <p style={styles.reasonText}>{matchedCeleb.reason}</p>
          <button style={styles.shareButton} onClick={handleShare}>
            결과 공유하기 📤
          </button>
          <button style={styles.resetButton} onClick={resetTest}>
            테스트 다시하기 🔄
          </button>
        </div>
      )}
    </div>
  );
}

// 간단하고 깔끔한 사내 인트라넷 스타일의 CSS
const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' },
  title: { color: '#333', marginBottom: '30px' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  progress: { color: '#888', fontSize: '14px', marginBottom: '15px' },
  questionText: { fontSize: '20px', color: '#222', marginBottom: '30px', wordBreak: 'keep-all' },
  buttonContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  optionButton: { padding: '15px', fontSize: '16px', backgroundColor: '#f0f4f8', border: '2px solid #e1e8ed', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold', color: '#444' },
  resultCard: { backgroundColor: '#fff', padding: '40px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', animation: 'fadeIn 0.5s' },
  resultTitle: { color: '#666', fontSize: '18px', marginBottom: '20px' },
  image: { width: '250px', height: '250px', objectFit: 'cover', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' },
  celebName: { fontSize: '28px', color: '#111', margin: '10px 0' },
  reasonText: { fontSize: '16px', color: '#555', lineHeight: '1.6', padding: '0 20px', marginBottom: '30px', wordBreak: 'keep-all' },
  shareButton: { padding: '12px 24px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' },
  resetButton: { padding: '12px 24px', fontSize: '16px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};
