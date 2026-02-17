<?php

namespace App\Console\Commands;

use App\Models\Site;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class ImportWordPressTheme extends Command
{
    protected $signature = 'wp:import-template {--site= : Site ID or slug} {--url= : Override WordPress URL} {--force : Overwrite existing templates}';

    protected $description = 'Import the complete WordPress theme (HTML shell, CSS, fonts, JS) for an exact design replica';

    private string $wpUrl = '';
    private string $wpOrigin = '';
    private string $outputDir = '';
    private string $cssDir = '';

    public function handle(): int
    {
        $siteOption = $this->option('site');
        $site = $siteOption
            ? Site::where('id', $siteOption)->orWhere('slug', $siteOption)->first()
            : Site::first();

        if (! $site) {
            $this->error('No site found.');

            return 1;
        }

        $this->wpUrl = $this->option('url') ?: rtrim($site->wordpress_url ?? '', '/');
        if (! $this->wpUrl) {
            $this->error("Site '{$site->name}' has no wordpress_url configured.");

            return 1;
        }

        $parsed = parse_url($this->wpUrl);
        $this->wpOrigin = ($parsed['scheme'] ?? 'http') . '://' . ($parsed['host'] ?? '');

        $this->outputDir = storage_path('app/wp-theme');
        $this->cssDir = public_path('css/wp-theme');

        // Check if templates already exist
        if (! $this->option('force') && file_exists($this->outputDir . '/shell_before.html')) {
            $this->info('WordPress templates already imported. Use --force to re-import.');

            return 0;
        }

        File::ensureDirectoryExists($this->outputDir);
        File::ensureDirectoryExists($this->cssDir);

        $this->info('=== WordPress Full Template Import ===');
        $this->info("Source: {$this->wpUrl}");
        $this->info("Site:   {$site->name} (ID: {$site->id})");
        $this->newLine();

        // Step 1: Fetch the WordPress homepage HTML
        $this->info('[1/6] Fetching WordPress homepage...');
        $html = $this->fetchUrl($this->wpUrl);
        if (! $html) {
            return 1;
        }
        $this->info('  Got ' . number_format(strlen($html)) . ' bytes');

        // Save original HTML for reference
        file_put_contents($this->outputDir . '/original.html', $html);

        // Step 2: Download all CSS files and rewrite links to local
        $this->info('[2/6] Downloading CSS stylesheets...');
        $html = $this->downloadAndLocalizeCSS($html);

        // Step 3: Keep Google Fonts as CDN
        $this->info('[3/6] Processing Google Fonts...');
        $html = $this->processGoogleFonts($html);

        // Step 4: Rewrite image/asset URLs to absolute
        $this->info('[4/6] Rewriting asset URLs to absolute...');
        $html = $this->rewriteAssetUrls($html);

        // Step 5: Normalize internal navigation links
        $this->info('[5/6] Normalizing internal links...');
        $html = $this->normalizeInternalLinks($html);

        // Step 6: Split into before/after shell templates
        $this->info('[6/6] Splitting HTML into shell templates...');
        $result = $this->splitAndSaveTemplates($html, $site);

        if (! $result) {
            return 1;
        }

        $this->newLine();
        $this->info('=== Import Complete! ===');
        $this->info("Templates: {$this->outputDir}/");
        $this->info("CSS:       {$this->cssDir}/");
        $this->info('The frontend will now use the exact WordPress design.');
        $this->newLine();

        return 0;
    }

    /**
     * Fetch a URL with browser-like headers.
     */
    private function fetchUrl(string $url): ?string
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.5',
                ])
                ->get($url);

            if (! $response->successful()) {
                $this->error("  HTTP {$response->status()} fetching {$url}");

                return null;
            }

            return $response->body();
        } catch (\Exception $e) {
            $this->error("  Failed: {$e->getMessage()}");

            return null;
        }
    }

    /**
     * Download all CSS stylesheets, save locally, rewrite <link> tags to point to local files.
     */
    private function downloadAndLocalizeCSS(string $html): string
    {
        // Find all <link rel="stylesheet"> tags
        preg_match_all('/<link[^>]+rel=["\']stylesheet["\'][^>]*>/i', $html, $matches);

        $cssCount = 0;
        $combinedCss = "/* WordPress Theme CSS - imported from {$this->wpUrl} */\n";
        $combinedCss .= "/* Imported: " . now()->toIso8601String() . " */\n\n";

        foreach ($matches[0] as $tag) {
            if (! preg_match('/href=["\']([^"\']+)["\']/i', $tag, $hrefMatch)) {
                continue;
            }

            $cssUrl = $this->makeAbsolute($hrefMatch[1]);

            // Skip Google Fonts (handled separately) and external analytics/ad CSS
            if (str_contains($cssUrl, 'fonts.googleapis.com')
                || str_contains($cssUrl, 'googleapis.com/css')
                || str_contains($cssUrl, 'googlesyndication')
                || str_contains($cssUrl, 'googletagmanager')) {
                continue;
            }

            try {
                $cssContent = $this->fetchUrl($cssUrl);
                if (! $cssContent) {
                    continue;
                }

                // Rewrite relative URLs inside CSS to absolute
                $cssContent = $this->rewriteCssUrls($cssContent, $cssUrl);

                $filename = 'wp-' . str_pad((string) $cssCount, 3, '0', STR_PAD_LEFT) . '-' . $this->sanitizeFilename(basename(parse_url($cssUrl, PHP_URL_PATH) ?: 'style.css'));
                file_put_contents($this->cssDir . '/' . $filename, $cssContent);

                $combinedCss .= "/* Source: {$cssUrl} */\n{$cssContent}\n\n";

                // Replace the external URL with local path in the HTML
                $html = str_replace($hrefMatch[1], '/css/wp-theme/' . $filename, $html);

                $cssCount++;
                $shortName = mb_substr(basename(parse_url($cssUrl, PHP_URL_PATH) ?: '?'), 0, 55);
                $this->line("  [{$cssCount}] {$shortName}");
            } catch (\Exception $e) {
                $this->warn('  Skipped: ' . basename(parse_url($cssUrl, PHP_URL_PATH) ?: '?'));
            }
        }

        // Extract inline <style> blocks from <head>
        if (preg_match('/<head[^>]*>(.*?)<\/head>/is', $html, $headMatch)) {
            preg_match_all('/<style[^>]*>(.*?)<\/style>/is', $headMatch[1], $styleMatches);
            foreach ($styleMatches[1] as $inlineStyle) {
                $trimmed = trim($inlineStyle);
                if (strlen($trimmed) > 20) {
                    $combinedCss .= "/* Inline <style> from <head> */\n{$trimmed}\n\n";
                }
            }
        }

        // Save combined CSS as well
        file_put_contents($this->cssDir . '/combined.css', $combinedCss);

        $this->info("  Total: {$cssCount} stylesheets (" . number_format(strlen($combinedCss)) . ' bytes)');

        return $html;
    }

    /**
     * Ensure Google Fonts links use https.
     */
    private function processGoogleFonts(string $html): string
    {
        $html = preg_replace('/href=["\']http:\/\/fonts\.googleapis\.com/', 'href="https://fonts.googleapis.com', $html);

        preg_match_all('/fonts\.googleapis\.com\/css[^"\']+/i', $html, $fontMatches);
        $count = count(array_unique($fontMatches[0]));
        $this->info("  {$count} Google Fonts families (kept as CDN)");

        return $html;
    }

    /**
     * Rewrite relative src/srcset and background-image URLs to absolute.
     */
    private function rewriteAssetUrls(string $html): string
    {
        // Rewrite src="..." and srcset="..." relative URLs
        $html = preg_replace_callback(
            '/(src|srcset)=["\'](?!https?:|\/\/|data:|#)([^"\']+)["\']/i',
            function ($match) {
                return $match[1] . '="' . $this->makeAbsolute($match[2]) . '"';
            },
            $html
        );

        // Protocol-relative to https
        $html = str_replace('src="//', 'src="https://', $html);
        $html = str_replace('href="//', 'href="https://', $html);

        $this->info('  Asset URLs rewritten to absolute');

        return $html;
    }

    /**
     * Normalize internal WP links to relative paths for the Laravel domain.
     */
    private function normalizeInternalLinks(string $html): string
    {
        $wpHost = parse_url($this->wpUrl, PHP_URL_HOST);
        if (! $wpHost) {
            return $html;
        }

        // Convert href="http(s)://wp-host/path" to href="/path"
        $count = 0;
        $html = preg_replace_callback(
            '/href=["\']https?:\/\/' . preg_quote($wpHost, '/') . '\/?([^"\']*)["\']/',
            function ($match) use (&$count) {
                $count++;

                return 'href="/' . $match[1] . '"';
            },
            $html
        );

        $this->info("  {$count} internal links normalized");

        return $html;
    }

    /**
     * Split the full HTML into shell_before and shell_after templates.
     */
    private function splitAndSaveTemplates(string $html, Site $site): bool
    {
        $contentStart = null;
        $contentWrapper = '';
        $strategy = '';

        // Strategy 1: Newspaper theme main content wrapper
        if (preg_match('/<div[^>]*class="[^"]*td-main-content-wrap[^"]*"[^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = 'td-main-content-wrap';
        }
        // Strategy 2: Newspaper theme container
        elseif (preg_match('/<div[^>]*class="[^"]*td-container-wrap[^"]*"[^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = 'td-container-wrap';
        }
        // Strategy 3: Generic WordPress #content
        elseif (preg_match('/<div[^>]*id=["\']content["\'][^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = '#content';
        }
        // Strategy 4: <main> tag
        elseif (preg_match('/<main[^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = '<main>';
        }
        // Strategy 5: role="main"
        elseif (preg_match('/<[^>]+role=["\']main["\'][^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = 'role=main';
        }
        // Strategy 6: .content-area or .site-content
        elseif (preg_match('/<div[^>]*class="[^"]*(?:content-area|site-content)[^"]*"[^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
            $contentStart = $match[0][1];
            $contentWrapper = $match[0][0];
            $strategy = '.content-area';
        }

        $beforeContent = '';
        $afterContent = '';

        if ($contentStart === null) {
            $this->warn('  Could not identify content area. Using <body> split.');
            if (preg_match('/<body[^>]*>/is', $html, $match, PREG_OFFSET_CAPTURE)) {
                $bodyEnd = $match[0][1] + strlen($match[0][0]);
                $beforeContent = substr($html, 0, $bodyEnd);
                $bodyClosePos = strripos($html, '</body>');
                $afterContent = $bodyClosePos ? substr($html, $bodyClosePos) : '</body></html>';
                $strategy = 'body-fallback';
            } else {
                $this->error('  Cannot parse HTML structure.');
                file_put_contents($this->outputDir . '/failed_parse.html', $html);

                return false;
            }
        } else {
            $this->info("  Content area found via: {$strategy}");

            // Find the footer/end boundary
            $footerPos = $this->findFooterPosition($html, $contentStart);

            if ($footerPos && $footerPos > $contentStart) {
                $beforeContent = substr($html, 0, $contentStart + strlen($contentWrapper));

                // Count unclosed divs between content start and footer
                $between = substr($html, $contentStart, $footerPos - $contentStart);
                $opens = preg_match_all('/<div[^>]*>/i', $between);
                $closes = preg_match_all('/<\/div>/i', $between);
                $unclosed = max(0, $opens - $closes);

                $closingDivs = str_repeat("</div>\n", $unclosed);
                $afterContent = $closingDivs . substr($html, $footerPos);

                $this->info('  Footer found, shell split complete');
            } else {
                $beforeContent = substr($html, 0, $contentStart + strlen($contentWrapper));
                $bodyClosePos = strripos($html, '</body>');
                $afterContent = $bodyClosePos ? substr($html, $bodyClosePos) : '</body></html>';

                $this->warn('  No footer marker found, using </body> as end');
            }
        }

        // Replace the WP <title> with our placeholder
        $beforeContent = preg_replace(
            '/<title>[^<]*<\/title>/i',
            '<title><!-- MC_TITLE --></title>',
            $beforeContent
        );

        // Add placeholder for analytics/extra head content before </head>
        $beforeContent = str_replace(
            '</head>',
            "<!-- MC_HEAD_EXTRA -->\n</head>",
            $beforeContent
        );

        // Add placeholder for body-start content (GTM noscript, etc.)
        if (preg_match('/(<body[^>]*>)/is', $beforeContent, $bodyMatch)) {
            $beforeContent = preg_replace(
                '/(<body[^>]*>)/is',
                '$1' . "\n<!-- MC_BODY_START -->",
                $beforeContent,
                1
            );
        }

        // Extract and save sidebar
        $this->extractSidebar($html);

        // Save templates
        file_put_contents($this->outputDir . '/shell_before.html', $beforeContent);
        file_put_contents($this->outputDir . '/shell_after.html', $afterContent);

        // Save metadata
        $metadata = [
            'imported_at' => now()->toIso8601String(),
            'source_url' => $this->wpUrl,
            'site_id' => $site->id,
            'site_name' => $site->name,
            'strategy' => $strategy,
            'shell_before_size' => strlen($beforeContent),
            'shell_after_size' => strlen($afterContent),
            'content_wrapper' => $contentWrapper,
        ];
        file_put_contents($this->outputDir . '/metadata.json', json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->info('  shell_before.html: ' . number_format(strlen($beforeContent)) . ' bytes');
        $this->info('  shell_after.html:  ' . number_format(strlen($afterContent)) . ' bytes');

        return true;
    }

    /**
     * Find the footer start position in the HTML.
     */
    private function findFooterPosition(string $html, int $afterPosition): ?int
    {
        $patterns = [
            '/<div[^>]*class="[^"]*td-footer-wrap[^"]*"[^>]*>/is',
            '/<div[^>]*class="[^"]*td-sub-footer[^"]*"[^>]*>/is',
            '/<footer[^>]*class="[^"]*td-footer[^"]*"[^>]*>/is',
            '/<footer[^>]*>/is',
            '/<div[^>]*id=["\']footer["\'][^>]*>/is',
            '/<div[^>]*class="[^"]*site-footer[^"]*"[^>]*>/is',
            '/<div[^>]*class="[^"]*footer-wrap[^"]*"[^>]*>/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $match, PREG_OFFSET_CAPTURE, $afterPosition)) {
                return $match[0][1];
            }
        }

        return null;
    }

    /**
     * Extract the sidebar HTML for separate use.
     */
    private function extractSidebar(string $html): void
    {
        $patterns = [
            // Newspaper theme sidebar
            '/<div[^>]*class="[^"]*td-pb-span4[^"]*td-main-sidebar[^"]*"[^>]*>.*?<\/div>\s*<!--\s*\.?td-main-sidebar\s*-->/is',
            '/<div[^>]*class="[^"]*td-main-sidebar[^"]*"[^>]*>.*?(?=<div[^>]*class="[^"]*td-footer)/is',
            // Generic WordPress sidebar
            '/<aside[^>]*class="[^"]*widget-area[^"]*"[^>]*>.*?<\/aside>/is',
            '/<aside[^>]*id=["\']secondary["\'][^>]*>.*?<\/aside>/is',
            '/<div[^>]*id=["\']sidebar["\'][^>]*>.*?<\/div>(?=\s*<(?:\/div|footer))/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $match)) {
                file_put_contents($this->outputDir . '/sidebar.html', $match[0]);
                $this->info('  Sidebar extracted (' . number_format(strlen($match[0])) . ' bytes)');

                return;
            }
        }

        $this->warn('  No sidebar found in WordPress HTML');
    }

    /**
     * Make a URL absolute using the WP origin.
     */
    private function makeAbsolute(string $url): string
    {
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }
        if (str_starts_with($url, '//')) {
            return 'https:' . $url;
        }
        if (str_starts_with($url, '/')) {
            return $this->wpOrigin . $url;
        }

        return $this->wpOrigin . '/' . $url;
    }

    /**
     * Rewrite relative URLs inside CSS content to absolute URLs.
     */
    private function rewriteCssUrls(string $css, string $cssFileUrl): string
    {
        $cssDir = dirname($cssFileUrl);

        return preg_replace_callback(
            '/url\(\s*["\']?(?!data:|https?:|\/\/)([^"\')\s]+)["\']?\s*\)/i',
            function ($match) use ($cssDir) {
                $relPath = $match[1];
                if (str_starts_with($relPath, '/')) {
                    return "url({$this->wpOrigin}{$relPath})";
                }
                $resolved = $cssDir . '/' . $relPath;
                while (str_contains($resolved, '/../')) {
                    $resolved = preg_replace('/[^\/]+\/\.\.\//', '', $resolved, 1);
                }

                return "url({$resolved})";
            },
            $css
        );
    }

    /**
     * Sanitize a string for use as a filename.
     */
    private function sanitizeFilename(string $name): string
    {
        $name = preg_replace('/\?.*$/', '', $name);
        $name = preg_replace('/[^a-zA-Z0-9._-]/', '', $name);

        return $name ?: 'style.css';
    }
}
