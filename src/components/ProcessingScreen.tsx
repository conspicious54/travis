import React from 'react';

interface ProcessingScreenProps {
  theme?: 'light' | 'dark';
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 ${
      isLight ? 'bg-white' : 'bg-[#0A0A0A]'
    } flex items-center justify-center`}>
      <div className="text-center">
        <div className="w-full h-1 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div className={`h-full ${
            isLight ? 'bg-blue-500' : 'bg-[#FF0000]'
          } rounded-full animate-[loading_2s_ease-in-out]`} style={{ width: '100%' }}></div>
        </div>
        <p className={`${
          isLight ? 'text-gray-600' : 'text-gray-400'
        } animate-pulse`}>Processing Your Application...</p>
      </div>
    </div>
  );
};