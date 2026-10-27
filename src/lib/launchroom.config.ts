/* ───── Launch Room — config ─────────────────────────────────────
   Every tunable number for the /customlaunchroom pages lives here.
   Changing a weight, band, or base month only requires editing this
   file; nothing else should hardcode scoring or launch-date math.

   Shape:
     - CANONICAL_* enums are the slugs used throughout the system.
       Typeform-raw answers are mapped to these via canonicalize().
     - SCORE_BANDS gives point values per canonical answer per
       dimension. Max per dimension is 20.
     - LAUNCH_BASE_MONTHS gives the baseline month count by product
       clarity (Q9). An under-$1K capital answer adds 1 month.
     - START_OF_WEEK_DAY is 1 (Monday) by convention. Launch date
       anchors to the Monday of the current week, then advances by
       the computed month count.
──────────────────────────────────────────────────────────────── */

export type ProductClarity = 'validated' | 'niche' | 'no_idea' | 'unsure';
export type CapitalBand    = '10k_plus' | '5k_10k' | '1k_5k' | 'under_1k';
export type TimingBand     = 'immediately' | '1_3_months' | '3_6_months' | 'exploring';
export type KnowledgeBand  = 'over_year' | 'several_months' | 'recently' | 'never';
export type ExperienceBand = 'already_selling' | 'tried_business' | 'none';

export const SCORE_BANDS = {
  product: {
    validated: 20,
    niche:     14,
    no_idea:    8,
    unsure:     4,
  } satisfies Record<ProductClarity, number>,

  capital: {
    '10k_plus': 20,
    '5k_10k':   16,
    '1k_5k':    10,
    under_1k:    4,
  } satisfies Record<CapitalBand, number>,

  timing: {
    immediately: 20,
    '1_3_months': 15,
    '3_6_months':  8,
    exploring:     4,
  } satisfies Record<TimingBand, number>,

  knowledge: {
    over_year:       16,
    several_months:  12,
    recently:         8,
    never:            4,
  } satisfies Record<KnowledgeBand, number>,

  /** Knowledge gets +4 if the lead has tried a business before or
   *  is already selling. Caps the dimension at 20. */
  knowledgeExperienceBonus: 4,

  /** Support is flat — they don't have a team yet, which is what
   *  the strategy call fills. Intentional ceiling. */
  support: 6,
};

export const SCORE_MAX_PER_DIMENSION = 20;

/** The projected launch date on the page is a flat 4 months out
 *  for every lead, by design. The "4 to 6 months is average"
 *  variance lives in the subtext, not in the number. Keeping the
 *  per-answer map here (all 4s) so if we ever want to re-introduce
 *  variance it is a one-line change. */
export const LAUNCH_BASE_MONTHS = {
  validated: 4,
  niche:     4,
  no_idea:   4,
  unsure:    4,
} satisfies Record<ProductClarity, number>;

/** Previously added a month for sub-$1K capital. Pulled back to
 *  zero so the projected date is a flat 4 months regardless of
 *  budget. */
export const LAUNCH_UNDER_1K_PENALTY_MONTHS = 0;

/** 0 = Sunday, 1 = Monday, ... Launch date anchors to this day of
 *  the current week, then advances by (base + penalty) months. */
export const START_OF_WEEK_DAY = 1;

/** Fallback months if we don't know product clarity yet (partial
 *  responses that haven't reached Q9). Matches the flat 4-month
 *  projection used everywhere else. */
export const LAUNCH_DEFAULT_MONTHS = 4;
