// get-article
//
// Fetches RSS feeds from four German news outlets, picks one story at random,
// and asks Claude to turn it into a single German paragraph.
//
// Deploy with:
//   supabase functions deploy get-article --no-verify-jwt
//
// Requires a secret set beforehand:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = "claude-sonnet-5";

const FEEDS = [
  { name: "Tagesschau", url: "https://www.tagesschau.de/xml/rss2/" },
  { name: "Zeit Online", url: "https://newsfeed.zeit.de/index" },
  { name: "Spiegel Online", url: "https://www.spiegel.de/schlagzeilen/index.rss" },
  // DW publishes several feeds under rss.dw.com; this is their general German
  // top-stories feed. If it ever moves, check https://rss.dw.com for the
  // current path and update this URL.
  { name: "DW (Deutsche Welle)", url: "https://rss.dw.com/xml/rss-de-all" }
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

function extractTag(block: string, tag: string): string {
  // Handles both <tag>text</tag> and <tag><![CDATA[text]]></tag>
  const cdataMatch = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"));
  if (cdataMatch) return decodeEntities(cdataMatch[1]).trim();

  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (plainMatch) return decodeEntities(stripTags(plainMatch[1])).trim();

  return "";
}

interface FeedItem {
  title: string;
  description: string;
  link: string;
  source: string;
}

async function fetchFeedItems(feed: { name: string; url: string }): Promise<FeedItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GermanReadingApp/1.0)" }
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    return itemBlocks
      .map((block) => ({
        title: extractTag(block, "title"),
        description: extractTag(block, "description"),
        link: extractTag(block, "link"),
        source: feed.name
      }))
      .filter((item) => item.title);
  } catch (err) {
    console.error(`Failed to fetch/parse ${feed.name}:`, err);
    return [];
  }
}

async function summarizeInGerman(item: FeedItem): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server");
  }

  const sourceText = [item.title, item.description].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      thinking: { type: "disabled" }, // simple task, no need to pay for reasoning tokens
      messages: [
        {
          role: "user",
          content:
            "Fasse die folgende Nachricht in genau einem Absatz auf Deutsch zusammen " +
            "(3-5 Sätze, klarer Nachrichtenstil, für Deutschlerner geeignet). " +
            "Gib NUR den Absatz zurück, ohne Einleitung oder Anführungszeichen.\n\n" +
            sourceText
        }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  // Claude may return a "thinking" block before the "text" block, so find
  // the text block by type rather than assuming it's first in the array.
  const textBlock = (data?.content || []).find((block: any) => block.type === "text");
  if (!textBlock?.text) throw new Error("Anthropic API returned no text");
  return textBlock.text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.all(FEEDS.map(fetchFeedItems));
    const allItems = results.flat();

    if (allItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No articles could be fetched from any source right now." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chosen = allItems[Math.floor(Math.random() * allItems.length)];
    const article = await summarizeInGerman(chosen);

    return new Response(
      JSON.stringify({
        article,
        source: chosen.source,
        sourceUrl: chosen.link,
        originalTitle: chosen.title
      }),
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
