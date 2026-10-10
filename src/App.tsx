import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { NewForm } from './pages/NewForm';
import { VideoProgressProvider } from './context/VideoProgressContext';
import { EmailCaptureProvider } from './context/EmailCaptureContext';
import { ExitIntentProvider } from './context/ExitIntentContext';
import { QuestionnaireProvider } from './context/QuestionnaireContext';

/* NewForm is the homepage ("/") so it stays eagerly imported — every
   other route is lazy-loaded. First visit downloads only the chunk
   needed to render NewForm; the rest fetch on navigation. The named
   -> default wrapper is needed because every page uses named exports
   (export function Foo) and React.lazy expects a default export. */
const lz = <T,>(f: () => Promise<{ [k: string]: T }>, name: string) =>
  lazy(() => f().then((m) => ({ default: m[name] as React.ComponentType })));

const DarkMode               = lz(() => import('./pages/DarkMode'),               'DarkMode');
const LightMode              = lz(() => import('./pages/LightMode'),              'LightMode');
const BookCall               = lz(() => import('./pages/BookCall'),               'BookCall');
const DmBookCall             = lz(() => import('./pages/DmBookCall'),             'DmBookCall');
const Training               = lz(() => import('./pages/Training'),               'Training');
const TrainingNew            = lz(() => import('./pages/TrainingNew'),            'TrainingNew');
const TrainingNewSetter      = lz(() => import('./pages/TrainingNewSetter'),      'TrainingNewSetter');
const TrainingNewCloser      = lz(() => import('./pages/TrainingNewCloser'),      'TrainingNewCloser');
const Walmart                = lz(() => import('./pages/Walmart'),                'Walmart');
const Refund                 = lz(() => import('./pages/Refund'),                 'Refund');
const Live                   = lz(() => import('./pages/Live'),                   'Live');
const VA                     = lz(() => import('./pages/VA'),                     'VA');
const PPC                    = lz(() => import('./pages/PPC'),                    'PPC');
const RouterPage             = lz(() => import('./pages/Router'),                 'Router');
const Book                   = lz(() => import('./pages/Book'),                   'Book');
const DmBook                 = lz(() => import('./pages/DmBook'),                 'DmBook');
const MoveForward            = lz(() => import('./pages/MoveForward'),            'MoveForward');
const NextStep               = lz(() => import('./pages/NextStep'),               'NextStep');
const ApplyNow               = lz(() => import('./pages/ApplyNow'),               'ApplyNow');
const DmApplyNow             = lz(() => import('./pages/DmApplyNow'),             'DmApplyNow');
const WebinarBook            = lz(() => import('./pages/WebinarBook'),            'WebinarBook');
const WebinarBookCall        = lz(() => import('./pages/WebinarBookCall'),        'WebinarBookCall');
const RealCost               = lz(() => import('./pages/RealCost'),               'RealCost');
const Method                 = lz(() => import('./pages/Method'),                 'Method');
const Questions              = lz(() => import('./pages/Questions'),              'Questions');
const Terms                  = lz(() => import('./pages/Terms'),                  'Terms');
const OptIn                  = lz(() => import('./pages/OptIn'),                  'OptIn');
const FreeCourse             = lz(() => import('./pages/FreeCourse'),             'FreeCourse');
const FastTrack              = lz(() => import('./pages/FastTrack'),              'FastTrack');
const AJ                     = lz(() => import('./pages/AJ'),                     'AJ');
const Darryl                 = lz(() => import('./pages/Darryl'),                 'Darryl');
const ProductResearchBonus   = lz(() => import('./pages/ProductResearchBonus'),   'ProductResearchBonus');
const ProductScorecard       = lz(() => import('./pages/ProductScorecard'),       'ProductScorecard');
const ProductEstimator       = lz(() => import('./pages/ProductEstimator'),       'ProductEstimator');
const Migration              = lz(() => import('./pages/Migration'),              'Migration');
const TermsOfService         = lz(() => import('./pages/TermsOfService'),         'TermsOfService');
const RefundPolicy           = lz(() => import('./pages/RefundPolicy'),           'RefundPolicy');
const PrivacyPolicy          = lz(() => import('./pages/PrivacyPolicy'),          'PrivacyPolicy');
const LiveTraining           = lz(() => import('./pages/LiveTraining'),           'LiveTraining');
const PassionProductMethodRedirect = lz(() => import('./pages/AnchorRedirect'),   'PassionProductMethodRedirect');
const AcceleratorOverviewRedirect  = lz(() => import('./pages/AnchorRedirect'),   'AcceleratorOverviewRedirect');
const FaqRedirect                  = lz(() => import('./pages/AnchorRedirect'),   'FaqRedirect');

