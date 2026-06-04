/* ───── URL param sanitization ─────────────────────────────────────
   When a Typeform / ClickFunnels / ActiveCampaign / HubSpot redirect
   has an unresolved merge tag, the upstream tool often substitutes a
   placeholder value (e.g. "_____") instead of leaving the field
   empty. If we accept those values at face value we end up:
     - identifying every such visitor as the same fictional Person
     - pre-filling HubSpot iframes with junk like email="_____"
     - storing "_____" into localStorage personalization that then
       renders on confirmation pages ("Hi _____!")
   Filter them out at intake. Use cleanParams() at the start of any
   page that reads URL params for identity / personalization.
──────────────────────────────────────────────────────────────────── */

const PLACEHOLDER_PATTERN = /^[_\-*~.\s]+$/;

const KNOWN_PLACEHOLDERS = new Set([
  'firstname', 'first_name', 'lastname', 'last_name', 'email', 'phone',
  'firstName', 'lastName', 'fname', 'lname',
  'null', 'undefined', 'none', 'unknown', 'n/a', 'na',
]);

/* Runs of placeholder characters at the START or END of a value.
   Matches things like "_____", "-----", "***", "xxxxx" - the literal
   glue left over when one slot of a concatenated merge tag template
   doesn't substitute (e.g. {{utm_firstname}}{{contact_firstname}}
   where one side is empty → "_____Team" or "Passion_____" or
   "xxxxxinfo@x.com"). Doesn't touch runs in the middle of a value,
   so emails like john_doe@example.com survive unchanged.

   Punctuation runs need only 3+ chars (less likely to appear in real
   data). Letter runs (x/X) need 5+ to avoid mangling things like
   names with double X. */
const BOUNDARY_PLACEHOLDER = /^[_\-*~.]{3,}|[_\-*~.]{3,}$|^[xX]{5,}|[xX]{5,}$/g;

/* Some Typeform / CF redirect templates use "$" as a query-param
   separator instead of "&", which turns ?email=foo&location=USA into
   ?email=foo$location=USA - meaning the email PARAM swallows every
   following key=value pair as part of its value. Detect a "$word="
   tail and chop it off. Safe against real values containing "$"
   amounts ("Cost is $100") because those aren't followed by "word=". */
const MALFORMED_QUERY_TAIL = /\$[A-Za-z_][A-Za-z0-9_]*=.*$/;

/** Strips placeholder runs glued to the start or end of a value AND
    chops any "$word=value..." tail that's a sign of a broken URL. */
export function stripBoundaryPlaceholders(value: string): string {
  return value
    .replace(MALFORMED_QUERY_TAIL, '')
    .replace(BOUNDARY_PLACEHOLDER, '')
    .trim();
}

/* A genuinely valid email: no whitespace, no $, single @, has a TLD.
   Used to gate identifyUser - rejects garbage like
   info@passionproduct.com$location=USA that survives boundary
   stripping in some malformed-URL edge cases. */
const STRICT_EMAIL_RE = /^[^\s@$,;<>"'(){}[\]]+@[^\s@$,;<>"'(){}[\]]+\.[^\s@$,;<>"'(){}[\]]+$/;

/** Rewrites window.location to strip "_____" glue from every URL
    param, then uses history.replaceState so the browser's URL bar
    actually shows the clean values. Critical for third-party widgets
    (HubSpot meetings embed, etc.) that pre-fill from the parent
    page's URL rather than from the iframe's data-src. Called once at
    app boot in main.tsx; running it again is a safe no-op when
    everything is already clean. */
export function sanitizeWindowUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    const cleaned = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      const stripped = stripBoundaryPlaceholders(value);
      if (stripped !== value) changed = true;
      if (stripped) cleaned.set(key, stripped);
    }
    if (changed) {
      const newSearch = cleaned.toString();
      const newUrl = url.pathname + (newSearch ? '?' + newSearch : '') + url.hash;
      window.history.replaceState({}, '', newUrl);
    }
    return changed;
  } catch {
    return false;
  }
}

/** Returns true if the value looks like an unsubstituted merge-tag
    fallback (e.g. "_____", "{{firstname}}", "%EMAIL%", "null"). */
export function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return true;
  if (PLACEHOLDER_PATTERN.test(v)) return true;
  if (KNOWN_PLACEHOLDERS.has(v.toLowerCase())) return true;
  if (/^\{\{.+\}\}$/.test(v)) return true; // Liquid / Handlebars
  if (/^\[.+\]$/.test(v)) return true;     // Mailchimp Classic [FNAME]
  if (/^%[A-Z_]+%$/.test(v)) return true;  // ActiveCampaign %FIRSTNAME%
  if (/^\*\|.+\|\*$/.test(v)) return true; // Mailchimp *|EMAIL|*
  return false;
}

