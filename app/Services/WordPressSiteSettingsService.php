<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WordPressSiteSettingsService
{
    /**
     * Import all settings from a WordPress site.
     * Extracts: favicon, Google Analytics, Search Console, site info.
     *
     * @return array{favicon: ?string, analytics: array, seo: array, site_info: array}
     */
    public function importAll(Site $site, string $wpUrl): array
    {
        $baseUrl = rtrim($wpUrl, '/');
        $results = [
            'favicon' => null,
            'analytics' => [],
            'seo' => [],
            'site_info' => [],
        ];

        // 1. Fetch homepage HTML for favicon, GA, Search Console
        $html = $this->fetchHomepage($baseUrl);

        if ($html) {
            // Extract favicon
            $faviconUrl = $this->extractFaviconUrl($html, $baseUrl);
            if ($faviconUrl) {
                $localPath = $this->downloadFavicon($faviconUrl, $site->id);
                if ($localPath) {
                    $results['favicon'] = $localPath;
                }
            }

            // Extract Google Analytics
            $gaData = $this->extractGoogleAnalytics($html);
            if (! empty($gaData)) {
                $results['analytics'] = array_merge($results['analytics'], $gaData);
            }

            // Extract Google Search Console verification
            $gscData = $this->extractSearchConsole($html);
            if (! empty($gscData)) {
                $results['seo'] = array_merge($results['seo'], $gscData);
            }

            // Extract other meta tags (description, keywords, etc.)
            $metaData = $this->extractMetaTags($html);
            if (! empty($metaData)) {
                $results['seo'] = array_merge($results['seo'], $metaData);
            }
        }

        // 2. Fetch site info from WP REST API
        $siteInfo = $this->fetchSiteInfo($baseUrl);
        if ($siteInfo) {
            $results['site_info'] = $siteInfo;
        }

        // 3. Apply results to the site model
        $this->applyToSite($site, $results);

        Log::info('WordPressSiteSettings: import complete', [
            'site_id' => $site->id,
            'favicon' => $results['favicon'] ? 'downloaded' : 'not found',
            'analytics_keys' => array_keys($results['analytics']),
            'seo_keys' => array_keys($results['seo']),
        ]);

        return $results;
    }

    /**
     * Fetch the homepage HTML.
     */
    protected function fetchHomepage(string $baseUrl): ?string
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; MediaChief/1.0)',
                    'Accept' => 'text/html',
                ])
                ->get($baseUrl);

            if ($response->successful()) {
                return $response->body();
            }
        } catch (\Throwable $e) {
            Log::warning('WordPressSiteSettings: failed to fetch homepage', [
                'url' => $baseUrl,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Extract favicon URL from HTML.
     * Checks: <link rel="icon">, <link rel="shortcut icon">, <link rel="apple-touch-icon">
     */
    protected function extractFaviconUrl(string $html, string $baseUrl): ?string
    {
        $patterns = [
            // Standard favicon
            '/<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']+)["\'][^>]*>/i',
            // Reverse attribute order
            '/<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'](?:shortcut )?icon["\'][^>]*>/i',
            // Apple touch icon
            '/<link[^>]*rel=["\']apple-touch-icon["\'][^>]*href=["\']([^"\']+)["\'][^>]*>/i',
            '/<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']apple-touch-icon["\'][^>]*>/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $matches)) {
                $faviconUrl = $matches[1];

                // Make absolute URL
                if (str_starts_with($faviconUrl, '//')) {
                    $faviconUrl = 'https:' . $faviconUrl;
                } elseif (str_starts_with($faviconUrl, '/')) {
                    $faviconUrl = $baseUrl . $faviconUrl;
                } elseif (! str_starts_with($faviconUrl, 'http')) {
                    $faviconUrl = $baseUrl . '/' . $faviconUrl;
                }

                return $faviconUrl;
            }
        }

        // Try default /favicon.ico
        try {
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->head($baseUrl . '/favicon.ico');

            if ($response->successful()) {
                return $baseUrl . '/favicon.ico';
            }
        } catch (\Throwable $e) {
            // Ignore
        }

        return null;
    }

    /**
     * Download a favicon and store it locally.
     */
    protected function downloadFavicon(string $url, int $siteId): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $content = $response->body();
            if (strlen($content) < 100) {
                return null; // Too small, probably an error page
            }

            // Detect extension from URL or content-type
            $contentType = $response->header('Content-Type', '');
            $ext = match (true) {
                str_contains($contentType, 'png') => 'png',
                str_contains($contentType, 'svg') => 'svg',
                str_contains($contentType, 'gif') => 'gif',
                str_contains($contentType, 'webp') => 'webp',
                str_contains($url, '.png') => 'png',
                str_contains($url, '.svg') => 'svg',
                str_contains($url, '.gif') => 'gif',
                str_contains($url, '.webp') => 'webp',
                default => 'ico',
            };

            $filename = "sites/favicons/site-{$siteId}-favicon.{$ext}";
            Storage::disk('public')->put($filename, $content);

            return $filename;
        } catch (\Throwable $e) {
            Log::warning('WordPressSiteSettings: failed to download favicon', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Extract Google Analytics tracking IDs from HTML.
     * Supports: gtag.js (GA4), analytics.js (Universal), old ga.js
     */
    protected function extractGoogleAnalytics(string $html): array
    {
        $analytics = [];

        // GA4 / gtag.js: G-XXXXXXXXXX or GT-XXXXXXXXXX
        if (preg_match('/gtag\s*\(\s*[\'"]config[\'"]\s*,\s*[\'"]([G|GT]-[A-Z0-9]+)[\'"]/i', $html, $m)) {
            $analytics['google_analytics_4'] = $m[1];
        }

        // Also check script src for gtag
        if (preg_match('/googletagmanager\.com\/gtag\/js\?id=([G|GT]-[A-Z0-9]+)/i', $html, $m)) {
            $analytics['google_analytics_4'] = $m[1];
        }

        // Universal Analytics: UA-XXXXXXX-X
        if (preg_match('/[\'"]?(UA-\d{4,}-\d{1,})[\'"]?/i', $html, $m)) {
            $analytics['google_analytics_ua'] = $m[1];
        }

        // Google Tag Manager: GTM-XXXXXXX
        if (preg_match('/GTM-[A-Z0-9]{5,}/i', $html, $m)) {
            $analytics['google_tag_manager'] = $m[0];
        }

        // Google AdSense: ca-pub-XXXXXXXXXX
        if (preg_match('/ca-pub-(\d+)/i', $html, $m)) {
            $analytics['google_adsense'] = 'ca-pub-' . $m[1];
        }

        // Facebook Pixel
        if (preg_match('/fbq\s*\(\s*[\'"]init[\'"]\s*,\s*[\'"](\d+)[\'"]\)/', $html, $m)) {
            $analytics['facebook_pixel'] = $m[1];
        }

        return $analytics;
    }

    /**
     * Extract Google Search Console verification meta tag.
     */
    protected function extractSearchConsole(string $html): array
    {
        $seo = [];

        // Google Search Console verification
        if (preg_match('/<meta\s+name=["\']google-site-verification["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $seo['google_site_verification'] = $m[1];
        }
        // Reverse attribute order
        if (preg_match('/<meta\s+content=["\']([^"\']+)["\']\s+name=["\']google-site-verification["\']/i', $html, $m)) {
            $seo['google_site_verification'] = $m[1];
        }

        // Bing Webmaster Tools
        if (preg_match('/<meta\s+name=["\']msvalidate\.01["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $seo['bing_verification'] = $m[1];
        }

        // Yandex verification
        if (preg_match('/<meta\s+name=["\']yandex-verification["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $seo['yandex_verification'] = $m[1];
        }

        return $seo;
    }

    /**
     * Extract useful meta tags from HTML.
     */
    protected function extractMetaTags(string $html): array
    {
        $meta = [];

        // Meta description
        if (preg_match('/<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $meta['meta_description'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        // Meta keywords
        if (preg_match('/<meta\s+name=["\']keywords["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $meta['meta_keywords'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        // Open Graph image (og:image) - useful as a fallback site logo
        if (preg_match('/<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $meta['og_image'] = $m[1];
        }

        // Robots meta
        if (preg_match('/<meta\s+name=["\']robots["\']\s+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $meta['robots'] = $m[1];
        }

        return $meta;
    }

    /**
     * Fetch site info from WordPress REST API root.
     */
    protected function fetchSiteInfo(string $baseUrl): ?array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get($baseUrl . '/wp-json/');

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            return [
                'name' => $data['name'] ?? null,
                'description' => $data['description'] ?? null,
                'url' => $data['url'] ?? null,
                'gmt_offset' => $data['gmt_offset'] ?? null,
                'timezone_string' => $data['timezone_string'] ?? null,
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Apply imported settings to the Site model.
     */
    protected function applyToSite(Site $site, array $results): void
    {
        $updates = [];

        // Favicon
        if (! empty($results['favicon'])) {
            $updates['favicon'] = $results['favicon'];
        }

        // Analytics (merge with existing)
        if (! empty($results['analytics'])) {
            $existing = $site->analytics ?? [];
            $updates['analytics'] = array_merge($existing, $results['analytics']);
        }

        // SEO settings (merge with existing)
        if (! empty($results['seo'])) {
            $existing = $site->seo_settings ?? [];
            $updates['seo_settings'] = array_merge($existing, $results['seo']);
        }

        // Site info (update description if empty)
        if (! empty($results['site_info'])) {
            if (empty($site->description) && ! empty($results['site_info']['description'])) {
                $updates['description'] = $results['site_info']['description'];
            }

            // Store timezone from WordPress
            if (! empty($results['site_info']['timezone_string'])) {
                $updates['settings'] = array_merge($site->settings ?? [], [
                    'wp_timezone' => $results['site_info']['timezone_string'],
                ]);
            }
        }

        if (! empty($updates)) {
            $site->update($updates);
        }
    }
}