/* SPA route tracker.
   Both Whop and HubSpot have their snippet in index.html which
   fires an initial pageview on first page load. In an SPA, React
   Router navigates between routes without a full page reload, so
   those initial calls don't re-fire for /newform -> /router ->
   /nextstep -> /applynow etc. This component listens to React
   Router location changes and pushes a pageview to each tracker
   so every funnel step counts.

   Sits inside <BrowserRouter> below so useLocation() works.
   Skips the FIRST mount because the inline pixels already fired
   for the initial location, avoiding a double-count. */
declare global {
  interface Window {
    whop?: {
      track: (event: string, ...args: unknown[]) => void;
      setScope: (...scopes: string[]) => void;
    };
    _hsq?: Array<[string, ...unknown[]]>;
  }
}
function RouteTracker() {
  const location = useLocation();
  const initialRef = React.useRef(true);
  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    try {
      window.whop?.track('page');
    } catch { /* no-op */ }
    try {
      window._hsq = window._hsq || [];
      window._hsq.push(['setPath', location.pathname + location.search]);
      window._hsq.push(['trackPageView']);
    } catch { /* no-op */ }
  }, [location.pathname, location.search]);
  return null;
}

function AppWrapper() {
  return (
    <EmailCaptureProvider>
      <VideoProgressProvider>
        <ExitIntentProvider>
          <QuestionnaireProvider>
            <BrowserRouter>
              <RouteTracker />
              <Suspense fallback={<div className="min-h-screen bg-white" />}>
                <Routes>
                  <Route path="/" element={<NewForm />} />
                  <Route path="/old-home" element={<DarkMode />} />
                  <Route path="/getstarted" element={<LightMode />} />
                  <Route path="/bookacall" element={<BookCall />} />
                  <Route path="/dmbookacall" element={<DmBookCall />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/trainingnew" element={<TrainingNew />} />
                  <Route path="/trainingnew/setter" element={<TrainingNewSetter />} />
                  <Route path="/trainingnew/closer" element={<TrainingNewCloser />} />
                  <Route path="/walmart" element={<Walmart />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/live" element={<Live />} />
                  <Route path="/va" element={<VA />} />
                  <Route path="/ppc" element={<PPC />} />
                  <Route path="/router" element={<RouterPage />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/dmbook" element={<DmBook />} />
                  <Route path="/newform" element={<NewForm />} />
                  <Route path="/moveforward" element={<MoveForward />} />
                  <Route path="/nextstep" element={<NextStep />} />
                  <Route path="/fasttrack" element={<FastTrack />} />
                  <Route path="/applynow" element={<ApplyNow />} />
                  <Route path="/dmapplynow" element={<DmApplyNow />} />
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
                  <Route path="/refundpolicy" element={<RefundPolicy />} />
                  <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                  <Route path="/live-training" element={<LiveTraining />} />
                  <Route path="/passionproductmethod" element={<PassionProductMethodRedirect />} />
                  <Route path="/acceleratoroverview" element={<AcceleratorOverviewRedirect />} />
                  <Route path="/faq" element={<FaqRedirect />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </QuestionnaireProvider>
        </ExitIntentProvider>
      </VideoProgressProvider>
    </EmailCaptureProvider>
  );
}

export default AppWrapper;
