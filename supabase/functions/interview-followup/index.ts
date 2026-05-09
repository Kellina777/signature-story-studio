// Generates a single, warm follow-up question based on the user's last answer.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { coreQuestion, answer, priorContext } = await req.json();
    if (!coreQuestion || !answer) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `you are a warm, perceptive story coach interviewing a founder/expert to uncover their signature story.
the user just answered a core question. ask ONE short follow-up — between 8 and 22 words — that goes deeper into the most emotionally specific or surprising thing they said.
rules:
- lowercase only. no em-dashes longer than one. no emojis. no preamble. no "great answer".
- do not ask about something they did not mention.
- favor specificity (a person, a moment, a feeling, a turning point) over abstractions.
- never ask more than one question.
- output the question only, nothing else.`;

    const user = `prior context (earlier answers, summarized):
${priorContext || "(none yet)"}

core question just asked:
"${coreQuestion}"

their answer:
"""${answer}"""

write the follow-up.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "rate limit, try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (resp.status === 402)
        return new Response(
          JSON.stringify({ error: "ai credits exhausted. add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      const t = await resp.text();
      console.error("ai gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "ai gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const followup: string =
      data?.choices?.[0]?.message?.content?.trim() || "tell me a little more about that.";

    return new Response(JSON.stringify({ followup }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
