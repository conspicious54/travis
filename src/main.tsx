import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { identifyUser } from './lib/posthog';

/* ───── Global PostHog identification from URL params ─────────────
   Runs on every page load. If the URL contains an email param
   (from Typeform, ClickFunnels, UTM passthrough, etc.), we identify
   the visitor in PostHog immediately. Also grabs first/last name
   if present. Checks multiple common param names.
──────────────────────────────────────────────────────────────────── */
try {
  const p = new URLSearchParams(window.location.search);
  const email =
    p.get('email') ||
    p.get('Email') ||
    p.get('EMAIL') ||
    p.get('contact_email') ||
    p.get('cf_email') ||
    '';

  if (email && email.includes('@')) {
    const firstName =
      p.get('firstname') ||
      p.get('first_name') ||
      p.get('firstName') ||
      p.get('name') ||
      undefined;
    const lastName =
      p.get('lastname') ||
      p.get('last_name') ||
      p.get('lastName') ||
      undefined;
    const phone =
      p.get('phone') ||
      p.get('Phone') ||
      undefined;

    identifyUser(email, {
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(phone ? { phone } : {}),
    });
  }
} catch {
  /* no-op — don't break app init if this fails */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);