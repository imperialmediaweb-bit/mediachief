<?php
/**
 * MediaChief - Full WordPress Site Exporter
 *
 * Upload this file to the ROOT of each WordPress site and visit it in browser:
 * https://your-wp-site.com/mediachief-export.php
 *
 * Or run from CLI:
 * php /path/to/wordpress/mediachief-export.php > export.json
 *
 * Exports EVERYTHING:
 * - Site settings (name, description, favicon, logo)
 * - Google Analytics tracking IDs (GA4, UA, GTM)
 * - Google Search Console verification
 * - All categories with hierarchy
 * - RSS campaigns from: WP Automatic, WP RSS Aggregator, Flavor, CyberSEO
 * - Google News feeds
 * - Active plugins list
 * - Article count and stats
 *
 * Import with:
 * php artisan wp:import-campaigns --site=1 --file=export.json
 * php artisan wp:import-all --dir=exports/
 */

// Load WordPress
define('SHORTINIT', false);
require_once __DIR__ . '/wp-load.php';

if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
}

$export = [
    'site_url' => get_site_url(),
    'site_name' => get_bloginfo('name'),
    'site_description' => get_bloginfo('description'),
    'exported_at' => date('Y-m-d H:i:s'),
    'settings' => [],
    'campaigns' => [],
    'categories' => [],
];

// ── Export Site Settings ──
$favicon_id = get_option('site_icon', 0);
$favicon_url = $favicon_id ? wp_get_attachment_url($favicon_id) : null;
$custom_logo_id = get_theme_mod('custom_logo');
$logo_url = $custom_logo_id ? wp_get_attachment_url($custom_logo_id) : null;

$export['settings'] = [
    'favicon_url' => $favicon_url,
    'logo_url' => $logo_url,
    'language' => get_locale(),
    'timezone' => get_option('timezone_string', ''),
    'gmt_offset' => get_option('gmt_offset', 0),
    'posts_per_page' => get_option('posts_per_page', 10),
    'permalink_structure' => get_option('permalink_structure', ''),
    'total_posts' => wp_count_posts()->publish,
    'total_pages' => wp_count_posts('page')->publish,
];

// ── Export Google Analytics & Tracking ──
$tracking = [];

// SiteKit by Google
$sitekit_analytics = get_option('googlesitekit_analytics_settings', []);
$sitekit_analytics4 = get_option('googlesitekit_analytics-4_settings', []);
if (!empty($sitekit_analytics['propertyID'])) {
    $tracking['google_analytics_ua'] = $sitekit_analytics['propertyID'];
}
if (!empty($sitekit_analytics4['propertyID'])) {
    $tracking['google_analytics_4_property'] = $sitekit_analytics4['propertyID'];
}
if (!empty($sitekit_analytics4['measurementID'])) {
    $tracking['google_analytics_4'] = $sitekit_analytics4['measurementID'];
}

// SiteKit Search Console
$sitekit_sc = get_option('googlesitekit_search-console_settings', []);
if (!empty($sitekit_sc['propertyID'])) {
    $tracking['search_console_property'] = $sitekit_sc['propertyID'];
}

// MonsterInsights
$mi_ua = get_option('monsterinsights_ua', '');
if (!empty($mi_ua)) {
    $tracking['google_analytics_ua'] = $mi_ua;
}
$mi_v4 = get_option('monsterinsights_v4_id', '');
if (!empty($mi_v4)) {
    $tracking['google_analytics_4'] = $mi_v4;
}

// GA Google Analytics plugin
$ga_options = get_option('gap_options', []);
if (!empty($ga_options['gap_id'])) {
    $tracking['google_analytics_ua'] = $ga_options['gap_id'];
}

