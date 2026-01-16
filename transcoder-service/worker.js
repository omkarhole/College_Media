const { generateHLS } = require('./hls-worker');
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');

/**
 * Worker function to process video transcoding (HLS Enabled)
 * @param {Object} data - { videoId, inputPath }
 */
module.exports = async (data) => {
    const { videoId, inputPath } = data;

    // Create a unique directory for this video's HLS output
    // e.g. uploads/<videoId_timestamp>/hls
    const uploadRoot = path.dirname(inputPath);
    const uniqueDir = path.join(uploadRoot, videoId);

    console.log(`Worker: Processing ${videoId} (HLS)`);

    // 1. Update Status: Processing
    await mongoose.connection.collection('posts').updateOne(
        { _id: new mongoose.Types.ObjectId(videoId) },
        { $set: { transcodingStatus: 'processing' } }
    );

    try {
        // 2. Generate HLS
        await fs.ensureDir(uniqueDir);
        const masterPath = await generateHLS(inputPath, uniqueDir);

        // 3. Construct Public URL
        // Assuming 'uploads/' is served statically by Nginx/Backend at /uploads
        // videoId/hls/master.m3u8
        const relativeUrl = `/uploads/${videoId}/hls/master.m3u8`;

        // 4. Update Status: Completed
        await mongoose.connection.collection('posts').updateOne(
            { _id: new mongoose.Types.ObjectId(videoId) },
            {
                $set: {
                    transcodingStatus: 'completed',
                    mediaUrl: relativeUrl, // Main URL logic
                    hlsUrl: relativeUrl
                }
            }
        );

        console.log(`Worker: Job ${videoId} Finished Successfully.`);
        return { success: true };

    } catch (error) {
        console.error('Transcoding Error:', error);

        await mongoose.connection.collection('posts').updateOne(
            { _id: new mongoose.Types.ObjectId(videoId) },
            { $set: { transcodingStatus: 'failed' } }
        );
        throw error;
    }
};
