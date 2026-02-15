<?php

namespace App\Console\Commands;

use App\Jobs\FetchRssFeedJob;
use App\Models\RssFeed;
use Illuminate\Console\Command;

class FetchRssFeeds extends Command
{
    protected $signature = 'rss:fetch {--site= : Fetch feeds for a specific site ID} {--feed= : Fetch a specific feed ID}';

    protected $description = 'Dispatch RSS feed fetch jobs for active feeds that are due';

    public function handle(): int
    {
        $query = RssFeed::where('is_active', true);

        if ($feedId = $this->option('feed')) {
            $query->where('id', $feedId);
        }

        if ($siteId = $this->option('site')) {
            $query->where('site_id', $siteId);
        }

        // Only fetch feeds that are due based on their fetch_interval
        $query->where(function ($q) {
            $q->whereNull('last_fetched_at')
                ->orWhereRaw('last_fetched_at < NOW() - INTERVAL fetch_interval MINUTE');
        });

        $feeds = $query->get();

        $this->info("Dispatching {$feeds->count()} feed fetch jobs...");

        foreach ($feeds as $feed) {
            FetchRssFeedJob::dispatch($feed);
            $this->line("  Dispatched: {$feed->name} ({$feed->url})");
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}
