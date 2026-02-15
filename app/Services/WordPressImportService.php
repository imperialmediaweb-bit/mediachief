<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WordPressImportService
{
    /**
     * Fetch posts from a WordPress site via REST API v2.
     *
     * @param  string  $wpUrl      WordPress site URL (e.g. https://example.com)
     * @param  int     $page       Page number (1-based)
     * @param  int     $perPage    Posts per page (max 100)
     * @return array{posts: array, total: int, totalPages: int}|null
     */
    public function fetchPosts(string $wpUrl, int $page = 1, int $perPage = 50): ?array
    {
        $apiUrl = rtrim($wpUrl, '/') . '/wp-json/wp/v2/posts';

        try {
            $response = Http::timeout(30)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get($apiUrl, [
                    'page' => $page,
                    'per_page' => $perPage,
                    'orderby' => 'date',
                    'order' => 'desc',
                    '_embed' => 'wp:featuredmedia,wp:term',
                ]);

            if (! $response->successful()) {
                Log::warning('WordPressImport: API error', [
                    'url' => $apiUrl,
                    'status' => $response->status(),
                ]);

                return null;
            }

            return [
                'posts' => $response->json(),
                'total' => (int) $response->header('X-WP-Total', 0),
                'totalPages' => (int) $response->header('X-WP-TotalPages', 0),
            ];
        } catch (\Throwable $e) {
            Log::error('WordPressImport: exception', [
                'url' => $apiUrl,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Fetch all categories from a WordPress site.
     *
     * @return array<int, array{id: int, name: string, slug: string}>|null
     */
    public function fetchCategories(string $wpUrl): ?array
    {
        $apiUrl = rtrim($wpUrl, '/') . '/wp-json/wp/v2/categories';

        try {
            $response = Http::timeout(15)
                ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                ->get($apiUrl, ['per_page' => 100]);

            if (! $response->successful()) {
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Discover RSS feed URLs from a WordPress site.
     * Checks common WP feed paths and parses the HTML for <link> feed tags.
     *
     * @return array<int, array{url: string, title: string}>
     */
    public function discoverFeeds(string $wpUrl): array
    {
        $baseUrl = rtrim($wpUrl, '/');
        $feeds = [];

        // 1. Try common WP feed URLs
        $commonFeeds = [
            '/feed/' => 'Main Feed',
            '/feed/rss2/' => 'RSS2 Feed',
            '/feed/atom/' => 'Atom Feed',
        ];

        foreach ($commonFeeds as $path => $name) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'MediaChief/1.0'])
                    ->get($baseUrl . $path);

                if ($response->successful() && str_contains($response->header('Content-Type', ''), 'xml')) {
                    $feeds[] = [
                        'url' => $baseUrl . $path,
                        'title' => $name,
                    ];
                    break; // One main feed is enough
                }
            } catch (\Throwable $e) {
                // Skip
            }
        }

        // 2. Try to discover category feeds from WP categories
        $categories = $this->fetchCategories($wpUrl);

        if ($categories) {
            foreach ($categories as $cat) {
                $catName = html_entity_decode($cat['name'] ?? '', ENT_QUOTES, 'UTF-8');
                $catSlug = $cat['slug'] ?? '';

                if (empty($catSlug) || ($cat['count'] ?? 0) < 3) {
                    continue; // Skip empty/tiny categories
                }

                // Skip "Uncategorized"
                if ($catSlug === 'uncategorized' || $catSlug === 'fara-categorie') {
                    continue;
                }

                $feeds[] = [
                    'url' => $baseUrl . '/category/' . $catSlug . '/feed/',
                    'title' => $catName,
                    'wp_category_slug' => $catSlug,
                    'wp_category_name' => $catName,
                ];
            }
        }

        return $feeds;
    }

    /**
     * Parse a WP REST API post into a normalized article array.
     */
    public function parsePost(array $post): array
    {
        $title = html_entity_decode(strip_tags($post['title']['rendered'] ?? ''), ENT_QUOTES, 'UTF-8');
        $body = $post['content']['rendered'] ?? '';
        $excerpt = html_entity_decode(strip_tags($post['excerpt']['rendered'] ?? ''), ENT_QUOTES, 'UTF-8');
        $excerpt = trim($excerpt);

        // Featured image from _embedded
        $featuredImage = null;
        $featuredImageAlt = null;
        if (! empty($post['_embedded']['wp:featuredmedia'][0])) {
            $media = $post['_embedded']['wp:featuredmedia'][0];
            $featuredImage = $media['source_url'] ?? null;
            $featuredImageAlt = $media['alt_text'] ?? null;
        }

        // If no featured image, try to extract from content
        if (! $featuredImage && preg_match('/<img[^>]+src=["\']([^"\']+)/', $body, $m)) {
            $featuredImage = $m[1];
        }

        // Categories from _embedded terms
        $categories = [];
        if (! empty($post['_embedded']['wp:term'])) {
            foreach ($post['_embedded']['wp:term'] as $termGroup) {
                foreach ($termGroup as $term) {
                    if (($term['taxonomy'] ?? '') === 'category') {
                        $categories[] = [
                            'id' => $term['id'],
                            'name' => html_entity_decode($term['name'], ENT_QUOTES, 'UTF-8'),
                            'slug' => $term['slug'],
                        ];
                    }
                }
            }
        }

        // Tags
        $tags = [];
        if (! empty($post['_embedded']['wp:term'])) {
            foreach ($post['_embedded']['wp:term'] as $termGroup) {
                foreach ($termGroup as $term) {
                    if (($term['taxonomy'] ?? '') === 'post_tag') {
                        $tags[] = html_entity_decode($term['name'], ENT_QUOTES, 'UTF-8');
                    }
                }
            }
        }

        // Author
        $author = null;
        if (! empty($post['_embedded']['author'][0]['name'])) {
            $author = $post['_embedded']['author'][0]['name'];
        }

        return [
            'wp_id' => $post['id'],
            'title' => Str::limit($title, 255, ''),
            'slug' => Str::limit($post['slug'] ?? Str::slug($title), 255, ''),
            'excerpt' => Str::limit($excerpt, 500, ''),
            'body' => $body,
            'featured_image' => $featuredImage,
            'featured_image_alt' => $featuredImageAlt,
            'author' => $author,
            'published_at' => $post['date'] ?? null,
            'source_url' => $post['link'] ?? null,
            'categories' => $categories,
            'tags' => $tags,
            'guid' => $post['guid']['rendered'] ?? "wp-{$post['id']}",
            'status' => ($post['status'] ?? 'publish') === 'publish' ? 'published' : 'draft',
        ];
    }
}
