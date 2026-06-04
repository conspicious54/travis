import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { identifyUser } from './lib/posthog';
import { getCleanParamAny } from './lib/urlParams';

/* ───── Global PostHog identification from URL params ─────────────
   Runs on every page load. If the URL contains an email param
   (from Typeform, ClickFunnels, UTM passthrough, etc.), we identify
   the visitor in PostHog immediately. Also grabs first/last name
   if present. Checks multiple common param names.

   getCleanParamAny skips placeholder values like "_____" or
   "{{firstname}}" so unsubstituted merge tags never reach identify.
──────────────────────────────────────────────────────────────────── */
try {
  const p = new URLSearchParams(window.location.search);
  const email = getCleanParamAny(p, ['email', 'Email', 'EMAIL', 'contact_email', 'cf_email', 'utm_email']);

  if (email) {
    const firstName = getCleanParamAny(p, ['firstname', 'first_name', 'firstName', 'name']) ?? undefined;
    const lastName = getCleanParamAny(p, ['lastname', 'last_name', 'lastName']) ?? undefined;
    const phone = getCleanParamAny(p, ['phone', 'Phone']) ?? undefined;

    identifyUser(email, {
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(phone ? { phone } : {}),
    });
  }
} catch {
  /* no-op - don't break app init if this fails */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);