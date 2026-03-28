const I18N = {
    en: {
        title: "TestGROUND",
        mbtiTitle: "MBTI Personality Test",
        mbtiDesc: "Discover your 4-letter personality type and understand your unique perspective on the world.",
        inquiryTitle: "Affiliate Inquiry",
        inquiryDesc: "Interested in partnering with TestGROUND? Send us a message!",
        footer: "© 2026 TestGROUND • Built with Modern Web Standards",
        question: "Question",
        of: "of",
        yourResult: "Your Result",
        takeAgain: "Take the Test Again",
        backHome: "Back to Home",
        send: "Send Message",
        emailLabel: "Your Email",
        messageLabel: "Your Message",
        successMsg: "Thank you! Your message has been sent.",
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
        title: "테스트그라운드",
        mbtiTitle: "MBTI 성격 유형 테스트",
        mbtiDesc: "당신의 4글자 성격 유형을 발견하고 세상을 바라보는 당신만의 독특한 관점을 이해해보세요.",
        inquiryTitle: "제휴 문의",
        inquiryDesc: "테스트그라운드와 파트너가 되고 싶으신가요? 메시지를 남겨주세요!",
        footer: "© 2026 테스트그라운드 • 현대적 웹 표준으로 제작됨",
        question: "질문",
        of: "/",
        yourResult: "테스트 결과",
        takeAgain: "테스트 다시 하기",
        backHome: "홈으로 돌아가기",
        send: "메시지 보내기",
        emailLabel: "이메일 주소",
        messageLabel: "문의 내용",
        successMsg: "감사합니다! 메시지가 성공적으로 전송되었습니다.",
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

let currentLang = 'en';

const GLOBAL_STYLES = `
    :host {
        --primary-bg: #f8f9fa;
        --header-footer-bg: #2c3e50;
        --primary-text: #343a40;
        --accent-color: #ff6b6b;
        --accent-hover: #ff4757;
        --card-bg: #ffffff;
        --shadow-color: rgba(0, 0, 0, 0.1);
        --font-heading: 'Poppins', sans-serif;
        --font-body: 'Lato', sans-serif;
        --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    button {
        background-color: var(--accent-color);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: var(--transition);
        margin: 0.5rem;
        font-family: var(--font-body);
        box-shadow: 0 4px 8px rgba(255, 107, 107, 0.4);
    }

    button:hover {
        background-color: var(--accent-hover);
        box-shadow: 0 6px 12px rgba(255, 107, 107, 0.6);
        transform: translateY(-2px);
    }

    button:active {
        transform: translateY(0);
    }

    input, textarea {
        width: 100%;
        padding: 0.8rem;
        margin-bottom: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: var(--font-body);
        box-sizing: border-box;
    }

    label {
        display: block;
        text-align: left;
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: var(--primary-text);
    }
`;

class AppShell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.showTestList();
    }

    render() {
        const t = I18N[currentLang];
        this.shadowRoot.innerHTML = `
            <style>
                ${GLOBAL_STYLES}
                :host {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                header {
                    background-color: var(--header-footer-bg);
                    color: white;
                    padding: 1rem 1.5rem;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    position: relative;
                }
                .lang-toggle {
                    position: absolute;
                    right: 1.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    gap: 0.5rem;
                }
                .lang-btn {
                    background: rgba(255,255,255,0.2);
                    padding: 0.3rem 0.6rem;
                    font-size: 0.8rem;
                    box-shadow: none;
                    margin: 0;
                }
                .lang-btn.active {
                    background: var(--accent-color);
                    font-weight: bold;
                }
                h1 {
                    margin: 0;
                    font-family: var(--font-heading);
                    font-size: 1.8rem;
                    letter-spacing: 1px;
                    cursor: pointer;
                }
                main {
                    flex: 1;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                    box-sizing: border-box;
                }
                footer {
                    background-color: var(--header-footer-bg);
                    color: rgba(255,255,255,0.7);
                    padding: 1rem;
                    text-align: center;
                    font-size: 0.9rem;
                }
                #content {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
            </style>
            <header>
                <h1 id="logo">${t.title}</h1>
                <div class="lang-toggle">
                    <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
                    <button class="lang-btn ${currentLang === 'ko' ? 'active' : ''}" data-lang="ko">KO</button>
                </div>
            </header>
            <main>
                <div id="content"></div>
            </main>
            <footer>
                <p>${t.footer}</p>
            </footer>
        `;

        this.shadowRoot.getElementById('logo').addEventListener('click', () => this.showTestList());

        this.shadowRoot.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentLang = e.target.dataset.lang;
                this.render();
                this.showTestList();
            });
        });
    }

    showTestList() {
        const t = I18N[currentLang];
        this.shadowRoot.getElementById('content').innerHTML = `
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; width: 100%;">
                <test-card 
                    id="mbti-card"
                    title="${t.mbtiTitle}" 
                    description="${t.mbtiDesc}" 
                    icon="🧠">
                </test-card>
                <test-card 
                    id="inquiry-card"
                    title="${t.inquiryTitle}" 
                    description="${t.inquiryDesc}" 
                    icon="🤝">
                </test-card>
            </div>
        `;
        this.shadowRoot.getElementById('mbti-card').addEventListener('click', () => this.showMbtiTest());
        this.shadowRoot.getElementById('inquiry-card').addEventListener('click', () => this.showInquiryForm());
    }

    showMbtiTest() {
        this.shadowRoot.getElementById('content').innerHTML = `<mbti-test></mbti-test>`;
    }

    showInquiryForm() {
        this.shadowRoot.getElementById('content').innerHTML = `<inquiry-form></inquiry-form>`;
    }
}

customElements.define('app-shell', AppShell);

class TestCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${GLOBAL_STYLES}
                :host {
                    display: block;
                    background-color: var(--card-bg);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px var(--shadow-color);
                    margin: 1rem;
                    padding: 2rem;
                    cursor: pointer;
                    transition: var(--transition);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-sizing: border-box;
                }
                :host(:hover) {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px var(--shadow-color);
                }
                .icon {
                    font-size: 3.5rem;
                    margin-bottom: 1.5rem;
                    display: block;
                }
                h2 {
                    font-family: var(--font-heading);
                    color: var(--primary-text);
                    margin: 0 0 1rem 0;
                    font-size: 1.5rem;
                }
                p {
                    margin: 0;
                    color: #555;
                    line-height: 1.6;
                }
            </style>
            <span class="icon">${this.getAttribute('icon')}</span>
            <h2>${this.getAttribute('title')}</h2>
            <p>${this.getAttribute('description')}</p>
        `;
    }
}

customElements.define('test-card', TestCard);

class MbtiTest extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.answers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        this.currentQuestion = 0;
    }

    connectedCallback() {
        this.renderQuestion();
    }

    renderQuestion() {
        const t = I18N[currentLang];
        const questions = t.mbtiQuestions;

        if (this.currentQuestion >= questions.length) {
            this.showResult();
            return;
        }

        const q = questions[this.currentQuestion];
        this.shadowRoot.innerHTML = `
            <style>
                ${GLOBAL_STYLES}
                .question-container {
                    padding: 2.5rem;
                    background: var(--card-bg);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px var(--shadow-color);
                    text-align: center;
                    animation: fadeIn 0.5s ease-out;
                    width: 100%;
                    max-width: 600px;
                    box-sizing: border-box;
                }
                h3 {
                    font-family: var(--font-heading);
                    margin-bottom: 2rem;
                    color: var(--primary-text);
                    font-size: 1.3rem;
                    line-height: 1.4;
                }
                .options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .progress {
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    color: #888;
                }
            </style>
            <div class="question-container">
                <div class="progress">${t.question} ${this.currentQuestion + 1} ${t.of} ${questions.length}</div>
                <h3>${q.q}</h3>
                <div class="options">
                    <button data-type="${q.type[0]}">${q.a[0]}</button>
                    <button data-type="${q.type[1]}">${q.a[1]}</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.answers[type]++;
                this.currentQuestion++;
                this.renderQuestion();
            });
        });
    }

    showResult() {
        const t = I18N[currentLang];
        const typeEvsI = this.answers.E >= this.answers.I ? 'E' : 'I';
        const typeSvsN = this.answers.S >= this.answers.N ? 'S' : 'N';
        const typeTvsF = this.answers.T >= this.answers.F ? 'T' : 'F';
        const typeJvsP = this.answers.J >= this.answers.P ? 'J' : 'P';
        const result = typeEvsI + typeSvsN + typeTvsF + typeJvsP;

        this.shadowRoot.innerHTML = `
            <style>
                ${GLOBAL_STYLES}
                .result-container {
                    padding: 3rem;
                    background: var(--card-bg);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px var(--shadow-color);
                    text-align: center;
                    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    width: 100%;
                    max-width: 600px;
                    box-sizing: border-box;
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                h2 {
                    font-family: var(--font-heading);
                    color: var(--accent-color);
                    font-size: 2.2rem;
                    margin: 0 0 1rem 0;
                }
                .type-code {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--primary-text);
                    margin-bottom: 1.5rem;
                    display: block;
                }
                p {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: #444;
                    margin-bottom: 2rem;
                }
                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
            </style>
            <div class="result-container">
                <h2>${t.yourResult}</h2>
                <span class="type-code">${result}</span>
                <p>${t.mbtiDescriptions[result] || 'You are a unique individual!'}</p>
                <div class="actions">
                    <button id="reset-button">${t.takeAgain}</button>
                    <button id="home-button" style="background-color: #6c757d;">${t.backHome}</button>
                </div>
            </div>
        `;

        this.shadowRoot.getElementById('reset-button').addEventListener('click', () => {
            this.currentQuestion = 0;
            this.answers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
            this.renderQuestion();
        });

        this.shadowRoot.getElementById('home-button').addEventListener('click', () => {
            const appShell = document.querySelector('app-shell');
            if (appShell) appShell.showTestList();
        });
    }
}

customElements.define('mbti-test', MbtiTest);

class InquiryForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const t = I18N[currentLang];
        this.shadowRoot.innerHTML = `
            <style>
                ${GLOBAL_STYLES}
                .form-container {
                    padding: 2.5rem;
                    background: var(--card-bg);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px var(--shadow-color);
                    text-align: center;
                    width: 100%;
                    max-width: 600px;
                    box-sizing: border-box;
                    animation: fadeIn 0.5s ease-out;
                }
                h2 {
                    font-family: var(--font-heading);
                    color: var(--primary-text);
                    margin-bottom: 1.5rem;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <div class="form-container">
                <h2>${t.inquiryTitle}</h2>
                <form action="https://formspree.io/f/xwvwvbqz" method="POST">
                    <label>${t.emailLabel}</label>
                    <input type="email" name="email" required placeholder="example@email.com">
                    
                    <label>${t.messageLabel}</label>
                    <textarea name="message" rows="5" required placeholder="Enter your inquiry details..."></textarea>
                    
                    <button type="submit">${t.send}</button>
                    <button type="button" id="back-btn" style="background-color: #6c757d;">${t.backHome}</button>
                </form>
            </div>
        `;

        this.shadowRoot.getElementById('back-btn').addEventListener('click', () => {
            const appShell = document.querySelector('app-shell');
            if (appShell) appShell.showTestList();
        });
    }
}

customElements.define('inquiry-form', InquiryForm);
