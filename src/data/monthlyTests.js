// 매월 1일 자동 업데이트되는 월별 인기 테스트 데이터
// 업데이트 기준: 전월 기준 구글 검색 상위권 (10대~40대 대상)

export const MONTHLY_TESTS = {
  '2026-05': {
    label: '2026년 5월',
    description: '5월 황금연휴 기념! 필코노미·메타센싱·여행 스타일 3종 업데이트 🌿',
    emoji: '🌿',
    tests: [
      {
        id: 'travel-style',
        title: '황금연휴 여행 유형 테스트',
        description: '5월 황금연휴, 나의 여행 스타일은? 탐험형·힐링형·문화형·미식형 중 어떤 여행자인지 알아보세요.',
        emoji: '🌏',
        tags: ['황금연휴', '여행', '5월'],
        path: '/travel-style',
        isAvailable: true,
        isNew: true,
        searchRank: 1
      },
      {
        id: 'feelconomy-type',
        title: '필코노미 소비 유형 테스트',
        description: '기분이 지갑을 연다? 2026 최신 트렌드 필코노미로 나의 감정 소비 유형을 알아보세요.',
        emoji: '🛍️',
        tags: ['필코노미', '소비', '트렌드'],
        path: '/feelconomy-type',
        isAvailable: true,
        isNew: true,
        searchRank: 2
      },
      {
        id: 'emotion-type',
        title: '감정 루틴 유형 테스트',
        description: '나는 감정을 어떻게 처리할까? 2026 메타센싱 트렌드로 나의 감정 관리 패턴을 진단해보세요.',
        emoji: '💆',
        tags: ['감정관리', '메타센싱', '심리'],
        path: '/emotion-type',
        isAvailable: true,
        isNew: true,
        searchRank: 3
      },
      {
        id: 'investment-type',
        title: '주식 투자 유형 테스트',
        description: '나의 투자 성향은? 성장주·가치투자·ETF·트렌드형 중 어떤 유형인지 알아보세요.',
        emoji: '📈',
        tags: ['주식', '투자', '재테크'],
        path: '/investment-type',
        isAvailable: true,
        isNew: false,
        searchRank: 4
      },
      {
        id: 'gatsaeng-test',
        title: '갓생 레벨 테스트',
        description: '나는 얼마나 갓생살고 있을까? 2026 MZ세대 최고 트렌드 갓생 지수 체크!',
        emoji: '🔥',
        tags: ['갓생', '자기계발', 'MZ'],
        path: '/gatsaeng-test',
        isAvailable: true,
        isNew: false,
        searchRank: 5
      },
      {
        id: 'dating-style',
        title: '연애 리얼리티 유형 테스트',
        description: '하트시그널 속 나는 어떤 유형? 로맨티스트·전략가·직진형·관찰형 중 나는?',
        emoji: '💘',
        tags: ['연애', '하트시그널', '심리'],
        path: '/dating-style',
        isAvailable: true,
        isNew: false,
        searchRank: 6
      },
      {
        id: 'mbti',
        title: 'MBTI 성격 유형 테스트',
        description: '16가지 성격 유형으로 나를 알아보세요. 가장 정확한 MBTI 테스트!',
        emoji: '🔮',
        tags: ['MBTI', '성격', '심리'],
        path: '/mbti',
        isAvailable: true,
        isNew: false,
        searchRank: 7
      }
    ]
  },
  '2026-04': {
    label: '2026년 4월',
    description: '4월 최신 트렌드 테스트 3종 업데이트! 주식·갓생·연애 🌸',
    emoji: '🌸',
    tests: [
      {
        id: 'investment-type',
        title: '주식 투자 유형 테스트',
        description: '나의 투자 성향은? 성장주·가치투자·ETF·트렌드형 중 어떤 유형인지 알아보세요.',
        emoji: '📈',
        tags: ['주식', '투자', '재테크'],
        path: '/investment-type',
        isAvailable: true,
        isNew: true,
        searchRank: 1
      },
      {
        id: 'gatsaeng-test',
        title: '갓생 레벨 테스트',
        description: '나는 얼마나 갓생살고 있을까? 2026 MZ세대 최고 트렌드 갓생 지수 체크!',
        emoji: '🔥',
        tags: ['갓생', '자기계발', 'MZ'],
        path: '/gatsaeng-test',
        isAvailable: true,
        isNew: true,
        searchRank: 2
      },
      {
        id: 'dating-style',
        title: '연애 리얼리티 유형 테스트',
        description: '하트시그널 속 나는 어떤 유형? 로맨티스트·전략가·직진형·관찰형 중 나는?',
        emoji: '💘',
        tags: ['연애', '하트시그널', '심리'],
        path: '/dating-style',
        isAvailable: true,
        isNew: true,
        searchRank: 3
      },
      {
        id: 'love-language',
        title: '러브 랭귀지 테스트',
        description: '나는 어떤 방식으로 사랑을 주고받을까? 5가지 사랑의 언어를 알아보세요.',
        emoji: '💕',
        tags: ['연애', '심리', '관계'],
        path: '/love-language',
        isAvailable: true,
        isNew: false,
        searchRank: 4
      },
      {
        id: 'mental-age',
        title: '심리 나이 테스트',
        description: '내 마음의 나이는 몇 살일까요? 10대부터 50대까지 확인해보세요.',
        emoji: '🧠',
        tags: ['심리', '성격', '유머'],
        path: '/mental-age',
        isAvailable: true,
        isNew: false,
        searchRank: 5
      },
      {
        id: 'kpop-fan',
        title: 'K-POP 팬 유형 테스트',
        description: '충성 팬덤파? 음악 감상파? 나는 어떤 스타일의 팬일까요?',
        emoji: '🎤',
        tags: ['K-POP', '음악', '팬덤'],
        path: '/kpop-fan',
        isAvailable: true,
        isNew: false,
        searchRank: 6
      },
      {
        id: 'mbti',
        title: 'MBTI 성격 유형 테스트',
        description: '16가지 성격 유형으로 나를 알아보세요. 가장 정확한 MBTI 테스트!',
        emoji: '🔮',
        tags: ['MBTI', '성격', '심리'],
        path: '/mbti',
        isAvailable: true,
        isNew: false,
        searchRank: 7
      }
    ]
  },
  '2026-03': {
    label: '2026년 3월',
    description: '봄을 맞이하는 3월의 인기 테스트 🌱',
    emoji: '🌱',
    tests: [
      {
        id: 'color-test',
        title: '색깔 심리 테스트',
        description: '내 성격을 색깔로 표현하면? 6가지 색깔 중 나는 어떤 색일까요?',
        emoji: '🎨',
        tags: ['심리', '성격', '색깔'],
        path: '/color-test',
        isAvailable: true,
        isNew: false,
        searchRank: 1
      },
      {
        id: 'stress-type',
        title: '스트레스 대처 유형 테스트',
        description: '폭발형? 잠수형? 먹방형? 나는 스트레스를 어떻게 풀까요?',
        emoji: '😤',
        tags: ['심리', '스트레스', '힐링'],
        path: '/stress-type',
        isAvailable: true,
        isNew: false,
        searchRank: 2
      },
      {
        id: 'mbti',
        title: 'MBTI 성격 유형 테스트',
        description: '16가지 성격 유형으로 나를 알아보세요. 가장 정확한 MBTI 테스트!',
        emoji: '🔮',
        tags: ['MBTI', '성격', '심리'],
        path: '/mbti',
        isAvailable: true,
        isNew: false,
        searchRank: 3
      },
      {
        id: 'celebrity',
        title: '연예인 이상형 테스트',
        description: '나와 찰떡인 연예인 이상형은 누구일까요?',
        emoji: '💘',
        tags: ['연애', '이상형', '연예인'],
        path: '/celebrity',
        isAvailable: true,
        isNew: false,
        searchRank: 4
      },
      {
        id: 'love-language',
        title: '러브 랭귀지 테스트',
        description: '나는 어떤 방식으로 사랑을 주고받을까요?',
        emoji: '💕',
        tags: ['연애', '심리', '관계'],
        path: '/love-language',
        isAvailable: true,
        isNew: false,
        searchRank: 5
      }
    ]
  }
};

// 현재 달 키 (YYYY-MM 형식)
export function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// 월 목록 (최신순 정렬)
export function getMonthList() {
  return Object.keys(MONTHLY_TESTS).sort((a, b) => b.localeCompare(a));
}
