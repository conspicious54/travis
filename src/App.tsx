import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DarkMode } from './pages/DarkMode';
import { LightMode } from './pages/LightMode';
import { HomeRedirect } from './pages/HomeRedirect';
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
import { NewForm } from './pages/NewForm';
import { MoveForward } from './pages/MoveForward';
import { NextStep } from './pages/NextStep';
import { ApplyNow } from './pages/ApplyNow';
import { WebinarBook } from './pages/WebinarBook';
import { WebinarBookCall } from './pages/WebinarBookCall';
import { RealCost } from './pages/RealCost';
import { Method } from './pages/Method';
import { Questions } from './pages/Questions';
import { Terms } from './pages/Terms';
import { OptIn } from './pages/OptIn';
import { FreeCourse } from './pages/FreeCourse';
import { AJ } from './pages/AJ';
import { Darryl } from './pages/Darryl';
import { ProductResearchBonus } from './pages/ProductResearchBonus';
import { ProductScorecard } from './pages/ProductScorecard';
import { ProductEstimator } from './pages/ProductEstimator';
import { Migration } from './pages/Migration';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { LiveTraining } from './pages/LiveTraining';
import {
  PassionProductMethodRedirect,
  AcceleratorOverviewRedirect,
  FaqRedirect,
} from './pages/AnchorRedirect';
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
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/old-home" element={<DarkMode />} />
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
                <Route path="/newform" element={<NewForm />} />
                <Route path="/moveforward" element={<MoveForward />} />
                <Route path="/nextstep" element={<NextStep />} />
                <Route path="/applynow" element={<ApplyNow />} />
                <Route path="/webinar/book" element={<WebinarBook />} />
                <Route path="/webinar/bookacall" element={<WebinarBookCall />} />
                <Route path="/realcost" element={<RealCost />} />
                <Route path="/method" element={<Method />} />
                <Route path="/questions" element={<Questions />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/optin" element={<OptIn />} />
                <Route path="/freecourse" element={<FreeCourse />} />
                <Route path="/aj" element={<AJ />} />
                <Route path="/darryl" element={<Darryl />} />
                <Route path="/productresearchbonus" element={<ProductResearchBonus />} />
                <Route path="/productscorecard" element={<ProductScorecard />} />
                <Route path="/productestimator" element={<ProductEstimator />} />
                <Route path="/migration" element={<Migration />} />
                <Route path="/termsofservice" element={<TermsOfService />} />
                <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                <Route path="/live-training" element={<LiveTraining />} />
                <Route path="/passionproductmethod" element={<PassionProductMethodRedirect />} />
                <Route path="/acceleratoroverview" element={<AcceleratorOverviewRedirect />} />
                <Route path="/faq" element={<FaqRedirect />} />
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