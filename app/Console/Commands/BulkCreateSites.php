<?php

namespace App\Console\Commands;

use App\Models\Site;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class BulkCreateSites extends Command
{
    protected $signature = 'sites:bulk-create
        {--file= : Path to JSON config file with site definitions}
        {--dry-run : Show what would be created without making changes}';

    protected $description = 'Create multiple sites from a JSON config file (for bulk migration of 50+ WordPress sites)';

    public function handle(): int
    {
        $filePath = $this->option('file');
        $dryRun = $this->option('dry-run');

        if (! $filePath) {
            $filePath = $this->ask('Path to sites JSON file', 'config/sites.json');
        }

        if (! file_exists($filePath)) {
            // Try relative to base_path
            $filePath = base_path($filePath);
        }

        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            $this->info('Create a JSON file based on config/sites-example.json');

            return self::FAILURE;
        }

        $config = json_decode(file_get_contents($filePath), true);

        if (! $config || ! isset($config['sites'])) {
            $this->error('Invalid JSON format. Expected "sites" array.');

            return self::FAILURE;
        }

        $defaults = $config['defaults'] ?? [];
        $sites = $config['sites'];

        $this->info("Found " . count($sites) . " sites to create");
        if ($dryRun) {
            $this->warn('[DRY RUN] No changes will be made.');
        }
        $this->newLine();

        $created = 0;
        $skipped = 0;
        $errors = 0;

        $tableData = [];

        foreach ($sites as $siteData) {
            $domain = $siteData['domain'] ?? '';
            $name = $siteData['name'] ?? '';

            if (empty($domain) || empty($name)) {
                $this->error("  [ERR] Missing domain or name: " . json_encode($siteData));
                $errors++;

                continue;
            }

            // Check if domain already exists
            $existing = Site::where('domain', $domain)->first();

            if ($existing) {
                // Update wordpress_url if missing
                if (empty($existing->wordpress_url) && ! empty($siteData['wordpress_url'])) {
                    if (! $dryRun) {
                        $existing->update(['wordpress_url' => $siteData['wordpress_url']]);
                    }
                    $this->line("  <comment>[UPDATE]</comment> {$domain} - added wordpress_url");
                } else {
                    $this->line("  <comment>[SKIP]</comment> {$domain} - already exists (ID: {$existing->id})");
                }
                $skipped++;
                $tableData[] = [$existing->id ?? '-', $name, $domain, 'EXISTS'];

                continue;
            }

            $slug = Str::slug($siteData['slug'] ?? $name);
            $language = $siteData['language'] ?? $defaults['language'] ?? 'en';
            $timezone = $siteData['timezone'] ?? $defaults['timezone'] ?? 'America/New_York';

            if ($dryRun) {
                $this->line("  [DRY] Would create: {$name} ({$domain})");
                $tableData[] = ['-', $name, $domain, 'WOULD CREATE'];
                $created++;

                continue;
            }

            $site = Site::create([
                'name' => $name,
                'slug' => $slug,
                'domain' => $domain,
                'wordpress_url' => $siteData['wordpress_url'] ?? null,
                'language' => $language,
                'timezone' => $timezone,
                'description' => $siteData['description'] ?? "{$name} - Local News",
                'is_active' => true,
            ]);

            $this->line("  <info>[NEW]</info> #{$site->id} {$name} ({$domain})");
            $tableData[] = [$site->id, $name, $domain, 'CREATED'];
            $created++;
        }

        $this->newLine();
        $this->table(['ID', 'Name', 'Domain', 'Status'], $tableData);
        $this->newLine();
        $this->info("Results: {$created} created, {$skipped} skipped, {$errors} errors");

        return self::SUCCESS;
    }
}
