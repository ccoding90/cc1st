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
  getDoc
} from 'firebase/firestore';

const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '...';
  const date = timestamp.toDate();
  return date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PostList = ({ onSelectPost, onNewPost }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="board-container animate-fadeIn">
      <header className="board-header">
        <h2>커뮤니티 피드</h2>
        <button className="btn-primary" onClick={onNewPost}>글쓰기</button>
      </header>
      <div className="feed">
        {posts.map(post => (
          <div key={post.id} className="post-item animate-fadeIn" onClick={() => onSelectPost(post.id)}>
            <div className="post-header">
              <span className="post-author">{post.author}</span>
              <span className="post-time">{formatDate(post.createdAt)}</span>
            </div>
            <span className="post-title">{post.title}</span>
            <p className="post-summary">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PostForm = ({ onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author || !content) return alert('모든 필드를 입력해주세요.');
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title,
        author,
        content,
        createdAt: serverTimestamp()
      });
      alert('글쓰기가 완료되었습니다. 목록으로 돌아갑니다.');
      onCancel(); // Return to list
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-fadeIn">
      <div className="form-header">
        <h3>새 게시물 만들기</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="무엇을 공유하고 싶으신가요?" />
        </div>
        <div className="form-group">
          <label>작성자</label>
          <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="성함을 입력하세요" />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows="8" placeholder="당신의 생각을 자유롭게 적어주세요..." />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ marginRight: '10px' }}>취소</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '공유하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PostDetail = ({ postId, onBack }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, 'posts', postId));
      if (docSnap.exists()) setPost(docSnap.data());
    };
    fetchPost();

    const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentAuthor || !commentText) return;
    await addDoc(collection(db, `posts/${postId}/comments`), {
      author: commentAuthor,
      text: commentText,
      createdAt: serverTimestamp()
    });
    setCommentAuthor('');
    setCommentText('');
  };

  if (!post) return <div className="loading">불러오는 중...</div>;

  return (
    <div className="detail-container animate-fadeIn">
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>← 돌아가기</button>
      <div className="post-detail-content">
        <div className="post-header-large">
          <span className="post-author-large">{post.author}</span>
          <span className="post-time-large">{formatDate(post.createdAt)}</span>
        </div>
        <h1>{post.title}</h1>
        <p className="content-body-large">{post.content}</p>
      </div>
      
      <section className="comments-section">
        <h4>댓글 {comments.length}개</h4>
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <span className="comment-author"><strong>{c.author}</strong></span>
              <span className="comment-text">{c.text}</span>
            </div>
          ))}
        </div>
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="이름" className="comment-input-small" />
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="댓글 달기..." rows="2" />
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }}>게시</button>
        </form>
      </section>
    </div>
  );
};

const Board = () => {
  const [view, setView] = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);

  const handleSelectPost = (id) => {
    setSelectedPostId(id);
    setView('detail');
  };

  return (
    <div className="board-page">
      {view === 'list' && <PostList onSelectPost={handleSelectPost} onNewPost={() => setView('form')} />}
      {view === 'form' && <PostForm onCancel={() => setView('list')} />}
      {view === 'detail' && <PostDetail postId={selectedPostId} onBack={() => setView('list')} />}
    </div>
  );
};

export default Board;
