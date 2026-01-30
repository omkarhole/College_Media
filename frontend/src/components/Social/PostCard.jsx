export default function PostCard({ post }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 w-full md:max-w-2xl mx-auto shadow-sm">
      {/* Header: Avatar, Name, Title, Timestamp */}
      <div className="flex items-center mb-3">
        <img
          src={post.user.avatar}
          alt={post.user.name}
          className="w-10 h-10 rounded-full mr-3"
        />
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
