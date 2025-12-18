import React from 'react';
import { GraduationCap, Users, UserCircle } from '@phosphor-icons/react';
import { CTAButton } from './CTAButton';

interface BenefitsProps {
  theme?: 'light' | 'dark';
}

export const Benefits: React.FC<BenefitsProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className="relative">
      <div className={`absolute inset-0 bg-gradient-to-b ${
        isLight 
          ? 'from-gray-50/40 via-transparent to-transparent' 
          : 'from-black/40 via-transparent to-transparent'
      } pointer-events-none`}></div>
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Learn Section */}
          <div className="relative">
            <div className="absolute -left-4 top-0">
              <div className={`w-2 h-2 ${isLight ? 'bg-blue-500' : 'bg-[#39FF14]'} rounded-full`}></div>
              <div className={`w-px h-full bg-gradient-to-b ${
                isLight 
                  ? 'from-blue-500 to-transparent' 
                  : 'from-[#39FF14] to-transparent'
              } absolute left-1/2 -translate-x-1/2`}></div>
            </div>
            <div className="pl-8">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap size={32} weight="bold" className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} />
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Learn Our Amazon <span className={isLight ? 'text-blue-500' : 'text-[#39FF14]'}>Strategy</span>
                </h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    World-class <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>custom built learning application</span>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Scale from <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>Zero to $10k/month</span> as fast as possible
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Master the skills you need to <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>maximise your income</span>
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Network Section */}
          <div className="relative">
            <div className="absolute -left-4 top-0">
              <div className={`w-2 h-2 ${isLight ? 'bg-blue-500' : 'bg-[#39FF14]'} rounded-full`}></div>
              <div className={`w-px h-full bg-gradient-to-b ${
                isLight 
                  ? 'from-blue-500 to-transparent' 
                  : 'from-[#39FF14] to-transparent'
              } absolute left-1/2 -translate-x-1/2`}></div>
            </div>
            <div className="pl-8">
              <div className="flex items-center gap-3 mb-4">
                <Users size={32} weight="bold" className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} />
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Join a Private <span className={isLight ? 'text-blue-500' : 'text-[#39FF14]'}>Community</span>
                </h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>Celebrate your wins</span> with people who understand
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Make <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>like-minded friends</span> on your journey
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Network with <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>113,000+ people</span>
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Access Section */}
          <div className="relative">
            <div className="absolute -left-4 top-0">
              <div className={`w-2 h-2 ${isLight ? 'bg-blue-500' : 'bg-[#39FF14]'} rounded-full`}></div>
              <div className={`w-px h-full bg-gradient-to-b ${
                isLight 
                  ? 'from-blue-500 to-transparent' 
                  : 'from-[#39FF14] to-transparent'
              } absolute left-1/2 -translate-x-1/2`}></div>
            </div>
            <div className="pl-8">
              <div className="flex items-center gap-3 mb-4">
                <UserCircle size={32} weight="bold" className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} />
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  1 on 1 with <span className={isLight ? 'text-blue-500' : 'text-[#39FF14]'}>7 Figure Sellers</span>
                </h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Mentors are <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>hyper-successful</span> experts in their field
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    Get <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>mentored every step</span> of your journey
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className={isLight ? 'text-blue-500 mt-1' : 'text-[#39FF14] mt-1'}>✓</span>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-300'}>
                    <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>1-on-1 advice</span> from industry experts
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <CTAButton className="mt-16" theme={theme} />
      </div>
    </div>
  );
};