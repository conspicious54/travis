import React from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';

interface CTAButtonProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const CTAButton: React.FC<CTAButtonProps> = ({ className = '', theme = 'dark' }) => {
  const { setShowQuestionnaire } = useQuestionnaire();
  const isLight = theme === 'light';

  const handleClick = () => {
    setShowQuestionnaire(true);
    // Scroll to top with smooth animation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`text-center mt-4 ${className}`}>
      <button 
        onClick={handleClick}
        className={`cta-button w-full max-w-4xl mx-auto py-4 px-8 rounded-lg text-2xl font-bold text-white ${
          isLight 
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-black hover:opacity-90'
        } transition-all duration-300`}
      >
        Start Making Money on Amazon
      </button>
      <div className={`flex items-center justify-center mt-4 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
        <div className="student-avatars">
          {[1, 2, 3, 4].map((i) => (
            <img 
              key={i}
              src={`https://i.pravatar.cc/100?img=${i}`}
              alt={`Student ${i}`}
              className={`w-6 h-6 border-2 ${isLight ? 'border-white' : 'border-[#0A0A0A]'}`}
            />
          ))}
        </div>
        <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>4,300+</span>
        <span className="ml-2">like-minded students</span>
      </div>
    </div>
  );
};