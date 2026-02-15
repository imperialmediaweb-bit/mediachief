<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\ImportLog;
use App\Models\RssFeed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FetchRssFeedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public RssFeed $rssFeed
    ) {
        $this->onQueue('rss');
    }

    public function handle(): void
    {
        $importLog = ImportLog::create([
            'site_id' => $this->rssFeed->site_id,
            'rss_feed_id' => $this->rssFeed->id,
            'type' => 'rss',
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $response = Http::timeout(30)->get($this->rssFeed->url);

            if (! $response->successful()) {
                $this->rssFeed->markAsError("HTTP {$response->status()}");
                $importLog->markFailed("HTTP error: {$response->status()}");

                return;
            }

            $xml = simplexml_load_string($response->body());

            if ($xml === false) {
                $this->rssFeed->markAsError('Invalid XML');
                $importLog->markFailed('Failed to parse RSS XML');

                return;
            }

            $items = $xml->channel->item ?? $xml->entry ?? [];
            $itemsFound = count($items);
            $imported = 0;
            $skipped = 0;
            $failed = 0;
            $needsProcessing = $this->rssFeed->needsProcessing();

            foreach ($items as $item) {
                try {
                    $guid = (string) ($item->guid ?? $item->id ?? $item->link);
                    $title = (string) ($item->title ?? '');
                    $link = (string) ($item->link ?? '');
                    $description = (string) ($item->description ?? $item->summary ?? '');
                    $content = (string) ($item->children('content', true)->encoded ?? $description);
                    $pubDate = (string) ($item->pubDate ?? $item->published ?? $item->updated ?? '');
                    $author = (string) ($item->author ?? $item->children('dc', true)->creator ?? '');

                    if (empty($title) || empty($guid)) {
                        $skipped++;

                        continue;
                    }

                    // Check for duplicate
                    $exists = Article::where('site_id', $this->rssFeed->site_id)
                        ->where('original_guid', $guid)
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }

                    // Extract first image from content
                    $image = null;
                    if (preg_match('/<img[^>]+src=["\']([^"\']+)/', $content, $matches)) {
                        $image = $matches[1];
                    }

                    // If AI processing is enabled, save as draft first
                    // ProcessArticleJob will rewrite + add image + publish
                    $shouldPublishDirectly = $this->rssFeed->auto_publish && ! $needsProcessing;

                    $article = Article::create([
                        'site_id' => $this->rssFeed->site_id,
                        'category_id' => $this->rssFeed->category_id,
                        'rss_feed_id' => $this->rssFeed->id,
                        'title' => Str::limit($title, 255, ''),
                        'slug' => Str::slug(Str::limit($title, 200, '')).'-'.Str::random(5),
                        'excerpt' => Str::limit(strip_tags($description), 500, ''),
                        'body' => $content,
                        'featured_image' => $image,
                        'source_url' => $link,
                        'source_name' => $this->rssFeed->source_name ?? parse_url($link, PHP_URL_HOST),
                        'author' => $author ?: null,
                        'status' => $shouldPublishDirectly ? 'published' : 'draft',
                        'published_at' => $shouldPublishDirectly && $pubDate
                            ? date('Y-m-d H:i:s', strtotime($pubDate))
                            : ($pubDate ? date('Y-m-d H:i:s', strtotime($pubDate)) : null),
                        'original_guid' => $guid,
                    ]);

                    // Dispatch AI processing job if feed has AI rewrite or Pixabay enabled
                    if ($needsProcessing) {
                        ProcessArticleJob::dispatch($article);
                    }

                    $imported++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning("RSS item import failed: {$e->getMessage()}", [
                        'feed_id' => $this->rssFeed->id,
                    ]);
                }
            }

            $this->rssFeed->markAsFetched();

            $importLog->update([
                'status' => 'completed',
                'items_found' => $itemsFound,
                'items_imported' => $imported,
                'items_skipped' => $skipped,
                'items_failed' => $failed,
                'completed_at' => now(),
                'summary' => "Found: {$itemsFound}, Imported: {$imported}, Skipped: {$skipped}, Failed: {$failed}"
                    .($needsProcessing ? ' (AI processing queued)' : ''),
            ]);
        } catch (\Throwable $e) {
            $this->rssFeed->markAsError($e->getMessage());
            $importLog->markFailed($e->getMessage());

            Log::error("RSS feed fetch failed: {$e->getMessage()}", [
                'feed_id' => $this->rssFeed->id,
            ]);

            throw $e;
        }
    }
}
