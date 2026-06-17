import React, { useEffect, useMemo } from 'react';
import { useExitIntent } from '../context/ExitIntentContext';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { getCleanIdentity } from '../lib/urlParams';

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
  const isNextStepPage = location.pathname === '/nextstep';
  const isApplyNowPage = location.pathname === '/applynow';
  const isGetStartedPage = location.pathname === '/getstarted';

  /* Personalization name from URL params - reused by the /applynow
     variant headline. Empty when unknown; the variant falls back
     to generic copy. */
  const firstname = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const raw = (getCleanIdentity(params).firstname || '').trim();
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [location.search]);

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
  if (isBookingPage || isTrainingPage || isNextStepPage) {
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

  // /applynow exit popup - "you're so close" framing. Different
  // emotional beat from the meme/snap version on /bookacall and
  // /nextstep: the visitor is mid-application, the conversion is
  // literally minutes away, so the message reinforces proximity
  // and removes the "I'll come back later" mental escape. Forces
  // a single dominant action ("Finish My Application") + closes
  // the popup so the Typeform is right there.
  if (isApplyNowPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setShowExitPopup(false)}
        />

        <div className="relative bg-white border border-gray-200 rounded-2xl p-7 md:p-9 max-w-lg w-full shadow-[0_0_60px_rgba(249,115,22,0.25)] animate-popup">
          <button
            onClick={() => setShowExitPopup(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* Almost-there progress visual - a fake 90%-full progress
              bar that anchors the "so close" message visually. */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                Your Application
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                90% Complete
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-[90%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">
            {firstname ? <>Hold up, {firstname} - you're </> : <>Hold up - you're </>}
            <span className="text-orange-600">90 seconds away</span>.
          </h2>

          <p className="text-gray-600 text-base md:text-lg leading-snug mb-7">
            You made it further than 80% of people. Don't quit at the finish line - finish your application
            and Travis's team will personally review it within 24 hours.
          </p>

          <button
            onClick={() => setShowExitPopup(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-lg font-black tracking-tight py-4 px-6 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Finish My Application →
          </button>

          <button
            onClick={() => setShowExitPopup(false)}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            No thanks, I'll start over later
          </button>
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