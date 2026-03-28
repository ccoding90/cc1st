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
  return date.toLocaleString();
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
        <h2>자유게시판</h2>
        <button className="btn-primary" onClick={onNewPost}>새 글 작성</button>
      </header>
      <div className="post-list">
        <div className="list-header">
          <span>제목</span>
          <span>작성자</span>
          <span>작성시간</span>
        </div>
        {posts.map(post => (
          <div key={post.id} className="list-item" onClick={() => onSelectPost(post.id)}>
            <span className="title">{post.title}</span>
            <span className="author">{post.author}</span>
            <span className="time">{formatDate(post.createdAt)}</span>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author || !content) return alert('모든 필드를 입력해주세요.');
    await addDoc(collection(db, 'posts'), {
      title,
      author,
      content,
      createdAt: serverTimestamp()
    });
    onCancel();
  };

  return (
    <div className="form-container animate-fadeIn">
      <h3>새 글 작성</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>
        <div className="form-group">
          <label>작성자</label>
          <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="이름을 입력하세요" />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows="10" placeholder="내용을 입력하세요" />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
          <button type="submit" className="btn-primary">등록</button>
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

  if (!post) return <div className="loading">로딩 중...</div>;

  return (
    <div className="detail-container animate-fadeIn">
      <button className="btn-secondary" onClick={onBack}>목록으로</button>
      <div className="post-content">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>작성자: {post.author}</span> | <span>{formatDate(post.createdAt)}</span>
        </div>
        <hr />
        <p className="content-body">{post.content}</p>
      </div>
      <section className="comments-section">
        <h3>댓글 ({comments.length})</h3>
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <strong>{c.author}</strong>: {c.text}
              <span className="comment-time">{formatDate(c.createdAt)}</span>
            </div>
          ))}
        </div>
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="이름" className="comment-author-input" />
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="댓글을 입력하세요..." />
          <button type="submit" className="btn-primary">댓글 등록</button>
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
