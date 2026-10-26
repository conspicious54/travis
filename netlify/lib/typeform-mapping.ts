import type { LaunchRoomAnswers, LaunchRoomContact } from '../../src/lib/launchroom';

/* ───── Typeform → Launch Room mapping ──────────────────────────
   Translates Typeform's native webhook payload into our canonical
   LaunchRoomAnswers + LaunchRoomContact shape.

   PLACEHOLDER MAPPINGS: Connor finalises the Typeform refs and
   option labels, then fills in the two maps below. Everything
   else works off these constants — no code change needed when
   Typeform's structure changes.

   Set the Typeform field REF for each question so this mapping
   stays stable across Typeform's internal id churn. In Typeform's
   logic editor every field has a Ref (hamburger menu → Logic →
   Ref). Use the slugs below.
──────────────────────────────────────────────────────────────── */

/** Typeform field `ref` for each Launch Room input. Change the
 *  right-hand strings in Typeform's Logic/Ref panel; keys stay
 *  the same so the rest of the code doesn't move. */
export const FIELD_REFS = {
  // Contact
  firstName: 'first_name',
  lastName:  'last_name',
  email:     'email',
  phone:     'phone',

  // Scoring + content answers (q-numbers match the brief)
  q4:  'q4_country',        // where you're selling from
  q5:  'q5_why',            // why you're here
  q6:  'q6_starting',       // where you're starting (none / tried biz / already selling)
  q7:  'q7_timeline_note',  // free-text timeline detail
  q8:  'q8_knowledge',      // how long following Travis
  q9:  'q9_product',        // product clarity
  q10: 'q10_timing',        // when you want to launch
  q11: 'q11_support',       // support preference
  q13: 'q13_capital',       // capital band
} as const;

/** Choice label (or option id) → our canonical answer slug.
 *  Typeform's `choice.label` is what the lead sees; `choice.ref`
 *  is the stable id. We try both so the mapping survives label
 *  edits. Fill in the real labels once the form is live. */
export const CHOICE_MAP: Record<string, Record<string, string>> = {
  q6: {
    'already_selling':   'already_selling',
    "I'm already selling on Amazon": 'already_selling',
    'tried_business':    'tried_business',
    "I've tried a business before": 'tried_business',
    'none':              'none',
    "I'm starting from zero": 'none',
  },
  q8: {
    'over_year':        'over_year',
    'Over a year':      'over_year',
    'several_months':   'several_months',
    'A few months':     'several_months',
    'recently':         'recently',
    'Found you recently': 'recently',
    'never':            'never',
    "I'm new here":     'never',
  },
  q9: {
    'validated':        'validated',
    'I have a validated product idea': 'validated',
    'niche':            'niche',
    'I know my niche':  'niche',
    'no_idea':          'no_idea',
    "I don't have an idea yet": 'no_idea',
    'unsure':           'unsure',
    "I'm not sure FBA is right for me": 'unsure',
  },
  q10: {
    'immediately':      'immediately',
    'Immediately':      'immediately',
    '1_3_months':       '1_3_months',
    '1-3 months':       '1_3_months',
    '3_6_months':       '3_6_months',
    '3-6 months':       '3_6_months',
    'exploring':        'exploring',
    "Just exploring":   'exploring',
  },
  q13: {
    '10k_plus':         '10k_plus',
    '$10,000+':         '10k_plus',
    '5k_10k':           '5k_10k',
    '$5,000 - $10,000': '5k_10k',
    '1k_5k':            '1k_5k',
    '$1,000 - $5,000':  '1k_5k',
    'under_1k':         'under_1k',
    'Under $1,000':     'under_1k',
  },
};

/** Shape of a single Typeform `answers[]` entry we care about. */
interface TypeformAnswer {
  field?: { ref?: string; id?: string; type?: string };
  type?: string;
  text?: string;
  email?: string;
  phone_number?: string;
  choice?: { label?: string; ref?: string };
  choices?: { labels?: string[]; refs?: string[] };
}

interface TypeformResponse {
  token?: string;
  event_type?: string;
  form_response?: {
    token?: string;
    submitted_at?: string;
    hidden?: Record<string, string | undefined>;
    answers?: TypeformAnswer[];
  };
}

/** Normalise Typeform's webhook payload into our canonical shape.
 *  Returns null if the payload doesn't contain a response_id we
 *  can key off. */
export function mapTypeformPayload(payload: TypeformResponse): {
  responseId: string;
  contact: LaunchRoomContact;
  answers: LaunchRoomAnswers;
} | null {
  const fr = payload.form_response;
  if (!fr) return null;
  const responseId = fr.token || payload.token;
  if (!responseId) return null;

  const byRef: Record<string, TypeformAnswer> = {};
  for (const a of fr.answers ?? []) {
    const ref = a.field?.ref;
    if (!ref) continue;
    byRef[ref] = a;
  }

  const value = (ref: string): string | undefined => {
    const a = byRef[ref];
    if (!a) return undefined;
    // text-y fields
    if (typeof a.text === 'string' && a.text.length) return a.text;
    if (typeof a.email === 'string' && a.email.length) return a.email;
    if (typeof a.phone_number === 'string' && a.phone_number.length) return a.phone_number;
    // choices — prefer stable `ref`, fall back to visible label
    if (a.choice) return a.choice.ref || a.choice.label || undefined;
    if (a.choices) return (a.choices.refs?.[0]) || (a.choices.labels?.[0]) || undefined;
    return undefined;
  };

  const canonicalize = (ref: string, raw: string | undefined): string | undefined => {
    if (!raw) return undefined;
    const map = CHOICE_MAP[ref];
    if (!map) return raw; // free-text / unmapped — pass through
    return map[raw] ?? raw;
  };

  const firstName = value(FIELD_REFS.firstName);
  const lastName  = value(FIELD_REFS.lastName);
  const nameJoined = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;

  const contact: LaunchRoomContact = {
    firstName,
    name: nameJoined,
    email: value(FIELD_REFS.email),
    phone: value(FIELD_REFS.phone),
  };

  const answers: LaunchRoomAnswers = {
    q4:  value(FIELD_REFS.q4),
    q5:  value(FIELD_REFS.q5),
    q6:  canonicalize('q6',  value(FIELD_REFS.q6))  as LaunchRoomAnswers['q6'],
    q7:  value(FIELD_REFS.q7),
    q8:  canonicalize('q8',  value(FIELD_REFS.q8))  as LaunchRoomAnswers['q8'],
    q9:  canonicalize('q9',  value(FIELD_REFS.q9))  as LaunchRoomAnswers['q9'],
    q10: canonicalize('q10', value(FIELD_REFS.q10)) as LaunchRoomAnswers['q10'],
    q11: value(FIELD_REFS.q11),
    q13: canonicalize('q13', value(FIELD_REFS.q13)) as LaunchRoomAnswers['q13'],
  };

  return { responseId, contact, answers };
}

/** Is this payload a partial (lead-abandoned-midway) event?
 *  Typeform uses event_type values 'form_response' (complete) and
 *  'form_response_partial' (partial) when partial submissions are
 *  enabled. */
export function isPartialEvent(payload: TypeformResponse): boolean {
  return payload.event_type === 'form_response_partial';
}
