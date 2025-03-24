import React from 'react';

interface FeaturedLogosProps {
  theme?: 'light' | 'dark';
}

export const FeaturedLogos: React.FC<FeaturedLogosProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className="mt-8 pb-4">
      <p className={`text-center ${isLight ? 'text-blue-600' : 'text-[#9FE870]'} text-sm font-medium mb-6`}>
        AS FEATURED IN
      </p>
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 px-4 grayscale opacity-80 max-w-5xl mx-auto">
        <img 
          src="https://www.nicepng.com/png/full/13-135300_white-transparent-background-business-insider-logo-png-black.png" 
          alt="Business Insider" 
          className={`h-5 md:h-8 object-contain ${isLight ? 'invert' : ''}`}
        />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Medium_%28website%29_logo.svg/2560px-Medium_%28website%29_logo.svg.png" 
          alt="Medium" 
          className={`h-5 md:h-8 object-contain ${isLight ? 'brightness-0' : 'invert brightness-0'}`}
        />
        <img 
          src="https://www.regenerativetravel.com/wp-content/uploads/2024/11/forbes-logo.png" 
          alt="Forbes" 
          className={`h-5 md:h-8 object-contain ${isLight ? 'invert' : ''}`}
        />
        <img 
          src="https://scottmautz.com/wp-content/uploads/2018/09/entrepreneur-logo-white.png" 
          alt="Entrepreneur" 
          className={`h-8 md:h-12 object-contain ${isLight && 'brightness-0'}`}
        />
      </div>
    </div>
  );
};