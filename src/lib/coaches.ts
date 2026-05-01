/* ───── coach profiles ─────────────────────────────────────────────
   Keyed by lowercased HubSpot owner name. Matching is forgiving —
   "Matthew Kemp" will match if HubSpot returns "Matt Kemp".
──────────────────────────────────────────────────────────────────── */

export interface Coach {
  id: string;
  firstName: string;
  fullName: string;
  role: string;
  tenure: string; // e.g. "Part of the Passion Product team for 3+ years"
  photoUrl: string;
  travisIntro: string; // 1–2 sentences, as if spoken by Travis
  bio: string; // 2–3 sentences on how they help
}

export const COACHES: Record<string, Coach> = {
  'sharlee fuentes': {
    id: 'sharlee',
    firstName: 'Sharlee',
    fullName: 'Sharlee Fuentes',
    role: 'Passion Product Lead Amazon Coach',
    tenure: 'On the Passion Product team',
    photoUrl: 'https://ca.slack-edge.com/T03TC8Y0CUB-U0ANQG6P1E3-e99b626cb26d-512',
    travisIntro:
      "Sharlee is one of my sharpest in-house Amazon coaches here at Passion Product. She's been side-by-side with hundreds of our students as they built real brands, and she's the person I trust to cut through the noise and tell you what's actually worth your time.",
    bio: "As part of the Passion Product coaching team, she's walked students through every stage of our method — from picking the right product to launching on Amazon and scaling past six figures. On your call she'll look at your situation, figure out where you are, and give you the exact next steps.",
  },
  'jorge rodriguez': {
    id: 'jorge',
    firstName: 'Jorge',
    fullName: 'Jorge Rodriguez',
    role: 'Passion Product Lead Amazon Coach',
    tenure: 'On the Passion Product team',
    photoUrl: 'https://ca.slack-edge.com/T03TC8Y0CUB-U0AJF7S2RA9-9f8571abcc34-512',
    travisIntro:
      "Jorge is one of my best in-house Amazon coaches at Passion Product. He's the guy I'd want in my corner if I were starting over today — sharp, direct, and focused on getting you results.",
    bio: "He's one of the coaches we've trained directly on the Passion Product method, and he's guided hundreds of our students through finding their first product, nailing their branding, and hitting a successful launch. On your call he'll get straight to what's going to move the needle for you.",
  },
  'matthew kemp': {
    id: 'matthew',
    firstName: 'Matt',
    fullName: 'Matthew Kemp',
    role: 'Passion Product Lead Amazon Coach',
    tenure: 'On the Passion Product team',
    photoUrl: '/coaches/matt.jpg',
    travisIntro:
      "Matt is one of my top in-house Amazon coaches at Passion Product. He's the kind of coach who takes your goals seriously and keeps you accountable to actually hitting them.",
    bio: "As part of our coaching team, he's helped hundreds of our students work through the Passion Product method — from spotting a winning niche to building a brand people actually want to buy from. On your call he'll break down exactly what the path looks like for your situation.",
  },
  'jesse saunders': {
    id: 'jesse',
    firstName: 'Jesse',
    fullName: 'Jesse Saunders',
    role: 'Passion Product Lead Amazon Coach',
    tenure: 'On the Passion Product team',
    photoUrl: '',
    travisIntro:
      "Jesse is one of my best in-house Amazon coaches at Passion Product. If you want someone who's going to be real with you and help you build something that actually works long-term, he's your guy.",
    bio: "He's deep in our method and has helped hundreds of Passion Product students move from 'I want to do this' to actually having a real brand on Amazon. On your call he'll help you see the clearest path forward for where you're at.",
  },
  // Last name pending — update fullName + the lowercased map key once
  // confirmed from HubSpot (the lookup matches first name alone, so this
  // already works, but the key-by-full-name is stronger).
  'zac': {
    id: 'zac',
    firstName: 'Zac',
    fullName: 'Zac',
    role: 'Passion Product Lead Amazon Coach',
    tenure: 'On the Passion Product team',
    photoUrl: '/coaches/zac.jpg',
    travisIntro:
      "Zac is one of my newest in-house Amazon coaches at Passion Product, and he's already proving why I brought him on. Sharp, direct, and serious about helping you build something real.",
    bio: "He's been trained directly on the Passion Product method and is in the trenches with our students every week. On your call he'll get to the heart of what's actually going to move the needle for your situation.",
  },
  // Santiago is a setter — kept here so getCoachByOwnerName resolves him
  // if a HubSpot owner happens to use his name. Setter SMS confirmations
  // also reference this entry via firstName.
  'santiago': {
    id: 'santiago',
    firstName: 'Santiago',
    fullName: 'Santiago',
    role: 'Passion Product Setter',
    tenure: 'On the Passion Product team',
    photoUrl: '',
    travisIntro:
      "Santiago is on our team at Passion Product. He's the first person you'll talk to before your strategy call.",
    bio: "He'll get you set up with the right next steps and make sure you're matched with the right coach for your situation.",
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
    'https://cdn.boldjourney.com/wp-content/uploads/2023/09/c-TravisMarziani__8_1694708666679.jpg',
};
