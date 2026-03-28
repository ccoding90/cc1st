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
  limit
} from 'firebase/firestore';

const formatDate = (timestamp) => {
  if (!timestamp) return '방금 전';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (new Date() - date) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return date.toLocaleDateString();
};

const PostList = ({ onSelectPost, onNewPost }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="board-container animate-in">
      <div className="feed-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>커뮤니티 피드</h2>
        <button className="btn-primary" onClick={onNewPost} style={{ width: 'auto', padding: '8px 16px' }}>글쓰기</button>
      </div>
      <div className="feed" style={{ marginTop: '20px' }}>
        {posts.map(post => (
          <div key={post.id} className="post-item animate-in" onClick={() => onSelectPost(post.id)}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="post-user">{post.author || '익명'}</span>
              <span className="post-time">{formatDate(post.createdAt)}</span>
            </div>
            <h3 className="post-title">{post.title}</h3>
            <p className="post-summary">{post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PostForm = ({ onCancel }) => {
  const [formData, setFormData] = useState({ title: '', author: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert('내용을 입력해주세요.');
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: formData.title,
        author: formData.author || '익명',
        content: formData.content,
        createdAt: serverTimestamp()
      });
      alert('게시물이 성공적으로 등록되었습니다.');
      onCancel(); // view를 'list'로 전환
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('등록 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-in">
      <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>새 게시물 작성</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목</label>
          <input 
            placeholder="제목을 입력하세요" 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>작성자</label>
          <input 
            placeholder="이름 (미입력 시 익명)" 
            value={formData.author}
            onChange={e => setFormData({...formData, author: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea 
            style={{ height: '200px' }}
            placeholder="내용을 입력하세요"
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

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
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', fontSize: '0.85rem' }}>← 목록으로</button>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0' }}>{post.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{post.author}</span>
          <span className="post-time">{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#333', fontSize: '1.05rem' }}>{post.content}</p>
    </div>
  );
};

const Board = () => {
  const [view, setView] = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);

  return (
    <div className="board-page">
      {view === 'list' && <PostList onSelectPost={(id) => { setSelectedPostId(id); setView('detail'); }} onNewPost={() => setView('form')} />}
      {view === 'form' && <PostForm onCancel={() => setView('list')} />}
      {view === 'detail' && <PostDetail postId={selectedPostId} onBack={() => setView('list')} />}
    </div>
  );
};

export default Board;
