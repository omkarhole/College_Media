const InteractionGraph = require('../models/InteractionGraph');
const Post = require('../models/Post');
const User = require('../models/User');
const logger = require('../utils/logger');

// Interaction Weights
const WEIGHTS = {
    VIEW: 1,
    CLICK: 2,
    LIKE: 5,
    COMMENT: 8,
    SHARE: 10,
    FOLLOW: 5
};

class RecommendationEngine {

    /**
     * Track an interaction in the graph
     * @param {string} userId - Who performed the action
     * @param {string} targetId - Post/User ID
     * @param {string} targetModel - 'Post' or 'User'
     * @param {string} type - 'LIKE', 'VIEW', etc.
     */
    static async trackInteraction(userId, targetId, targetModel, type) {
        try {
            const weight = WEIGHTS[type] || 1;

            // Upsert the interaction edge
            await InteractionGraph.findOneAndUpdate(
                { source: userId, target: targetId, type },
                {
                    source: userId,
                    target: targetId,
                    targetModel,
                    type,
                    weight,
                    createdAt: new Date() // Reset expiry on new interaction
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            logger.error('Error tracking interaction:', error);
        }
    }

    /**
     * Get Content-Based + Collaborative Filtering Recommendations
     * Strategy:
     * 1. Find users similar to current user (users who liked same posts).
     * 2. Find posts those similar users liked, that current user hasn't seen.
     * 3. Boost by recency and weight.
     */
    static async getFeedRecommendations(userId, limit = 20) {
        try {
            // Step 1: Find items (Posts) the user has interacted with tightly (Liked/Commented)
            const userInteractions = await InteractionGraph.find({
                source: userId,
                type: { $in: ['LIKE', 'COMMENT', 'SHARE'] },
                targetModel: 'Post'
            }).select('target');

            const likedPostIds = userInteractions.map(i => i.target);

            // Step 2: Collaborative Filtering Aggregation
            // "Users who liked what I liked, also liked..."
            const recommendations = await InteractionGraph.aggregate([
                // Match interactions on posts I liked (find similar users)
                {
                    $match: {
                        target: { $in: likedPostIds },
                        targetModel: 'Post',
                        source: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude myself
                    }
                },
                // Group by User to find "Similar Users"
                {
                    $group: {
                        _id: '$source',
                        similarityScore: { $sum: 1 } // Simple intersection count
                    }
                },
                { $sort: { similarityScore: -1 } },
                { $limit: 100 }, // Top 100 similar users

                // Lookup what THESE users liked (that are NOT in my list)
                {
                    $lookup: {
                        from: 'interactiongraphs',
                        localField: '_id',
                        foreignField: 'source',
                        as: 'theirInteractions'
                    }
                },
                { $unwind: '$theirInteractions' },
                {
                    $match: {
                        'theirInteractions.targetModel': 'Post',
                        'theirInteractions.type': { $in: ['LIKE', 'SHARE'] },
                        'theirInteractions.target': { $nin: likedPostIds } // Something I haven't liked yet
                    }
                },
                // Group by Post to calculate Recommendation Score
                {
                    $group: {
                        _id: '$theirInteractions.target',
                        score: { $sum: '$theirInteractions.weight' }, // Sum weights from similar users
                        count: { $sum: 1 } // How many similar users liked it
                    }
                },
                { $sort: { score: -1 } },
                { $limit: limit }
            ]);

            // If we have enough collaborative recommendations, fetch Post details
            let postIds = recommendations.map(r => r._id);

            // FALLBACK: If cold start (no/few recommendations), use Friends-of-Friends logic or Trending
            if (postIds.length < limit) {
                const friendsOfFriends = await this.getGraphRecommendations(userId, limit - postIds.length);
                postIds = [...new Set([...postIds, ...friendsOfFriends])];
            }

            // Fetch actual post data
            const posts = await Post.find({
                _id: { $in: postIds },
                isDeleted: false,
                visibility: 'public' // Ensure public
            })
                .populate('user', 'username profilePicture')
                .lean();

            // Re-order based on score (since .find() doesn't preserve order)
            const postsMap = new Map(posts.map(p => [p._id.toString(), p]));
            const orderedPosts = postIds
                .map(id => postsMap.get(id.toString()))
                .filter(p => p); // Remove nulls

            return orderedPosts;

        } catch (error) {
            logger.error('Recommend Engine Error:', error);
            // Fallback to chronological if engine fails
            return await Post.find({ visibility: 'public' })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('user', 'username profilePicture');
        }
    }

    /**
     * Graph Strategy: Friends of Friends (FoF)
     * "Posts created by people my friends follow"
     */
    static async getGraphRecommendations(userId, limit = 10) {
        // 1. Find my Followings
        const following = await InteractionGraph.find({
            source: userId,
            type: 'FOLLOW'
        }).select('target');

        const myNetworkIds = following.map(f => f.target);

        // 2. Find who THEY follow (2nd degree)
        const secondDegree = await InteractionGraph.aggregate([
            {
                $match: {
                    source: { $in: myNetworkIds },
                    type: 'FOLLOW'
                }
            },
            { $group: { _id: '$target' } }, // Unique users
            { $match: { _id: { $nin: [...myNetworkIds, new mongoose.Types.ObjectId(userId)] } } }, // Exclude my direct network
            { $limit: 20 }
        ]);

        const recommendedCreators = secondDegree.map(r => r._id);

        // 3. Get recent posts from these creators
        const posts = await Post.find({
            user: { $in: recommendedCreators },
            visibility: 'public'
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id');

        return posts.map(p => p._id);
    }
}

module.exports = RecommendationEngine;
