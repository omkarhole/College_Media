const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

/**
 * Generate HLS (m3u8) streams for Adaptive Bitrate Streaming
 * Creates 3 qualities: 360p, 720p, 1080p
 * @param {string} inputPath 
 * @param {string} outputDir 
 */
async function generateHLS(inputPath, outputDir) {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    // Ensure HLS directory exists
    const hlsDir = path.join(outputDir, 'hls');
    await fs.ensureDir(hlsDir);

    console.log(`🎬 HLS Generation Started for ${path.basename(inputPath)}`);

    const variants = [
        { name: '360p', size: '640x360', bit: '800k' },
        { name: '720p', size: '1280x720', bit: '2500k' },
        { name: '1080p', size: '1920x1080', bit: '5000k' }
    ];

    // Note: Generating strictly sequentially to avoid CPU overloading
    for (const v of variants) {
        console.log(`   > Generating ${v.name} variant...`);
        const playlistPath = path.join(hlsDir, `${v.name}.m3u8`);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .size(v.size)
                .videoCodec('libx264')
                .videoBitrate(v.bit)
                .outputOptions([
                    '-hls_time 10',      // 10 second segments
                    '-hls_list_size 0',  // Include all segments in list
                    '-f hls'             // Format HLS
                ])
                .output(playlistPath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error(`Error generating ${v.name}:`, err);
                    reject(err);
                })
                .run();
        });
    }

    // Generate Master Playlist
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
    variants.forEach(v => {
        // Bandwidth calculation (approx)
        const bandwidth = parseInt(v.bit) * 1000;
        masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${v.size}\n${v.name}.m3u8\n`;
    });

    const masterPath = path.join(hlsDir, 'master.m3u8');
    await fs.writeFile(masterPath, masterContent);

    console.log(`✅ HLS Generation Complete: ${masterPath}`);
    return masterPath;
}

module.exports = { generateHLS };
