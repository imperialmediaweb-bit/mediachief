<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ArticleRewriteService
{
    /**
     * Rewrite an article using OpenAI API.
     *
     * @param  string  $title     Original title
     * @param  string  $body      Original HTML body
     * @param  string  $excerpt   Original excerpt
     * @param  string  $language  Target language (ro, en, etc.)
     * @param  string|null  $customPrompt  Custom rewrite instructions
     * @return array{title: string, body: string, excerpt: string}|null
     */
    public function rewrite(
        string $title,
        string $body,
        string $excerpt,
        string $language = 'ro',
        ?string $customPrompt = null,
    ): ?array {
        $apiKey = config('services.openai.key');

        if (! $apiKey) {
            Log::warning('ArticleRewriteService: no OPENAI_API_KEY configured');

            return null;
        }

        $languageNames = [
            'ro' => 'Romanian',
            'en' => 'English',
            'de' => 'German',
            'fr' => 'French',
            'es' => 'Spanish',
            'it' => 'Italian',
        ];

        $lang = $languageNames[$language] ?? 'Romanian';
        $plainBody = strip_tags($body);
        $plainBody = mb_substr($plainBody, 0, 6000);

        $systemPrompt = <<<PROMPT
You are a professional news journalist and editor. Your task is to completely rewrite/paraphrase articles to be 100% unique while keeping the same meaning and facts.

Rules:
- Rewrite EVERYTHING: title, body, excerpt
- Output language: {$lang}
- Keep the same factual information and key details
- Change sentence structure, vocabulary, and phrasing completely
- Write in a professional journalistic style
- The body should be well-structured HTML with <p>, <h2>, <h3>, <strong>, <em> tags
- The excerpt should be 1-2 sentences, plain text, max 300 characters
- Do NOT invent facts or add information not in the original
- Do NOT include any source attribution in the rewritten text
PROMPT;

        if ($customPrompt) {
            $systemPrompt .= "\n\nAdditional instructions:\n{$customPrompt}";
        }

        $userMessage = <<<MSG
Rewrite this article completely:

ORIGINAL TITLE: {$title}

ORIGINAL EXCERPT: {$excerpt}

ORIGINAL BODY:
{$plainBody}

Respond ONLY with valid JSON in this exact format:
{"title": "rewritten title here", "excerpt": "rewritten excerpt here", "body": "<p>rewritten HTML body here</p>"}
MSG;

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])
                ->timeout(120)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userMessage],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 4000,
                ]);

            if (! $response->successful()) {
                Log::error('ArticleRewriteService: OpenAI API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = $response->json('choices.0.message.content', '');

            // Strip markdown code fences if present
            $content = preg_replace('/^```(?:json)?\s*/m', '', $content);
            $content = preg_replace('/\s*```$/m', '', $content);
            $content = trim($content);

            $result = json_decode($content, true);

            if (! $result || ! isset($result['title'], $result['body'])) {
                Log::warning('ArticleRewriteService: failed to parse AI response', [
                    'response' => mb_substr($content, 0, 500),
                ]);

                return null;
            }

            return [
                'title' => mb_substr($result['title'], 0, 255),
                'body' => $result['body'],
                'excerpt' => mb_substr($result['excerpt'] ?? '', 0, 500),
            ];
        } catch (\Throwable $e) {
            Log::error('ArticleRewriteService: exception', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
