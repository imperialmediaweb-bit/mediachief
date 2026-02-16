<?php

namespace App\Console\Commands;

use App\Jobs\ImportWordPressJob;
use App\Jobs\ImportWordPressSiteSettingsJob;
use App\Models\Category;
use App\Models\RssFeed;
use App\Models\Site;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportAllSites extends Command
{
    protected $signature = 'wp:import-all
        {--dir= : Directory containing JSON export files from mediachief-export.php}
        {--file= : Single combined JSON file with all site exports}
        {--settings : Also import site settings (favicon, GA, Search Console) via WP API}
        {--articles : Also import articles via WordPress REST API}
        {--ai : Enable AI rewriting on all campaigns}
        {--images : Enable Pixabay image fetching}
        {--auto-publish : Auto-publish articles}
        {--dry-run : Show what would be imported without making changes}';

    protected $description = 'Bulk import all WordPress sites from export JSON files (campaigns, settings, articles)';

    public function handle(): int
    {
        $dir = $this->option('dir');
        $file = $this->option('file');
        $dryRun = $this->option('dry-run');

        if (! $dir && ! $file) {
            $dir = $this->ask('Directory with JSON export files (or use --file for a single combined file)');
        }

        $exports = $this->loadExports($dir, $file);

        if (empty($exports)) {
            $this->error('No valid export files found.');

            return self::FAILURE;
        }

        $this->info("Found " . count($exports) . " site exports to import.");
        $this->newLine();

        if ($dryRun) {
            $this->warn('[DRY RUN] No changes will be made.');
            $this->newLine();
        }

        $totalCampaigns = 0;
        $totalCategories = 0;
        $sitesProcessed = 0;
        $sitesSkipped = 0;

        foreach ($exports as $export) {
            $siteUrl = $export['site_url'] ?? '';
            $siteName = $export['site_name'] ?? '';
            $domain = parse_url($siteUrl, PHP_URL_HOST);

            if (empty($domain)) {
                $this->warn("Skipping export with no site_url");

                continue;
            }

            // Remove www. for matching
            $domainClean = preg_replace('/^www\./', '', $domain);

            $this->info("━━━ {$siteName} ({$domain}) ━━━");

            // Find matching MediaChief site
            $site = Site::where('domain', $domain)
                ->orWhere('domain', $domainClean)
                ->orWhere('domain', 'www.' . $domainClean)
                ->first();

            if (! $site) {
                $this->warn("  No matching site found for domain: {$domain}");
                $this->line("  Create it first with: php artisan sites:bulk-create");
                $sitesSkipped++;
                $this->newLine();

                continue;
            }

            $this->line("  Matched to: {$site->name} (ID: {$site->id})");

            // Import settings from export (tracking, favicon URL, etc.)
            if (! empty($export['settings'])) {
                $this->importSettings($site, $export['settings'], $dryRun);
            }

            // Import categories
            $categoryMap = [];
            if (! empty($export['categories'])) {
                $categoryMap = $this->importCategories($site, $export['categories'], $dryRun);
                $totalCategories += count($categoryMap);
            }

            // Import campaigns
            if (! empty($export['campaigns'])) {
                $imported = $this->importCampaigns($site, $export['campaigns'], $categoryMap, $dryRun);
                $totalCampaigns += $imported;
            }

            // Import site settings via WP API (favicon download, etc.)
            if ($this->option('settings') && ! $dryRun) {
                $wpUrl = $site->wordpress_url ?: $siteUrl;
                ImportWordPressSiteSettingsJob::dispatch(
                    site: $site,
                    wpUrl: $wpUrl,
                );
                $this->line("  [QUEUED] Site settings import (favicon, GA, SEO)");
            }

            // Import articles via WP API
            if ($this->option('articles') && ! $dryRun) {
                $wpUrl = $site->wordpress_url ?: $siteUrl;
                ImportWordPressJob::dispatch(
                    site: $site,
                    wpUrl: $wpUrl,
                    page: 1,
                    aiProcess: $this->option('ai'),
                );
                $this->line("  [QUEUED] Article import from WordPress API");
            }

            $sitesProcessed++;
            $this->newLine();
        }

        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("Import complete!");
        $this->info("  Sites processed: {$sitesProcessed}");
        $this->info("  Sites skipped:   {$sitesSkipped}");
        $this->info("  Categories:      {$totalCategories}");
        $this->info("  Campaigns:       {$totalCampaigns}");

        if ($this->option('settings')) {
            $this->info("  Settings import: queued for {$sitesProcessed} sites");
        }
        if ($this->option('articles')) {
            $this->info("  Article import:  queued for {$sitesProcessed} sites");
        }

        return self::SUCCESS;
    }

    /**
     * Load exports from directory of JSON files or a single combined JSON.
     */
    private function loadExports(?string $dir, ?string $file): array
    {
        $exports = [];

        if ($file && file_exists($file)) {
            $json = file_get_contents($file);
            $data = json_decode($json, true);

            if (is_array($data)) {
                // Combined file: array of exports
                if (isset($data[0]['site_url'])) {
                    return $data;
                }
                // Single export
                if (isset($data['site_url'])) {
                    return [$data];
                }
            }

            return [];
        }

        if ($dir && is_dir($dir)) {
            $files = glob(rtrim($dir, '/') . '/*.json');

            foreach ($files as $f) {
                if (basename($f) === 'all-sites-export.json') {
                    continue; // Skip combined file, use individual ones
                }

                $json = file_get_contents($f);
                $data = json_decode($json, true);

                if ($data && isset($data['site_url'])) {
                    $exports[] = $data;
                    $this->line("  Loaded: " . basename($f));
                }
            }
        }

        return $exports;
    }

    /**
     * Import settings from the export (tracking IDs, etc.)
     */
    private function importSettings(Site $site, array $settings, bool $dryRun): void
    {
        $tracking = $settings['tracking'] ?? [];
        $updates = [];

        // Import tracking/analytics data
        if (! empty($tracking)) {
            $existing = $site->analytics ?? [];
            $merged = array_merge($existing, $tracking);

            if ($merged !== $existing) {
                $updates['analytics'] = $merged;
                foreach ($tracking as $key => $value) {
                    $this->line("  [" . ($dryRun ? 'DRY' : 'OK') . "] Analytics: {$key} = {$value}");
                }
            }
        }

        // Store favicon URL for later download
        if (! empty($settings['favicon_url']) && empty($site->favicon)) {
            $seoSettings = $site->seo_settings ?? [];
            $seoSettings['wp_favicon_url'] = $settings['favicon_url'];
            $updates['seo_settings'] = $seoSettings;
            $this->line("  [" . ($dryRun ? 'DRY' : 'OK') . "] Favicon URL saved: {$settings['favicon_url']}");
        }

        // Store logo URL
        if (! empty($settings['logo_url']) && empty($site->logo)) {
            $seoSettings = $updates['seo_settings'] ?? $site->seo_settings ?? [];
            $seoSettings['wp_logo_url'] = $settings['logo_url'];
            $updates['seo_settings'] = $seoSettings;
            $this->line("  [" . ($dryRun ? 'DRY' : 'OK') . "] Logo URL saved: {$settings['logo_url']}");
        }

        // Update description if empty
        if (! empty($settings['description'] ?? null) && empty($site->description)) {
            // Description comes from the parent export, not settings
        }

        if (! $dryRun && ! empty($updates)) {
            $site->update($updates);
        }
    }

    /**
     * Import categories and return wp_id -> local_id map.
     */
    private function importCategories(Site $site, array $wpCategories, bool $dryRun): array
    {
        $map = [];
        $created = 0;
        $existing = 0;

        foreach ($wpCategories as $cat) {
            $slug = Str::slug($cat['slug'] ?: $cat['name']);

            $localCat = Category::where('site_id', $site->id)
                ->where('slug', $slug)
                ->first();

            if ($localCat) {
                $map[$cat['id']] = $localCat->id;
                $existing++;

                continue;
            }

            if ($dryRun) {
                $created++;

                continue;
            }

            $parentId = null;
            if (! empty($cat['parent_id']) && isset($map[$cat['parent_id']])) {
                $parentId = $map[$cat['parent_id']];
            }

            $localCat = Category::create([
                'site_id' => $site->id,
                'parent_id' => $parentId,
                'name' => $cat['name'],
                'slug' => $slug,
                'description' => $cat['description'] ?? null,
                'is_active' => true,
                'sort_order' => 0,
            ]);

            $map[$cat['id']] = $localCat->id;
            $created++;
        }

        if ($created > 0 || $existing > 0) {
            $this->line("  Categories: {$created} new, {$existing} existing");
        }

        return $map;
    }

    /**
     * Import campaigns as RssFeed records.
     */
    private function importCampaigns(Site $site, array $campaigns, array $categoryMap, bool $dryRun): int
    {
        $aiEnabled = $this->option('ai');
        $imagesEnabled = $this->option('images');
        $autoPublish = $this->option('auto-publish');

        $created = 0;
        $skipped = 0;

        foreach ($campaigns as $campaign) {
            $url = $campaign['url'] ?? '';
            if (empty($url)) {
                continue;
            }

            $exists = RssFeed::where('site_id', $site->id)
                ->where('url', $url)
                ->exists();

            if ($exists) {
                $skipped++;

                continue;
            }

            $categoryId = null;
            $wpCatId = $campaign['category_wp_id'] ?? null;
            if ($wpCatId && isset($categoryMap[$wpCatId])) {
                $categoryId = $categoryMap[$wpCatId];
            }

            $fetchInterval = (int) ($campaign['fetch_interval'] ?? 30);
            if (str_contains($url, 'news.google.com') && $fetchInterval > 15) {
                $fetchInterval = 15;
            }

            if (! $dryRun) {
                RssFeed::create([
                    'site_id' => $site->id,
                    'category_id' => $categoryId,
                    'name' => $campaign['name'] ?? 'Imported Campaign',
                    'url' => $url,
                    'source_name' => $campaign['source_name'] ?? parse_url($url, PHP_URL_HOST),
                    'fetch_interval' => $fetchInterval,
                    'is_active' => $campaign['is_active'] ?? true,
                    'auto_publish' => $autoPublish || ($campaign['auto_publish'] ?? true),
                    'ai_rewrite' => $aiEnabled,
                    'ai_language' => $site->language ?? 'en',
                    'fetch_images' => $imagesEnabled,
                ]);
            }

            $created++;
        }

        $source = $campaign['source'] ?? 'mixed';
        $this->line("  Campaigns: {$created} new, {$skipped} skipped [{$source}]");

        return $created;
    }
}
