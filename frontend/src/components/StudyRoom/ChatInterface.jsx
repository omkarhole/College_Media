import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ messages, onSendMessage, onReaction }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleEmojiReaction = (messageId, emoji) => {
    onReaction(messageId, emoji);
  };

  return (
    <div className="chat-interface">
      <div className="messages-container" ref={messageListRef}>
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className="message"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="message-header">
              <span className="user-avatar">{msg.avatar}</span>
              <div className="message-info">
                <span className="user-name">{msg.user}</span>
                <span className="timestamp">{msg.timestamp}</span>
              </div>
            </div>
            <div className="message-content">{msg.message}</div>
            {msg.reactions && msg.reactions.length > 0 && (
              <div className="message-reactions">
                {msg.reactions.map((reaction) => (
                  <span key={reaction.id} className="reaction-badge">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
            <div className="message-actions">
              <button
                className="reaction-btn"
                onClick={() => handleEmojiReaction(msg.id, '👍')}
                title="Helpful"
              >
                👍
              </button>
              <button
                className="reaction-btn"
                onClick={() => handleEmojiReaction(msg.id, '❤️')}
                title="Love"
              >
                ❤️
              </button>
              <button
                className="reaction-btn"
                onClick={() => handleEmojiReaction(msg.id, '🎉')}
                title="Celebrate"
              >
                🎉
              </button>
              <button
                className="reaction-btn"
                onClick={() => handleEmojiReaction(msg.id, '🤔')}
                title="Think"
              >
                🤔
              </button>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Share your thoughts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="send-button" disabled={!inputValue.trim()}>
          📤
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
