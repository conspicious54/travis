import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Youtube, Users, Mail } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /scalers/dq — resources page for DQ'd Scalers leads ─────────
   Shown to anyone the Scalers track filters out (country, no live
   Amazon product, score, etc.) EXCEPT the wholesale / retail
   arbitrage / online arbitrage case, which has its own repositioning
   page at /scalers/arbitrage.

   The job of this page is to leave the visitor with real resources
   they can act on today instead of a dead end. Every link below is a
   PLACEHOLDER — swap the URLs for the real Travis / Passion Product
   resources once we have the final list.
──────────────────────────────────────────────────────────────────── */

const LOGO_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/Passion%20Product%20Formula%20-%20ICON.png';

// SCALERS DQ PLACEHOLDER: swap any href with the real destination.
// Keep the shape; it drives the card grid below.
const RESOURCES = [
  {
    icon: Play,
    title: 'Free Amazon Training',
    body: 'Watch the full training that explains the Passion Product method from scratch.',
    cta: 'Watch the training',
    href: 'https://thepassionproductformula.com/',
    external: true,
  },
  {
    icon: Youtube,
    title: 'Travis on YouTube',
    body: 'New videos every week on product research, listings, PPC, and the business behind Amazon.',
    cta: 'Open the channel',
    href: 'https://www.youtube.com/@TravisMarziani',
    external: true,
  },
  {
    icon: BookOpen,
    title: 'The Passion Product Formula Book',
    body: 'The playbook, start to finish. Covers idea picking, sourcing, launching, and scaling.',
    cta: 'Grab the book',
    href: 'https://www.amazon.com/dp/B0DGLPY59X',
    external: true,
  },
  {
    icon: Users,
    title: 'Join the free community',
    body: 'Thousands of sellers at every stage, trading what is actually working on Amazon right now.',
    cta: 'Join the community',
    href: 'https://www.facebook.com/groups/thepassionproductformula',
    external: true,
  },
  {
    icon: Mail,
    title: 'Weekly email with the latest moves',
    body: 'A short Monday email with one tactic you can try this week. No fluff.',
    cta: 'Subscribe',
    href: 'https://thepassionproductformula.com/',
    external: true,
  },
];

export function ScalersDq() {
  useEffect(() => {
    document.title = 'Thanks For Applying';
    trackEvent('scalers_dq_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-center">
          <img src={LOGO_URL} alt="Passion Product" className="h-9 w-auto" loading="eager" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-10 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-5">
            Thanks For Applying
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
            Right now this specific program isn't the best fit, but we have plenty of ways to help you keep moving.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Below are the free resources we point people to most. Any of them will give you something to act on today.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            return (
              <a
                key={r.title}
                href={r.href}
                target={r.external ? '_blank' : undefined}
                rel={r.external ? 'noopener noreferrer' : undefined}
                onClick={() => trackEvent('scalers_dq_resource_clicked', { resource: r.title })}
                className="group block rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900">{r.title}</h2>
                    <p className="mt-1 text-sm text-slate-600 leading-snug">{r.body}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 group-hover:gap-1.5 transition-all">
                      {r.cta} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Changed your situation?</h2>
          <p className="mt-2 text-sm text-slate-600">
            If something about your business or goals shifts, come back and reapply. We're adding sellers to the program every week.
          </p>
          <Link
            to="/scalers"
            onClick={() => trackEvent('scalers_dq_reapply_clicked')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Reapply <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <LegalDisclaimer />
      </main>
    </div>
  );
}
