import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DarkMode } from './pages/DarkMode';
import { LightMode } from './pages/LightMode';
import { BookCall } from './pages/BookCall';
import { Training } from './pages/Training';
import { TrainingNew } from './pages/TrainingNew';
import { TrainingNewSetter } from './pages/TrainingNewSetter';
import { TrainingNewCloser } from './pages/TrainingNewCloser';
import { Walmart } from './pages/Walmart';
import { Refund } from './pages/Refund';
import { Live } from './pages/Live';
import { VA } from './pages/VA';
import { PPC } from './pages/PPC';
import { Router } from './pages/Router';
import { Book } from './pages/Book';
import { RealCost } from './pages/RealCost';
import { Method } from './pages/Method';
import { Terms } from './pages/Terms';
import { OptIn } from './pages/OptIn';
import { FreeCourse } from './pages/FreeCourse';
import { AJ } from './pages/AJ';
import { Darryl } from './pages/Darryl';
import { ProductResearchBonus } from './pages/ProductResearchBonus';
import { ProductScorecard } from './pages/ProductScorecard';
import { ProductEstimator } from './pages/ProductEstimator';
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
                <Route path="/trainingnew" element={<TrainingNew />} />
                <Route path="/trainingnew/setter" element={<TrainingNewSetter />} />
                <Route path="/trainingnew/closer" element={<TrainingNewCloser />} />
                <Route path="/walmart" element={<Walmart />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/live" element={<Live />} />
                <Route path="/va" element={<VA />} />
                <Route path="/ppc" element={<PPC />} />
                <Route path="/router" element={<Router />} />
                <Route path="/book" element={<Book />} />
                <Route path="/realcost" element={<RealCost />} />
                <Route path="/method" element={<Method />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/optin" element={<OptIn />} />
                <Route path="/freecourse" element={<FreeCourse />} />
                <Route path="/aj" element={<AJ />} />
                <Route path="/darryl" element={<Darryl />} />
                <Route path="/productresearchbonus" element={<ProductResearchBonus />} />
                <Route path="/productscorecard" element={<ProductScorecard />} />
                <Route path="/productestimator" element={<ProductEstimator />} />
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