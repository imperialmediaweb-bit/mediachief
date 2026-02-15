<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Category;
use App\Models\ImportLog;
use App\Models\Site;
use App\Services\PixabayImageService;
use App\Services\WordPressImportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImportWordPressJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public int $timeout = 600;

    public function __construct(
        public Site $site,
        public string $wpUrl,
        public int $page = 1,
        public bool $aiProcess = false,
    ) {
        $this->onQueue('rss');
    }

    public function handle(WordPressImportService $wpService): void
    {
        $importLog = ImportLog::create([
            'site_id' => $this->site->id,
            'type' => 'wordpress',
            'status' => 'running',
            'started_at' => now(),
            'summary' => "WordPress import page {$this->page} from {$this->wpUrl}",
        ]);

        try {
            $result = $wpService->fetchPosts($this->wpUrl, $this->page, 50);

            if (! $result) {
                $importLog->markFailed("Failed to fetch page {$this->page} from WordPress API");

                return;
            }

            $posts = $result['posts'];
            $totalPages = $result['totalPages'];
            $total = $result['total'];

            $imported = 0;
            $skipped = 0;
            $failed = 0;

            // Pre-load category map for this site
            $categoryMap = $this->buildCategoryMap($wpService);

            foreach ($posts as $post) {
                try {
                    $parsed = $wpService->parsePost($post);

                    // Check duplicate by guid
                    $exists = Article::where('site_id', $this->site->id)
                        ->where('original_guid', $parsed['guid'])
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }

                    // Map WP category to local category
                    $categoryId = null;
                    if (! empty($parsed['categories'])) {
                        $wpCat = $parsed['categories'][0];
                        $categoryId = $categoryMap[$wpCat['slug']] ?? $this->findOrCreateCategory($wpCat);
                    }

                    // Download featured image to local storage
                    $localImage = null;
                    if (! empty($parsed['featured_image'])) {
                        $localImage = PixabayImageService::downloadToStorage(
                            $parsed['featured_image'],
                            $this->site->id,
                        );
                    }

                    $article = Article::create([
                        'site_id' => $this->site->id,
                        'category_id' => $categoryId,
                        'title' => $parsed['title'],
                        'slug' => $this->ensureUniqueSlug($parsed['slug']),
                        'excerpt' => $parsed['excerpt'],
                        'body' => $parsed['body'],
                        'featured_image' => $localImage,
                        'featured_image_alt' => $parsed['featured_image_alt'],
                        'author' => $parsed['author'],
                        'source_url' => $parsed['source_url'],
                        'source_name' => parse_url($this->wpUrl, PHP_URL_HOST),
                        'status' => $this->aiProcess ? 'draft' : $parsed['status'],
                        'published_at' => $parsed['published_at'],
                        'tags' => ! empty($parsed['tags']) ? $parsed['tags'] : null,
                        'original_guid' => $parsed['guid'],
                    ]);

                    // Dispatch AI processing if enabled (with forced flags since no feed)
                    if ($this->aiProcess) {
                        ProcessArticleJob::dispatch(
                            article: $article,
                            forceRewrite: true,
                            forceImage: true,
                            language: $this->site->language ?? 'ro',
                        );
                    }

                    $imported++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('WP import: article failed', [
                        'site_id' => $this->site->id,
                        'error' => $e->getMessage(),
                        'wp_id' => $post['id'] ?? 'unknown',
                    ]);
                }
            }

            $importLog->update([
                'status' => 'completed',
                'items_found' => count($posts),
                'items_imported' => $imported,
                'items_skipped' => $skipped,
                'items_failed' => $failed,
                'completed_at' => now(),
                'summary' => "Page {$this->page}/{$totalPages} (total: {$total}) - Imported: {$imported}, Skipped: {$skipped}, Failed: {$failed}",
            ]);

            // Dispatch next page if there are more
            if ($this->page < $totalPages) {
                self::dispatch(
                    $this->site,
                    $this->wpUrl,
                    $this->page + 1,
                    $this->aiProcess,
                );
            }
        } catch (\Throwable $e) {
            $importLog->markFailed($e->getMessage());

            Log::error('WP import: job failed', [
                'site_id' => $this->site->id,
                'page' => $this->page,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Build a slug->id map of existing categories for this site.
     */
    private function buildCategoryMap(WordPressImportService $wpService): array
    {
        return Category::where('site_id', $this->site->id)
            ->pluck('id', 'slug')
            ->toArray();
    }

    /**
     * Find or create a local category from a WP category.
     */
    private function findOrCreateCategory(array $wpCategory): int
    {
        $existing = Category::where('site_id', $this->site->id)
            ->where('slug', $wpCategory['slug'])
            ->first();

        if ($existing) {
            return $existing->id;
        }

        $category = Category::create([
            'site_id' => $this->site->id,
            'name' => $wpCategory['name'],
            'slug' => $wpCategory['slug'],
            'is_active' => true,
            'sort_order' => 0,
        ]);

        return $category->id;
    }

    /**
     * Ensure slug is unique for this site.
     */
    private function ensureUniqueSlug(string $slug): string
    {
        $baseSlug = Str::limit($slug, 230, '');
        $exists = Article::where('site_id', $this->site->id)
            ->where('slug', $baseSlug)
            ->exists();

        return $exists ? $baseSlug . '-' . Str::random(5) : $baseSlug;
    }
}
