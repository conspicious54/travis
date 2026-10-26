/* ───── Launch Room — content blocks ─────────────────────────────
   One block per (section, canonical answer). Each section always
   has a `qN_default` fallback used when the lead didn't answer, or
   when their answer doesn't map to a known slug.

   PLACEHOLDER COPY — Jeremy writes the real text for each key and
   drops it in. Shape stays the same.

   Each block can optionally reference a video (Wistia / mp4 URL);
   left empty for now, filled when Travis records.
──────────────────────────────────────────────────────────────── */

export interface ContentBlock {
  heading: string;
  body: string;      // may contain line breaks (\n\n for paragraphs)
  videoUrl?: string; // optional per-block Travis video
}

/** The 8 personalized sections and which Typeform question drives
 *  each. Order here is the order they render on the page. */
export const SECTIONS = [
  { id: 'q5',  label: "Why you're here" },
  { id: 'q6',  label: "Where you're starting" },
  { id: 'q8',  label: "Who's guiding you" },
  { id: 'q9',  label: 'Your product path' },
  { id: 'q13', label: 'Your funding path' },
  { id: 'q10', label: 'Your timeline' },
  { id: 'q4',  label: 'Selling from where you are' },
  { id: 'q11', label: 'How we would support you' },
] as const;

export type SectionId = typeof SECTIONS[number]['id'];

const P = (heading: string, body = 'PLACEHOLDER — Jeremy to fill.'): ContentBlock => ({ heading, body });

export const CONTENT_BLOCKS: Record<string, ContentBlock> = {
  // ─── Q5 Why you're here ─────────────────────────────────────
  q5_default: P('Why you built this'),

  // ─── Q6 Where you're starting ───────────────────────────────
  q6_already_selling: P("You're already selling — different conversation"),
  q6_tried_business:  P("You've tried a business before"),
  q6_none:            P("Starting from zero"),
  q6_default:         P('Where you are starting from'),

  // ─── Q8 Who's guiding you ───────────────────────────────────
  q8_over_year:       P("You've followed Travis for over a year"),
  q8_several_months:  P("You've been in the orbit for a few months"),
  q8_recently:        P('You found us recently'),
  q8_never:           P("You're new here"),
  q8_default:         P('How you got here'),

  // ─── Q9 Your product path ───────────────────────────────────
  q9_validated:       P('You have a validated idea'),
  q9_niche:           P('You know your niche, not your product'),
  q9_no_idea:         P("You don't have an idea yet"),
  q9_unsure:          P("You're not sure FBA is right for you"),
  q9_default:         P('Your product path'),

  // ─── Q13 Your funding path ──────────────────────────────────
  q13_10k_plus:       P("You have $10K+ to deploy"),
  q13_5k_10k:         P('You have $5K to $10K to deploy'),
  q13_1k_5k:          P('You have $1K to $5K to deploy'),
  q13_under_1k:       P('You have under $1K — different plan'),
  q13_default:        P('Your funding plan'),

  // ─── Q10 Your timeline ──────────────────────────────────────
  q10_immediately:    P("You want to launch now"),
  q10_1_3_months:     P('1 to 3 months out'),
  q10_3_6_months:     P('3 to 6 months out'),
  q10_exploring:      P("You're exploring"),
  q10_default:        P('Your timeline'),

  // ─── Q4 Selling from where you are ──────────────────────────
  q4_default:         P('Selling from where you are'),

  // ─── Q11 How we would support you ───────────────────────────
  q11_default:        P('How we would support you'),
};

export function resolveBlock(key: string): ContentBlock {
  return CONTENT_BLOCKS[key]
    ?? CONTENT_BLOCKS[key.replace(/_[^_]+$/, '_default')]
    ?? { heading: 'Section', body: 'PLACEHOLDER' };
}
