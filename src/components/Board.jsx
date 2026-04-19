import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, getDoc, deleteDoc, writeBatch,
  updateDoc, increment, limit
} from 'firebase/firestore';

const ADMIN_PASSWORD = '조쿠만1!';
const HOT_LIKES = 3;
const HOT_VIEWS = 20;

const CAT_META = {
  free:  { label: '자유', color: '#0095f6', bg: '#e8f4fd', emoji: '💬' },
  humor: { label: '유머', color: '#fd9644', bg: '#fff3e0', emoji: '😂' },
};

const getCat   = (p) => p.category || 'free';
const getViews = (p) => p.views || 0;
const getLikes = (p) => p.likes || 0;
const isHot    = (p) => getLikes(p) >= HOT_LIKES || getViews(p) >= HOT_VIEWS;

const formatDate = (ts) => {
  if (!ts) return '방금 전';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return '방금 전';
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

// ── CategoryTabs ────────────────────────────────────────────
function CategoryTabs({ active, onChange, counts }) {
  const tabs = [
    { key: 'all',     label: '전체',     emoji: '📋', ac: '#495057' },
    { key: 'free',    label: '자유게시판', emoji: '💬', ac: '#0095f6' },
    { key: 'humor',   label: '유머게시판', emoji: '😂', ac: '#fd9644' },
    { key: 'popular', label: '인기글',    emoji: '🔥', ac: '#eb3b5a' },
  ];
  return (
    <div style={{
      display: 'flex', gap: '8px', flexWrap: 'wrap',
      padding: '0 0 16px', borderBottom: '2px solid #f1f3f5', marginBottom: '8px'
    }}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            padding: '8px 15px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
            transition: 'all 0.18s',
            background: isActive ? t.ac : '#f1f3f5',
            color:      isActive ? '#fff' : '#666',
            boxShadow:  isActive ? `0 2px 10px ${t.ac}40` : 'none',
          }}>
            {t.emoji} {t.label}&nbsp;
            <span style={{ fontWeight: 500, opacity: 0.9, fontSize: '0.78rem' }}>
              {counts[t.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── PostList ────────────────────────────────────────────────
function PostList({ onSelectPost, onNewPost }) {
  const [posts, setPosts]           = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, snap =>
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const filtered = (() => {
    switch (activeCategory) {
      case 'free':    return posts.filter(p => getCat(p) === 'free');
      case 'humor':   return posts.filter(p => getCat(p) === 'humor');
      case 'popular': return posts
          .filter(isHot)
          .sort((a, b) =>
            (getLikes(b) * 3 + getViews(b)) - (getLikes(a) * 3 + getViews(a))
          );
      default:        return posts;
    }
  })();

  const counts = {
    all:     posts.length,
    free:    posts.filter(p => getCat(p) === 'free').length,
    humor:   posts.filter(p => getCat(p) === 'humor').length,
    popular: posts.filter(isHot).length,
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return alert('삭제할 게시글을 선택해주세요.');
    const pw = window.prompt('🔒 관리자 비밀번호를 입력하세요.');
    if (pw === null) return;
    if (pw !== ADMIN_PASSWORD) return alert('❌ 비밀번호가 틀렸습니다.');
    if (!window.confirm(`선택한 ${selectedIds.size}개 게시글을 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'posts', id)));
      await batch.commit();
      setSelectedIds(new Set());
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="board-container animate-in">
      {/* 헤더 */}
      <div className="feed-header" style={{ marginBottom: '20px', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 3px' }}>💬 커뮤니티</h2>
          <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
            자유롭게 이야기 나눠요 · 추천 {HOT_LIKES}개↑ 또는 조회 {HOT_VIEWS}↑이면 인기글 🔥
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {selectedIds.size > 0 && (
            <button onClick={handleDeleteSelected} disabled={isDeleting} style={{
              padding: '8px 14px', background: isDeleting ? '#ccc' : '#e74c3c',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.82rem', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}>
              {isDeleting ? '삭제 중...' : `🗑️ 삭제 (${selectedIds.size})`}
            </button>
          )}
          <button className="btn-primary" onClick={onNewPost}
            style={{ width: 'auto', padding: '9px 18px', fontWeight: 700 }}>
            ✏️ 글쓰기
          </button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <CategoryTabs
        active={activeCategory}
        onChange={(key) => { setActiveCategory(key); setSelectedIds(new Set()); }}
        counts={counts}
      />

      {/* 인기글 기준 안내 (인기글 탭일 때) */}
      {activeCategory === 'popular' && (
        <div style={{
          padding: '10px 14px', background: '#fff8f0', borderRadius: '8px',
          border: '1px solid #ffe5cc', marginBottom: '10px',
          fontSize: '0.8rem', color: '#e07b00'
        }}>
          🔥 자유·유머 게시판에서 <strong>추천 {HOT_LIKES}개 이상</strong> 또는 <strong>조회수 {HOT_VIEWS} 이상</strong>인 글이 자동으로 모입니다.
        </div>
      )}

      {/* 빈 상태 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#ccc' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>
            {activeCategory === 'popular' ? '🔥' : '✏️'}
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {activeCategory === 'popular'
              ? '아직 인기글이 없어요. 좋은 글을 작성해보세요!'
              : '첫 글을 작성해보세요!'}
          </p>
        </div>
      ) : (
        <div>
          {/* 전체 선택 바 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', background: '#f8f9fa', borderRadius: '8px',
            marginBottom: '6px', fontSize: '0.82rem', color: '#666'
          }}>
            <input type="checkbox"
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={() => {
                selectedIds.size === filtered.length
                  ? setSelectedIds(new Set())
                  : setSelectedIds(new Set(filtered.map(p => p.id)));
              }}
              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#e74c3c' }}
            />
            <span>전체 선택</span>
            {selectedIds.size > 0 && (
              <span style={{ color: '#e74c3c', fontWeight: 700 }}>{selectedIds.size}개 선택됨</span>
            )}
          </div>

          {/* 게시글 목록 */}
          {filtered.map(post => {
            const cat = getCat(post);
            const cm  = CAT_META[cat] || CAT_META.free;
            const hot = isHot(post);
            const sel = selectedIds.has(post.id);
            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8f9fa'; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'white'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '13px 12px',
                  borderRadius: '10px', marginBottom: '3px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: sel ? '#fff5f5' : 'white',
                  borderLeft: sel ? '3px solid #e74c3c' : '3px solid transparent',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* 체크박스 */}
                <div onClick={e => toggleSelect(e, post.id)} style={{ flexShrink: 0 }}>
                  <input type="checkbox" checked={sel} readOnly
                    onClick={e => e.stopPropagation()}
                    style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#e74c3c' }}
                  />
                </div>

                {/* 카테고리 뱃지 */}
                <span style={{
                  flexShrink: 0, padding: '3px 9px', borderRadius: '10px',
                  background: cm.bg, color: cm.color,
                  fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {cm.emoji} {cm.label}
                </span>

                {/* 제목 + 메타 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    {hot && <span style={{ fontSize: '0.82rem' }}>🔥</span>}
                    <span style={{
                      fontWeight: 700, fontSize: '0.93rem', color: '#1a1a1a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {post.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.76rem', color: '#aaa' }}>
                    <span>👤 {post.author || '익명'}</span>
                    <span>🕐 {formatDate(post.createdAt)}</span>
                  </div>
                </div>

                {/* 조회·추천 */}
                <div style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-end', gap: '3px', fontSize: '0.75rem'
                }}>
                  <span style={{ color: '#bbb' }}>👁 {getViews(post)}</span>
                  <span style={{ color: getLikes(post) > 0 ? '#eb3b5a' : '#bbb', fontWeight: getLikes(post) > 0 ? 700 : 400 }}>
                    👍 {getLikes(post)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* sticky 하단 삭제 버튼 */}
      {selectedIds.size > 0 && (
        <div style={{ position: 'sticky', bottom: '16px', marginTop: '20px', textAlign: 'center' }}>
          <button onClick={handleDeleteSelected} disabled={isDeleting} style={{
            padding: '12px 32px', background: isDeleting ? '#ccc' : '#e74c3c',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '0.95rem', fontWeight: 700,
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(231,76,60,.35)'
          }}>
            {isDeleting ? '삭제 중...' : `🗑️ 선택한 ${selectedIds.size}개 삭제`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── PostForm ─────────────────────────────────────────────────
function PostForm({ onCancel }) {
  const [form, setForm] = useState({ title: '', author: '', content: '', category: 'free' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return alert('제목과 내용을 입력해주세요.');
    setSubmitting(true);
    try {
      await Promise.race([
        addDoc(collection(db, 'posts'), {
          title:     form.title.trim(),
          author:    form.author.trim() || '익명',
          content:   form.content.trim(),
          category:  form.category,
          views:     0,
          likes:     0,
          createdAt: serverTimestamp(),
        }),
        new Promise(r => setTimeout(r, 2500)),
      ]);
      onCancel();
    } catch (err) {
      console.error(err);
      onCancel();
    }
  };

  const catOptions = [
    { key: 'free',  label: '💬 자유게시판', color: '#0095f6' },
    { key: 'humor', label: '😂 유머게시판', color: '#fd9644' },
  ];

  return (
    <div className="form-container animate-in">
      <h3 style={{ marginBottom: '22px', fontWeight: 800, fontSize: '1.2rem' }}>✏️ 새 글 작성</h3>
      <form onSubmit={handleSubmit}>

        {/* 카테고리 선택 */}
        <div className="form-group">
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>카테고리 선택</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {catOptions.map(c => (
              <button key={c.key} type="button"
                onClick={() => setForm({ ...form, category: c.key })}
                style={{
                  flex: 1, padding: '11px', cursor: 'pointer',
                  borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
                  transition: 'all 0.15s',
                  border: `2px solid ${form.category === c.key ? c.color : '#e9ecef'}`,
                  background: form.category === c.key ? `${c.color}18` : '#fafafa',
                  color: form.category === c.key ? c.color : '#999',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>제목</label>
          <input placeholder="제목을 입력하세요" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>작성자</label>
          <input placeholder="이름 (생략 시 익명)" value={form.author}
            onChange={e => setForm({ ...form, author: e.target.value })} />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea style={{ height: '180px' }} placeholder="내용을 입력하세요"
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
            {submitting ? '등록 중...' : '등록하기 ✓'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── PostDetail ───────────────────────────────────────────────
function PostDetail({ postId, onBack }) {
  const [post, setPost]   = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    })();

    // 조회수 증가 (세션당 1회)
    if (!sessionStorage.getItem(`viewed_${postId}`)) {
      updateDoc(doc(db, 'posts', postId), { views: increment(1) }).catch(() => {});
      sessionStorage.setItem(`viewed_${postId}`, '1');
    }

    // 추천 상태 복원
    setLiked(!!localStorage.getItem(`liked_${postId}`));
  }, [postId]);

  const handleLike = async () => {
    if (liked) return;
    try {
      await updateDoc(doc(db, 'posts', postId), { likes: increment(1) });
      localStorage.setItem(`liked_${postId}`, '1');
      setLiked(true);
      setPost(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : prev);
    } catch {
      alert('오류가 발생했습니다.');
    }
  };

  if (!post) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>불러오는 중...</div>
  );

  const cat = getCat(post);
  const cm  = CAT_META[cat] || CAT_META.free;
  const hot = isHot(post);

  return (
    <div className="detail-container animate-in">
      {/* 뒤로가기 */}
      <button className="btn-secondary" onClick={onBack}
        style={{ marginBottom: '20px', fontSize: '0.85rem', padding: '7px 14px' }}>
        ← 목록으로
      </button>

      {/* 카테고리 + HOT 뱃지 */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{
          padding: '4px 11px', borderRadius: '12px',
          background: cm.bg, color: cm.color, fontSize: '0.78rem', fontWeight: 700
        }}>
          {cm.emoji} {cm.label}
        </span>
        {hot && (
          <span style={{
            padding: '4px 10px', borderRadius: '12px',
            background: '#fff0f0', color: '#eb3b5a', fontSize: '0.78rem', fontWeight: 700
          }}>
            🔥 인기글
          </span>
        )}
      </div>

      {/* 제목 */}
      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.4, color: '#1a1a1a' }}>
        {post.title}
      </h2>

      {/* 메타 정보 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        padding: '10px 14px', background: '#f8f9fa', borderRadius: '10px',
        marginBottom: '22px', fontSize: '0.83rem', color: '#888'
      }}>
        <span>👤 <strong style={{ color: '#444' }}>{post.author || '익명'}</strong></span>
        <span>🕐 {formatDate(post.createdAt)}</span>
        <span>👁 조회 {getViews(post)}</span>
        <span style={{ color: getLikes(post) > 0 ? '#eb3b5a' : '#aaa', fontWeight: getLikes(post) > 0 ? 700 : 400 }}>
          👍 추천 {getLikes(post)}
        </span>
      </div>

      {/* 본문 */}
      <div style={{
        lineHeight: '1.88', whiteSpace: 'pre-wrap', color: '#333',
        fontSize: '0.97rem', minHeight: '100px',
        padding: '4px 0 32px'
      }}>
        {post.content}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5', margin: '0 0 24px' }} />

      {/* 추천 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={handleLike} disabled={liked} style={{
          padding: '13px 36px', borderRadius: '30px',
          border: `2px solid ${liked ? '#ddd' : '#eb3b5a'}`,
          background: liked ? '#fafafa' : 'white',
          color: liked ? '#aaa' : '#eb3b5a',
          fontWeight: 700, fontSize: '0.97rem',
          cursor: liked ? 'default' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {liked ? '✅ 추천했어요' : '👍 추천하기'}
          <span style={{
            background: liked ? '#ddd' : '#eb3b5a',
            color: liked ? '#999' : 'white',
            borderRadius: '12px', padding: '2px 9px', fontSize: '0.83rem',
          }}>
            {getLikes(post)}
          </span>
        </button>
      </div>
      {liked && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#bbb', marginTop: '8px' }}>
          이미 추천한 글입니다
        </p>
      )}
    </div>
  );
}

// ── Board (메인) ─────────────────────────────────────────────
const Board = () => {
  const [view, setView]               = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    document.title = '커뮤니티 게시판 | CCGG';
  }, []);

  return (
    <div className="board-page">
      {view === 'list' && (
        <PostList
          onSelectPost={id => { setSelectedPostId(id); setView('detail'); }}
          onNewPost={() => setView('form')}
        />
      )}
      {view === 'form'   && <PostForm    onCancel={() => setView('list')} />}
      {view === 'detail' && <PostDetail  postId={selectedPostId} onBack={() => setView('list')} />}
    </div>
  );
};

export default Board;
