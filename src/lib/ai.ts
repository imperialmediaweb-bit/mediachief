import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

/**
 * Article drafting through the OpenAI REST API. No SDK: one fetch keeps the
 * dependency list unchanged and the call is a single request.
 */

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export interface GenerateInput {
  topic: string;
  keyPoints?: string;
  audience?: string;
  tone?: string;
  companyName?: string;
  website?: string;
}

export interface GeneratedArticle {
  title: string;
  body: string;
}

export async function generateArticle(input: GenerateInput): Promise<GeneratedArticle> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AI drafting is not configured");

  const system = [
    "You write press releases and sponsored articles for US local newspapers.",
    `The piece runs in up to ${TOTAL_NEWSPAPERS} state newspapers, so keep it readable anywhere in the country.`,
    "House style: plain American English, short sentences, no hype, no superlatives, no exclamation marks.",
    "Open with the news itself, not with background. Third person throughout.",
    "Never invent statistics, awards, quotes, prices or dates. If the client did not supply a fact, leave it out.",
    "Do not promise results, cures, earnings or guarantees of any kind.",
    "Between 450 and 700 words, in 5 to 8 short paragraphs.",
    'Return strict JSON only: {"title": string, "body": string}. The body uses \\n\\n between paragraphs and contains no markdown.',
  ].join(" ");

  const user = [
    `Topic: ${input.topic}`,
    input.companyName ? `Company: ${input.companyName}` : "",
    input.website ? `Website: ${input.website}` : "",
    input.keyPoints ? `Points to cover: ${input.keyPoints}` : "",
    input.audience ? `Audience: ${input.audience}` : "",
    input.tone ? `Tone: ${input.tone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[ai] OpenAI error", res.status, detail.slice(0, 400));
    throw new Error("The drafting service did not answer. Try again in a moment.");
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("The drafting service returned nothing");

  let parsed: { title?: unknown; body?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("The drafting service returned an unreadable answer");
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!title || !body) throw new Error("The draft came back incomplete");

  return { title: title.slice(0, 200), body: body.slice(0, 20000) };
}
