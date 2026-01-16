const Post = require('../models/Post');
const User = require('../models/User');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) return null;
            return await User.findById(user.userId);
        },
        user: async (_, { id }, { loaders }) => {
            return await loaders.userLoader.load(id);
        },
        feed: async (_, { limit = 10, offset = 0 }) => {
            return await Post.find({ visibility: 'public' })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit);
        },
        post: async (_, { id }, { loaders }) => {
            return await loaders.postLoader.load(id);
        }
    },
    Mutation: {
        createPost: async (_, { caption, imageUrl }, { user }) => {
            if (!user) throw new AuthenticationError('Not authenticated');

            const newPost = await Post.create({
                user: user.userId,
                caption,
                imageUrl, // Assuming schema allows this or 'content'
                createdAt: new Date().toISOString()
            });
            return newPost;
        },
        likePost: async (_, { postId }, { user }) => {
            if (!user) throw new AuthenticationError('Not authenticated');
            await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
            return true;
        }
    },
    // Field Resolvers
    Post: {
        author: async (parent, _, { loaders }) => {
            if (parent.user) return loaders.userLoader.load(parent.user);
            return null;
        },
        createdAt: (parent) => new Date(parent.createdAt).toISOString()
    },
    User: {
        posts: async (parent, { limit = 5 }) => {
            return await Post.find({ user: parent.id }).limit(limit).sort({ createdAt: -1 });
        }
    }
};

module.exports = resolvers;
