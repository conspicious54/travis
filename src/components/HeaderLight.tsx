import React from 'react';
import { Phone } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export const HeaderLight = () => {
  return (
    <header className="flex justify-between items-center h-16 px-8 md:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-white to-transparent">
      <a href="tel:1.800.211.823" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors group shrink-0">
        <Phone size={16} weight="bold" className="animate-pulse" />
        <span className="text-sm tracking-wider group-hover:underline italic">1.800.211.823</span>
      </a>
      <div className="h-16 flex items-center justify-center">
        <img 
          src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png" 
          alt="Passion Product" 
          className="h-14"
        />
      </div>
      <Link 
        to="/" 
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
      >
        Dark Mode
      </Link>
    </header>
  );
};