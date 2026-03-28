import React, { useState } from 'react';

const InquiryForm = () => {
    const [lang, setLang] = useState('ko');

    const t = {
        en: {
            title: "Affiliate Inquiry",
            desc: "Interested in partnering with CCGG? Send us a message!",
            emailLabel: "Your Email",
            messageLabel: "Your Message",
            send: "Send Message",
            successMsg: "Thank you! Your message has been sent."
        },
        ko: {
            title: "제휴 문의",
            desc: "CCGG와 파트너가 되고 싶으신가요? 메시지를 남겨주세요!",
            emailLabel: "이메일 주소",
            messageLabel: "문의 내용",
            send: "메시지 보내기",
            successMsg: "감사합니다! 메시지가 성공적으로 전송되었습니다."
        }
    }[lang];

    return (
        <div className="inquiry-page animate-fadeIn">
            <div className="lang-toggle-container">
                <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                <button className={`lang-btn ${lang === 'ko' ? 'active' : ''}`} onClick={() => setLang('ko')}>KO</button>
            </div>
            <div className="form-container">
                <div className="form-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t.title}</h2>
                    <p style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>{t.desc}</p>
                </div>
                <form action="https://formspree.io/f/xwvwvbqz" method="POST">
                    <div className="form-group">
                        <label>{t.emailLabel}</label>
                        <input type="email" name="email" required placeholder="example@email.com" />
                    </div>
                    <div className="form-group">
                        <label>{t.messageLabel}</label>
                        <textarea name="message" rows="6" required placeholder="여기에 문의 내용을 상세히 적어주세요..."></textarea>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}>
                        {t.send}
                    </button>
                </form>
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem', color: '#8e8e8e', fontSize: '0.8rem' }}>
                <p>평일 기준 24시간 이내에 답변해 드립니다.</p>
            </div>
        </div>
    );
};

export default InquiryForm;
