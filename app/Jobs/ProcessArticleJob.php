<?php

namespace App\Jobs;

use App\Models\Article;
use App\Services\ArticleRewriteService;
use App\Services\PixabayImageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcessArticleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public int $timeout = 180;

    public function __construct(
        public Article $article,
        public bool $forceRewrite = false,
        public bool $forceImage = false,
        public ?string $language = null,
        public ?string $customPrompt = null,
    ) {
        $this->onQueue('ai');
    }

    public function handle(
        ArticleRewriteService $rewriteService,
        PixabayImageService $pixabayService,
    ): void {
        $feed = $this->article->rssFeed;
        $site = $this->article->site;
        $language = $this->language ?? $feed?->ai_language ?? $site?->language ?? 'ro';
        $updated = [];

        // Determine what to do based on feed settings or forced flags
        $shouldRewrite = $this->forceRewrite || ($feed?->ai_rewrite ?? false);
        $shouldFetchImage = $this->forceImage || ($feed?->fetch_images ?? false);
        $shouldPublish = $feed?->auto_publish ?? false;

        // Step 1: AI Rewrite
        if ($shouldRewrite) {
            Log::info('ProcessArticleJob: rewriting article', [
                'article_id' => $this->article->id,
                'title' => $this->article->title,
            ]);

            $rewritten = $rewriteService->rewrite(
                title: $this->article->title,
                body: $this->article->body,
                excerpt: $this->article->excerpt ?? '',
                language: $language,
                customPrompt: $this->customPrompt ?? $feed?->ai_prompt,
            );

            if ($rewritten) {
                $updated['title'] = $rewritten['title'];
                $updated['slug'] = Str::slug(Str::limit($rewritten['title'], 200, '')) . '-' . Str::random(5);
                $updated['body'] = $rewritten['body'];

                if (! empty($rewritten['excerpt'])) {
                    $updated['excerpt'] = $rewritten['excerpt'];
                }

                Log::info('ProcessArticleJob: rewrite successful', [
                    'article_id' => $this->article->id,
                    'new_title' => $rewritten['title'],
                ]);
            } else {
                Log::warning('ProcessArticleJob: rewrite failed, keeping original', [
                    'article_id' => $this->article->id,
                ]);
            }
        }

        // Step 2: Pixabay Image (if no image present)
        if ($shouldFetchImage && ! $this->article->featured_image) {
            $searchTitle = $updated['title'] ?? $this->article->title;

            Log::info('ProcessArticleJob: fetching Pixabay image', [
                'article_id' => $this->article->id,
                'search' => $searchTitle,
            ]);

            $image = $pixabayService->findImage($searchTitle, $language);

            if ($image) {
                $updated['featured_image'] = $image['url'];
                $updated['featured_image_alt'] = $image['alt'];

                Log::info('ProcessArticleJob: image found', [
                    'article_id' => $this->article->id,
                    'photographer' => $image['photographer'],
                ]);
            }
        }

        // Step 3: Auto-publish if configured (only for feed-based imports)
        if ($shouldPublish && $this->article->status === 'draft') {
            $updated['status'] = 'published';
            $updated['published_at'] = $this->article->published_at ?? now();
        }

        // Apply all updates at once
        if (! empty($updated)) {
            $this->article->update($updated);
        }
    }
}
