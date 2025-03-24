import React from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';

interface HeadlineProps {
  theme?: 'light' | 'dark';
}

export const Headline: React.FC<HeadlineProps> = ({ theme = 'dark' }) => {
  const { showQuestionnaire } = useQuestionnaire();
  const isLight = theme === 'light';

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 text-center py-6">
      <h1 className={`text-[2rem] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] font-medium tracking-tight leading-none ${isLight ? 'text-gray-900' : 'text-white'}`}>
        {showQuestionnaire ? (
          <div className="flex items-center justify-center gap-2 font-bold">
            Fill Out The Form Below ⬇️
          </div>
        ) : (
          <>
            <div className="mb-1">Learn The Method To Make</div>
            <div className="mb-1 font-bold">$100,000 Selling On Amazon</div>
            <div className="flex items-center justify-center gap-2">
              With No Experience In 2025 ⬇️
            </div>
          </>
        )}
      </h1>
      
      {!showQuestionnaire && (
        <p className={`mt-4 text-base md:text-lg ${isLight ? 'text-gray-600' : 'text-gray-400'} max-w-2xl mx-auto`}>
          I'll Pay You $1,000 If This Doesnt Work For You...
        </p>
      )}
    </div>
  );
};