/* ───── Lead magnets table ────────────────────────────────────────
   Reusable resources that campaign variants can promise on the
   /newform lead page. Each variant references one of these by id.

   Adding a lead magnet:
     1. Pick a stable id (kebab-case, no spaces).
     2. Add a row below with `name` + `delivery_reference` + `active`.
     3. Reference it from campaign rows via `lead_magnet_id`.

   `delivery_reference` is whatever your email/Zapier automation needs
   to fulfill the resource — a file URL, a Zapier tag, a product SKU,
   etc. This module just stores the reference; the downstream
   automation (Zapier → email sequence) is responsible for actual
   delivery based on the value it receives.

   SAMPLE ROWS below are marked as such — replace them with real
   resources when copy + delivery are ready.
──────────────────────────────────────────────────────────────────── */

export interface LeadMagnet {
  /** Stable identifier referenced by campaign rows. */
  id: string;
  /** Internal / analytics name — visitors don't see this. */
  name: string;
  /** Zapier tag, file URL, or automation identifier used for fulfillment.
      Passed through with the form submission so downstream automation
      knows which resource was promised. */
  delivery_reference: string;
  /** Whether the resource is currently available. Inactive magnets
      never resolve — variants referencing them will render as if no
      magnet was matched. */
  active: boolean;
}

export const LEAD_MAGNETS: readonly LeadMagnet[] = [
  // ─── SAMPLE ROWS — replace with real resources ─────────────────
  {
    id: 'sample-product-research-checklist',
    name: '[SAMPLE] Product Research Checklist',
    delivery_reference: 'zapier_tag:pr-checklist-v1',
    active: true,
  },
  {
    id: 'sample-ai-prompts-pack',
    name: '[SAMPLE] AI Prompts for Product Research',
    delivery_reference: 'zapier_tag:ai-prompts-v1',
    active: true,
  },
  {
    id: 'sample-profitability-calculator',
    name: '[SAMPLE] Amazon Profitability Calculator',
    delivery_reference: 'zapier_tag:profit-calc-v1',
    active: true,
  },
  {
    id: 'sample-strategy-call',
    name: '[SAMPLE] Free Strategy Call (VSL/sales)',
    delivery_reference: 'strategy_call_flow',
    active: true,
  },
];

/** Look up a lead magnet by id. Returns null if missing or inactive. */
export function findLeadMagnet(id: string | null | undefined): LeadMagnet | null {
  if (!id) return null;
  const magnet = LEAD_MAGNETS.find((m) => m.id === id);
  return magnet && magnet.active ? magnet : null;
}
