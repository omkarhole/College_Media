import { useState } from 'react';
import CommentSection from './CommentSection';

export default function PostCard({ post, currentUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', transition: 'all 0.2s' }}>
      {/* Header: Avatar, Name, Title, Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <img
          src={post.user?.avatar || `https://ui-avatars.com/api/?name=${post.user?.name || 'User'}&background=random`}
          alt={post.user?.name || 'User'}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '0.75rem' }}
        />
        <div>
          <h3 style={{ fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '0.125rem' }}>{post.user?.name || 'Anonymous'}</h3>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>{post.user?.email || 'User'} • {post.timestamp}</p>
        </div>
      </div>

      {/* Content */}
      <p style={{ fontSize: '14px', color: '#374151', marginBottom: '1rem', lineHeight: '1.6' }}>{post.content}</p>

      {/* Engagement Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
        <span>{likesCount} likes</span>
        <span>{commentCount} comments</span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '0.5rem' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#6B7280', background: 'transparent', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#E5E7EB'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
          <span>👍</span> Like
        </button>
        <button 
          onClick={handleCommentClick}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '13px', 
            color: showComments ? '#3B82F6' : '#6B7280', 
            background: 'transparent', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            transition: 'background 0.2s',
            fontWeight: showComments ? '600' : '400'
          }} 
          onMouseOver={(e) => e.currentTarget.style.background = '#E5E7EB'} 
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span>💬</span> Comment
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#6B7280', background: 'transparent', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#E5E7EB'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
          <span>🔗</span> Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={post._id || post.id}
          initialCount={commentCount}
          currentUserId={currentUserId}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}
