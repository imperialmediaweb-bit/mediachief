import Anthropic from "@anthropic-ai/sdk";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

/**
 * Article drafting. Claude writes it (same setup as MediaExpres); OpenAI is
 * only the fallback when no Anthropic key is set. Used in the order form,
 * before payment, and in the client account after payment.
 */

export const ARTICLE_KINDS = ["press_release", "sponsored", "seo"] as const;
export type ArticleKind = (typeof ARTICLE_KINDS)[number];

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export interface GenerateInput {
  topic: string;
  keyPoints?: string;
  audience?: string;
  tone?: string;
  companyName?: string;
  website?: string;
  kind?: ArticleKind;
  /** The search the buyer wants to rank for (SEO articles). */
  keyword?: string;
  /** Phrases the buyer wants linked, free text ("phrase -> url" per line). */
  links?: string;
  /** Text read from the buyer's website — the source of truth for facts. */
  siteContext?: string;
}

export interface GeneratedArticle {
  title: string;
  body: string;
}

const KIND_RULES: Record<ArticleKind, string> = {
  press_release: [
    "Write a PRESS RELEASE: news about the company, the way a newspaper would run it.",
    "350 to 550 words. Third person, neutral journalistic tone, no sales pitch, no superlatives.",
    "The first paragraph answers who, what, when, where and why.",
    "Quotes only if the client supplied one. End with a short 'About [company]' paragraph.",
  ].join(" "),
  sponsored: [
    "Write a SPONSORED ARTICLE (advertorial) that reads as useful content, not a loud ad.",
    "500 to 700 words: headline, an intro that hooks, 4 to 6 short sections with subheadings, a clear call to action at the end.",
    "Concrete benefits, no empty superlatives.",
  ].join(" "),
  seo: [
    "Write an SEO ARTICLE: an informative guide that answers a real Google search, with the company mentioned naturally.",
    "700 to 900 words, built around the main keyword: in the headline, the first paragraph, one or two subheadings and naturally in the text.",
    "4 to 6 subheadings, some phrased as questions people search for. The company appears 2 or 3 times as an example or solution.",
  ].join(" "),
};

function systemPrompt(kind: ArticleKind): string {
  return [
    "You write content for Media Chief, a network of US local newspapers.",
    `The piece runs in up to ${TOTAL_NEWSPAPERS} state newspapers, so keep it readable anywhere in the country.`,
    KIND_RULES[kind],
    "House style: plain American English, short sentences, no exclamation marks.",
    "Never invent statistics, awards, quotes, prices or dates. Use only facts from the client or from their website text. If a fact is missing, write around it.",
    "Do not promise results, cures, earnings or guarantees of any kind.",
    "Subheadings are short lines of their own. No markdown.",
    'Return strict JSON only: {"title": string, "body": string}. The body uses \\n\\n between paragraphs.',
  ].join(" ");
}

function userPrompt(input: GenerateInput): string {
  const parts = [`What the client wants to say:\n${input.topic}`];
  if (input.companyName) parts.push(`Company: ${input.companyName}`);
  if (input.website) parts.push(`Website: ${input.website}`);
  if (input.keyword) parts.push(`Main keyword: ${input.keyword}`);
  if (input.keyPoints) parts.push(`Points to cover: ${input.keyPoints}`);
  if (input.audience) parts.push(`Audience: ${input.audience}`);
  if (input.tone) parts.push(`Tone: ${input.tone}`);
  if (input.links) {
    parts.push(
      `The client wants links on certain phrases (we add the links at publication):\n"""\n${input.links}\n"""\nUse EXACTLY these phrases in the text, once each, in natural sentences. Do not write the web addresses in the text.`
    );
  }
  if (input.siteContext) {
    parts.push(
      `Text from the company's website (treat it as the source of truth):\n"""\n${input.siteContext}\n"""`
    );
  }
  return parts.join("\n\n");
}

async function draftWithClaude(key: string, system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: key });
  const res = await client.beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 8000,
    // The buyer waits for the draft on screen; an article is not a hard problem.
    output_config: { effort: "low" },
    // If the safety filters refuse, another model retries on its own.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") throw new Error("The request was declined");
  return res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function draftWithOpenAI(key: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
  return data?.choices?.[0]?.message?.content || "";
}

export async function generateArticle(input: GenerateInput): Promise<GeneratedArticle> {
  const system = systemPrompt(input.kind || "press_release");
  const user = userPrompt(input);

  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  let content: string;
  if (claudeKey) {
    try {
      content = await draftWithClaude(claudeKey, system, user);
    } catch (err) {
      console.error("[ai] Claude error", err);
      throw new Error("The drafting service did not answer. Try again in a moment.");
    }
  } else if (openaiKey) {
    content = await draftWithOpenAI(openaiKey, system, user);
  } else {
    throw new Error("AI drafting is not configured");
  }
  if (!content) throw new Error("The drafting service returned nothing");

  // Claude sometimes wraps the JSON in a code fence; take the outermost object.
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  let parsed: { title?: unknown; body?: unknown };
  try {
    parsed = JSON.parse(start >= 0 && end > start ? content.slice(start, end + 1) : content);
  } catch {
    throw new Error("The drafting service returned an unreadable answer");
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!title || !body) throw new Error("The draft came back incomplete");

  return { title: title.slice(0, 200), body: body.slice(0, 20000) };
}
