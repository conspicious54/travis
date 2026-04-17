/* ───── coach profiles ─────────────────────────────────────────────
   Keyed by lowercased HubSpot owner name. Matching is forgiving —
   "Matthew Kemp" will match if HubSpot returns "Matt Kemp".
──────────────────────────────────────────────────────────────────── */

export interface Coach {
  id: string;
  firstName: string;
  fullName: string;
  role: string;
  photoUrl: string; // populate once you have the real image URLs
  travisIntro: string; // 1–2 sentences, as if spoken by Travis
  bio: string; // 2–3 sentences, more detail on how they help
}

export const COACHES: Record<string, Coach> = {
  'sharlee fuentes': {
    id: 'sharlee',
    firstName: 'Sharlee',
    fullName: 'Sharlee Fuentes',
    role: 'Lead Amazon Coach',
    photoUrl: '', // TODO: add real photo URL
    travisIntro:
      "Sharlee is one of my sharpest Amazon coaches. She's been side-by-side with hundreds of our students as they built real brands, and she's the person I trust to cut through the noise and tell you what's actually worth your time.",
    bio: "She's walked through every stage of the Passion Product method with students — from picking the right product to launching on Amazon and scaling past six figures. On your call she'll look at your situation, figure out where you are, and give you the exact next steps.",
  },
  'jorge rodriguez': {
    id: 'jorge',
    firstName: 'Jorge',
    fullName: 'Jorge Rodriguez',
    role: 'Lead Amazon Coach',
    photoUrl: '', // TODO: add real photo URL
    travisIntro:
      "Jorge is one of my best Amazon coaches. He's the guy I'd want in my corner if I were starting over today — sharp, direct, and focused on getting you results.",
    bio: "He knows the Passion Product method inside out and has coached hundreds of students through finding their first product, nailing their branding, and hitting a successful launch. On your call he'll get straight to what's going to move the needle for you.",
  },
  'matthew kemp': {
    id: 'matthew',
    firstName: 'Matt',
    fullName: 'Matthew Kemp',
    role: 'Lead Amazon Coach',
    photoUrl: '', // TODO: add real photo URL
    travisIntro:
      "Matt is one of my top Amazon coaches. He's the kind of coach who takes your goals seriously and keeps you accountable to actually hitting them.",
    bio: "He's helped hundreds of students work through the Passion Product method — from spotting a winning niche to building a brand people actually want to buy from. On your call he'll break down exactly what the path looks like for your situation.",
  },
  'jesse saunders': {
    id: 'jesse',
    firstName: 'Jesse',
    fullName: 'Jesse Saunders',
    role: 'Lead Amazon Coach',
    photoUrl: '', // TODO: add real photo URL
    travisIntro:
      "Jesse is one of my best Amazon coaches. If you want someone who's going to be real with you and help you build something that actually works long-term, he's your guy.",
    bio: "He's deep in the Passion Product method and has helped hundreds of students move from 'I want to do this' to actually having a real brand on Amazon. On your call he'll help you see the clearest path forward for where you're at.",
  },
};

export function getCoachByOwnerName(ownerName: string | null | undefined): Coach | null {
  if (!ownerName) return null;
  const needle = ownerName.toLowerCase().trim();
  for (const [key, coach] of Object.entries(COACHES)) {
    if (needle.includes(key) || key.includes(needle)) return coach;
    // Also try matching on first name alone
    if (needle.includes(coach.firstName.toLowerCase())) return coach;
  }
  return null;
}

// Travis's intro (shown next to the coach)
export const TRAVIS = {
  firstName: 'Travis',
  fullName: 'Travis Marziani',
  role: 'Founder, Passion Product',
  photoUrl:
    'https://passionproduct.com/wp-content/uploads/2024/10/Travis-hosting-event-1.webp',
};
