const DataLoader = require('dataloader');
const User = require('../models/User');
const Post = require('../models/Post');

// Batch function for Users by ID
const batchUsers = async (userIds) => {
    const uniqueIds = [...new Set(userIds.map(id => id.toString()))];
    const users = await User.find({ _id: { $in: uniqueIds } });

    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u);

    return userIds.map(id => userMap[id.toString()] || null);
};

// Batch function for Posts by ID
const batchPosts = async (postIds) => {
    const uniqueIds = [...new Set(postIds.map(id => id.toString()))];
    const posts = await Post.find({ _id: { $in: uniqueIds } });

    const postMap = {};
    posts.forEach(p => postMap[p._id.toString()] = p);

    return postIds.map(id => postMap[id.toString()] || null);
};

const createLoaders = () => ({
    userLoader: new DataLoader(batchUsers),
    postLoader: new DataLoader(batchPosts)
});

module.exports = createLoaders;
