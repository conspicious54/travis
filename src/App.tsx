import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DarkMode } from './pages/DarkMode';
import { LightMode } from './pages/LightMode';
import { BookCall } from './pages/BookCall';
import { Training } from './pages/Training';
import { Terms } from './pages/Terms';
import { OptIn } from './pages/OptIn';
import { VideoProgressProvider } from './context/VideoProgressContext';
import { EmailCaptureProvider } from './context/EmailCaptureContext';
import { ExitIntentProvider } from './context/ExitIntentContext';
import { QuestionnaireProvider } from './context/QuestionnaireContext';

function AppWrapper() {
  return (
    <EmailCaptureProvider>
      <VideoProgressProvider>
        <ExitIntentProvider>
          <QuestionnaireProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<DarkMode />} />
                <Route path="/getstarted" element={<LightMode />} />
                <Route path="/bookacall" element={<BookCall />} />
                <Route path="/training" element={<Training />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/optin" element={<OptIn />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </QuestionnaireProvider>
        </ExitIntentProvider>
      </VideoProgressProvider>
    </EmailCaptureProvider>
  );
}

export default AppWrapper;