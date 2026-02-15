<?php
/**
 * MediaChief - WordPress Campaign Exporter
 *
 * Upload this file to the ROOT of each WordPress site and visit it in browser:
 * https://your-wp-site.com/mediachief-export.php
 *
 * It will output JSON with all RSS feed campaigns from popular plugins:
 * - WP RSS Aggregator (wprss_feed)
 * - WP Automatic (wp_automatic_camps)
 * - Flavor / CyberSEO
 * - Flavor (flavor_feed)
 * - Custom RSS feeds from wp_options
 *
 * After downloading the JSON, import it with:
 * php artisan wp:import-campaigns --site=1 --file=export.json
 */

// Load WordPress
define('SHORTINIT', false);
require_once __DIR__ . '/wp-load.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$export = [
    'site_url' => get_site_url(),
    'site_name' => get_bloginfo('name'),
    'exported_at' => date('Y-m-d H:i:s'),
    'campaigns' => [],
    'categories' => [],
];

// ── Export WordPress categories ──
$wp_categories = get_categories(['hide_empty' => false]);
foreach ($wp_categories as $cat) {
    $export['categories'][] = [
        'id' => $cat->term_id,
        'name' => $cat->name,
        'slug' => $cat->slug,
        'description' => $cat->description,
        'count' => $cat->count,
        'parent_id' => $cat->parent ?: null,
    ];
}

// ── 1. WP RSS Aggregator ──
$wprss_feeds = get_posts([
    'post_type' => 'wprss_feed',
    'post_status' => 'publish',
    'posts_per_page' => -1,
]);

foreach ($wprss_feeds as $feed) {
    $url = get_post_meta($feed->ID, 'wprss_url', true);
    if (empty($url)) continue;

    $category_id = null;
    $terms = wp_get_post_terms($feed->ID, 'category');
    if (!empty($terms) && !is_wp_error($terms)) {
        $category_id = $terms[0]->term_id;
    }

    // Try wprss_feed_category meta
    if (!$category_id) {
        $category_id = get_post_meta($feed->ID, 'wprss_feed_category', true) ?: null;
    }

    $export['campaigns'][] = [
        'source' => 'wprss_aggregator',
        'name' => $feed->post_title,
        'url' => $url,
        'category_wp_id' => $category_id,
        'is_active' => $feed->post_status === 'publish',
        'fetch_interval' => (int) get_post_meta($feed->ID, 'wprss_feed_interval', true) ?: 30,
        'auto_publish' => true,
        'source_name' => parse_url($url, PHP_URL_HOST),
        'meta' => [
            'limit' => get_post_meta($feed->ID, 'wprss_feed_limit', true),
            'unique_titles' => get_post_meta($feed->ID, 'wprss_unique_titles', true),
        ],
    ];
}

// ── 2. WP Automatic Plugin ──
global $wpdb;
$table_name = $wpdb->prefix . 'automatic_camps';

if ($wpdb->get_var("SHOW TABLES LIKE '{$table_name}'") === $table_name) {
    $camps = $wpdb->get_results("SELECT * FROM {$table_name}", ARRAY_A);

    foreach ($camps as $camp) {
        // WP Automatic stores feed URLs in camp_general or camp_options (serialized)
        $options = maybe_unserialize($camp['camp_options'] ?? '');
        $general = maybe_unserialize($camp['camp_general'] ?? '');

        $feeds_str = $camp['feeds'] ?? ($general['feeds'] ?? '');
        $feed_urls = array_filter(array_map('trim', explode("\n", $feeds_str)));

        $category_id = $camp['camp_post_category'] ?? null;
        if (is_serialized($category_id)) {
            $cats = maybe_unserialize($category_id);
            $category_id = is_array($cats) ? ($cats[0] ?? null) : $category_id;
        }

        foreach ($feed_urls as $url) {
            if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) continue;

            $export['campaigns'][] = [
                'source' => 'wp_automatic',
                'name' => $camp['camp_name'] ?? 'Unnamed Campaign',
                'url' => $url,
                'category_wp_id' => $category_id,
                'is_active' => ($camp['camp_active'] ?? 1) == 1,
                'fetch_interval' => (int) ($camp['camp_frequency'] ?? 30),
                'auto_publish' => true,
                'source_name' => parse_url($url, PHP_URL_HOST),
                'meta' => [
                    'camp_type' => $camp['camp_type'] ?? 'feed',
                    'translate' => $options['camp_translate'] ?? '',
                    'rewrite' => $options['camp_rewrite'] ?? '',
                    'post_status' => $camp['camp_post_status'] ?? 'publish',
                ],
            ];
        }
    }
}

// ── 3. Flavor / CyberSEO feeds ──
$flavor_feeds = get_posts([
    'post_type' => 'flavor_feed',
    'post_status' => 'any',
    'posts_per_page' => -1,
]);

foreach ($flavor_feeds as $feed) {
    $url = get_post_meta($feed->ID, '_flavor_feed_url', true)
        ?: get_post_meta($feed->ID, 'flavor_url', true);

    if (empty($url)) continue;

    $export['campaigns'][] = [
        'source' => 'flavor',
        'name' => $feed->post_title,
        'url' => $url,
        'category_wp_id' => null,
        'is_active' => $feed->post_status === 'publish',
        'fetch_interval' => 30,
        'auto_publish' => true,
        'source_name' => parse_url($url, PHP_URL_HOST),
    ];
}

// ── 4. CyberSEO options ──
$cyberseo_feeds = get_option('cyberseo_feeds', []);
if (is_array($cyberseo_feeds)) {
    foreach ($cyberseo_feeds as $key => $feed_data) {
        $url = is_string($feed_data) ? $feed_data : ($feed_data['url'] ?? '');
        if (empty($url)) continue;

        $export['campaigns'][] = [
            'source' => 'cyberseo',
            'name' => is_array($feed_data) ? ($feed_data['name'] ?? "CyberSEO Feed") : "CyberSEO Feed",
            'url' => $url,
            'category_wp_id' => is_array($feed_data) ? ($feed_data['category'] ?? null) : null,
            'is_active' => true,
            'fetch_interval' => 30,
            'auto_publish' => true,
            'source_name' => parse_url($url, PHP_URL_HOST),
        ];
    }
}

// ── 5. Google News feeds from any source ──
// Search all post meta and options for Google News RSS URLs
$google_news_urls = $wpdb->get_col("
    SELECT DISTINCT meta_value FROM {$wpdb->postmeta}
    WHERE meta_value LIKE '%news.google.com%'
       OR meta_value LIKE '%google.com/rss%'
       OR meta_value LIKE '%google.com/news%'
    LIMIT 100
");

foreach ($google_news_urls as $url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) continue;

    // Check if already added
    $already = false;
    foreach ($export['campaigns'] as $c) {
        if ($c['url'] === $url) { $already = true; break; }
    }
    if ($already) continue;

    $export['campaigns'][] = [
        'source' => 'google_news',
        'name' => 'Google News Feed',
        'url' => $url,
        'category_wp_id' => null,
        'is_active' => true,
        'fetch_interval' => 15,
        'auto_publish' => true,
        'source_name' => 'Google News',
    ];
}

// ── Summary ──
$export['summary'] = [
    'total_campaigns' => count($export['campaigns']),
    'total_categories' => count($export['categories']),
    'sources_found' => array_unique(array_column($export['campaigns'], 'source')),
];

echo json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
