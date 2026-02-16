<?php

namespace App\Jobs;

use App\Models\ImportLog;
use App\Models\Site;
use App\Services\WordPressSiteSettingsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ImportWordPressSiteSettingsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $backoff = 30;

    public int $timeout = 120;

    public function __construct(
        public Site $site,
        public string $wpUrl,
    ) {
        $this->onQueue('rss');
    }

    public function handle(WordPressSiteSettingsService $service): void
    {
        $importLog = ImportLog::create([
            'site_id' => $this->site->id,
            'type' => 'wordpress',
            'status' => 'running',
            'started_at' => now(),
            'summary' => "Importing site settings from {$this->wpUrl}",
        ]);

        try {
            $results = $service->importAll($this->site, $this->wpUrl);

            $imported = 0;
            $details = [];

            if (! empty($results['favicon'])) {
                $imported++;
                $details[] = 'Favicon downloaded';
            }

            foreach ($results['analytics'] as $key => $value) {
                $imported++;
                $details[] = "{$key}: {$value}";
            }

            foreach ($results['seo'] as $key => $value) {
                $imported++;
                $label = str_replace('_', ' ', $key);
                $details[] = "{$label} imported";
            }

            if (! empty($results['site_info']['name'])) {
                $details[] = "WP site: {$results['site_info']['name']}";
            }

            $importLog->update([
                'status' => 'completed',
                'items_found' => count($details),
                'items_imported' => $imported,
                'completed_at' => now(),
                'summary' => 'Settings imported: ' . implode(', ', $details ?: ['No settings found']),
            ]);

            Log::info('WP site settings import complete', [
                'site_id' => $this->site->id,
                'results' => $details,
            ]);
        } catch (\Throwable $e) {
            $importLog->markFailed($e->getMessage());

            Log::error('WP site settings import failed', [
                'site_id' => $this->site->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
