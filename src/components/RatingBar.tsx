import React from 'react';
import { Star } from '@phosphor-icons/react';

interface RatingBarProps {
  theme?: 'light' | 'dark';
}

export const RatingBar: React.FC<RatingBarProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className={`text-center py-4 ${
      isLight 
        ? 'bg-transparent' 
        : 'bg-gradient-to-b from-black/40 to-transparent border-y border-white/10'
    }`}>
      <div className="flex items-center justify-center gap-8">
        <div className={`flex items-center gap-4 ${isLight ? 'px-0' : 'review-card'}`}>
          <div className="relative hidden md:block">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <img 
                  key={i}
                  src={`https://i.pravatar.cc/100?img=${i}`}
                  alt={`Customer ${i}`}
                  className={`w-10 h-10 rounded-full border-2 ${
                    isLight 
                      ? 'border-blue-500/20 ring-2 ring-white shadow-lg' 
                      : 'border-[#39FF14]/20 ring-2 ring-black'
                  }`}
                />
              ))}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${
              isLight ? 'bg-blue-500' : 'bg-[#39FF14]'
            } rounded-full flex items-center justify-center ${
              isLight ? 'text-white' : 'text-black'
            } text-xs font-bold shadow-lg`}>
              +
            </div>
          </div>
          <div className="text-left">
            <div className={`text-2xl md:text-3xl font-bold ${
              isLight 
                ? 'text-gray-900' 
                : 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'
            } whitespace-nowrap`}>1,000+</div>
            <div className={`${
              isLight ? 'text-blue-600' : 'text-[#39FF14]'
            } text-sm md:text-base font-medium tracking-wide whitespace-nowrap`}>
              Satisfied Customers
            </div>
          </div>
        </div>
        
        <div className={`h-16 w-px ${
          isLight 
            ? 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200' 
            : 'bg-gradient-to-b from-white/5 via-white/20 to-white/5'
        }`}></div>
        
        <div className={`flex items-center gap-4 ${isLight ? 'px-0' : 'review-card'}`}>
          <div className={`text-2xl md:text-4xl font-bold ${
            isLight 
              ? 'text-gray-900' 
              : 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'
          }`}>4.9</div>
          <div className="flex flex-col items-start gap-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  size={16}
                  weight="fill"
                  className={`md:w-6 md:h-6 ${
                    isLight 
                      ? 'text-blue-500 drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]' 
                      : 'text-[#39FF14] drop-shadow-[0_0_3px_rgba(57,255,20,0.5)]'
                  }`}
                />
              ))}
            </div>
            <div className={`${
              isLight ? 'text-blue-600' : 'text-[#39FF14]'
            } text-sm md:text-base font-medium tracking-wide whitespace-nowrap`}>
              Global Rating
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};