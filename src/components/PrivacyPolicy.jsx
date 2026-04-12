import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'CCGG 개인정보처리방침';
  }, []);

  return (
    <div className="privacy-wrapper animate-in">
      <h1 className="privacy-title">개인정보처리방침</h1>
      <p className="privacy-date">최종 업데이트: 2026년 4월 1일</p>

      <div className="privacy-section">
        <h2>1. 개인정보 수집 항목 및 목적</h2>
        <p>CCGG(이하 "사이트")는 다음과 같은 최소한의 정보만 수집합니다.</p>
        <ul>
          <li><strong>수집 항목:</strong> 제휴 문의 시 이메일 주소, 문의 내용</li>
          <li><strong>수집 목적:</strong> 제휴 문의 응대 및 답변</li>
          <li><strong>보유 기간:</strong> 문의 처리 완료 후 6개월</li>
        </ul>
        <p>테스트 이용 시 별도의 개인정보는 수집하지 않습니다. 테스트 결과는 사용자의 브라우저에서만 처리되며 서버에 저장되지 않습니다.</p>
      </div>

      <div className="privacy-section">
        <h2>2. 쿠키 및 유사 기술 사용</h2>
        <p>사이트는 서비스 개선과 광고 게재를 위해 쿠키를 사용합니다.</p>
        <ul>
          <li><strong>Google AdSense:</strong> 맞춤형 광고 제공을 위해 Google이 쿠키를 사용할 수 있습니다.</li>
          <li><strong>Google Analytics:</strong> 사이트 이용 통계 분석 (익명 데이터)</li>
        </ul>
        <p>
          Google의 개인정보 처리방침은{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            https://policies.google.com/privacy
          </a>
          에서 확인할 수 있습니다.
          광고 쿠키 비활성화는{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 가능합니다.
        </p>
      </div>

      <div className="privacy-section">
        <h2>3. 광고 (Google AdSense)</h2>
        <p>
          본 사이트는 Google AdSense를 통해 광고를 게재합니다. Google과 같은 제3자 업체는
          쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 맞춤형 광고를 제공할 수 있습니다.
          맞춤형 광고를 원하지 않으시면 <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>를
          방문하시거나 Google 광고 설정에서 비활성화하실 수 있습니다.
        </p>
      </div>

      <div className="privacy-section">
        <h2>4. 외부 링크</h2>
        <p>
          본 사이트는 외부 웹사이트로 연결되는 링크를 포함할 수 있습니다.
          외부 사이트의 개인정보 처리방침에 대해서는 책임지지 않습니다.
        </p>
      </div>

      <div className="privacy-section">
        <h2>5. 자유게시판 이용</h2>
        <p>
          자유게시판 이용 시 작성자명(선택)과 게시물 내용이 저장됩니다.
          게시물은 작성자 본인 또는 관리자에 의해 삭제될 수 있습니다.
          타인의 명예를 훼손하거나 개인정보를 포함하는 게시물은 사전 통보 없이 삭제될 수 있습니다.
        </p>
      </div>

      <div className="privacy-section">
        <h2>6. 개인정보 보호 책임자</h2>
        <p>
          개인정보와 관련한 문의사항은 제휴 문의 페이지를 통해 연락 주시기 바랍니다.
        </p>
      </div>

      <div className="privacy-section">
        <h2>7. 방침 변경</h2>
        <p>
          본 개인정보처리방침은 법령 및 서비스 변경에 따라 업데이트될 수 있습니다.
          변경 사항은 본 페이지에 공지됩니다.
        </p>
      </div>
    </div>
  );
}
