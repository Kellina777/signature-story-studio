// Builds the 7-section signature story blueprint from a full interview transcript.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    if (!transcript || !Array.isArray(transcript)) {
      return new Response(JSON.stringify({ error: "transcript array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const transcriptText = transcript
      .map((m: { role: string; content: string }) =>
        `${m.role.toUpperCase()}: ${m.content}`,
      )
      .join("\n\n");

    const system = `you are a senior story coach. you write the user's signature story document in their voice — preserving their phrases, rhythm, slang, emotional specifics. you do NOT polish it into corporate copy. lowercase prose, warm, plain, human.

return strictly via the provided tool. each section body should be 90-180 words, written in the FIRST person ("i"), and grounded in things the user actually said in the transcript. quote or echo their phrases. never invent specifics.`;

    const tool = {
      type: "function",
      function: {
        name: "write_blueprint",
        description: "the signature story blueprint",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "a short, evocative title in lowercase" },
            sections: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                properties: {
                  key: {
                    type: "string",
                    enum: ["origin", "message", "value", "client", "pillars", "offer", "bio"],
                  },
                  title: { type: "string" },
                  body: { type: "string" },
                },
                required: ["key", "title", "body"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "sections"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `here is the full interview transcript. write the blueprint.\n\n${transcriptText}\n\nsections, in this order:\n1 origin — where the work began, the turning point\n2 message — the one thing i'm here to say\n3 value — the change i create for people\n4 client — who i'm for, in human terms\n5 pillars — 3-5 themes i return to again and again\n6 offer — how someone works with me\n7 bio — a 90-word third-person bio that still sounds like me`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "write_blueprint" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "rate limit, try again shortly." }), {
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
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "no blueprint returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify(parsed), {
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
