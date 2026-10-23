import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Youtube, Users, Mail, Gift, Star } from 'lucide-react';
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
// Each card gets a specific value prop — this isn't a consolation
// list, it's a toolkit the visitor can actually use today.
const RESOURCES = [
  {
    icon: Play,
    title: 'The Full Free Training',
    body: 'The exact system we walk clients through on paid calls, condensed into one on-demand video. Start here if you only pick one.',
    cta: 'Watch now',
    href: 'https://thepassionproductformula.com/',
    external: true,
    featured: true,
    badge: 'Start here',
  },
  {
    icon: Youtube,
    title: 'Travis on YouTube',
    body: 'Hundreds of free videos on product research, PPC, listings, and the actual numbers behind running an Amazon brand. New ones every week.',
    cta: 'Open the channel',
    href: 'https://www.youtube.com/@TravisMarziani',
    external: true,
  },
  {
    icon: BookOpen,
    title: 'The Passion Product Formula Book',
    body: "The playbook in print. Picking an idea, sourcing, launching, scaling. Travis's full method you can read on a flight.",
    cta: 'Grab the book',
    href: 'https://www.amazon.com/dp/B0DGLPY59X',
    external: true,
  },
  {
    icon: Users,
    title: 'The private seller community',
    body: 'Real sellers at every stage sharing what is working right now. Ask a question and someone who already solved it answers.',
    cta: 'Request access',
    href: 'https://www.facebook.com/groups/thepassionproductformula',
    external: true,
  },
  {
    icon: Mail,
    title: 'The Monday email',
    body: 'One tactic you can act on this week. Written by the team actually running the method. No reheated LinkedIn fluff.',
    cta: 'Subscribe free',
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
            <Gift className="w-3.5 h-3.5" /> You're Still Getting The Full Toolkit
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
            This specific program isn't the right fit right now. The method is.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
            We don't want you walking away empty-handed. Below is every free resource we actually point paying clients to on their first week. Everything the method is built on, nothing held back. If you work through even one of them, you'll move farther in the next thirty days than most sellers move in a quarter.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            const featured = r.featured;
            return (
              <a
                key={r.title}
                href={r.href}
                target={r.external ? '_blank' : undefined}
                rel={r.external ? 'noopener noreferrer' : undefined}
                onClick={() => trackEvent('scalers_dq_resource_clicked', { resource: r.title })}
                className={
                  'group block rounded-2xl p-5 md:p-6 shadow-sm transition hover:shadow-md ' +
                  (featured
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 hover:border-orange-400'
                    : 'bg-white border border-slate-200 hover:border-orange-300')
                }
              >
                <div className="flex items-start gap-4">
                  <div
                    className={
                      'shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl ' +
                      (featured ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600')
                    }
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-base md:text-lg font-black text-slate-900">{r.title}</h2>
                      {r.badge ? (
                        <span className="inline-flex items-center gap-1 bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <Star className="w-3 h-3" /> {r.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm md:text-base text-slate-700 leading-snug">{r.body}</p>
                    <span
                      className={
                        'mt-3 inline-flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all ' +
                        (featured ? 'text-orange-700' : 'text-orange-600')
                      }
                    >
                      {r.cta} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Reapply block */}
        <div className="mt-14 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-7 md:p-9 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Situation changes? Door's open.
          </h2>
          <p className="mt-3 text-base md:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            If something shifts (new product launched, revenue climbs, goals change) come back and reapply. We take new sellers into the program every week.
          </p>
          <Link
            to="/scalers"
            onClick={() => trackEvent('scalers_dq_reapply_clicked')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-slate-900 shadow-lg transition hover:bg-slate-100 hover:scale-[1.02]"
          >
            Reapply when you're ready <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 italic">
          Results not typical. Individual outcomes depend on effort, product, and market.
        </p>

        <LegalDisclaimer />
      </main>
    </div>
  );
}
