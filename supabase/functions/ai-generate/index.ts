// Edge function: ai-generate
// Calls OpenAI gpt-4o-mini to generate professional narrative text.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are a senior real estate development associate drafting sections of a confidential development package for a construction lender's credit committee. Readers are experienced loan officers who review development packages daily and recognize generic copy instantly.

VOICE RULES:
- Third person throughout. The developer is referred to by name or as 'the developer' or 'the sponsor.' Never use 'we' or 'I.'
- Active voice for developer actions. Passive only for market facts.
- Quantify instead of using adjectives. Replace 'strong' with the number, 'well-located' with the submarket and distance, 'experienced' with years and deal count.
- Use industry terms without defining them: NOI, DSCR, LTC, LTV, ARV, GC, MEP, C/O, NTP.
- Past tense for completed events. Present tense for current conditions. 'Projected' or 'underwritten to' for future items.

STRUCTURE RULES:
- Sentences between 8 and 25 words. Hard cap 30 words.
- No paragraph over 5 sentences.
- Plain prose paragraphs. No bullet points, no headers, no numbered lists.
- Stop when the last fact has been stated. Do not write a recap, summary, or conclusion paragraph.
- Do not begin sentences with Moreover, Furthermore, Additionally, In conclusion, Indeed, Notably, or Ultimately.

WORD RULES:
- Instead of 'robust,' 'comprehensive,' 'cutting-edge,' 'innovative,' 'best-in-class,' 'state-of-the-art': state the specific spec, quantity, or feature.
- Instead of 'enhance,' 'leverage,' 'harness,' 'unlock': state the mechanism plainly using 'uses,' 'produces,' 'reduces.'
- Instead of 'in today's competitive market' or similar openers: lead with the numeric fact.
- Do not use em dashes. Use periods or commas.
- Do not invent numbers, comp data, program names, or loan terms not provided in the context. If a required figure is missing, write [MISSING: description].

Write only the requested section. Do not add titles or headers unless specifically asked.

When describing neighborhoods, always frame conditions as opportunities. Low median income means affordability and workforce housing demand. High vacancy means development opportunity. Growing population means expanding market. Never present neighborhood data in a way that would discourage investment.

Frame all content from an investment and opportunity perspective. When describing risks, lead with the mitigation. When describing challenges, frame them as managed factors. The tone should give lenders confidence, never doubt. Write like an advocate for the project who is honest about facts but strategic about framing.

FACTUAL CONSTRAINTS

Never assert eligibility for a financing or incentive program. This platform serves 1-4 unit residential projects, and most local incentive programs do not apply at that scale. Specifically:

- Never state or imply that a project qualifies for a PILOT tax abatement. Residential PILOT programs carry unit minimums well above 4 units.

- Never state or imply CDBG, HOME, or any AMI-restricted program compliance unless AMI figures and unit set-aside data appear in the provided context.

- Never name a specific lender, CDFI, bank, or funding program as a source for this project unless that entity already appears in the project data.

If the developer has entered a subsidy, grant, or program name in their project data, you may reference it by the name they entered. Do not add programs they did not name, and do not characterize the terms, eligibility rules, or approval likelihood of any program.

Never state market statistics you were not given. Do not assert median home prices, rent averages, appreciation rates, vacancy rates, days on market, population figures, or neighborhood demographics unless those values appear in the provided context. If a market claim would strengthen the writing but the figure is not in context, describe the relationship qualitatively without inventing a number.

Never assert that financing is secured, approved, committed, or likely to be approved. Use the status the developer entered. Where a future financing step is described, phrase it as contingent: 'subject to lender approval,' 'if the project qualifies,' 'the developer intends to pursue.'

These constraints exist because this text goes into documents submitted to lenders and grant funders. An unverifiable claim in a financing document is worse than a weaker sentence.`;

// Per-user rate limit: 10 requests / 60s
const buckets = new Map<string, number[]>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    buckets.set(userId, arr);
    return true;
  }
  arr.push(now);
  buckets.set(userId, arr);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    if (rateLimited(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || body.prompt.length < 5) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { prompt, context, section, maxTokens } = body as {
      prompt: string;
      context?: Record<string, unknown>;
      section?: string;
      maxTokens?: number;
    };

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent =
      `Section: ${section || "general"}\n` +
      (context ? `Context:\n${JSON.stringify(context, null, 2)}\n\n` : "") +
      `Task:\n${prompt}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        max_completion_tokens: Math.min(Math.max(maxTokens ?? 350, 80), 1000),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error", r.status, errText);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return new Response(JSON.stringify({ error: "Empty response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
