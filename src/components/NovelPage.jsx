import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, getDoc, getDocs, deleteDoc,
  updateDoc, increment, writeBatch
} from 'firebase/firestore';

const ADMIN_PASSWORD = '조쿠만1!';

const GENRES = ['로맨스', '판타지', '현대물', '무협', 'SF', '미스터리', '일상', '기타'];

const COVER_COLORS = [
  '#6c5ce7', '#0095f6', '#eb3b5a', '#fd9644',
  '#20bf6b', '#a55eea', '#f7b731', '#45aaf2'
];

const STATUS_STYLE = {
  '연재중': { color: '#20bf6b', bg: '#e8faf0' },
  '완결':   { color: '#888',    bg: '#f1f3f5' },
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
};

const verifyAdmin = () => {
  const pw = window.prompt('🔒 관리자 비밀번호를 입력하세요.');
  if (pw === null) return false;
  if (pw !== ADMIN_PASSWORD) { alert('❌ 비밀번호가 틀렸습니다.'); return false; }
  return true;
};

// ── NovelList ────────────────────────────────────────────────
function NovelList({ onSelectNovel }) {
  const [novels, setNovels] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'novels'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, snap =>
      setNovels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  if (showForm) return <NovelForm onCancel={() => setShowForm(false)} />;

  return (
    <div className="board-container animate-in">
      {/* 헤더 */}
      <div className="feed-header" style={{ marginBottom: '24px', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 3px' }}>📖 웹소설</h2>
          <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
            오리지널 연재 웹소설 · 클릭해서 읽어보세요
          </p>
        </div>
        <button
          onClick={() => { if (verifyAdmin()) setShowForm(true); }}
          style={{
            padding: '9px 16px', background: '#6c5ce7', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 700,
            fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
          }}
        >
          + 새 작품
        </button>
      </div>

      {/* 빈 상태 */}
      {novels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#ccc' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>📝</div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>아직 등록된 작품이 없습니다.</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>관리자가 첫 작품을 등록하면 여기에 표시됩니다.</p>
        </div>
      )}

      {/* 작품 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {novels.map(novel => (
          <NovelCard key={novel.id} novel={novel} onClick={() => onSelectNovel(novel.id)} />
        ))}
      </div>
    </div>
  );
}

// ── NovelCard ────────────────────────────────────────────────
function NovelCard({ novel, onClick }) {
  const ss = STATUS_STYLE[novel.status] || STATUS_STYLE['연재중'];
  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      style={{
        cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
        background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0', transition: 'all 0.22s',
      }}
    >
      {/* 커버 */}
      <div style={{
        height: '130px',
        background: `linear-gradient(135deg, ${novel.coverColor || '#6c5ce7'}, ${novel.coverColor || '#6c5ce7'}bb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.8rem', position: 'relative',
      }}>
        {novel.coverEmoji || '📖'}
        <span style={{
          position: 'absolute', top: '10px', right: '10px',
          padding: '3px 9px', borderRadius: '10px',
          ...ss, fontSize: '0.72rem', fontWeight: 700,
        }}>
          {novel.status || '연재중'}
        </span>
      </div>

      {/* 정보 */}
      <div style={{ padding: '14px 16px' }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: '8px',
          background: '#f0eaff', color: '#6c5ce7', fontSize: '0.72rem', fontWeight: 700,
          marginBottom: '7px',
        }}>
          {novel.genre || '기타'}
        </span>
        <h3 style={{
          margin: '0 0 6px', fontWeight: 800, fontSize: '1.02rem',
          color: '#1a1a1a', lineHeight: 1.35,
        }}>
          {novel.title}
        </h3>
        <p style={{
          margin: '0 0 12px', fontSize: '0.8rem', color: '#888', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {novel.description || '소개글이 없습니다.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb' }}>
          <span>📑 {novel.chapterCount || 0}화</span>
          <span>{novel.updatedAt ? formatDate(novel.updatedAt) : ''} 업데이트</span>
        </div>
      </div>
    </div>
  );
}

// ── NovelForm (신규 작품 등록) ────────────────────────────────
function NovelForm({ onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', genre: '로맨스', status: '연재중',
    coverEmoji: '📖', coverColor: COVER_COLORS[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('제목을 입력해주세요.');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'novels'), {
        title: form.title.trim(),
        description: form.description.trim(),
        genre: form.genre,
        status: form.status,
        coverEmoji: form.coverEmoji,
        coverColor: form.coverColor,
        chapterCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onCancel();
    } catch (err) {
      console.error(err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-in">
      <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '22px' }}>📝 새 작품 등록</h3>
      <form onSubmit={handleSubmit}>

        {/* 커버 색상 */}
        <div className="form-group">
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>커버 색상</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COVER_COLORS.map(c => (
              <div key={c} onClick={() => setForm({ ...form, coverColor: c })} style={{
                width: '30px', height: '30px', borderRadius: '50%', background: c,
                cursor: 'pointer', transition: 'border 0.15s',
                border: form.coverColor === c ? '3px solid #333' : '3px solid transparent',
                boxSizing: 'border-box',
              }} />
            ))}
          </div>
        </div>

        {/* 커버 이모지 */}
        <div className="form-group">
          <label>커버 이모지</label>
          <input placeholder="예: 📖 🌙 ⚔️ 💕 🐉"
            value={form.coverEmoji}
            onChange={e => setForm({ ...form, coverEmoji: e.target.value })} />
        </div>

        {/* 제목 */}
        <div className="form-group">
          <label>작품 제목</label>
          <input placeholder="작품 제목을 입력하세요" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        {/* 소개 */}
        <div className="form-group">
          <label>작품 소개</label>
          <textarea style={{ height: '90px' }}
            placeholder="독자들에게 작품을 소개해보세요"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* 장르 */}
        <div className="form-group">
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>장르</label>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {GENRES.map(g => (
              <button key={g} type="button" onClick={() => setForm({ ...form, genre: g })} style={{
                padding: '6px 12px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                background: form.genre === g ? '#6c5ce7' : '#f1f3f5',
                color: form.genre === g ? '#fff' : '#666',
              }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 연재 상태 */}
        <div className="form-group">
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>연재 상태</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: '연재중', label: '✍️ 연재중', color: '#20bf6b' },
              { key: '완결',   label: '✅ 완결',   color: '#888' },
            ].map(s => (
              <button key={s.key} type="button" onClick={() => setForm({ ...form, status: s.key })} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s',
                background: form.status === s.key ? s.color : '#f1f3f5',
                color: form.status === s.key ? '#fff' : '#999',
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button type="submit" disabled={submitting} style={{
            flex: 2, padding: '12px', background: '#6c5ce7', color: '#fff',
            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? '등록 중...' : '작품 등록하기 ✓'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── NovelDetail (목차 페이지) ────────────────────────────────
function NovelDetail({ novelId, onBack, onSelectChapter }) {
  const [novel, setNovel]     = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showChapterForm, setShowChapterForm] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'novels', novelId));
      if (snap.exists()) setNovel({ id: snap.id, ...snap.data() });
    })();

    const q = query(
      collection(db, 'novels', novelId, 'chapters'),
      orderBy('number', 'asc')
    );
    return onSnapshot(q, snap =>
      setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [novelId]);

  const handleDeleteNovel = async () => {
    if (!verifyAdmin()) return;
    if (!window.confirm('이 작품과 모든 화를 삭제하시겠습니까?\n⚠️ 되돌릴 수 없습니다.')) return;
    try {
      const batch = writeBatch(db);
      chapters.forEach(ch =>
        batch.delete(doc(db, 'novels', novelId, 'chapters', ch.id))
      );
      batch.delete(doc(db, 'novels', novelId));
      await batch.commit();
      onBack();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const nextNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.number)) + 1
    : 1;

  if (showChapterForm) return (
    <ChapterForm
      novelId={novelId}
      nextNumber={nextNumber}
      onCancel={() => setShowChapterForm(false)}
    />
  );

  if (!novel) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>불러오는 중...</div>
  );

  const ss = STATUS_STYLE[novel.status] || STATUS_STYLE['연재중'];

  return (
    <div className="board-container animate-in">
      {/* 뒤로가기 */}
      <button className="btn-secondary" onClick={onBack}
        style={{ marginBottom: '20px', fontSize: '0.85rem', padding: '7px 14px' }}>
        ← 작품 목록
      </button>

      {/* 작품 헤더 카드 */}
      <div style={{
        display: 'flex', gap: '18px', padding: '20px', alignItems: 'flex-start',
        background: 'white', borderRadius: '14px', marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
      }}>
        {/* 커버 썸네일 */}
        <div style={{
          width: '76px', height: '96px', borderRadius: '10px', flexShrink: 0,
          background: `linear-gradient(135deg, ${novel.coverColor || '#6c5ce7'}, ${novel.coverColor || '#6c5ce7'}aa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem',
        }}>
          {novel.coverEmoji || '📖'}
        </div>
        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '7px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 9px', borderRadius: '10px', background: '#f0eaff', color: '#6c5ce7', fontSize: '0.73rem', fontWeight: 700 }}>
              {novel.genre}
            </span>
            <span style={{ padding: '3px 9px', borderRadius: '10px', ...ss, fontSize: '0.73rem', fontWeight: 700 }}>
              {novel.status}
            </span>
          </div>
          <h2 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a' }}>
            {novel.title}
          </h2>
          <p style={{ margin: '0 0 10px', fontSize: '0.84rem', color: '#777', lineHeight: 1.6 }}>
            {novel.description || '소개글이 없습니다.'}
          </p>
          <div style={{ fontSize: '0.76rem', color: '#bbb' }}>
            📑 총 {novel.chapterCount || 0}화
            {novel.updatedAt ? ` · ${formatDate(novel.updatedAt)} 업데이트` : ''}
          </div>
        </div>
      </div>

      {/* 관리자 버튼 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={() => { if (verifyAdmin()) setShowChapterForm(true); }}
          style={{
            padding: '8px 16px', background: '#6c5ce7', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 700,
            fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          ✍️ 새 화 추가
        </button>
        <button onClick={handleDeleteNovel} style={{
          padding: '8px 14px', background: 'white', color: '#e74c3c',
          border: '1px solid #e74c3c', borderRadius: '8px',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}>
          🗑️ 작품 삭제
        </button>
      </div>

      {/* 목차 */}
      <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#444', margin: '0 0 10px' }}>
        📑 목차 ({chapters.length}화)
      </h3>

      {chapters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc', fontSize: '0.9rem' }}>
          아직 등록된 화가 없습니다.
        </div>
      ) : (
        chapters.map(ch => (
          <ChapterRow
            key={ch.id}
            chapter={ch}
            novelId={novelId}
            onClick={() => onSelectChapter(ch.id)}
          />
        ))
      )}
    </div>
  );
}

