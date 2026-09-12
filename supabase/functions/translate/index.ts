// translate
//
// Takes a paragraph of German text and returns an English translation, using Claude.
//
// Deploy with:
//   supabase functions deploy translate --no-verify-jwt
//
// Requires a secret set beforehand (shared with get-article):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = "claude-sonnet-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function translateToEnglish(germanText: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content:
            "Translate the following German paragraph into natural, plain English. " +
            "Return ONLY the translation, with no preamble or quotation marks.\n\n" +
            germanText
        }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic API returned no text");
  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const germanText: string = body?.text;

    if (!germanText || typeof germanText !== "string") {
      return new Response(
        JSON.stringify({ error: "Request body must include a 'text' string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const translation = await translateToEnglish(germanText);

    return new Response(
      JSON.stringify({ translation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err instanceof Error ? err.message : err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
