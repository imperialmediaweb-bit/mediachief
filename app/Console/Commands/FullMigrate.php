<?php

namespace App\Console\Commands;

use App\Jobs\ImportWordPressJob;
use App\Models\Category;
use App\Models\RssFeed;
use App\Models\Site;
use App\Services\WordPressImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FullMigrate extends Command
{
    protected $signature = 'migrate:full
        {file? : Text file with WordPress URLs (one per line)}
        {--ai : Enable AI rewriting for imported campaigns}
        {--images : Enable Pixabay image fetching for imported campaigns}
        {--auto-publish : Auto-publish new articles from campaigns}
        {--skip-articles : Skip article import, only create sites and campaigns}
        {--skip-campaigns : Skip campaign import, only create sites and articles}
        {--dry-run : Show what would be done without making changes}
        {--language=en : Default language for all sites}
        {--timezone=America/New_York : Default timezone for all sites}';

    protected $description = 'Full migration: give a text file with WordPress URLs → creates sites, imports categories, articles, and discovers RSS campaigns';

    private WordPressImportService $wpService;

    private int $sitesCreated = 0;

    private int $sitesSkipped = 0;

    private int $categoriesImported = 0;

    private int $articlesQueued = 0;

    private int $feedsCreated = 0;

    private int $campaignsImported = 0;

    public function handle(WordPressImportService $wpService): int
    {
        $this->wpService = $wpService;

        $file = $this->argument('file');
        if (! $file) {
            $file = $this->ask('Path to file with WordPress URLs (one per line)', 'sites.txt');
        }

        if (! file_exists($file)) {
            $file = base_path($file);
        }

        if (! file_exists($file)) {
            $this->error("File not found: {$file}");
            $this->newLine();
            $this->info('Create a text file with one WordPress URL per line:');
            $this->line('  https://washingtonxpexpress.com');
            $this->line('  https://newyorkexpress.com');
            $this->line('  https://texasnewsexpress.com');

            return self::FAILURE;
        }

        $lines = array_filter(
            array_map('trim', file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)),
            fn ($line) => ! empty($line) && ! str_starts_with($line, '#'),
        );

        if (empty($lines)) {
            $this->error('No URLs found in file.');

            return self::FAILURE;
        }

        $dryRun = $this->option('dry-run');
        $skipArticles = $this->option('skip-articles');
        $skipCampaigns = $this->option('skip-campaigns');

        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║     MediaChief - Full WordPress Migration    ║');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->newLine();
        $this->info("WordPress sites found: " . count($lines));
        $this->info("Import articles: " . ($skipArticles ? 'NO' : 'YES'));
        $this->info("Import campaigns: " . ($skipCampaigns ? 'NO' : 'YES'));
        $this->info("AI rewrite: " . ($this->option('ai') ? 'YES' : 'NO'));
        $this->info("Pixabay images: " . ($this->option('images') ? 'YES' : 'NO'));

        if ($dryRun) {
            $this->warn('[DRY RUN] No changes will be made.');
        }

        $this->newLine();

        if (! $dryRun && ! $this->confirm("Proceed with migration of " . count($lines) . " WordPress sites?", true)) {
            return self::SUCCESS;
        }

        $this->newLine();

        foreach ($lines as $i => $url) {
            $url = rtrim($url, '/');
            $num = $i + 1;
            $total = count($lines);

            $this->info("━━━ [{$num}/{$total}] {$url} ━━━");

            // Step 1: Create site
            $site = $this->createSite($url, $dryRun);
            if (! $site && $dryRun) {
                $this->newLine();
                continue;
            }
            if (! $site) {
                $this->error("  Failed to create site for {$url}");
                $this->newLine();
                continue;
            }

            // Step 2: Import categories from WP REST API
            $this->importCategories($site, $url, $dryRun);

            // Step 3: Try importing campaigns (export script or auto-discover)
            if (! $skipCampaigns) {
                $this->importCampaigns($site, $url, $dryRun);
            }

            // Step 4: Queue article import
            if (! $skipArticles) {
                $this->queueArticleImport($site, $url, $dryRun);
            }

            $this->newLine();
        }

        // Summary
        $this->newLine();
        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║           Migration Summary                  ║');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Sites created', $this->sitesCreated],
                ['Sites skipped (existing)', $this->sitesSkipped],
                ['Categories imported', $this->categoriesImported],
                ['RSS feeds discovered', $this->feedsCreated],
                ['Campaigns imported (export script)', $this->campaignsImported],
                ['Articles queued for import', $this->articlesQueued],
            ],
        );

        if ($this->articlesQueued > 0) {
            $this->newLine();
            $this->info('Articles are being imported in background via queue.');
            $this->info('Start workers: php artisan queue:work --queue=default,rss,ai');
        }

        if ($this->feedsCreated > 0 || $this->campaignsImported > 0) {
            $this->newLine();
            $this->info('RSS feeds will start fetching automatically via scheduler.');
            $this->info('Or manually: php artisan rss:fetch');
        }

        return self::SUCCESS;
    }

    private function createSite(string $wpUrl, bool $dryRun): ?Site
    {
        $domain = parse_url($wpUrl, PHP_URL_HOST);
        if (! $domain) {
            $this->error("  Invalid URL: {$wpUrl}");

            return null;
        }

        // Check if exists
        $existing = Site::where('domain', $domain)->first();
        if ($existing) {
            if (empty($existing->wordpress_url)) {
                if (! $dryRun) {
                    $existing->update(['wordpress_url' => $wpUrl]);
                }
                $this->line("  <comment>[EXISTS]</comment> {$domain} (ID: {$existing->id}) - updated wordpress_url");
            } else {
                $this->line("  <comment>[EXISTS]</comment> {$domain} (ID: {$existing->id})");
            }
            $this->sitesSkipped++;

            return $existing;
        }

        // Fetch site name from WP
        $name = $this->fetchSiteName($wpUrl) ?? $this->domainToName($domain);

        if ($dryRun) {
            $this->line("  [DRY] Would create: {$name} ({$domain})");
            $this->sitesCreated++;

            return null;
        }

        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'domain' => $domain,
            'wordpress_url' => $wpUrl,
            'language' => $this->option('language'),
            'timezone' => $this->option('timezone'),
            'description' => "{$name} - Local News",
            'is_active' => true,
        ]);

        $this->line("  <info>[CREATED]</info> #{$site->id} {$name} ({$domain})");
        $this->sitesCreated++;

        return $site;
    }

    private function fetchSiteName(string $wpUrl): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get(rtrim($wpUrl, '/') . '/wp-json');

            if ($response->successful()) {
                $data = $response->json();

                return html_entity_decode($data['name'] ?? '', ENT_QUOTES, 'UTF-8') ?: null;
            }
        } catch (\Throwable $e) {
            // Fallback to domain-based name
        }

        return null;
    }

    private function domainToName(string $domain): string
    {
        // washingtonxpexpress.com → Washington XP Express
        $name = preg_replace('/\.(com|net|org|us|co)$/', '', $domain);
        $name = str_replace(['-', '.'], ' ', $name);

        return Str::title($name);
    }

    private function importCategories(Site $site, string $wpUrl, bool $dryRun): void
    {
        $categories = $this->wpService->fetchCategories($wpUrl);

        if (! $categories || empty($categories)) {
            $this->line('  Categories: none found via REST API');

            return;
        }

        $imported = 0;
        foreach ($categories as $cat) {
            $slug = $cat['slug'] ?? '';
            $name = html_entity_decode($cat['name'] ?? '', ENT_QUOTES, 'UTF-8');

            if (empty($slug) || empty($name)) {
                continue;
            }

            // Skip "Uncategorized"
            if (in_array($slug, ['uncategorized', 'fara-categorie', 'sin-categoria'])) {
                continue;
            }

            $exists = Category::where('site_id', $site->id)->where('slug', $slug)->exists();
            if ($exists) {
                continue;
            }

            if (! $dryRun) {
                Category::create([
                    'site_id' => $site->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $cat['description'] ?? null,
                    'parent_id' => null,
                    'is_active' => true,
                    'sort_order' => 0,
                ]);
            }

            $imported++;
        }

        $this->categoriesImported += $imported;
        $this->line("  Categories: {$imported} imported");
    }

    private function importCampaigns(Site $site, string $wpUrl, bool $dryRun): void
    {
        $aiEnabled = $this->option('ai');
        $imagesEnabled = $this->option('images');
        $autoPublish = $this->option('auto-publish');

        // Method 1: Try mediachief-export.php on the WP site
        $exportUrl = rtrim($wpUrl, '/') . '/mediachief-export.php';
        $exportData = null;

        try {
            $response = Http::timeout(15)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get($exportUrl);

            if ($response->successful()) {
                $data = $response->json();
                if ($data && ! empty($data['campaigns'])) {
                    $exportData = $data;
                    $this->line("  <info>Export script found!</info> {$data['summary']['total_campaigns']} campaigns");
                }
            }
        } catch (\Throwable $e) {
            // Export script not available
        }

        if ($exportData) {
            // Import from export script data
            $imported = 0;
            $categoryMap = $this->buildCategoryMap($site, $exportData['categories'] ?? [], $dryRun);

            foreach ($exportData['campaigns'] as $campaign) {
                $url = $campaign['url'] ?? '';
                if (empty($url)) {
                    continue;
                }

                if (RssFeed::where('site_id', $site->id)->where('url', $url)->exists()) {
                    continue;
                }

                if (! $dryRun) {
                    $categoryId = null;
                    $wpCatId = $campaign['category_wp_id'] ?? null;
                    if ($wpCatId && isset($categoryMap[$wpCatId])) {
                        $categoryId = $categoryMap[$wpCatId];
                    }

                    $fetchInterval = (int) ($campaign['fetch_interval'] ?? 30);
                    $isGoogleNews = str_contains($url, 'news.google.com') || str_contains($url, 'google.com/rss');
                    if ($isGoogleNews && $fetchInterval > 15) {
                        $fetchInterval = 15;
                    }

                    RssFeed::create([
                        'site_id' => $site->id,
                        'category_id' => $categoryId,
                        'name' => $campaign['name'] ?? 'Imported Campaign',
                        'url' => $url,
                        'source_name' => $campaign['source_name'] ?? parse_url($url, PHP_URL_HOST),
                        'fetch_interval' => $fetchInterval,
                        'is_active' => $campaign['is_active'] ?? true,
                        'auto_publish' => $autoPublish,
                        'ai_rewrite' => $aiEnabled,
                        'ai_language' => $site->language ?? 'en',
                        'fetch_images' => $imagesEnabled,
                    ]);
                }

                $imported++;
            }

            $this->campaignsImported += $imported;
            $this->line("  Campaigns: {$imported} imported from export script");

            return;
        }

        // Method 2: Auto-discover RSS feeds from WP category feeds
        $this->line('  Export script not found, auto-discovering feeds...');
        $feeds = $this->wpService->discoverFeeds($wpUrl);

        if (empty($feeds)) {
            $this->line('  Feeds: none discovered');

            return;
        }

        $created = 0;
        foreach ($feeds as $feed) {
            $url = $feed['url'] ?? '';
            if (empty($url)) {
                continue;
            }

            if (RssFeed::where('site_id', $site->id)->where('url', $url)->exists()) {
                continue;
            }

            if (! $dryRun) {
                // Try to match to local category
                $categoryId = null;
                if (! empty($feed['wp_category_slug'])) {
                    $localCat = Category::where('site_id', $site->id)
                        ->where('slug', $feed['wp_category_slug'])
                        ->first();
                    $categoryId = $localCat?->id;
                }

                RssFeed::create([
                    'site_id' => $site->id,
                    'category_id' => $categoryId,
                    'name' => $feed['title'] ?? 'Discovered Feed',
                    'url' => $url,
                    'source_name' => parse_url($wpUrl, PHP_URL_HOST),
                    'fetch_interval' => 30,
                    'is_active' => true,
                    'auto_publish' => $autoPublish,
                    'ai_rewrite' => $aiEnabled,
                    'ai_language' => $site->language ?? 'en',
                    'fetch_images' => $imagesEnabled,
                ]);
            }

            $created++;
        }

        $this->feedsCreated += $created;
        $this->line("  Feeds: {$created} discovered and created");
    }

    private function buildCategoryMap(Site $site, array $exportCategories, bool $dryRun): array
    {
        $map = [];

        foreach ($exportCategories as $cat) {
            $slug = Str::slug($cat['slug'] ?? $cat['name'] ?? '');
            if (empty($slug)) {
                continue;
            }

            if (in_array($slug, ['uncategorized', 'fara-categorie'])) {
                continue;
            }

            $localCat = Category::where('site_id', $site->id)->where('slug', $slug)->first();

            if (! $localCat && ! $dryRun) {
                $localCat = Category::create([
                    'site_id' => $site->id,
                    'name' => $cat['name'] ?? $slug,
                    'slug' => $slug,
                    'description' => $cat['description'] ?? null,
                    'is_active' => true,
                    'sort_order' => 0,
                ]);
            }

            if ($localCat) {
                $map[$cat['id']] = $localCat->id;
            }
        }

        return $map;
    }

    private function queueArticleImport(Site $site, string $wpUrl, bool $dryRun): void
    {
        try {
            $result = $this->wpService->fetchPosts($wpUrl, 1, 1);
        } catch (\Throwable $e) {
            $this->line("  Articles: <error>REST API not accessible</error> ({$e->getMessage()})");

            return;
        }

        if (! $result || $result['total'] === 0) {
            $this->line('  Articles: 0 found');

            return;
        }

        $total = $result['total'];

        if (! $dryRun) {
            ImportWordPressJob::dispatch(
                site: $site,
                wpUrl: $wpUrl,
                page: 1,
                aiProcess: $this->option('ai'),
            );
        }

        $this->articlesQueued += $total;
        $this->line("  Articles: <info>{$total}</info> queued for import (background)");
    }
}
