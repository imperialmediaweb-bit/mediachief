<?php

namespace App\Console\Commands;

use App\Jobs\ImportWordPressJob;
use App\Jobs\ImportWordPressSiteSettingsJob;
use App\Models\Article;
use App\Models\Category;
use App\Models\Page;
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
        {--articles : Import articles directly from export JSON}
        {--articles-api : Import articles via WordPress REST API (queued)}
        {--pages : Import pages from export JSON}
        {--all : Import everything from JSON (articles, pages, settings, campaigns)}
        {--ai : Enable AI rewriting on all campaigns}
        {--images : Enable Pixabay image fetching}
        {--auto-publish : Auto-publish articles}
        {--dry-run : Show what would be imported without making changes}';

    protected $description = 'Complete bulk import: all WordPress sites from export JSON (campaigns, articles, pages, settings, theme, GA, GSC - everything)';

    public function handle(): int
    {
        $dir = $this->option('dir');
        $file = $this->option('file');
        $dryRun = $this->option('dry-run');
        $importAll = $this->option('all');

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

        $totals = [
            'campaigns' => 0,
            'categories' => 0,
            'articles' => 0,
            'pages' => 0,
            'sites_ok' => 0,
            'sites_skip' => 0,
        ];

        foreach ($exports as $export) {
            $siteUrl = $export['site_url'] ?? '';
            $siteName = $export['site_name'] ?? '';
            $domain = parse_url($siteUrl, PHP_URL_HOST);

            if (empty($domain)) {
                $this->warn("Skipping export with no site_url");

                continue;
            }

            $domainClean = preg_replace('/^www\./', '', $domain);

            $this->info("━━━ {$siteName} ({$domain}) ━━━");

            // Find matching MediaChief site
            $site = Site::where('domain', $domain)
                ->orWhere('domain', $domainClean)
                ->orWhere('domain', 'www.' . $domainClean)
                ->first();

            if (! $site) {
                // Auto-create site if it doesn't exist
                if (! $dryRun) {
                    $site = Site::create([
                        'name' => $siteName ?: ucfirst(explode('.', $domainClean)[0]) . ' Express',
                        'slug' => Str::slug($domainClean),
                        'domain' => $domainClean,
                        'wordpress_url' => $siteUrl,
                        'language' => $export['settings']['language'] ?? 'en',
                        'timezone' => $export['settings']['timezone'] ?? 'America/New_York',
                        'is_active' => true,
                    ]);
                    $this->line("  [NEW] Created site: {$site->name} (ID: {$site->id})");
                } else {
                    $this->line("  [DRY] Would create site: {$siteName} ({$domainClean})");
                    $totals['sites_skip']++;
                    $this->newLine();

                    continue;
                }
            } else {
                $this->line("  Matched to: {$site->name} (ID: {$site->id})");
            }

            // 1. Import ALL settings (tracking, theme, SEO, menus, widgets)
            if (! empty($export['settings'])) {
                $this->importSettings($site, $export['settings'], $dryRun);
            }

            // 2. Import categories
            $categoryMap = [];
            if (! empty($export['categories'])) {
                $categoryMap = $this->importCategories($site, $export['categories'], $dryRun);
                $totals['categories'] += count($categoryMap);
            }

            // 3. Import campaigns (RSS feeds / WP Automatic)
            if (! empty($export['campaigns'])) {
                $imported = $this->importCampaigns($site, $export['campaigns'], $categoryMap, $dryRun);
                $totals['campaigns'] += $imported;
            }

            // 4. Import articles directly from JSON
            if (($importAll || $this->option('articles')) && ! empty($export['posts'])) {
                $imported = $this->importArticles($site, $export['posts'], $categoryMap, $dryRun);
                $totals['articles'] += $imported;
            }

            // 5. Import pages from JSON
            if (($importAll || $this->option('pages')) && ! empty($export['pages'])) {
                $imported = $this->importPages($site, $export['pages'], $dryRun);
                $totals['pages'] += $imported;
            }

            // 6. Import site settings via WP API (favicon download, etc.)
            if ($this->option('settings') && ! $dryRun) {
                $wpUrl = $site->wordpress_url ?: $siteUrl;
                ImportWordPressSiteSettingsJob::dispatch(
                    site: $site,
                    wpUrl: $wpUrl,
                );
                $this->line("  [QUEUED] Live settings import (favicon download, GA verify)");
            }

            // 7. Import articles via REST API (alternative to JSON import)
            if ($this->option('articles-api') && ! $dryRun) {
                $wpUrl = $site->wordpress_url ?: $siteUrl;
                ImportWordPressJob::dispatch(
                    site: $site,
                    wpUrl: $wpUrl,
                    page: 1,
                    aiProcess: $this->option('ai'),
                );
                $this->line("  [QUEUED] Article import from WordPress REST API");
            }

            $totals['sites_ok']++;
            $this->newLine();
        }

        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("Import complete!");
        $this->info("  Sites processed: {$totals['sites_ok']}");
        $this->info("  Sites skipped:   {$totals['sites_skip']}");
        $this->info("  Categories:      {$totals['categories']}");
        $this->info("  Campaigns:       {$totals['campaigns']}");
        $this->info("  Articles:        {$totals['articles']}");
        $this->info("  Pages:           {$totals['pages']}");

        if ($this->option('settings')) {
            $this->info("  Live settings:   queued for {$totals['sites_ok']} sites");
        }
        if ($this->option('articles-api')) {
            $this->info("  API articles:    queued for {$totals['sites_ok']} sites");
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
                if (isset($data[0]['site_url'])) {
                    return $data;
                }
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
                    continue;
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
     * Import ALL settings from the export (tracking, theme, SEO, menus, widgets).
     */
    private function importSettings(Site $site, array $settings, bool $dryRun): void
    {
        $tag = $dryRun ? 'DRY' : 'OK';
        $updates = [];

        // --- Tracking / Analytics ---
        $tracking = $settings['tracking'] ?? [];
        if (! empty($tracking)) {
            $existing = $site->analytics ?? [];
            $merged = array_merge($existing, $tracking);

            if ($merged !== $existing) {
                $updates['analytics'] = $merged;
                foreach ($tracking as $key => $value) {
                    if (is_string($value)) {
                        $this->line("  [{$tag}] Analytics: {$key} = {$value}");
                    }
                }
            }
        }

        // --- SEO settings ---
        $seoSettings = $site->seo_settings ?? [];

        // Favicon URL
        if (! empty($settings['favicon_url'])) {
            $seoSettings['wp_favicon_url'] = $settings['favicon_url'];
            $this->line("  [{$tag}] Favicon: {$settings['favicon_url']}");
        }

        // Logo URL
        if (! empty($settings['logo_url'])) {
            $seoSettings['wp_logo_url'] = $settings['logo_url'];
            $this->line("  [{$tag}] Logo: {$settings['logo_url']}");
        }

        // SEO plugin data (Yoast, Rank Math, AIO SEO)
        $seo = $settings['seo'] ?? [];
        if (! empty($seo)) {
            $seoSettings['wp_seo_plugin'] = $seo['plugin'] ?? null;
            $seoSettings['wp_seo_data'] = $seo;
            $this->line("  [{$tag}] SEO plugin: " . ($seo['plugin'] ?? 'none'));
        }

        if (! empty($seoSettings)) {
            $updates['seo_settings'] = $seoSettings;
        }

        // --- Site settings (theme, menus, widgets) ---
        $siteSettings = $site->settings ?? [];

        // Theme
        $wpTheme = $settings['theme'] ?? [];
        if (! empty($wpTheme)) {
            $themeSettings = $siteSettings['theme'] ?? [];

            // Colors
            $colors = $wpTheme['colors'] ?? [];
            if (! empty($colors)) {
                $themeSettings['colors'] = $colors;
                if (! empty($colors['primary_color']) || ! empty($colors['accent_color'])) {
                    $themeSettings['primary_color'] = $colors['primary_color'] ?? $colors['accent_color'] ?? null;
                }
                if (! empty($colors['header_background_color'])) {
                    $themeSettings['nav_bg'] = $colors['header_background_color'];
                }
            }

            // Custom CSS
            if (! empty($wpTheme['custom_css'])) {
                $themeSettings['custom_css'] = $wpTheme['custom_css'];
                $this->line("  [{$tag}] Custom CSS: " . strlen($wpTheme['custom_css']) . " chars");
            }

            // Header/background images
            if (! empty($wpTheme['header_image'])) {
                $themeSettings['header_image'] = $wpTheme['header_image'];
            }
            if (! empty($wpTheme['background_image'])) {
                $themeSettings['background_image'] = $wpTheme['background_image'];
            }

            // Theme info
            $themeSettings['wp_theme_name'] = $wpTheme['name'] ?? null;
            $themeSettings['wp_theme_slug'] = $wpTheme['slug'] ?? null;
            $themeSettings['wp_theme_parent'] = $wpTheme['parent'] ?? null;

            // All theme mods (raw backup)
            if (! empty($wpTheme['all_mods'])) {
                $themeSettings['wp_all_mods'] = $wpTheme['all_mods'];
            }

            $siteSettings['theme'] = $themeSettings;
            $this->line("  [{$tag}] Theme: " . ($wpTheme['name'] ?? 'unknown'));
        }

        // Menus
        $menus = $settings['menus'] ?? [];
        if (! empty($menus)) {
            $siteSettings['menus'] = $menus;
            $this->line("  [{$tag}] Menus: " . count($menus) . " navigation menus");
        }

        // Widgets
        $widgets = $settings['widgets'] ?? [];
        if (! empty($widgets)) {
            $siteSettings['widgets'] = $widgets;
            $totalWidgets = 0;
            foreach ($widgets as $sidebar => $items) {
                $totalWidgets += count($items);
            }
            $this->line("  [{$tag}] Widgets: {$totalWidgets} across " . count($widgets) . " sidebars");
        }

        // Active plugins (for reference)
        $plugins = $settings['active_plugins'] ?? [];
        if (! empty($plugins)) {
            $siteSettings['wp_plugins'] = $plugins;
            $this->line("  [{$tag}] Plugins: " . count($plugins) . " active");
        }

        // Reading/Writing/Discussion settings
        foreach (['reading', 'writing', 'discussion'] as $settingGroup) {
            if (! empty($settings[$settingGroup])) {
                $siteSettings["wp_{$settingGroup}"] = $settings[$settingGroup];
            }
        }

        // General settings
        if (! empty($settings['blogname'])) {
            $siteSettings['wp_blogname'] = $settings['blogname'];
        }
        if (! empty($settings['blogdescription'])) {
            $siteSettings['wp_blogdescription'] = $settings['blogdescription'];
            if (empty($site->description)) {
                $updates['description'] = $settings['blogdescription'];
            }
        }
        if (! empty($settings['permalink_structure'])) {
            $siteSettings['wp_permalink'] = $settings['permalink_structure'];
        }

        if (! empty($siteSettings)) {
            $updates['settings'] = $siteSettings;
        }

        // Update language/timezone if empty
        if (empty($site->language) && ! empty($settings['language'])) {
            $lang = $settings['language'];
            // Convert WP locale (en_US) to simple lang code (en)
            $updates['language'] = strlen($lang) > 2 ? substr($lang, 0, 2) : $lang;
        }
        if (empty($site->timezone) && ! empty($settings['timezone'])) {
            $updates['timezone'] = $settings['timezone'];
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
            $name = $cat['name'] ?? '';
            if (empty($name) || strtolower($name) === 'uncategorized') {
                continue;
            }

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

        $sources = array_unique(array_column($campaigns, 'source'));
        $this->line("  Campaigns: {$created} new, {$skipped} existing [" . implode(', ', $sources) . "]");

        return $created;
    }

    /**
     * Import articles directly from the export JSON (no API needed).
     */
    private function importArticles(Site $site, array $posts, array $categoryMap, bool $dryRun): int
    {
        $imported = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($posts as $post) {
            try {
                $title = $post['title'] ?? '';
                if (empty($title)) {
                    continue;
                }

                // Check duplicate by original_guid or slug
                $guid = $post['original_guid'] ?? $post['guid'] ?? null;
                if ($guid) {
                    $exists = Article::where('site_id', $site->id)
                        ->where('original_guid', $guid)
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }
                }

                $slug = $post['slug'] ?? Str::slug($title);
                $existsBySlug = Article::where('site_id', $site->id)
                    ->where('slug', $slug)
                    ->exists();

                if ($existsBySlug) {
                    $slug = $slug . '-' . Str::random(5);
                }

                // Map category
                $categoryId = null;
                $cats = $post['categories'] ?? [];
                if (! empty($cats)) {
                    $firstCat = is_array($cats[0]) ? $cats[0] : $cats;
                    $wpCatId = $firstCat['term_id'] ?? $firstCat['id'] ?? null;
                    if ($wpCatId && isset($categoryMap[$wpCatId])) {
                        $categoryId = $categoryMap[$wpCatId];
                    } elseif (! empty($firstCat['slug'])) {
                        $localCat = Category::where('site_id', $site->id)
                            ->where('slug', $firstCat['slug'])
                            ->first();
                        $categoryId = $localCat?->id;
                    }
                }

                // Map status
                $wpStatus = $post['status'] ?? 'publish';
                $status = match ($wpStatus) {
                    'publish' => 'published',
                    'draft' => 'draft',
                    'future' => 'scheduled',
                    default => 'draft',
                };

                // Tags
                $tags = $post['tags'] ?? [];
                if (! empty($tags) && is_array($tags[0] ?? null)) {
                    // Tags came as objects with name key
                    $tags = array_column($tags, 'name');
                }

                if (! $dryRun) {
                    Article::create([
                        'site_id' => $site->id,
                        'category_id' => $categoryId,
                        'title' => $title,
                        'slug' => Str::limit($slug, 230, ''),
                        'excerpt' => $post['excerpt'] ?? null,
                        'body' => $post['body'] ?? $post['content'] ?? '',
                        'featured_image' => $post['featured_image'] ?? null,
                        'featured_image_alt' => $post['featured_image_alt'] ?? null,
                        'source_url' => $post['source_url'] ?? null,
                        'source_name' => $post['source_name'] ?? null,
                        'author' => $post['author'] ?? null,
                        'status' => $status,
                        'published_at' => $post['published_at'] ?? null,
                        'tags' => ! empty($tags) ? $tags : null,
                        'original_guid' => $guid,
                    ]);
                }

                $imported++;
            } catch (\Throwable $e) {
                $failed++;
            }
        }

        $this->line("  Articles: {$imported} imported, {$skipped} existing, {$failed} failed");

        return $imported;
    }

    /**
     * Import pages from the export JSON.
     */
    private function importPages(Site $site, array $wpPages, bool $dryRun): int
    {
        $imported = 0;
        $skipped = 0;

        foreach ($wpPages as $page) {
            $title = $page['title'] ?? '';
            if (empty($title)) {
                continue;
            }

            $slug = $page['slug'] ?? Str::slug($title);

            $exists = Page::where('site_id', $site->id)
                ->where('slug', $slug)
                ->exists();

            if ($exists) {
                $skipped++;

                continue;
            }

            if (! $dryRun) {
                Page::create([
                    'site_id' => $site->id,
                    'title' => $title,
                    'slug' => $slug,
                    'body' => $page['content'] ?? $page['body'] ?? '',
                    'template' => $page['template'] ?? 'default',
                    'is_published' => ($page['status'] ?? 'publish') === 'publish',
                    'show_in_menu' => false,
                    'sort_order' => 0,
                ]);
            }

            $imported++;
        }

        $this->line("  Pages: {$imported} imported, {$skipped} existing");

        return $imported;
    }
}
