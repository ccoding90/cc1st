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
        <div className="inquiry-page animate-in">
            <div className="lang-toggle-container" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                <button 
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`} 
                  onClick={() => setLang('en')}
                  style={{ background: lang === 'en' ? 'var(--accent-color)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                >EN</button>
                <button 
                  className={`lang-btn ${lang === 'ko' ? 'active' : ''}`} 
                  onClick={() => setLang('ko')}
                  style={{ background: lang === 'ko' ? 'var(--accent-color)' : 'transparent', color: lang === 'ko' ? '#fff' : 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                >KO</button>
            </div>
            <div className="form-container">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0' }}>{t.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.desc}</p>
                </div>
                <form action="https://formspree.io/f/xwvwvbqz" method="POST">
                    <div className="form-group">
                        <label>{t.emailLabel}</label>
                        <input type="email" name="email" required placeholder="example@email.com" />
                    </div>
                    <div className="form-group">
                        <label>{t.messageLabel}</label>
                        <textarea name="message" rows="8" required placeholder="문의하실 내용을 상세히 적어주세요..."></textarea>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                        {t.send}
                    </button>
                </form>
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <p>보내주신 문의는 담당자가 확인 후 영업일 기준 24시간 내에 답변드립니다.</p>
            </div>
        </div>
    );
};

export default InquiryForm;
