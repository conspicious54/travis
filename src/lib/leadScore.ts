/* ───── Typeform lead-score capture + forward ─────────────────────
   The /applynow Typeform calculates a score (0–18) based on how the
   visitor answered the qualification questions. Typeform forwards
   that score to the next page as a URL param when the "Redirect to
   URL" template includes it (e.g. &leadscore={{var:score}}).

   Our earlier CDBC analysis showed a real cliff at score 13 — 13+
   scorers close at 2x+ the rate of 6–12 scorers. Capturing the score
   on the booking page lets us:
     - Tag the PostHog Person so cohort analysis stays with the lead
     - Attach lead_score to every booking event so dashboards can
       filter the booking funnel by score segment
     - Forward it to the confirmation page so coach routing /
       messaging can tier up for high-score leads later

   Accepted URL param names (first match wins):
     leadscore, lead_score, score, typeform_score
   Values are parsed as integers; negative scores (Typeform's "no
   answer" quirk) are kept as-is since the dashboards do interpret
   them, but non-numeric values are rejected to keep the Person
   property clean.
──────────────────────────────────────────────────────────────────── */

const ACCEPTED_KEYS = ['leadscore', 'lead_score', 'score', 'typeform_score'] as const;

/** Read the lead score from the current URL. Returns the numeric
 *  value as a string (so the exact Typeform value is preserved for
 *  downstream URL forwarding) and the parsed integer. Returns null
 *  for both when no param is present or the value doesn't parse. */
export function readLeadScoreFromUrl(): { raw: string | null; score: number | null } {
  if (typeof window === 'undefined') return { raw: null, score: null };
  const params = new URLSearchParams(window.location.search);
  for (const key of ACCEPTED_KEYS) {
    const v = params.get(key);
    if (v == null) continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) continue;
    return { raw: trimmed, score: parsed };
  }
  return { raw: null, score: null };
}