/** Returns true if the value is a real-looking email address. Strips
    boundary placeholders + malformed query-tail first so
    "_____info@x.com" → "info@x.com" and
    "xxxxxinfo@x.com$location=USA" → "info@x.com" both validate.
    Uses a strict regex that rejects whitespace, $, commas, etc. in
    either the local or domain part - garbage that survives boundary
    stripping won't sneak through. */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = stripBoundaryPlaceholders(value);
  if (v.length < 5) return false;
  if (!STRICT_EMAIL_RE.test(v)) return false;
  if (isPlaceholder(v)) return false;
  return true;
}

/** Reads a URL param and returns its value, or null if the value is
    missing / blank / pure placeholder. Strips boundary placeholder
    runs glued onto a real value (e.g. "_____Team" → "Team"). Use
    this as a drop-in replacement for params.get(name). */
export function getCleanParam(
  params: URLSearchParams,
  name: string
): string | null {
  const raw = params.get(name);
  if (raw === null) return null;
  const stripped = stripBoundaryPlaceholders(raw);
  if (!stripped) return null;
  if (isPlaceholder(stripped)) return null;
  return stripped;
}

/** Same as getCleanParam but checks multiple names in order and
    returns the first valid match. Useful when an email might arrive
    as either `email` or `utm_email` (one is the upstream merge tag,
    the other is the UTM passthrough - we want whichever is real). */
export function getCleanParamAny(
  params: URLSearchParams,
  names: string[]
): string | null {
  for (const n of names) {
    const v = getCleanParam(params, n);
    if (v) return v;
  }
  return null;
}

/** Builds a new URLSearchParams containing only the named keys whose
    values pass the placeholder filter. Use this when forwarding URL
    params to a downstream destination (e.g. HubSpot iframe) so we
    don't propagate junk. */
export function cleanParamsForForward(
  params: URLSearchParams,
  names: string[]
): URLSearchParams {
  const out = new URLSearchParams();
  for (const n of names) {
    const v = getCleanParam(params, n);
    if (v) out.set(n, v);
  }
  return out;
}

/* ───── canonical identity aliases ─────────────────────────────────
   We send visitors to Typeform with the same identity in TWO param
   slots (e.g. ?email={{contact.email}}&utm_email={{utm.email}}) so
   either source can populate it. When Typeform redirects on, both
   slots come through - one is real, one is "_____". Code that needs
   "the email" or "the first name" should never look at one slot in
   isolation - it should use these alias lists with getCleanParamAny
   so the first valid value wins, regardless of param name.
──────────────────────────────────────────────────────────────────── */
export const IDENTITY_PARAM_NAMES = {
  email:     ['email', 'Email', 'EMAIL', 'utm_email', 'contact_email', 'cf_email'],
  firstname: ['firstname', 'first_name', 'firstName', 'utm_firstname', 'utm_first_name'],
  lastname:  ['lastname', 'last_name', 'lastName', 'utm_lastname', 'utm_last_name'],
  phone:     ['phone', 'Phone', 'utm_phone'],
} as const;

export interface CleanIdentity {
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
}

/** Returns the canonical identity values from URL params, picking
    the first valid (non-placeholder) value across every alias. */
export function getCleanIdentity(params: URLSearchParams): CleanIdentity {
  return {
    email:     getCleanParamAny(params, [...IDENTITY_PARAM_NAMES.email]),
    firstname: getCleanParamAny(params, [...IDENTITY_PARAM_NAMES.firstname]),
    lastname:  getCleanParamAny(params, [...IDENTITY_PARAM_NAMES.lastname]),
    phone:     getCleanParamAny(params, [...IDENTITY_PARAM_NAMES.phone]),
  };
}

/** Builds a URLSearchParams with the CANONICAL identity field names
    populated from any matching alias. So URL ?email=_____&utm_email=
    real@x.com produces { email: "real@x.com" } in the output - the
    HubSpot iframe pre-fill, etc. always gets the real value under
    the expected key. */
export function buildCanonicalIdentityForward(
  params: URLSearchParams
): URLSearchParams {
  const id = getCleanIdentity(params);
  const out = new URLSearchParams();
  if (id.firstname) out.set('firstname', id.firstname);
  if (id.lastname)  out.set('lastname',  id.lastname);
  if (id.phone)     out.set('phone',     id.phone);
  if (id.email)     out.set('email',     id.email);
  return out;
}
