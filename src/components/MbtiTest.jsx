import React, { useState } from 'react';

const I18N = {
    en: {
        title: "MBTI Personality Test",
        question: "Question",
        of: "of",
        yourResult: "Your Result",
        takeAgain: "Take the Test Again",
        backHome: "Back to Home",
        mbtiQuestions: [
            { q: "At a social event, do you usually...", a: ["Talk to many people, including strangers", "Talk to a few people you already know"], type: ["E", "I"] },
            { q: "Do you tend to focus more on...", a: ["Facts and details of the present", "Possibilities and future connections"], type: ["S", "N"] },
            { q: "When making a decision, do you rely more on...", a: ["Logical analysis and objective truth", "Personal values and how it affects others"], type: ["T", "F"] },
            { q: "Do you prefer your life to be...", a: ["Structured and organized with clear plans", "Flexible and spontaneous with open options"], type: ["J", "P"] },
            { q: "Do you get your energy from...", a: ["Interacting with others and external activities", "Spending time alone and internal reflection"], type: ["E", "I"] },
            { q: "Are you more interested in...", a: ["What is actual and real", "What is possible and theoretical"], type: ["S", "N"] },
            { q: "Which is a higher compliment?", a: ["'You are a very logical person'", "'You are a very sensitive person'"], type: ["T", "F"] },
            { q: "Do you feel more comfortable...", a: ["Having things settled and decided", "Keeping your options open for as long as possible"], type: ["J", "P"] }
        ],
        mbtiDescriptions: {
            'INTJ': 'The Architect: Imaginative and strategic thinkers, with a plan for everything.',
            'INTP': 'The Logician: Innovative inventors with an unquenchable thirst for knowledge.',
            'ENTJ': 'The Commander: Bold, imaginative and strong-willed leaders, always finding a way – or making one.',
            'ENTP': 'The Debater: Smart and curious thinkers who cannot resist an intellectual challenge.',
            'INFJ': 'The Advocate: Quiet and mystical, yet very inspiring and tireless idealists.',
            'INFP': 'The Mediator: Poetic, kind and altruistic people, always eager to help a good cause.',
            'ENFJ': 'The Protagonist: Charismatic and inspiring leaders, able to mesmerize their listeners.',
            'ENFP': 'The Campaigner: Enthusiastic, creative and sociable free spirits, who can always find a reason to smile.',
            'ISTJ': 'The Logistician: Practical and fact-minded individuals, whose reliability cannot be doubted.',
            'ISFJ': 'The Defender: Very dedicated and warm protectors, always ready to defend their loved ones.',
            'ESTJ': 'The Executive: Excellent administrators, unsurpassed at managing things – or people.',
            'ESFJ': 'The Consul: Extraordinarily caring, social and popular people, always eager to help.',
            'ISTP': 'The Virtuoso: Bold and practical experimenters, masters of all kinds of tools.',
            'ISFP': 'The Adventurer: Flexible and charming artists, always ready to explore and experience something new.',
            'ESTP': 'The Entrepreneur: Smart, energetic and very perceptive people, who truly enjoy living on the edge.',
            'ESFP': 'The Entertainer: Spontaneous, energetic and enthusiastic people – life is never boring around them.'
        }
    },
    ko: {
        title: "MBTI 성격 유형 테스트",
        question: "질문",
        of: "/",
        yourResult: "테스트 결과",
        takeAgain: "테스트 다시 하기",
        backHome: "홈으로 돌아가기",
        mbtiQuestions: [
            { q: "사교 모임에서 당신은 보통...", a: ["낯선 사람을 포함해 많은 사람들과 대화한다", "이미 알고 있는 몇몇 사람들과 대화한다"], type: ["E", "I"] },
            { q: "당신은 어디에 더 집중하는 편인가요?", a: ["현재의 사실과 세부 사항", "미래의 가능성과 연결고리"], type: ["S", "N"] },
            { q: "의사 결정을 할 때 무엇에 더 의존하나요?", a: ["논리적 분석과 객관적 진실", "개인적 가치와 타인에게 미칠 영향"], type: ["T", "F"] },
            { q: "당신의 삶이 어떤 방식이길 선호하나요?", a: ["명확한 계획이 있는 체계적이고 조직적인 삶", "선택의 폭을 넓혀두는 유연하고 즉흥적인 삶"], type: ["J", "P"] },
            { q: "당신은 어디에서 에너지를 얻나요?", a: ["타인과의 상호작용과 외부 활동", "혼자만의 시간과 내면의 성찰"], type: ["E", "I"] },
            { q: "당신은 무엇에 더 관심이 있나요?", a: ["실제적이고 현실적인 것", "가능성이 있고 이론적인 것"], type: ["S", "N"] },
            { q: "어떤 칭찬이 더 기분 좋게 들리나요?", a: ["'당신은 매우 논리적인 사람이군요'", "'당신은 매우 감수성이 풍부한 사람이군요'"], type: ["T", "F"] },
            { q: "어떨 때 더 편안함을 느끼나요?", a: ["일이 확정되고 결정되었을 때", "가능한 한 오랫동안 선택의 여지를 남겨두었을 때"], type: ["J", "P"] }
        ],
        mbtiDescriptions: {
            'INTJ': '용의주도한 전략가: 상상력이 풍부하며 전략적 사고에 능하며, 모든 것에 대한 계획을 가지고 있습니다.',
            'INTP': '논리적인 사색가: 지적 호기심이 많으며 끊임없이 지식을 갈구하는 혁신적인 발명가입니다.',
            'ENTJ': '대담한 통솔자: 대담하고 상상력이 풍부하며 강한 의지를 가진 리더로, 언제나 길을 찾아내거나 만들어냅니다.',
            'ENTP': '뜨거운 논쟁을 즐기는 변론가: 지적인 도전을 거부하지 않는 영리하고 호기심 많은 사색가입니다.',
            'INFJ': '선의의 옹호자: 조용하고 신비로우며 샘솟는 영감으로 지칠 줄 모르는 이상주의자입니다.',
            'INFP': '열정적인 중재자: 상냥하고 이타적인 성격으로, 언제나 좋은 일을 위해 헌신할 준비가 되어 있는 시적인 사람입니다.',
            'ENFJ': '정의로운 사회운동가: 카리스마 있고 영감을 주는 리더로, 청중을 사로잡는 능력이 있습니다.',
            'ENFP': '재기발랄한 활동가: 열정적이고 창의적이며 사교적인 자유로운 영혼으로, 언제나 웃을 이유를 찾아냅니다.',
            'ISTJ': '청렴결백한 논리주의자: 실용적이고 사실에 근거해 사고하며, 신뢰를 저버리지 않는 성실한 사람입니다.',
            'ISFJ': '용감한 수호자: 소중한 사람들을 보호하는 데 헌신적이고 따뜻한 마음을 가진 수호자입니다.',
            'ESTJ': '엄격한 관리자: 사물이나 사람을 관리하는 데 타의 추종을 불허하는 뛰어난 행정가입니다.',
            'ESFJ': '사교적인 외교관: 타인에게 각별한 관심을 쏟으며 사교적이고 인기가 많은 성격으로, 언제나 도움을 줄 준비가 되어 있습니다.',
            'ISTP': '만능 재주꾼: 대담하고 실용적인 실험가로, 온갖 도구를 자유자재로 다루는 거장입니다.',
            'ISFP': '호기심 많은 예술가: 유연하고 매력 넘치는 예술가로, 항상 새로운 것을 탐험하고 경험할 준비가 되어 있습니다.',
            'ESTP': '모험을 즐기는 사업가: 명석하고 에너지가 넘치며 관찰력이 뛰어난 사람으로, 위험을 기꺼이 감수하며 삶을 즐깁니다.',
            'ESFP': '자유로운 영혼의 연예인: 즉흥적이고 에너지가 넘치며 열정적인 성격으로, 주변 사람들을 즐겁게 합니다.'
        }
    }
};

