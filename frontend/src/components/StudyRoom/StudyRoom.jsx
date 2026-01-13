import React, { useState, useCallback, useRef, useEffect } from 'react';
import './StudyRoom.css';
import ChatInterface from './ChatInterface';
import ActiveLearners from './ActiveLearners';
import VideoSection from './VideoSection';

const StudyRoom = ({ roomId = 'room-1', courseName = 'Introduction to Web Development' }) => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'John', avatar: '👨‍💻', message: 'Hey everyone!', timestamp: '10:30 AM', reactions: [] },
    { id: 2, user: 'Sarah', avatar: '👩‍💻', message: 'This topic is interesting', timestamp: '10:31 AM', reactions: [] },
  ]);

  const [activeLearners, setActiveLearners] = useState([
    { id: 1, name: 'You', avatar: '👨‍💻', isActive: true },
    { id: 2, name: 'John', avatar: '👨‍🎓', isActive: true },
    { id: 3, name: 'Sarah', avatar: '👩‍🎓', isActive: true },
    { id: 4, name: 'Mike', avatar: '👨‍💼', isActive: false },
    { id: 5, name: 'Emma', avatar: '👩‍💼', isActive: true },
    { id: 6, name: 'Alex', avatar: '👨‍🏫', isActive: true },
  ]);

  const [reactionRain, setReactionRain] = useState([]);
  const reactionIdRef = useRef(0);

  const handleSendMessage = useCallback((messageText) => {
    const newMessage = {
      id: messages.length + 1,
      user: 'You',
      avatar: '👨‍💻',
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [messages.length]);

  const handleReaction = useCallback((messageId, emoji) => {
    // Update message reactions
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: [
                ...msg.reactions,
                { emoji, id: `${messageId}-${msg.reactions.length}` },
              ],
            }
          : msg
      )
    );

    // Create reaction rain animation
    const rainId = reactionIdRef.current++;
    setReactionRain((prev) => [
      ...prev,
      {
        id: rainId,
        emoji,
        startX: Math.random() * 80 + 10,
      },
    ]);

    // Remove reaction from rain after animation completes
    setTimeout(() => {
      setReactionRain((prev) => prev.filter((r) => r.id !== rainId));
    }, 2000);
  }, []);

  return (
    <div className="study-room-container">
      <div className="study-room-header">
        <h1>{courseName}</h1>
        <span className="room-id">Room #{roomId}</span>
      </div>

      <div className="study-room-layout">
        {/* Desktop View */}
        <div className="desktop-layout">
          <div className="video-container">
            <VideoSection />
          </div>
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <h3>Study Chat</h3>
              <span className="participant-count">{messages.length} messages</span>
            </div>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
            />
          </div>
        </div>

        {/* Mobile View */}
        <div className="mobile-layout">
          <VideoSection />
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
          />
        </div>

        {/* Active Learners */}
        <ActiveLearners learners={activeLearners} />

        {/* Reaction Rain Animation */}
        <div className="reaction-rain-container">
          {reactionRain.map((reaction) => (
            <div
              key={reaction.id}
              className="reaction-rain-item"
              style={{
                '--start-x': `${reaction.startX}%`,
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
