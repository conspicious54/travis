import React, { useEffect } from 'react';
import { useExitIntent } from '../context/ExitIntentContext';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

interface ExitIntentPopupProps {
  theme?: 'light' | 'dark';
}

export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ theme = 'dark' }) => {
  const { showExitPopup, setShowExitPopup, hasTriggered, setHasTriggered } = useExitIntent();
  const { showQuestionnaire } = useQuestionnaire();
  const location = useLocation();
  const isLight = theme === 'light';
  const isBookingPage = location.pathname === '/bookacall';
  const isTrainingPage = location.pathname === '/training';

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseLeave = (e: MouseEvent) => {
      if (!hasTriggered && e.clientY <= 0) {
        setShowExitPopup(true);
        setHasTriggered(true);
      }
    };

    // Wait a few seconds before enabling the exit intent detection
    timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered, setHasTriggered, setShowExitPopup]);

  if (!showExitPopup) return null;

  const handleContinue = () => {
    setShowExitPopup(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Booking page exit popup
  if (isBookingPage || isTrainingPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div 
          className={`absolute inset-0 ${
            isLight 
              ? 'bg-gray-500/30 backdrop-blur-sm' 
              : 'bg-black/60 backdrop-blur-sm'
          }`}
          onClick={() => setShowExitPopup(false)}
        ></div>
        
        <div className={`relative ${
          isLight 
            ? 'bg-white border-gray-200' 
            : 'bg-[#0A0A0A] border-[#39FF14]/20'
          } border rounded-2xl p-8 max-w-2xl w-full ${
            isLight 
              ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
              : 'shadow-[0_0_50px_rgba(57,255,20,0.15)]'
          } animate-popup`}>
          <button 
            onClick={() => setShowExitPopup(false)}
            className={`absolute top-4 right-4 ${
              isLight ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-white'
            } transition-colors`}
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <div className="mb-6">
              <img 
                src="https://media.tenor.com/NMvVsicSz_cAAAAM/onenolesfan3-snap.gif"
                alt="Snap"
                className="w-full max-w-[300px] mx-auto rounded-xl shadow-lg"
              />
            </div>
            
            <h2 className={`text-3xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-4`}>
              WOAH WOAH WOAH, Hold Up...
            </h2>
            
            <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-300'} mb-8`}>
              I can't let you leave that easy. It takes 10 seconds for my team & I to give you a personalized Amazon FBA plan on how you can make $100k/yr.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContinue}
                className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all text-lg ${
                  isLight 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-[#39FF14] text-black hover:bg-[#32D912]'
                }`}
              >
                Yes, I want a personalized Amazon FBA plan →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire exit popup
  if (showQuestionnaire) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div 
          className={`absolute inset-0 ${
            isLight 
              ? 'bg-gray-500/30 backdrop-blur-sm' 
              : 'bg-black/60 backdrop-blur-sm'
          }`}
          onClick={() => setShowExitPopup(false)}
        ></div>
        
        <div className={`relative ${
          isLight 
            ? 'bg-white border-gray-200' 
            : 'bg-[#0A0A0A] border-[#39FF14]/20'
          } border rounded-2xl p-8 max-w-2xl w-full ${
            isLight 
              ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
              : 'shadow-[0_0_50px_rgba(57,255,20,0.15)]'
          } animate-popup`}>
          <button 
            onClick={() => setShowExitPopup(false)}
            className={`absolute top-4 right-4 ${
              isLight ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-white'
            } transition-colors`}
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <div className="mb-6">
              <img 
                src="https://i.imgur.com/mUYi4Qh.png"
                alt="ATV in Greece"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            
            <h2 className={`text-3xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-4`}>
              Don't Miss This Opportunity!
            </h2>
            
            <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-300'} mb-8`}>
              I'm able to ride ATVs in Greece on a random Tuesday because I figured out how to make money on Amazon.
              <br /><br />
              I'm now showing you how to do the same in this training video. So why wouldn't you keep watching it?
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContinue}
                className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all text-lg ${
                  isLight 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-[#39FF14] text-black hover:bg-[#32D912]'
                }`}
              >
                Yes, I wanna know how to make money on Amazon →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default exit popup
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div 
        className={`absolute inset-0 ${
          isLight 
            ? 'bg-gray-500/30 backdrop-blur-sm' 
            : 'bg-black/60 backdrop-blur-sm'
        }`}
        onClick={() => setShowExitPopup(false)}
      ></div>
      
      <div className={`relative ${
        isLight 
          ? 'bg-white border-gray-200' 
          : 'bg-[#0A0A0A] border-[#39FF14]/20'
        } border rounded-2xl p-8 max-w-2xl w-full ${
          isLight 
            ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
            : 'shadow-[0_0_50px_rgba(57,255,20,0.15)]'
        } animate-popup`}>
        <button 
          onClick={() => setShowExitPopup(false)}
          className={`absolute top-4 right-4 ${
            isLight ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-white'
          } transition-colors`}
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className={`text-3xl md:text-4xl font-bold ${
            isLight ? 'text-gray-900' : 'text-white'
          } mb-4`}>
            Wait<span className="headline-symbol">!</span> Don<span className="headline-symbol">'</span>t Miss This Opportunity
          </h2>
          <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
            You<span className="headline-symbol">'</span>re about to leave without discovering how to make your first <span className={`font-semibold ${
              isLight ? 'text-blue-600' : 'text-[#39FF14]'
            }`}><span className="headline-symbol">$</span>100<span className="headline-symbol">,</span>000</span> on Amazon<span className="headline-symbol">.</span>
          </p>
        </div>

        <div className={`${
          isLight ? 'bg-gray-50' : 'bg-white/5'
        } rounded-xl p-6 mb-8`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full ${
              isLight ? 'bg-blue-500/10' : 'bg-[#39FF14]/10'
            } flex items-center justify-center flex-shrink-0`}>
              <span className={`text-2xl font-bold ${
                isLight ? 'text-blue-500' : 'text-[#39FF14]'
              }`}>1</span>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${
                isLight ? 'text-gray-900' : 'text-white'
              } mb-2`}>Watch the Full Video</h3>
              <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                Learn the exact strategies I used to build a 7-figure Amazon business<span className="headline-symbol">.</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${
              isLight ? 'bg-blue-500/10' : 'bg-[#39FF14]/10'
            } flex items-center justify-center flex-shrink-0`}>
              <span className={`text-2xl font-bold ${
                isLight ? 'text-blue-500' : 'text-[#39FF14]'
              }`}>2</span>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${
                isLight ? 'text-gray-900' : 'text-white'
              } mb-2`}>Get Your <span className="headline-symbol">$</span>1<span className="headline-symbol">,</span>000 Guarantee</h3>
              <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                If you don<span className="headline-symbol">'</span>t succeed with our program<span className="headline-symbol">,</span> we<span className="headline-symbol">'</span>ll pay you <span className="headline-symbol">$</span>1<span className="headline-symbol">,</span>000<span className="headline-symbol">.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleContinue}
            className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all text-lg ${
              isLight 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-[#39FF14] text-black hover:bg-[#32D912]'
            }`}
          >
            Continue Watching
          </button>
          <button
            onClick={() => setShowExitPopup(false)}
            className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all text-lg ${
              isLight 
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};