// Generic - search options table for GA/GTM IDs
global $wpdb;
$ga_options_search = $wpdb->get_results("
    SELECT option_name, option_value FROM {$wpdb->options}
    WHERE (option_value LIKE 'G-%' OR option_value LIKE 'UA-%' OR option_value LIKE 'GTM-%')
    AND option_value REGEXP '^(G-[A-Z0-9]+|UA-[0-9]+-[0-9]+|GTM-[A-Z0-9]+)$'
    LIMIT 20
", ARRAY_A);

foreach ($ga_options_search as $opt) {
    $val = trim($opt['option_value']);
    if (preg_match('/^G-[A-Z0-9]+$/', $val) && empty($tracking['google_analytics_4'])) {
        $tracking['google_analytics_4'] = $val;
    } elseif (preg_match('/^UA-\d+-\d+$/', $val) && empty($tracking['google_analytics_ua'])) {
        $tracking['google_analytics_ua'] = $val;
    } elseif (preg_match('/^GTM-[A-Z0-9]+$/', $val) && empty($tracking['google_tag_manager'])) {
        $tracking['google_tag_manager'] = $val;
    }
}

// Google AdSense
$adsense = get_option('googlesitekit_adsense_settings', []);
if (!empty($adsense['clientID'])) {
    $tracking['google_adsense'] = $adsense['clientID'];
}

// Google Site Verification
$verification = get_option('googlesitekit_verification_meta', '');
if (!empty($verification)) {
    $tracking['google_site_verification'] = $verification;
}

$export['settings']['tracking'] = $tracking;

// ── Active plugins list ──
$active_plugins = get_option('active_plugins', []);
$plugin_names = array_map(function($p) {
    return explode('/', $p)[0];
}, $active_plugins);
$export['settings']['active_plugins'] = array_values($plugin_names);

// ── Export WordPress Theme Settings ──
$current_theme = wp_get_theme();
$theme_slug = get_option('stylesheet');
$theme_mods = get_theme_mods();

$export['settings']['theme'] = [
    'name' => $current_theme->get('Name'),
    'version' => $current_theme->get('Version'),
    'slug' => $theme_slug,
    'parent' => $current_theme->parent() ? $current_theme->parent()->get('Name') : null,
];

// Extract theme colors from customizer
$theme_colors = [];
$color_keys = [
    'header_textcolor', 'background_color', 'accent_color',
    'primary_color', 'secondary_color', 'link_color',
    'header_background_color', 'footer_background_color',
];
foreach ($color_keys as $key) {
    if (!empty($theme_mods[$key])) {
        $val = $theme_mods[$key];
        // Ensure hex format
        if (!str_starts_with($val, '#') && ctype_xdigit($val)) {
            $val = '#' . $val;
        }
        $theme_colors[$key] = $val;
    }
}

// Also check theme options (popular theme frameworks store colors here)
$theme_options = get_option($theme_slug . '_options', get_option('theme_options', []));
if (is_array($theme_options)) {
    foreach (['primary_color', 'accent_color', 'brand_color', 'link_color'] as $key) {
        if (!empty($theme_options[$key]) && empty($theme_colors[$key])) {
            $theme_colors[$key] = $theme_options[$key];
        }
    }
}

$export['settings']['theme']['colors'] = $theme_colors;

// Header image / background
if (!empty($theme_mods['header_image']) && $theme_mods['header_image'] !== 'remove-header') {
    $export['settings']['theme']['header_image'] = $theme_mods['header_image'];
}
if (!empty($theme_mods['background_image'])) {
    $export['settings']['theme']['background_image'] = $theme_mods['background_image'];
}

// Custom CSS (WordPress core + theme)
$custom_css_post = wp_get_custom_css_post();
if ($custom_css_post) {
    $export['settings']['theme']['custom_css'] = $custom_css_post->post_content;
}

// Menus
$nav_menus = wp_get_nav_menus();
$export['settings']['menus'] = [];
$menu_locations = get_nav_menu_locations();

foreach ($nav_menus as $menu) {
    $items = wp_get_nav_menu_items($menu->term_id);
    $menu_data = [
        'name' => $menu->name,
        'slug' => $menu->slug,
        'location' => array_search($menu->term_id, $menu_locations) ?: null,
        'items' => [],
    ];

    if ($items) {
        foreach ($items as $item) {
            $menu_data['items'][] = [
                'title' => $item->title,
                'url' => $item->url,
                'type' => $item->type,
                'object' => $item->object,
                'object_id' => $item->object_id,
                'parent' => (int)$item->menu_item_parent ?: null,
                'order' => $item->menu_order,
                'target' => $item->target,
                'classes' => array_filter($item->classes),
            ];
        }
    }

    $export['settings']['menus'][] = $menu_data;
}

// Widgets/sidebars
$sidebars_widgets = get_option('sidebars_widgets', []);
$export['settings']['widgets'] = [];
foreach ($sidebars_widgets as $sidebar => $widgets) {
    if ($sidebar === 'wp_inactive_widgets' || !is_array($widgets)) continue;
    $export['settings']['widgets'][$sidebar] = count($widgets);
}

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