const MbtiTest = () => {
    const [lang, setLang] = useState('ko');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    const [showResult, setShowResult] = useState(false);

    const t = I18N[lang];
    const questions = t.mbtiQuestions;

    const handleAnswer = (type) => {
        setAnswers(prev => ({ ...prev, [type]: prev[type] + 1 }));
        if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResult(true);
        }
    };

    const resetTest = () => {
        setCurrentQuestion(0);
        setAnswers({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
        setShowResult(false);
    };

    const calculateResult = () => {
        const typeEvsI = answers.E >= answers.I ? 'E' : 'I';
        const typeSvsN = answers.S >= answers.N ? 'S' : 'N';
        const typeTvsF = answers.T >= answers.F ? 'T' : 'F';
        const typeJvsP = answers.J >= answers.P ? 'J' : 'P';
        return typeEvsI + typeSvsN + typeTvsF + typeJvsP;
    };

    if (showResult) {
        const result = calculateResult();
        return (
            <div className="result-container animate-scaleIn">
                <h2>{t.yourResult}</h2>
                <span className="type-code">{result}</span>
                <p>{t.mbtiDescriptions[result]}</p>
                <button onClick={resetTest} className="btn-primary">{t.takeAgain}</button>
            </div>
        );
    }

    const q = questions[currentQuestion];

    return (
        <div className="test-page">
            <div className="lang-toggle-container">
                <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                <button className={`lang-btn ${lang === 'ko' ? 'active' : ''}`} onClick={() => setLang('ko')}>KO</button>
            </div>
            <div className="question-container animate-fadeIn">
                <div className="progress">{t.question} {currentQuestion + 1} {t.of} {questions.length}</div>
                <h3>{q.q}</h3>
                <div className="options">
                    <button onClick={() => handleAnswer(q.type[0])} className="btn-option">{q.a[0]}</button>
                    <button onClick={() => handleAnswer(q.type[1])} className="btn-option">{q.a[1]}</button>
                </div>
            </div>
        </div>
    );
};

export default MbtiTest;
