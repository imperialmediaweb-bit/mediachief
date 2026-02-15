<?php

namespace App\Console\Commands;

use App\Jobs\ImportWordPressJob;
use App\Models\Category;
use App\Models\RssFeed;
use App\Models\Site;
use App\Services\WordPressImportService;
use Illuminate\Console\Command;

class ImportWordPress extends Command
{
    protected $signature = 'wp:import
        {--site= : MediaChief site ID to import into}
        {--wp-url= : WordPress site URL (e.g. https://example.com)}
        {--articles : Import existing articles via WP REST API}
        {--feeds : Auto-discover and create RSS feed campaigns}
        {--all : Import both articles and create feeds}
        {--ai : Enable AI rewriting for imported content}
        {--images : Enable Pixabay image fetching}
        {--auto-publish : Auto-publish imported articles}';

    protected $description = 'Import articles and RSS feed campaigns from a WordPress site';

    public function handle(WordPressImportService $wpService): int
    {
        $siteId = $this->option('site');
        $wpUrl = $this->option('wp-url');

        if (! $siteId || ! $wpUrl) {
            // Interactive mode - let user pick
            if (! $siteId) {
                $sites = Site::where('is_active', true)->get();

                if ($sites->isEmpty()) {
                    $this->error('No active sites found. Create a site first.');

                    return self::FAILURE;
                }

                $siteName = $this->choice(
                    'Which site to import into?',
                    $sites->pluck('name', 'id')->toArray()
                );

                $siteId = $sites->firstWhere('name', $siteName)?->id;
            }

            if (! $wpUrl) {
                $wpUrl = $this->ask('WordPress site URL (e.g. https://example.com)');
            }
        }

        $site = Site::find($siteId);

        if (! $site) {
            $this->error("Site #{$siteId} not found.");

            return self::FAILURE;
        }

        $importAll = $this->option('all');
        $importArticles = $importAll || $this->option('articles');
        $importFeeds = $importAll || $this->option('feeds');
        $aiEnabled = $this->option('ai');
        $imagesEnabled = $this->option('images');
        $autoPublish = $this->option('auto-publish');

        if (! $importArticles && ! $importFeeds) {
            $importAll = true;
            $importArticles = true;
            $importFeeds = true;
        }

        $this->info("Importing from: {$wpUrl}");
        $this->info("Into site: {$site->name} (#{$site->id})");
        $this->newLine();

        // 1. Import RSS feeds (campaigns)
        if ($importFeeds) {
            $this->importFeeds($wpService, $site, $wpUrl, $aiEnabled, $imagesEnabled, $autoPublish);
        }

        // 2. Import existing articles
        if ($importArticles) {
            $this->importArticles($wpService, $site, $wpUrl, $aiEnabled);
        }

        $this->newLine();
        $this->info('Done! Check import logs in admin panel for progress.');

        return self::SUCCESS;
    }

    private function importFeeds(
        WordPressImportService $wpService,
        Site $site,
        string $wpUrl,
        bool $aiEnabled,
        bool $imagesEnabled,
        bool $autoPublish,
    ): void {
        $this->info('Discovering RSS feeds...');

        $feeds = $wpService->discoverFeeds($wpUrl);

        if (empty($feeds)) {
            $this->warn('No RSS feeds found.');

            return;
        }

        $this->info("Found " . count($feeds) . " feeds:");

        $created = 0;
        $skipped = 0;

        foreach ($feeds as $feed) {
            // Check if feed already exists
            $exists = RssFeed::where('site_id', $site->id)
                ->where('url', $feed['url'])
                ->exists();

            if ($exists) {
                $this->line("  [SKIP] {$feed['title']} - already exists");
                $skipped++;

                continue;
            }

            // Map WP category to local category
            $categoryId = null;
            if (! empty($feed['wp_category_slug'])) {
                $category = Category::where('site_id', $site->id)
                    ->where('slug', $feed['wp_category_slug'])
                    ->first();

                if (! $category) {
                    $category = Category::create([
                        'site_id' => $site->id,
                        'name' => $feed['wp_category_name'],
                        'slug' => $feed['wp_category_slug'],
                        'is_active' => true,
                        'sort_order' => 0,
                    ]);
                }

                $categoryId = $category->id;
            }

            RssFeed::create([
                'site_id' => $site->id,
                'category_id' => $categoryId,
                'name' => $feed['title'],
                'url' => $feed['url'],
                'source_name' => parse_url($wpUrl, PHP_URL_HOST),
                'fetch_interval' => 30,
                'is_active' => true,
                'auto_publish' => $autoPublish,
                'ai_rewrite' => $aiEnabled,
                'ai_language' => $site->language ?? 'ro',
                'fetch_images' => $imagesEnabled,
            ]);

            $this->line("  [NEW] {$feed['title']} -> {$feed['url']}");
            $created++;
        }

        $this->info("Feeds: {$created} created, {$skipped} skipped");
    }

    private function importArticles(
        WordPressImportService $wpService,
        Site $site,
        string $wpUrl,
        bool $aiEnabled,
    ): void {
        $this->info('Checking WordPress articles...');

        $result = $wpService->fetchPosts($wpUrl, 1, 1);

        if (! $result) {
            $this->error('Could not connect to WordPress REST API.');
            $this->warn("Make sure {$wpUrl}/wp-json/wp/v2/posts is accessible.");

            return;
        }

        $total = $result['total'];
        $totalPages = $result['totalPages'];

        $this->info("Found {$total} articles ({$totalPages} pages).");

        if ($total === 0) {
            return;
        }

        if (! $this->confirm("Import all {$total} articles?", true)) {
            return;
        }

        // Dispatch the first page, job will self-chain for remaining pages
        ImportWordPressJob::dispatch($site, $wpUrl, 1, $aiEnabled);

        $this->info("Import job dispatched. Articles will be imported in background ({$totalPages} pages).");

        if ($aiEnabled) {
            $this->info('AI rewriting is enabled - articles will be rewritten after import.');
        }
    }
}
