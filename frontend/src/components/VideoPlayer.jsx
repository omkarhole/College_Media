import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ src, poster, autoPlay = false }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Destroy previous HLS instance if exists
        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                capLevelToPlayerSize: true, // Optimize quality for player dimensions
                autoStartLoad: true
            });

            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✅ HLS Manifest Loaded');
                if (autoPlay) {
                    video.play().catch(e => console.warn('AutoPlay blocked:', e));
                }
            });

            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) {
                    console.error('❌ HLS Fatal Error:', data);
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari/iOS)
            video.src = src;
            if (autoPlay) {
                video.play().catch(e => console.warn('AutoPlay blocked:', e));
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, autoPlay]);

    return (
        <div className="video-container w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <video
                ref={videoRef}
                poster={poster}
                controls
                playsInline
                className="w-full h-auto aspect-video"
            />
        </div>
    );
};

export default VideoPlayer;
