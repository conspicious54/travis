import React from 'react';
import { Phone } from '@phosphor-icons/react';

export const HeaderLight = () => {
  return (
    <header className="flex justify-between items-center h-16 px-8 md:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-white to-transparent">
      <a href="tel:1.800.211.823" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors group shrink-0">
        <Phone size={16} weight="bold" className="animate-pulse" />
<<<<<<< HEAD
        <span className="text-sm tracking-wider group-hover:underline italic">+1 844-698-3321</span>
=======
        <span className="text-sm tracking-wider group-hover:underline italic">1.800.211.823</span>
>>>>>>> de124c96e04b3b44b958f56e55f27a30cb880119
      </a>
      <div className="absolute left-1/2 -translate-x-1/2">
        <img 
          src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png" 
          alt="Passion Product" 
          className="h-14"
        />
      </div>
      <div className="w-[140px]"></div>
    </header>
  );
};