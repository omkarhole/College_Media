import { useState } from 'react';

// Generate initials from user name
const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate a consistent color based on user name
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Fallback Avatar Component
function AvatarFallback({ name }) {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div
      className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center ${colorClass} text-white font-semibold text-sm`}
      title={name}
    >
      {initials}
    </div>
  );
}

export default function PostCard({ post }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 w-full md:max-w-2xl mx-auto shadow-xs">
      {/* Header: Avatar, Name, Title, Timestamp */}
      <div className="flex items-center mb-3 gap-1.5">
        {imageError ? (
          <AvatarFallback name={post.user.name} />
        ) : (
          <img
            src={post.user.avatar}
            alt={post.user.name}
            className="w-10 h-10 rounded-full mr-3"
            onError={handleImageError}
          />
        )}
        <div>
          <h3 className="font-semibold text-sm text-gray-900">{post.user.name}</h3>
          <p className="text-xs text-gray-500">{post.user.title} • {post.timestamp}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-800 mb-3 leading-relaxed">{post.content}</p>

      {/* Engagement Stats */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>{post.likes} likes</span>
        <span>{post.comments} comments</span>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-around mt-2 border-t border-gray-100 pt-2">
        <button className="flex items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors">
          👍 Like
        </button>
        <button className="flex items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors">
          💬 Comment
        </button>
        <button className="flex items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors">
          🔗 Share
        </button>
      </div>
    </div>
  );
}
