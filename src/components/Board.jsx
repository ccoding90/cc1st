import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  writeBatch,
  limit
} from 'firebase/firestore';

const ADMIN_PASSWORD = '조쿠만1!';

const formatDate = (timestamp) => {
  if (!timestamp) return '방금 전';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (new Date() - date) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return date.toLocaleDateString();
};

// ────────────────────────────────────────────────
// 게시글 목록
// ────────────────────────────────────────────────
const PostList = ({ onSelectPost, onNewPost }) => {
  const [posts, setPosts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  // 체크박스 토글
  const toggleSelect = (e, postId) => {
    e.stopPropagation(); // 게시글 클릭 이벤트 방지
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map(p => p.id)));
    }
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 게시글을 선택해주세요.');
      return;
    }

    const password = window.prompt('🔒 관리자 비밀번호를 입력하세요.');

    if (password === null) return; // 취소 클릭 시

    if (password !== ADMIN_PASSWORD) {
      alert('❌ 비밀번호가 틀렸습니다.');
      return;
    }

    const confirmDelete = window.confirm(
      `선택한 ${selectedIds.size}개의 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'posts', id));
      });
      await batch.commit();
      setSelectedIds(new Set());
      alert(`✅ ${selectedIds.size}개의 게시글이 삭제되었습니다.`);
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="board-container animate-in">
      {/* 헤더 */}
      <div className="feed-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>커뮤니티 피드</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{
                padding: '7px 14px',
                background: isDeleting ? '#ccc' : '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isDeleting ? '삭제 중...' : `🗑️ 선택 삭제 (${selectedIds.size})`}
            </button>
          )}
          <button className="btn-primary" onClick={onNewPost} style={{ width: 'auto', padding: '8px 16px' }}>
            글쓰기
          </button>
        </div>
      </div>

      {/* 전체 선택 바 (게시글이 있을 때만 표시) */}
      {posts.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '16px',
          fontSize: '0.85rem',
          color: '#555'
        }}>
          <input
            type="checkbox"
            id="select-all"
            checked={selectedIds.size === posts.length && posts.length > 0}
            onChange={toggleSelectAll}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#e74c3c' }}
          />
          <label htmlFor="select-all" style={{ cursor: 'pointer', userSelect: 'none' }}>
            {selectedIds.size === posts.length && posts.length > 0 ? '전체 해제' : '전체 선택'}
          </label>
          {selectedIds.size > 0 && (
            <span style={{ marginLeft: '4px', color: '#e74c3c', fontWeight: 600 }}>
              {selectedIds.size}개 선택됨
            </span>
          )}
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="feed" style={{ marginTop: '12px' }}>
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            아직 게시글이 없습니다. 첫 글을 작성해보세요! 🖊️
          </div>
        )}
        {posts.map(post => (
          <div
            key={post.id}
            className="post-item animate-in"
            onClick={() => onSelectPost(post.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              background: selectedIds.has(post.id) ? '#fff5f5' : undefined,
              borderLeft: selectedIds.has(post.id) ? '3px solid #e74c3c' : '3px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            {/* 체크박스 */}
            <div
              onClick={e => toggleSelect(e, post.id)}
              style={{ paddingTop: '2px', flexShrink: 0 }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(post.id)}
                onChange={() => {}}
                onClick={e => e.stopPropagation()}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#e74c3c' }}
              />
            </div>

            {/* 게시글 내용 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="post-user">{post.author || '익명'}</span>
                <span className="post-time">{formatDate(post.createdAt)}</span>
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-summary">
                {post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 선택 삭제 버튼 (게시글이 많을 때 편의용) */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'sticky',
          bottom: '16px',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            style={{
              padding: '12px 32px',
              background: isDeleting ? '#ccc' : '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(231,76,60,0.35)'
            }}
          >
            {isDeleting ? '삭제 중...' : `🗑️ 선택한 ${selectedIds.size}개 게시글 삭제`}
          </button>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────
// 글쓰기 폼
// ────────────────────────────────────────────────
const PostForm = ({ onCancel }) => {
  const [formData, setFormData] = useState({ title: '', author: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert('내용을 입력해주세요.');

    setIsSubmitting(true);

    const submissionPromise = addDoc(collection(db, 'posts'), {
      title: formData.title,
      author: formData.author || '익명',
      content: formData.content,
      createdAt: serverTimestamp()
    });

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await Promise.race([submissionPromise, timeoutPromise]);
      alert('게시물이 성공적으로 등록되었습니다.');
      onCancel();
    } catch (error) {
      console.error('Submission Error: ', error);
      alert('등록 중 오류가 발생했으나, 잠시 후 목록에서 확인하실 수 있습니다.');
      onCancel();
    }
  };

  return (
    <div className="form-container animate-in">
      <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>새 게시물 작성</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목</label>
          <input
            placeholder="제목"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>작성자</label>
          <input
            placeholder="이름 (익명 가능)"
            value={formData.author}
            onChange={e => setFormData({ ...formData, author: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea
            style={{ height: '200px' }}
            placeholder="내용을 입력하세요"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ────────────────────────────────────────────────
// 게시글 상세
// ────────────────────────────────────────────────
const PostDetail = ({ postId, onBack }) => {
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, 'posts', postId));
      if (docSnap.exists()) setPost(docSnap.data());
    };
    fetchPost();
  }, [postId]);

  if (!post) return <div style={{ textAlign: 'center', padding: '40px' }}>불러오는 중...</div>;

  return (
    <div className="detail-container animate-in">
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
        ← 목록으로
      </button>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0' }}>{post.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{post.author}</span>
          <span className="post-time">{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#333' }}>{post.content}</p>
    </div>
  );
};

// ────────────────────────────────────────────────
// 메인 Board 컴포넌트
// ────────────────────────────────────────────────
const Board = () => {
  const [view, setView] = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);

  return (
    <div className="board-page">
      {view === 'list' && (
        <PostList
          onSelectPost={(id) => { setSelectedPostId(id); setView('detail'); }}
          onNewPost={() => setView('form')}
        />
      )}
      {view === 'form' && <PostForm onCancel={() => setView('list')} />}
      {view === 'detail' && <PostDetail postId={selectedPostId} onBack={() => setView('list')} />}
    </div>
  );
};

export default Board;