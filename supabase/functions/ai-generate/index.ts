// Edge function: ai-generate
// Calls OpenAI gpt-4o-mini to generate professional narrative text.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Browser origins allowed to call this function (SEC-08). Edit this list when a production or
// preview domain changes. Other origins get no Access-Control-Allow-Origin header, so the browser blocks them.
// Keep it in sync with the list in ../attom-comps/index.ts.
const ALLOWED_ORIGINS = [
  "http://localhost:8080", // npm run dev (vite.config.ts)
  // TODO(owner): add the production and preview origins, e.g. "https://app.example.com".
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...(ALLOWED_ORIGINS.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Input caps (SEC-04). Requests over these return 413.
const PROMPT_MAX_CHARS = 4_000;
const CONTEXT_MAX_CHARS = 20_000; // serialized JSON of `context`
// Per-user limits, counted in the ai_generate_request_log table so they hold across isolates.
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 200;

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

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    // SEC-07: a throw from the auth path is an unauthenticated request, so it returns 401 too.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    let userId: string | undefined;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!userErr && user) userId = user.id;
    } catch (e) {
      console.warn("ai-generate auth check threw", e);
    }
    if (!userId) return json({ error: "Unauthorized" }, 401);

    // SEC-04: per-user per-minute and per-day limits, counted in Postgres so they hold across isolates.
    // Fails closed if the counter cannot be read or written.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const windowStart = (ms: number) => new Date(Date.now() - ms).toISOString();
    const [minute, day] = await Promise.all([
      admin.from("ai_generate_request_log").select("user_id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", windowStart(60_000)),
      admin.from("ai_generate_request_log").select("user_id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", windowStart(24 * 60 * 60_000)),
    ]);
    if (minute.error || day.error) {
      console.error("ai-generate rate limit count failed", minute.error ?? day.error);
      return json({ error: "Service unavailable" }, 503);
    }
    if ((minute.count ?? 0) >= RATE_LIMIT_PER_MINUTE || (day.count ?? 0) >= RATE_LIMIT_PER_DAY) {
      return json({ error: "Rate limit exceeded. Try again later." }, 429);
    }
    const { error: recordErr } = await admin.from("ai_generate_request_log").insert({ user_id: userId });
    if (recordErr) {
      console.error("ai-generate rate limit insert failed", recordErr);
      return json({ error: "Service unavailable" }, 503);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || body.prompt.length < 5) {
      return json({ error: "Invalid prompt" }, 400);
    }
    if (body.prompt.length > PROMPT_MAX_CHARS) return json({ error: "Prompt too large" }, 413);
    const { prompt, context, section, maxTokens } = body as {
      prompt: string;
      context?: Record<string, unknown>;
      section?: string;
      maxTokens?: number;
    };
    const contextJson = context ? JSON.stringify(context, null, 2) : "";
    if (contextJson.length > CONTEXT_MAX_CHARS) return json({ error: "Context too large" }, 413);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      // SEC-07: the detail goes to the server log, not to the client.
      console.error("ai-generate: OPENAI_API_KEY is not set");
      return json({ error: "Service unavailable" }, 503);
    }

    const userContent =
      `Section: ${section || "general"}\n` +
      (contextJson ? `Context:\n${contextJson}\n\n` : "") +
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
