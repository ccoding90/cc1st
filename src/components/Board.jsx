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
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>커뮤니티 피드</h2>
        <button className="btn-primary" onClick={onNewPost}>공유하기</button>
      </div>
      <div className="feed">
        {posts.map(post => (
          <div key={post.id} className="post-item animate-in" onClick={() => onSelectPost(post.id)}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#efefef', marginRight: '10px' }}></div>
              <div>
                <span className="post-user">{post.author || '익명'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatDate(post.createdAt)}</span>
              </div>
            </div>
            <h3 className="post-title">{post.title}</h3>
            <p className="post-summary">{post.content?.substring(0, 120)}{post.content?.length > 120 ? '...' : ''}</p>
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
      // Optimistic behavior: close form early or show immediate feedback
      await addDoc(collection(db, 'posts'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      alert('게시물이 공유되었습니다!');
      onCancel();
    } catch (error) {
      alert('오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-in">
      <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>새 게시물</h3>
      <form onSubmit={handleSubmit}>
        <input 
          style={{ marginBottom: '12px', background: '#fff' }}
          placeholder="제목" 
          onChange={e => setFormData({...formData, title: e.target.value})}
        />
        <input 
          style={{ marginBottom: '12px', background: '#fff' }}
          placeholder="작성자" 
          onChange={e => setFormData({...formData, author: e.target.value})}
        />
        <textarea 
          style={{ height: '150px', marginBottom: '20px', background: '#fff' }}
          placeholder="어떤 이야기를 공유하고 싶으신가요?"
          onChange={e => setFormData({...formData, content: e.target.value})}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
            {isSubmitting ? '공유 중...' : '게시하기'}
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

  if (!post) return <div className="animate-in" style={{ textAlign: 'center', padding: '50px' }}>불러오는 중...</div>;

  return (
    <div className="detail-container animate-in">
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '0.85rem' }}>← 뒤로가기</button>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#efefef', marginRight: '12px' }}></div>
        <div>
          <span style={{ fontWeight: 700, display: 'block' }}>{post.author || '익명'}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>{post.title}</h2>
      <p style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#333' }}>{post.content}</p>
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
