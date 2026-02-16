<?php

namespace App\Console\Commands;

use App\Models\Site;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ImportWordPressTheme extends Command
{
    protected $signature = 'wp:import-theme-css {--site= : Site ID or slug}';

    protected $description = 'Import CSS/styles from the WordPress site to replicate the exact theme design';

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

        $wpUrl = rtrim($site->wordpress_url ?? '', '/');
        if (! $wpUrl) {
            $this->error("Site '{$site->name}' has no wordpress_url configured.");
            return 1;
        }

        $this->info("Importing theme CSS from: {$wpUrl}");
        $this->info("Site: {$site->name} (ID: {$site->id})");
        $this->newLine();

        // Step 1: Fetch the WordPress homepage HTML
        $this->info('[1/4] Fetching WordPress homepage...');
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                ])
                ->get($wpUrl);

            if (! $response->successful()) {
                $this->error("Failed to fetch {$wpUrl} (HTTP {$response->status()})");
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("Connection failed: {$e->getMessage()}");
            return 1;
        }

        $html = $response->body();
        $this->info('  Got ' . strlen($html) . ' bytes');

        // Step 2: Extract all CSS stylesheet URLs
        $this->info('[2/4] Extracting CSS stylesheet URLs...');
        $cssUrls = $this->extractCssUrls($html, $wpUrl);

        if (empty($cssUrls)) {
            $this->warn('No CSS stylesheets found in the HTML.');
            return 1;
        }

        $this->info("  Found " . count($cssUrls) . " stylesheets");
        foreach ($cssUrls as $url) {
            $this->line("    - {$url}");
        }

        // Step 3: Download all CSS files
        $this->info('[3/4] Downloading CSS files...');
        $outputDir = public_path('css/wp-theme');
        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $combinedCss = "/* WordPress Theme CSS - imported from {$wpUrl} */\n";
        $combinedCss .= "/* Site: {$site->name} | Imported: " . now()->toIso8601String() . " */\n\n";

        $downloaded = 0;
        foreach ($cssUrls as $cssUrl) {
            try {
                $cssResponse = Http::timeout(15)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer' => $wpUrl,
                    ])
                    ->get($cssUrl);

                if ($cssResponse->successful()) {
                    $css = $cssResponse->body();
                    // Rewrite relative URLs in CSS to absolute
                    $css = $this->rewriteCssUrls($css, $cssUrl, $wpUrl);
                    $combinedCss .= "/* Source: {$cssUrl} */\n{$css}\n\n";
                    $downloaded++;
                    $this->info("  Downloaded: " . basename(parse_url($cssUrl, PHP_URL_PATH)));
                } else {
                    $this->warn("  Skipped (HTTP {$cssResponse->status()}): " . basename(parse_url($cssUrl, PHP_URL_PATH)));
                }
            } catch (\Exception $e) {
                $this->warn("  Failed: " . basename(parse_url($cssUrl, PHP_URL_PATH)) . " - {$e->getMessage()}");
            }
        }

        // Step 4: Extract inline <style> blocks from <head>
        $this->info('[3.5/4] Extracting inline styles...');
        $inlineStyles = $this->extractInlineStyles($html);
        if ($inlineStyles) {
            $combinedCss .= "/* Inline styles from <head> */\n{$inlineStyles}\n\n";
            $this->info("  Extracted inline styles (" . strlen($inlineStyles) . " bytes)");
        }

        // Save combined CSS
        $outputFile = $outputDir . '/newspaper.css';
        file_put_contents($outputFile, $combinedCss);
        $this->info("[4/4] Saved combined CSS to: public/css/wp-theme/newspaper.css");
        $this->info("  Total size: " . number_format(strlen($combinedCss)) . " bytes");
        $this->info("  Downloaded {$downloaded}/" . count($cssUrls) . " stylesheets");

        // Also extract and save the HTML structure
        $structureFile = $outputDir . '/structure.html';
        $structure = $this->extractHtmlStructure($html);
        file_put_contents($structureFile, $structure);
        $this->info("  Saved HTML structure to: public/css/wp-theme/structure.html");

        $this->newLine();
        $this->info('Done! The CSS has been imported.');
        $this->info('Your Laravel layout will automatically use it.');
        $this->newLine();

        return 0;
    }

    private function extractCssUrls(string $html, string $baseUrl): array
    {
        $urls = [];

        // Match <link rel="stylesheet" href="...">
        preg_match_all('/<link[^>]+rel=["\']stylesheet["\'][^>]*>/i', $html, $matches);

        foreach ($matches[0] as $tag) {
            if (preg_match('/href=["\']([^"\']+)["\']/i', $tag, $hrefMatch)) {
                $url = $hrefMatch[1];
                // Make absolute
                if (str_starts_with($url, '//')) {
                    $url = 'https:' . $url;
                } elseif (str_starts_with($url, '/')) {
                    $parsedBase = parse_url($baseUrl);
                    $url = ($parsedBase['scheme'] ?? 'https') . '://' . $parsedBase['host'] . $url;
                } elseif (! str_starts_with($url, 'http')) {
                    $url = rtrim($baseUrl, '/') . '/' . $url;
                }

                // Skip external CDN fonts and irrelevant CSS
                if (str_contains($url, 'fonts.googleapis.com')) {
                    continue;
                }

                $urls[] = $url;
            }
        }

        return array_unique($urls);
    }

    private function extractInlineStyles(string $html): string
    {
        $styles = '';

        // Extract only <style> blocks in <head>
        if (preg_match('/<head[^>]*>(.*?)<\/head>/is', $html, $headMatch)) {
            $head = $headMatch[1];
            preg_match_all('/<style[^>]*>(.*?)<\/style>/is', $head, $styleMatches);
            foreach ($styleMatches[1] as $style) {
                $style = trim($style);
                if (strlen($style) > 10) {
                    $styles .= $style . "\n";
                }
            }
        }

        return $styles;
    }

    private function rewriteCssUrls(string $css, string $cssUrl, string $wpUrl): string
    {
        $parsedBase = parse_url($wpUrl);
        $origin = ($parsedBase['scheme'] ?? 'https') . '://' . $parsedBase['host'];
        $cssDir = dirname($cssUrl);

        // Rewrite url(../...) to absolute URLs
        return preg_replace_callback('/url\(\s*["\']?(?!data:|https?:|\/\/)([^"\')\s]+)["\']?\s*\)/i', function ($match) use ($cssDir, $origin) {
            $relPath = $match[1];

            if (str_starts_with($relPath, '/')) {
                return "url({$origin}{$relPath})";
            }

            // Resolve relative path
            $resolved = $cssDir . '/' . $relPath;
            // Simplify ../
            while (str_contains($resolved, '/../')) {
                $resolved = preg_replace('/[^\/]+\/\.\.\//', '', $resolved, 1);
            }

            return "url({$resolved})";
        }, $css);
    }

    private function extractHtmlStructure(string $html): string
    {
        $structure = "<!-- HTML Structure extracted from WordPress -->\n\n";

        // Extract header
        if (preg_match('/<header[^>]*>.*?<\/header>/is', $html, $match)) {
            $structure .= "<!-- HEADER -->\n{$match[0]}\n\n";
        }

        // Extract nav
        if (preg_match('/<nav[^>]*class="[^"]*td-header-menu[^"]*"[^>]*>.*?<\/nav>/is', $html, $match)) {
            $structure .= "<!-- NAVIGATION -->\n{$match[0]}\n\n";
        }

        // Extract footer
        if (preg_match('/<footer[^>]*>.*?<\/footer>/is', $html, $match)) {
            $structure .= "<!-- FOOTER -->\n{$match[0]}\n\n";
        }

        return $structure;
    }
}
