import React, { useEffect } from 'react';

/* ───── shareable anchor redirects ──────────────────────────────────
   Tiny components that route short URLs like /passionproductmethod
   to the corresponding section on /trainingnew via a hash anchor.
   Uses a full window.location.href assignment so the browser loads
   /trainingnew fresh and the native scroll-to-anchor + scroll-mt-*
   classes do their thing.
──────────────────────────────────────────────────────────────────── */

function redirectTo(hash: string) {
  if (typeof window !== 'undefined') {
    window.location.replace(`/trainingnew#${hash}`);
  }
}

export function PassionProductMethodRedirect() {
  useEffect(() => redirectTo('passion-product-method'), []);
  return <FallbackLink hash="passion-product-method" label="Passion Product Method" />;
}

export function AcceleratorOverviewRedirect() {
  useEffect(() => redirectTo('accelerator-overview'), []);
  return <FallbackLink hash="accelerator-overview" label="Accelerator Program" />;
}

export function FaqRedirect() {
  useEffect(() => redirectTo('faq'), []);
  return <FallbackLink hash="faq" label="Frequently Asked Questions" />;
}

function FallbackLink({ hash, label }: { hash: string; label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
      <div>
        <p className="text-gray-600 mb-3">Redirecting to {label}…</p>
        <a
          href={`/trainingnew#${hash}`}
          className="text-orange-600 underline font-semibold"
        >
          Click here if you aren't redirected automatically
        </a>
      </div>
    </div>
  );
}
