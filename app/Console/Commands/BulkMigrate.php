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

class BulkMigrate extends Command
{
    protected $signature = 'migrate:wordpress
        {--site= : Migrate a single site by ID (or "all" for all sites with wordpress_url)}
        {--articles : Import existing articles via WP REST API}
        {--campaigns : Import campaigns via export JSON files}
        {--campaigns-dir= : Directory containing campaign export JSONs (named by domain)}
        {--deploy-export : Auto-deploy mediachief-export.php to WP sites via upload}
        {--all : Import both articles and campaigns}
        {--ai : Enable AI rewriting}
        {--images : Enable Pixabay image fetching}
        {--auto-publish : Auto-publish articles}
        {--dry-run : Show what would be done without making changes}
        {--skip-existing : Skip sites that already have articles imported}';

    protected $description = 'Bulk migrate articles and campaigns from all WordPress sites to MediaChief';

    private int $totalArticlesQueued = 0;

    private int $totalCampaignsCreated = 0;

    private int $totalSitesProcessed = 0;

    public function handle(WordPressImportService $wpService): int
    {
        $siteOption = $this->option('site');
        $importAll = $this->option('all');
        $importArticles = $importAll || $this->option('articles');
        $importCampaigns = $importAll || $this->option('campaigns');
        $aiEnabled = $this->option('ai');
        $imagesEnabled = $this->option('images');
        $autoPublish = $this->option('auto-publish');
        $dryRun = $this->option('dry-run');
        $skipExisting = $this->option('skip-existing');
        $campaignsDir = $this->option('campaigns-dir') ?? base_path('storage/app/imports/campaigns');

        if (! $importArticles && ! $importCampaigns) {
            $importAll = true;
            $importArticles = true;
            $importCampaigns = true;
        }

        // Get sites to process
        $sites = $this->getSites($siteOption);

        if ($sites->isEmpty()) {
            $this->error('No sites found to migrate.');
            $this->info('Run sites:bulk-create first to create sites, or set wordpress_url on existing sites.');

            return self::FAILURE;
        }

        $this->info("=== MediaChief Bulk Migration ===");
        $this->info("Sites to process: {$sites->count()}");
        $this->info("Import articles: " . ($importArticles ? 'YES' : 'NO'));
        $this->info("Import campaigns: " . ($importCampaigns ? 'YES' : 'NO'));
        $this->info("AI rewrite: " . ($aiEnabled ? 'YES' : 'NO'));
        $this->info("Pixabay images: " . ($imagesEnabled ? 'YES' : 'NO'));

        if ($dryRun) {
            $this->warn('[DRY RUN] No changes will be made.');
        }

        $this->newLine();

        if (! $dryRun && ! $this->confirm("Proceed with migration of {$sites->count()} sites?", true)) {
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($sites->count());
        $bar->setFormat(" %current%/%max% [%bar%] %percent:3s%% -- %message%");
        $bar->start();

        foreach ($sites as $site) {
            $bar->setMessage($site->domain);

            if ($skipExisting && $site->articles()->count() > 0) {
                $bar->setMessage("{$site->domain} (skipped - has articles)");
                $bar->advance();

                continue;
            }

            $wpUrl = $site->wordpress_url ?: "https://{$site->domain}";

            // Import campaigns from JSON files
            if ($importCampaigns) {
                $this->migrateCampaigns($site, $wpUrl, $campaignsDir, $aiEnabled, $imagesEnabled, $autoPublish, $dryRun);
            }

            // Import articles via WP REST API
            if ($importArticles) {
                $this->migrateArticles($wpService, $site, $wpUrl, $aiEnabled, $dryRun);
            }

            $this->totalSitesProcessed++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info("=== Migration Complete ===");
        $this->info("Sites processed: {$this->totalSitesProcessed}");
        $this->info("Article import jobs queued: {$this->totalArticlesQueued}");
        $this->info("Campaigns created: {$this->totalCampaignsCreated}");
        $this->newLine();

        if ($this->totalArticlesQueued > 0) {
            $this->info('Articles are being imported in background via queue workers.');
            $this->info('Monitor progress: php artisan queue:work --queue=default,rss,ai');
        }

        return self::SUCCESS;
    }

    private function getSites($siteOption)
    {
        if (! $siteOption || $siteOption === 'all') {
            return Site::where('is_active', true)
                ->whereNotNull('wordpress_url')
                ->where('wordpress_url', '!=', '')
                ->orderBy('id')
                ->get();
        }

        $site = Site::find($siteOption);

        if (! $site) {
            return collect();
        }

        return collect([$site]);
    }

    private function migrateCampaigns(
        Site $site,
        string $wpUrl,
        string $campaignsDir,
        bool $aiEnabled,
        bool $imagesEnabled,
        bool $autoPublish,
        bool $dryRun,
    ): void {
        // Look for JSON export file by domain name
        $domain = $site->domain;
        $possibleFiles = [
            "{$campaignsDir}/{$domain}.json",
            "{$campaignsDir}/" . str_replace('.', '-', $domain) . '.json',
            "{$campaignsDir}/{$site->slug}.json",
        ];

        $jsonFile = null;
        foreach ($possibleFiles as $file) {
            if (file_exists($file)) {
                $jsonFile = $file;

                break;
            }
        }

        if (! $jsonFile) {
            // Try to fetch directly from WP site if export script is deployed
            $exportUrl = rtrim($wpUrl, '/') . '/mediachief-export.php';

            try {
                $response = Http::timeout(30)->get($exportUrl);

                if ($response->successful()) {
                    $data = $response->json();
                    if ($data && isset($data['campaigns'])) {
                        // Save to campaigns dir for future use
                        if (! $dryRun && ! is_dir($campaignsDir)) {
                            mkdir($campaignsDir, 0755, true);
                        }
                        if (! $dryRun) {
                            file_put_contents("{$campaignsDir}/{$domain}.json", $response->body());
                        }
                        $this->importCampaignsFromData($site, $data, $aiEnabled, $imagesEnabled, $autoPublish, $dryRun);

                        return;
                    }
                }
            } catch (\Exception $e) {
                // Export script not available, skip
            }

            return;
        }

        $data = json_decode(file_get_contents($jsonFile), true);

        if (! $data || ! isset($data['campaigns'])) {
            return;
        }

        $this->importCampaignsFromData($site, $data, $aiEnabled, $imagesEnabled, $autoPublish, $dryRun);
    }

    private function importCampaignsFromData(
        Site $site,
        array $data,
        bool $aiEnabled,
        bool $imagesEnabled,
        bool $autoPublish,
        bool $dryRun,
    ): void {
        // Import categories
        $categoryMap = [];
        foreach ($data['categories'] ?? [] as $cat) {
            $slug = Str::slug($cat['slug'] ?: $cat['name']);

            if ($dryRun) {
                continue;
            }

            $localCat = Category::firstOrCreate(
                ['site_id' => $site->id, 'slug' => $slug],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'] ?? null,
                    'is_active' => true,
                    'sort_order' => 0,
                ]
            );
            $categoryMap[$cat['id']] = $localCat->id;
        }

        // Import campaigns
        foreach ($data['campaigns'] as $campaign) {
            $url = $campaign['url'] ?? '';
            if (empty($url)) {
                continue;
            }

            $exists = RssFeed::where('site_id', $site->id)
                ->where('url', $url)
                ->exists();

            if ($exists) {
                continue;
            }

            if ($dryRun) {
                $this->totalCampaignsCreated++;

                continue;
            }

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

            $this->totalCampaignsCreated++;
        }
    }

    private function migrateArticles(
        WordPressImportService $wpService,
        Site $site,
        string $wpUrl,
        bool $aiEnabled,
        bool $dryRun,
    ): void {
        try {
            $result = $wpService->fetchPosts($wpUrl, 1, 1);
        } catch (\Exception $e) {
            return;
        }

        if (! $result || $result['total'] === 0) {
            return;
        }

        if ($dryRun) {
            $this->totalArticlesQueued += $result['total'];

            return;
        }

        ImportWordPressJob::dispatch(
            site: $site,
            wpUrl: $wpUrl,
            page: 1,
            aiProcess: $aiEnabled,
        );

        $this->totalArticlesQueued += $result['total'];
    }
}
