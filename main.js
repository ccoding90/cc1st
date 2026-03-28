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
`;

class AppShell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.showTestList();
    }

    render() {
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
                    padding: 1.5rem;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    margin: 0;
                    font-family: var(--font-heading);
                    font-size: 2rem;
                    letter-spacing: 1px;
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
                <h1>TestGROUND</h1>
            </header>
            <main>
                <div id="content"></div>
            </main>
            <footer>
                <p>© 2026 TestGROUND • Built with Modern Web Standards</p>
            </footer>
        `;
    }

    showTestList() {
        this.shadowRoot.getElementById('content').innerHTML = `
            <test-card 
                title="MBTI Personality Test" 
                description="Discover your 4-letter personality type and understand your unique perspective on the world." 
                icon="🧠">
            </test-card>
        `;
        this.shadowRoot.querySelector('test-card').addEventListener('click', () => this.showMbtiTest());
    }

    showMbtiTest() {
        this.shadowRoot.getElementById('content').innerHTML = `<mbti-test></mbti-test>`;
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
                    max-width: 500px;
                    text-align: center;
                    border: 1px solid rgba(0,0,0,0.05);
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
        this.questions = [
            { q: "At a social event, do you usually...", a: ["Talk to many people, including strangers", "Talk to a few people you already know"], type: ["E", "I"] },
            { q: "Do you tend to focus more on...", a: ["Facts and details of the present", "Possibilities and future connections"], type: ["S", "N"] },
            { q: "When making a decision, do you rely more on...", a: ["Logical analysis and objective truth", "Personal values and how it affects others"], type: ["T", "F"] },
            { q: "Do you prefer your life to be...", a: ["Structured and organized with clear plans", "Flexible and spontaneous with open options"], type: ["J", "P"] },
            { q: "Do you get your energy from...", a: ["Interacting with others and external activities", "Spending time alone and internal reflection"], type: ["E", "I"] },
            { q: "Are you more interested in...", a: ["What is actual and real", "What is possible and theoretical"], type: ["S", "N"] },
            { q: "Which is a higher compliment?", a: ["'You are a very logical person'", "'You are a very sensitive person'"], type: ["T", "F"] },
            { q: "Do you feel more comfortable...", a: ["Having things settled and decided", "Keeping your options open for as long as possible"], type: ["J", "P"] }
        ];
        this.answers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        this.currentQuestion = 0;
    }

    connectedCallback() {
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResult();
            return;
        }

        const q = this.questions[this.currentQuestion];
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
                }
                h3 {
                    font-family: var(--font-heading);
                    margin-bottom: 2rem;
                    color: var(--primary-text);
                    font-size: 1.4rem;
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
                <div class="progress">Question ${this.currentQuestion + 1} of ${this.questions.length}</div>
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
        const typeEvsI = this.answers.E >= this.answers.I ? 'E' : 'I';
        const typeSvsN = this.answers.S >= this.answers.N ? 'S' : 'N';
        const typeTvsF = this.answers.T >= this.answers.F ? 'T' : 'F';
        const typeJvsP = this.answers.J >= this.answers.P ? 'J' : 'P';
        const result = typeEvsI + typeSvsN + typeTvsF + typeJvsP;

        const descriptions = {
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
        };

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
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                h2 {
                    font-family: var(--font-heading);
                    color: var(--accent-color);
                    font-size: 2.5rem;
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
                    font-size: 1.2rem;
                    line-height: 1.6;
                    color: #444;
                    margin-bottom: 2rem;
                }
            </style>
            <div class="result-container">
                <h2>Your Result</h2>
                <span class="type-code">${result}</span>
                <p>${descriptions[result] || 'You are a unique individual with a fascinating blend of traits!'}</p>
                <button id="reset-button">Take the Test Again</button>
                <button id="home-button" style="background-color: #6c757d;">Back to Home</button>
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
