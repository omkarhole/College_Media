import React from 'react';

const VideoSection = () => {
  return (
    <div className="video-section">
      <div className="video-placeholder">
        <div className="video-content">
          <div className="play-icon">▶️</div>
          <p>Video Stream</p>
          <small>Live session in progress...</small>
        </div>
      </div>
      <div className="video-controls">
        <button className="video-control-btn" title="Volume">
          🔊
        </button>
        <button className="video-control-btn" title="Full Screen">
          ⛶
        </button>
        <button className="video-control-btn" title="Settings">
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default VideoSection;
