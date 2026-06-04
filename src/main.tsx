import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { identifyUser } from './lib/posthog';
import { getCleanIdentity } from './lib/urlParams';

/* ───── Global PostHog identification from URL params ─────────────
   Runs on every page load. If the URL carries identity from any of
   the supported aliases (email / utm_email / contact_email / ...),
   identify the visitor in PostHog immediately. Placeholder values
   like "_____" are skipped, so a real value under any alias wins.
──────────────────────────────────────────────────────────────────── */
try {
  const id = getCleanIdentity(new URLSearchParams(window.location.search));
  if (id.email) {
    identifyUser(id.email, {
      ...(id.firstname ? { first_name: id.firstname } : {}),
      ...(id.lastname  ? { last_name:  id.lastname }  : {}),
      ...(id.phone     ? { phone:      id.phone }     : {}),
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