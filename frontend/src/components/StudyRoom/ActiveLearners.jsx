import React from 'react';

const ActiveLearners = ({ learners }) => {
  return (
    <div className="active-learners">
      <div className="active-learners-header">
        <h4>Active Learners ({learners.filter((l) => l.isActive).length})</h4>
      </div>
      <div className="learners-scroll">
        {learners.map((learner) => (
          <div
            key={learner.id}
            className={`learner-avatar ${learner.isActive ? 'active' : 'inactive'}`}
            title={learner.name}
          >
            <span className="avatar">{learner.avatar}</span>
            {learner.isActive && <span className="pulse-ring"></span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveLearners;
