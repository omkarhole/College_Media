const mongoose = require('mongoose');

/**
 * InteractionGraph Model
 * Models edges in our social graph for recommendation engine.
 * Nodes are Users and Posts/Taags.
 * Edges have weights (e.g., View = 1, Like = 5, Share = 10).
 */
const interactionGraphSchema = new mongoose.Schema({
    // source node (always a user who performed the action)
    source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // target node (User, Post, or Tag)
    target: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    targetModel: {
        type: String,
        enum: ['User', 'Post', 'Tag'], // What is the target?
        required: true
    },
    type: {
        type: String,
        enum: ['VIEW', 'LIKE', 'COMMENT', 'SHARE', 'FOLLOW', 'TAG_INTEREST'],
        required: true
    },
    weight: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Keep interactions for 30 days for recency bias (efficiency)
    }
});

// Composite index for fast lookups (e.g., "Did user X like post Y?")
interactionGraphSchema.index({ source: 1, target: 1, type: 1 }, { unique: true });

// Index for Collaborative Filtering: "Find users who also interacted with Target"
interactionGraphSchema.index({ target: 1, type: 1 });

module.exports = mongoose.model('InteractionGraph', interactionGraphSchema);
