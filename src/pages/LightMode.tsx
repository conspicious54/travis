import React from 'react';
import { CustomVideoPlayer } from '../components/CustomVideoPlayer';
import { HeaderLight } from '../components/HeaderLight';
import { RatingBar } from '../components/RatingBar';
import { Headline } from '../components/Headline';
import { FeaturedLogos } from '../components/FeaturedLogos';
import { Benefits } from '../components/Benefits';
import { Testimonials } from '../components/Testimonials';
import { LearningSteps } from '../components/LearningSteps';
import { CTAButton } from '../components/CTAButton';
import { useVideoProgress } from '../context/VideoProgressContext';
import { useEmailCapture } from '../context/EmailCaptureContext';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { EmailCapturePopup } from '../components/EmailCapturePopup';
import { ExitIntentPopup } from '../components/ExitIntentPopup';
import { Questionnaire } from '../components/Questionnaire';
import { SuccessState } from '../components/SuccessState';

function MainContent() {
  const { hasReachedThreeMinutes } = useVideoProgress();
  const { isUnlocked } = useEmailCapture();
  const { showQuestionnaire, isSubmitted } = useQuestionnaire();

  if (isSubmitted) {
    return <SuccessState theme="light" />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 relative overflow-hidden transition-all duration-500 ${!isUnlocked ? 'blur-sm' : ''}`}>
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-grid-pattern-light opacity-100"></div>
      <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-gradient-radial from-blue-100/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-gradient-radial from-purple-100/30 to-transparent pointer-events-none"></div>
      
      <div className="relative">
        <HeaderLight />
        {!showQuestionnaire && <RatingBar theme="light" />}
        <Headline theme="light" />

        <div className="relative max-w-4xl mx-auto px-4 mb-4">
          {!showQuestionnaire && (
            <>
              <div className="absolute -right-2 md:-right-8 -top-4 md:-top-8 z-10 transform rotate-15 transition-transform hover:scale-105">
                <img 
                  src="https://www.threekit.com/hubfs/Inc.%205000%20Color%20Medallion%20Logo.png"
                  alt="Inc. 5000"
                  className="w-20 h-20 md:w-32 md:h-32 object-contain"
                />
              </div>
              
              <div className="rounded-2xl overflow-hidden border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <CustomVideoPlayer
                  src="https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/file-uploads-sites-117035-video-46c688e-aad-e43-afad-00c.mp4"
                  poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
                  showEndState={true}
                  theme="light"
                />
              </div>
            </>
          )}

          {showQuestionnaire && <Questionnaire theme="light" />}
        </div>

        {!showQuestionnaire && <FeaturedLogos theme="light" />}

        {!showQuestionnaire && (
          <div 
            className={`transition-all duration-1000 ${
              hasReachedThreeMinutes 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="max-w-4xl mx-auto px-4">
              <CTAButton theme="light" />
            </div>
            <Benefits theme="light" />
            <LearningSteps theme="light" />
          </div>
        )}

        {!isSubmitted && <Testimonials theme="light" />}
      </div>
    </div>
  );
}

export function LightMode() {
  const { isUnlocked } = useEmailCapture();
  const { isSubmitted } = useQuestionnaire();

  return (
    <>
      <MainContent />
      {!isUnlocked && !isSubmitted && <EmailCapturePopup theme="light" />}
      {!isSubmitted && <ExitIntentPopup theme="light" />}
    </>
  );
}