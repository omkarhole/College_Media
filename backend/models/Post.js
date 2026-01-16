const mongoose = require("mongoose");
const PointSchema = require('./Location');

/* ============================================================
   📌 POST SCHEMA
   ============================================================ */

const postSchema = new mongoose.Schema(
  {
    /* -------------------------
       👤 AUTHOR
    ------------------------- */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* -------------------------
       📝 CONTENT
    ------------------------- */
    content: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true
    },

    postType: {
      type: String,
      enum: ["text", "photo", "video", "poll", "shared"],
      default: "text"
    },

    /* -------------------------
       🖼 MEDIA
    ------------------------- */
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"]
        },
        url: { type: String, required: true },
        thumbnail: String,
        alt: String
      }
    ],

    /* -------------------------
       📊 POLLS
    ------------------------- */
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [
            {
              user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              votedAt: { type: Date, default: Date.now }
            }
          ]
        }
      ],
      endsAt: Date,
      allowMultipleVotes: { type: Boolean, default: false }
    },

    /* -------------------------
       ❤️ ENGAGEMENT
    ------------------------- */
    likes: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likedAt: { type: Date, default: Date.now }
      }
    ],

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    /* -------------------------
       🔁 SHARED POSTS
    ------------------------- */
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    },

    /* -------------------------
       🔐 VISIBILITY
    ------------------------- */
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public"
    },

    /* -------------------------
       🔎 TAGS & MENTIONS
    ------------------------- */
    tags: [{ type: String, trim: true, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    /* -------------------------
       📍 LOCATION
    ------------------------- */
    location: {
      type: PointSchema,
      default: undefined
    },

    /* -------------------------
       🧠 STATE FLAGS
    ------------------------- */
    isPinned: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,

    /* -------------------------
       🧠 SEMANTIC SEARCH
    ------------------------- */
    embedding: {
      type: [Number],
      select: false, // Hide by default to save bandwidth
    },

    /* -------------------------
       🗑 SOFT DELETE
    ------------------------- */
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date
  },
  {
    timestamps: true,
    optimisticConcurrency: true
  }
);

/* ============================================================
   📊 INDEXING STRATEGY (LARGE COLLECTION OPTIMIZED)
   ============================================================ */

/* -------------------------
   📰 FEED QUERIES
------------------------- */

// User profile feed
postSchema.index(
  { user: 1, isDeleted: 1, createdAt: -1 },
  {
    name: "idx_user_feed",
    partialFilterExpression: { isDeleted: false }
  }
);

// Global public feed
postSchema.index(
  { visibility: 1, isDeleted: 1, createdAt: -1 },
  {
    name: "idx_public_feed",
    partialFilterExpression: {
      isDeleted: false,
      visibility: "public"
    }
  }
);

/* -------------------------
   🔍 DISCOVERY
------------------------- */

// Tag based search
postSchema.index(
  { tags: 1, createdAt: -1 },
  { name: "idx_tag_search" }
);

// Mentions
postSchema.index(
  { mentions: 1, createdAt: -1 },
  { name: "idx_mentions" }
);

/* -------------------------
   🔥 TRENDING POSTS
------------------------- */

postSchema.index(
  { likesCount: -1, createdAt: -1 },
  { name: "idx_trending_likes" }
);

postSchema.index(
  { viewsCount: -1, createdAt: -1 },
  { name: "idx_trending_views" }
);

/* -------------------------
   🔁 SHARED POSTS
------------------------- */

postSchema.index(
  { sharedPost: 1, createdAt: -1 },
  { name: "idx_shared_posts" }
);

/* -------------------------
   📍 GEO DISCOVERY
------------------------- */

postSchema.index(
  { location: "2dsphere" },
  { name: "idx_geo_posts" }
);

/* ============================================================
   ⚙️ METHODS (PERFORMANCE AWARE)
   ============================================================ */

postSchema.methods.toggleLike = async function (userId) {
  const index = this.likes.findIndex(
    (l) => l.user.toString() === userId.toString()
  );

  if (index > -1) {
    this.likes.splice(index, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
  } else {
    this.likes.push({ user: userId });
    this.likesCount += 1;
  }

  return this.save();
};

postSchema.methods.incrementViews = async function () {
  this.viewsCount += 1;
  return this.save();
};

postSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   🚀 EXPORT
   ============================================================ */

module.exports = mongoose.model("Post", postSchema);
