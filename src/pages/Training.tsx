import React from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { CustomVideoPlayer } from '../components/CustomVideoPlayer';
import { useEmailCapture } from '../context/EmailCaptureContext';
import { ExitIntentPopup } from '../components/ExitIntentPopup';

function TrainingHeadline() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 text-center py-12">
      <p className="text-blue-600 text-lg font-medium mb-2">Just one more step...</p>
      <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] tracking-tight leading-none text-gray-900">
        <div className="mb-1">Watch This Video</div>
        <div className="font-bold flex items-center justify-center gap-2">
          Before Your Call ⬇️
        </div>
      </h1>
    </div>
  );
}

function MainContent() {
  const { isUnlocked } = useEmailCapture();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-grid-pattern-light opacity-100"></div>
      <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-gradient-radial from-blue-100/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-gradient-radial from-purple-100/30 to-transparent pointer-events-none"></div>
      
      <div className="relative">
        <HeaderLight />
        <TrainingHeadline />

        <div className="relative max-w-4xl mx-auto px-4 mb-4">
          <div className="rounded-2xl overflow-hidden border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <CustomVideoPlayer
              src="https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/Fast%20Track%20Video%20Draft%203%20-%201.m4v"
              poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
              showEndState={true}
              theme="light"
            />
          </div>
          <div className="mt-8 text-center">
            <p className="text-xl font-semibold text-blue-600 max-w-2xl mx-auto mb-4">
              📌 Bookmark this page now so you can easily come back to it!
            </p>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              This training contains the exact blueprint that has helped thousands of students build 6-figure Amazon businesses. Watch every minute to maximize your success on our upcoming call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Training() {
  return (
    <>
      <MainContent />
      <ExitIntentPopup theme="light" />
    </>
  );
}