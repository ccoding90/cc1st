import React, { useState } from 'react';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

function initKakao() {
  if (!window.Kakao) return false;
  if (!KAKAO_KEY) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_KEY);
  }
  return true;
}

export default function ShareButtons({ shareText, shareUrl, testTitle }) {
  const [copied, setCopied] = useState(false);

  const url = shareUrl || window.location.href;

  const handleKakao = () => {
    if (!initKakao()) {
      handleCopy();
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: testTitle || 'CCGG 심리 테스트',
        description: shareText || '나의 심리 테스트 결과를 확인해보세요!',
        imageUrl: 'https://ccgg.web.app/og-image.png',
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: '나도 해보기 →', link: { mobileWebUrl: url, webUrl: url } },
      ],
    });
  };

  const handleCopy = async () => {
    const text = shareText ? `${shareText}\n테스트 하러 가기 👉 ${url}` : url;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('아래 링크를 복사해서 친구에게 공유해보세요!', text);
    }
  };

  return (
    <div className="share-row">
      <button className="share-btn-kakao" onClick={handleKakao}>
        <span className="share-icon">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1.5C4.858 1.5 1.5 4.26 1.5 7.65c0 2.187 1.393 4.112 3.497 5.27l-.668 2.48 2.893-1.916A9.2 9.2 0 0 0 9 13.8c4.142 0 7.5-2.76 7.5-6.15S13.142 1.5 9 1.5Z" fill="#3C1E1E"/>
          </svg>
        </span>
        카카오톡 공유
      </button>
      <button className={`share-btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
        {copied ? '✅ 복사됨!' : '🔗 링크 복사'}
      </button>
    </div>
  );
}
