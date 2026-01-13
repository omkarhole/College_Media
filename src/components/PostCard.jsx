import React from 'react';

/**
 * PostCard Component
 *
 * Individual post display with user info, media, interactions, and caption.
 *
 * @param {Object} props
 * @param {Object} props.post - Post object with user, media, caption, likes, comments
 * @param {boolean} props.isLiked - Whether the post is liked by the current user
 * @param {function} props.onLikeToggle - Handler for like toggle events
 * @returns {React.ReactElement} Post card JSX
 */
const PostCard = ({ post, isLiked, onLikeToggle }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* ========== POST HEADER ========== */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <img
          src={post.user.avatar}
          alt={post.user.username}
          className="w-10 h-10 rounded-full mr-3 cursor-pointer hover:scale-110 transition-transform duration-300"
        />
        <span className="font-semibold text-gray-800 cursor-pointer hover:text-purple-600 transition-colors duration-300">{post.user.username}</span>
        <div className="ml-auto cursor-pointer hover:text-gray-500 transition-colors duration-300">
          <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
      </div>

      {/* ========== POST MEDIA ========== */}
      <div className="w-full cursor-pointer">
        <img
          src={post.media}
          alt="Post content"
          className="w-full object-cover hover:opacity-95 transition-opacity duration-300"
        />
      </div>

      {/* ========== POST INTERACTIONS ========== */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4">
            {/* LIKE BUTTON */}
            <button
              onClick={onLikeToggle}
              className="flex items-center space-x-1 group"
            >
              <svg
                className={`w-6 h-6 transition-all duration-300 ${
                  isLiked
                    ? "fill-pink-500 text-pink-500 scale-110 animate-bounce"
                    : "text-gray-600 group-hover:text-pink-500"
                }`}
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-medium text-gray-700">{isLiked ? post.likes + 1 : post.likes}</span>
            </button>

            {/* COMMENT BUTTON */}
            <button className="flex items-center space-x-1 group cursor-pointer">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium text-gray-700">{post.comments}</span>
            </button>
          </div>

          {/* SHARE BUTTON */}
          <button className="group cursor-pointer">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-purple-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>

        {/* POST CAPTION */}
        <div className="mb-3">
          <p className="text-gray-800">
            <span className="font-semibold mr-2 cursor-pointer hover:text-purple-600 transition-colors duration-300">{post.user.username}</span>
            {post.caption}
          </p>
        </div>

        {/* VIEW COMMENTS */}
        <button className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors duration-300 cursor-pointer">
          View all {post.comments} comments
        </button>
      </div>
    </div>
  );
};

export default PostCard;
