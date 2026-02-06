import { useState } from 'react';

export default function CommentForm({ onSubmit, placeholder = "Write a comment...", buttonText = "Comment", autoFocus = false }) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (text.trim().length > 500) {
      setError('Comment must be less than 500 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(text.trim());
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '0.75rem',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
            backgroundColor: isSubmitting ? '#F9FAFB' : '#fff',
            opacity: isSubmitting ? 0.6 : 1,
          }}
          maxLength={500}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem'
        }}>
          <span style={{
            fontSize: '12px',
            color: text.length > 450 ? '#DC2626' : '#6B7280'
          }}>
            {text.length}/500
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (!text.trim() || isSubmitting) ? '#E5E7EB' : '#3B82F6',
              color: (!text.trim() || isSubmitting) ? '#9CA3AF' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (!text.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Posting...' : buttonText}
          </button>
        </div>
      </div>
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}
    </form>
  );
}
