import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowDown } from 'lucide-react';
import { useVideoProgress } from '../context/VideoProgressContext';

interface CustomVideoPlayerProps {
  src: string;
  poster: string;
  showEndState?: boolean;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, poster, showEndState = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInitialPlay, setShowInitialPlay] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const { setHasReachedThreeMinutes } = useVideoProgress();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const totalDuration = video.duration;
      
      if (time >= 180 && !showInitialPlay) {
        setHasReachedThreeMinutes(true);
      }

      const totalWeightedDuration = 
        (30 * 6) +                 // 0-30s: 6x
        (30 * 5.5) +               // 30-60s: 5.5x
        (30 * 5) +                 // 60-90s: 5x
        (30 * 4.5) +               // 90-120s: 4.5x
        (30 * 4) +                 // 120-150s: 4x
        (30 * 3.5) +               // 150-180s: 3.5x
        (30 * 3) +                 // 180-210s: 3x
        (30 * 2.5) +               // 210-240s: 2.5x
        (30 * 2) +                 // 240-270s: 2x
        (30 * 1.75) +              // 270-300s: 1.75x
        (30 * 1.5) +               // 300-330s: 1.5x
        (Math.max(0, totalDuration - 330)); // Remaining duration at 1x

      let weightedTime = 0;
      
      if (time <= 30) {
        weightedTime = time * 6;
      } else if (time <= 60) {
        weightedTime = (30 * 6) + ((time - 30) * 5.5);
      } else if (time <= 90) {
        weightedTime = (30 * 6) + (30 * 5.5) + ((time - 60) * 5);
      } else if (time <= 120) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + ((time - 90) * 4.5);
      } else if (time <= 150) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + ((time - 120) * 4);
      } else if (time <= 180) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + ((time - 150) * 3.5);
      } else if (time <= 210) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + ((time - 180) * 3);
      } else if (time <= 240) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + (30 * 3) + ((time - 210) * 2.5);
      } else if (time <= 270) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + (30 * 3) + (30 * 2.5) + ((time - 240) * 2);
      } else if (time <= 300) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + (30 * 3) + (30 * 2.5) + (30 * 2) + ((time - 270) * 1.75);
      } else if (time <= 330) {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + (30 * 3) + (30 * 2.5) + (30 * 2) + (30 * 1.75) + ((time - 300) * 1.5);
      } else {
        weightedTime = (30 * 6) + (30 * 5.5) + (30 * 5) + (30 * 4.5) + (30 * 4) + (30 * 3.5) + (30 * 3) + (30 * 2.5) + (30 * 2) + (30 * 1.75) + (30 * 1.5) + (time - 330);
      }

      const progressPercentage = (weightedTime / totalWeightedDuration) * 100;
      setProgress(Math.min(100, progressPercentage));
      setCurrentTime(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.muted = true;
      video.play().catch(() => {
        // Autoplay failed
      });
    };

    const handleEnded = () => {
      if (showEndState) {
        setIsEnded(true);
        setIsPlaying(false);
      } else {
        // For testimonial videos, loop instead
        video.currentTime = 0;
        video.play();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [setHasReachedThreeMinutes, showInitialPlay, showEndState]);

  const scrollToCenter = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollTo = window.scrollY + containerRect.top - (windowHeight - containerRect.height) / 2;
      
      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const scrollToButton = () => {
    const button = document.querySelector('.cta-button');
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const startPlaying = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = 0;
    videoRef.current.muted = false;
    setIsMuted(false);
    videoRef.current.play();
    setIsPlaying(true);
    setShowInitialPlay(false);
    setIsEnded(false);
    scrollToCenter();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (showInitialPlay) {
        startPlaying();
        return;
      }
      
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        scrollToCenter();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="relative group" ref={containerRef}>
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-xl cursor-pointer"
        poster={poster}
        onClick={togglePlay}
        loop={!showEndState}
      >
        <source src={src} type="video/mp4" />
      </video>

      {showInitialPlay && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 cursor-pointer"
          onClick={startPlaying}
        >
          <div className="animate-bounce mb-4">
            <div className="w-24 h-24 rounded-full bg-[#39FF14] flex items-center justify-center hover:bg-white transition-colors group">
              <Play className="w-12 h-12 text-black ml-2" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white text-center px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm">
            Click to Play Your Video
          </p>
        </div>
      )}

      {showEndState && isEnded && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 cursor-pointer transition-opacity duration-300"
          onClick={scrollToButton}
        >
          <h3 className="text-3xl font-bold text-white mb-6">Start Making Money on Amazon</h3>
          <div className="animate-bounce">
            <ArrowDown className="w-12 h-12 text-[#39FF14]" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-1 bg-white/30 rounded-full mb-4">
          <div 
            className="h-full bg-[#39FF14] rounded-full relative transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#39FF14] rounded-full shadow-lg"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="text-white hover:text-[#39FF14] transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="text-white hover:text-[#39FF14] transition-colors"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-[#39FF14]"
              />
            </div>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="text-white hover:text-[#39FF14] transition-colors"
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};