// ── ChapterRow ───────────────────────────────────────────────
function ChapterRow({ chapter, novelId, onClick }) {
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!verifyAdmin()) return;
    if (!window.confirm(`${chapter.number}화를 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'novels', novelId, 'chapters', chapter.id));
      await updateDoc(doc(db, 'novels', novelId), {
        chapterCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = '#f8f0ff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 14px', borderRadius: '10px', marginBottom: '4px',
        background: 'white', cursor: 'pointer', transition: 'background 0.15s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f5f5f5',
      }}
    >
      {/* 화 번호 */}
      <span style={{
        flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%',
        background: '#f0eaff', color: '#6c5ce7', fontWeight: 800, fontSize: '0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {chapter.number}
      </span>

      {/* 제목 & 날짜 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.93rem', color: '#1a1a1a', marginBottom: '2px' }}>
          {chapter.number}화{chapter.title ? ` — ${chapter.title}` : ''}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#bbb' }}>
          {formatDate(chapter.createdAt)}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
        style={{
          flexShrink: 0, padding: '5px 10px', background: 'transparent',
          color: '#e74c3c', border: '1px solid #e74c3c',
          borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', opacity: 0.5,
        }}
      >
        삭제
      </button>
    </div>
  );
}

// ── ChapterForm (새 화 작성) ─────────────────────────────────
function ChapterForm({ novelId, nextNumber, onCancel }) {
  const [form, setForm] = useState({ number: nextNumber, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return alert('본문을 입력해주세요.');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'novels', novelId, 'chapters'), {
        number:    form.number,
        title:     form.title.trim(),
        content:   form.content.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'novels', novelId), {
        chapterCount: increment(1),
        updatedAt:    serverTimestamp(),
      });
      onCancel();
    } catch (err) {
      console.error(err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-in">
      <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '22px' }}>
        ✍️ {form.number}화 작성
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: '0 0 90px' }}>
            <label>화 번호</label>
            <input type="number" min="1" value={form.number}
              onChange={e => setForm({ ...form, number: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>화 제목 <span style={{ fontWeight: 400, color: '#aaa' }}>(선택)</span></label>
            <input placeholder="예: 운명의 첫 만남" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label>본문</label>
          <textarea
            style={{
              height: '420px', lineHeight: '1.9',
              fontFamily: 'inherit', fontSize: '0.97rem',
              letterSpacing: '0.01em',
            }}
            placeholder="이야기를 써내려가세요..."
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            취소
          </button>
          <button type="submit" disabled={submitting} style={{
            flex: 2, padding: '12px', background: '#6c5ce7', color: '#fff',
            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? '등록 중...' : `${form.number}화 등록하기 ✓`}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── ChapterReader (읽기 뷰) ──────────────────────────────────
function ChapterReader({ novelId, initialChapterId, onBack }) {
  const [currentId, setCurrentId] = useState(initialChapterId);
  const [chapter, setChapter]     = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [novelTitle, setNovelTitle]   = useState('');

  // 전체 챕터 목록 1회 로드
  useEffect(() => {
    (async () => {
      const novelSnap = await getDoc(doc(db, 'novels', novelId));
      if (novelSnap.exists()) setNovelTitle(novelSnap.data().title || '');

      const q = query(
        collection(db, 'novels', novelId, 'chapters'),
        orderBy('number', 'asc')
      );
      const snap = await getDocs(q);
      setAllChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [novelId]);

  // 현재 화 로드 + 상단 스크롤
  useEffect(() => {
    setChapter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    (async () => {
      const snap = await getDoc(doc(db, 'novels', novelId, 'chapters', currentId));
      if (snap.exists()) setChapter({ id: snap.id, ...snap.data() });
    })();
  }, [currentId, novelId]);

  const currentIdx  = allChapters.findIndex(c => c.id === currentId);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  if (!chapter) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#bbb' }}>불러오는 중...</div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* 뒤로가기 */}
      <button className="btn-secondary" onClick={onBack}
        style={{ marginBottom: '20px', fontSize: '0.85rem', padding: '7px 14px' }}>
        ← 목차로
      </button>

      {/* 챕터 헤더 */}
      <div style={{
        textAlign: 'center', padding: '28px 24px 24px',
        background: 'white', borderRadius: '14px', marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}>
        {novelTitle && (
          <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#aaa', letterSpacing: '0.05em' }}>
            {novelTitle}
          </p>
        )}
        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#6c5ce7', fontWeight: 700 }}>
          {chapter.number}화
        </p>
        <h2 style={{
          margin: '0 0 10px', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', lineHeight: 1.4
        }}>
          {chapter.title || `${chapter.number}화`}
        </h2>
        <p style={{ margin: 0, fontSize: '0.76rem', color: '#ccc' }}>
          {formatDate(chapter.createdAt)}
        </p>
      </div>

      {/* 본문 */}
      <div style={{
        background: 'white', borderRadius: '14px',
        padding: '36px 32px', marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        lineHeight: '2.05', whiteSpace: 'pre-wrap',
        fontSize: '1.03rem', color: '#2c2c2c',
        wordBreak: 'keep-all', letterSpacing: '0.015em',
      }}>
        {chapter.content}
      </div>

      {/* 이전 / 다음 화 네비게이션 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        {prevChapter ? (
          <button onClick={() => setCurrentId(prevChapter.id)} style={{
            flex: 1, padding: '13px 12px', borderRadius: '10px',
            border: '1px solid #e9ecef', background: 'white', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.86rem', color: '#555', textAlign: 'left',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8f0ff'; e.currentTarget.style.borderColor = '#6c5ce7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e9ecef'; }}
          >
            ◀ {prevChapter.number}화{prevChapter.title ? ` ${prevChapter.title}` : ''}
          </button>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {nextChapter ? (
          <button onClick={() => setCurrentId(nextChapter.id)} style={{
            flex: 1, padding: '13px 12px', borderRadius: '10px',
            border: '1px solid #e9ecef', background: 'white', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.86rem', color: '#555', textAlign: 'right',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8f0ff'; e.currentTarget.style.borderColor = '#6c5ce7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e9ecef'; }}
          >
            {nextChapter.number}화{nextChapter.title ? ` ${nextChapter.title}` : ''} ▶
          </button>
        ) : (
          <div style={{ flex: 1, padding: '13px 12px', borderRadius: '10px', background: '#fafafa', textAlign: 'center', fontSize: '0.82rem', color: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            마지막 화입니다 ✨
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
        <button className="btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
          목차로 돌아가기
        </button>
      </div>
    </div>
  );
}

// ── NovelPage (메인) ─────────────────────────────────────────
const NovelPage = () => {
  const [view, setView]                       = useState('list');
  const [selectedNovelId, setSelectedNovelId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  useEffect(() => {
    document.title = '웹소설 | CCGG';
  }, []);

  return (
    <div className="board-page">
      {view === 'list' && (
        <NovelList
          onSelectNovel={id => { setSelectedNovelId(id); setView('novel'); }}
        />
      )}
      {view === 'novel' && (
        <NovelDetail
          novelId={selectedNovelId}
          onBack={() => setView('list')}
          onSelectChapter={id => { setSelectedChapterId(id); setView('chapter'); }}
        />
      )}
      {view === 'chapter' && (
        <ChapterReader
          novelId={selectedNovelId}
          initialChapterId={selectedChapterId}
          onBack={() => setView('novel')}
        />
      )}
    </div>
  );
};

export default NovelPage;
