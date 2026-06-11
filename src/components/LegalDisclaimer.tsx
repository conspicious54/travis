/* ───── Universal legal/disclaimer footer block ────────────────────
   Drop <LegalDisclaimer /> at the bottom of any page. Contains the
   four-paragraph disclaimer the legal/compliance copy requires on
   every public-facing page:

   1. Not affiliated with YouTube/Google/Facebook
   2. "In the spirit of full disclosure..." optional-opportunity note
   3. Register-Now consent line
   4. IMPORTANT NOTICE earnings disclaimer

   Edit the copy in ONE place and every page updates.
─────────────────────────────────────────────────────────────────── */

export function LegalDisclaimer() {
  return (
    <section className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-3 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          This website operates independently and is not affiliated with YouTube, Google, or Facebook. We are not
          endorsed by or connected to YouTube, Google Inc., or Facebook Inc. in any capacity. FACEBOOK is a registered
          trademark of Facebook, Inc. YOUTUBE is a registered trademark of Google Inc.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          In the spirit of full disclosure, we present an optional opportunity at the conclusion for those interested
          in receiving hands-on assistance with implementing these digital advertising methods and techniques. Is
          participation mandatory? Not at all. Will you gain valuable knowledge and actionable insights regardless of
          whether you choose to work with us directly? Absolutely. Many participants will complete this workshop, apply
          the strategies independently, and achieve significant success. Others will recognize the potential and decide
          that collaborative guidance is the fastest path to their desired outcomes. The choice is entirely yours, though
          we encourage you to join the complimentary workshop, apply what you learn, and share your feedback with us!
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          By clicking Register Now, you agree to allow Passion Product and our authorized partners to reach out to you
          with relevant marketing communications. This consent is optional and not required for any purchase.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-bold">IMPORTANT NOTICE:</span> The revenue figures and outcomes referenced in this
          workshop represent our personal achievements and, in certain instances, the results obtained by current or
          former clients. Please note that these outcomes are not standard or guaranteed. We do not suggest that you
          will replicate these results (or achieve any specific outcome). Most individuals who consume educational
          webinar content see minimal to no results. These examples serve illustrative purposes only. Your success will
          differ and depends on numerous variables including your experience, dedication, and effort level. All business
          ventures involve risk and require substantial, ongoing commitment and action. If you cannot accept this reality,
          please do not register for this workshop.
        </p>
      </div>
    </section>
  );
}
