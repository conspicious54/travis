import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onPlay, onPause, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Only initialize player if it hasn't been initialized yet
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        sources: [{
          src: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/file-uploads-sites-117035-video-46c688e-aad-e43-afad-00c.mp4',
          type: 'video/mp4'
        }],
        poster: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80'
      }, () => {
        // Player is ready
        const player = playerRef.current;
        if (player) {
          player.on('play', () => onPlay?.());
          player.on('pause', () => onPause?.());
          player.on('ended', () => onEnded?.());
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [onPlay, onPause, onEnded]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
      >
        <source 
          src="https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/file-uploads-sites-117035-video-46c688e-aad-e43-afad-00c.mp4" 
          type="video/mp4" 
        />
      </video>
    </div>
  );
};