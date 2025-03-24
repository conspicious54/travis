import React, { createContext, useContext, useState } from 'react';

interface VideoProgressContextType {
  hasReachedThreeMinutes: boolean;
  setHasReachedThreeMinutes: (value: boolean) => void;
}

const VideoProgressContext = createContext<VideoProgressContextType | undefined>(undefined);

export const VideoProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasReachedThreeMinutes, setHasReachedThreeMinutes] = useState(false);

  return (
    <VideoProgressContext.Provider value={{ hasReachedThreeMinutes, setHasReachedThreeMinutes }}>
      {children}
    </VideoProgressContext.Provider>
  );
};

export const useVideoProgress = () => {
  const context = useContext(VideoProgressContext);
  if (context === undefined) {
    throw new Error('useVideoProgress must be used within a VideoProgressProvider');
  }
  return context;
};