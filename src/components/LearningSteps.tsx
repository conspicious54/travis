import React from 'react';
import { Laptop, Users, Trophy, Chats, GraduationCap, UsersThree } from '@phosphor-icons/react';
import { CTAButton } from './CTAButton';

interface LearningStepsProps {
  theme?: 'light' | 'dark';
}

export const LearningSteps: React.FC<LearningStepsProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className={isLight ? 'bg-white' : 'bg-[#0A0A0A]'}>
      <div className="container mx-auto px-4 space-y-32 py-20">
        {/* Step-by-Step Learning Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative pb-8 pr-8">
            <div className={`relative rounded-2xl overflow-hidden border-2 ${
              isLight 
                ? 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                : 'border-[#39FF14]/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]'
            }`}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
                alt="Learning Platform"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            
            <div className={`absolute bottom-0 right-0 ${
              isLight 
                ? 'bg-white' 
                : 'bg-[#111111]'
            } p-4 rounded-xl border ${
              isLight 
                ? 'border-gray-200 shadow-lg' 
                : 'border-white/10 shadow-xl'
            } z-10`}>
              <div className={`text-2xl font-bold ${
                isLight ? 'text-blue-500' : 'text-[#39FF14]'
              }`}>100+</div>
              <div className={`text-sm ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}>Video Courses</div>
            </div>
          </div>

          <div>
            <h2 className={`text-4xl font-bold mb-8 ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>Step by Step Learning</h2>
            <p className={`text-xl ${
              isLight ? 'text-gray-600' : 'text-gray-300'
            } mb-8`}>
              You will get <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>access to 100+ video courses</span> and well-structured tutorials covering every aspect of <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>selling on Amazon</span>.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <GraduationCap size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Easy to follow program for Amazon success</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Step-by-step guidance to ensure you're always moving forward.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Laptop size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Find high potential products</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Learn strategies to find winning products, over and over again.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Trophy size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Hyper advanced learning application</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Access our custom-built platform designed for maximum retention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Live Sessions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className={`text-4xl font-bold mb-8 ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>Live Sessions with Seven Figure Sellers</h2>
            <p className={`text-xl ${
              isLight ? 'text-gray-600' : 'text-gray-300'
            } mb-8`}>
              Each of our <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>coaches have made over $1M USD profit</span> using the methods they teach in our trainings.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Users size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Small group mentorship</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Get weekly small group coaching calls, guiding you through each step.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Chats size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Weekly live Q&A sessions</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Get your questions answered in real-time by experts.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Trophy size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Proven success strategies</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Learn methods that have generated millions in revenue.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 pb-8 pr-8">
            <div className={`relative rounded-2xl overflow-hidden border-2 ${
              isLight 
                ? 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                : 'border-[#39FF14]/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]'
            }`}>
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
                alt="Live Sessions"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            
            <div className={`absolute bottom-0 right-0 ${
              isLight 
                ? 'bg-white' 
                : 'bg-[#111111]'
            } p-4 rounded-xl border ${
              isLight 
                ? 'border-gray-200 shadow-lg' 
                : 'border-white/10 shadow-xl'
            } z-10`}>
              <div className={`text-2xl font-bold ${
                isLight ? 'text-blue-500' : 'text-[#39FF14]'
              }`}>24/7</div>
              <div className={`text-sm ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}>Support</div>
            </div>
          </div>
        </div>

        {/* Community Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative pb-8 pr-8">
            <div className={`relative rounded-2xl overflow-hidden border-2 ${
              isLight 
                ? 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                : 'border-[#39FF14]/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]'
            }`}>
              <img 
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"
                alt="Community"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            
            <div className={`absolute bottom-0 right-0 ${
              isLight 
                ? 'bg-white' 
                : 'bg-[#111111]'
            } p-4 rounded-xl border ${
              isLight 
                ? 'border-gray-200 shadow-lg' 
                : 'border-white/10 shadow-xl'
            } z-10`}>
              <div className={`text-2xl font-bold ${
                isLight ? 'text-blue-500' : 'text-[#39FF14]'
              }`}>113K+</div>
              <div className={`text-sm ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}>Students</div>
            </div>
          </div>

          <div>
            <h2 className={`text-4xl font-bold mb-8 ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>An Exclusive Community with 4k Likeminded Students</h2>
            <p className={`text-xl ${
              isLight ? 'text-gray-600' : 'text-gray-300'
            } mb-8`}>
              Our online community is a supportive, high-focus environment. Everyone is on the same mission: <span className={isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>acquiring an abundance of wealth</span>.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <UsersThree size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Network with 4000 people</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Connect with successful Amazon sellers on the same mission.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Users size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Make likeminded friends</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Build relationships with ambitious entrepreneurs.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${
                  isLight 
                    ? 'bg-blue-500/10' 
                    : 'bg-[#39FF14]/10'
                } flex items-center justify-center flex-shrink-0`}>
                  <Trophy size={24} className={isLight ? 'text-blue-500' : 'text-[#39FF14]'} weight="bold" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>Celebrate your wins</h3>
                  <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Share your success with people who understand ambition.</p>
                </div>
              </div>
            </div>

            <CTAButton className="mt-12" theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};