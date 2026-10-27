import type { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

/* ───── /.netlify/functions/launchroom-brainstorm ────────────────
   Multi-turn AI brainstormer for the ProductIdeaBlock on the
   Launch Room page. Keeps conversation state on the client
   (sent back on each turn), proxies to Anthropic server-side so
   the API key never ships to the browser.

   Body (POST, application/json):
     {
       messages: [{ role: 'user' | 'assistant', content: string }, ...],
       context?: { firstName?: string, q13?: string, q10?: string }
     }

   Response:
     200 { reply: string, handoff: boolean }
         handoff: true after enough back-and-forth that we should
         show the "here's where we'd take this from here" CTA.
     500 { error }

   If ANTHROPIC_API_KEY is not set on Netlify, returns a graceful
   fallback so the UI still works.
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20;      // hard cap on history length (user+assistant)
const HANDOFF_TURN = 6;    // after 3 user turns + 3 assistant turns, offer handoff
const MAX_OUTPUT_TOKENS = 600;

const SYSTEM_PROMPT = `You are a product-launch coach helping an Amazon FBA applicant brainstorm or sharpen a product idea. You work for Passion Product Formula, Travis Marziani's program.

Rules:
- Reply in 3 to 6 short sentences, no more. This is a chat, not an article.
- No em dashes. Ever.
- Be specific. If they give you an interest, respond with one concrete product shape and one sharp follow-up question that pushes them toward a buyer and a use case.
- Never promise income, pricing, or guaranteed success.
- If they share an idea, point out the one thing that would make it stronger. Don't dump a checklist.
- When they signal they are warm on a direction ("I like it", "yeah let's go with this", "this is a good start"), zoom out and tell them what the next 2 or 3 steps look like inside the paid program. Keep it concrete: supplier shortlist, sampling, listing build.
- Never use the words "unlock" or "exclusive". Never fake urgency.
- You are not a replacement for the strategy call. You are the warm-up.`;

interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  let payload: {
    messages?: ClientMessage[];
    context?: { firstName?: string; q13?: string; q10?: string };
  };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages: ClientMessage[] = rawMessages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return json(400, { error: 'need_user_message' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const assistantTurns = messages.filter((m) => m.role === 'assistant').length;
  const handoff = assistantTurns + 1 >= HANDOFF_TURN / 2;

  // Fallback: no key configured. Return a reasonable canned reply
  // keyed off the user's latest message so the UI still demos.
  if (!apiKey) {
    const last = messages[messages.length - 1].content.toLowerCase();
    const reply = handoff
      ? `That's a strong direction to walk into your strategy call with. On the call we would pressure-test it, sketch a supplier shortlist, and name your week-one actions. Pick a time below when you are ready.`
      : last.length < 40
      ? `Tell me more. What is one specific moment in your day where this would matter? Who are you picturing when you say "the customer"?`
      : `Good start. The sharper the user and the sharper the moment, the easier the listing writes itself later. Which of these customers can you picture most clearly: a beginner, a hobbyist a year in, or a pro who already owns three competing products?`;
    return json(200, { reply, handoff });
  }

  try {
    const client = new Anthropic({ apiKey });
    const ctxLines: string[] = [];
    if (payload.context?.firstName) ctxLines.push(`Applicant first name: ${payload.context.firstName}.`);
    if (payload.context?.q13) ctxLines.push(`Capital band: ${payload.context.q13}.`);
    if (payload.context?.q10) ctxLines.push(`Timing: ${payload.context.q10}.`);
    const contextSuffix = ctxLines.length ? `\n\nContext about this applicant:\n${ctxLines.join('\n')}` : '';

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT + contextSuffix,
      messages,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!reply) {
      return json(500, { error: 'empty_response' });
    }

    return json(200, { reply, handoff });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return json(err.status || 500, { error: 'anthropic_api_error', detail: err.message });
    }
    return json(500, { error: 'brainstorm_failed', detail: String(err) });
  }
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
