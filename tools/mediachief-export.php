<?php
/**
 * MediaChief - Complete WordPress Site Exporter v2
 *
 * Exports EVERYTHING from a WordPress site:
 * - Site settings (name, description, favicon, logo, language, timezone)
 * - Google Analytics, GTM, AdSense, Search Console
 * - Theme settings (colors, custom CSS, fonts, header/background images)
 * - Navigation menus with all items
 * - Widgets configuration
 * - Permalink structure, reading/writing/discussion settings
 * - SEO plugin settings (Yoast, Rank Math, All in One SEO)
 * - All categories with hierarchy
 * - All tags
 * - RSS campaigns: WP Automatic (FULL details), WP RSS Aggregator, Flavor, CyberSEO
 * - Google News feeds
 * - Active plugins list
 * - Articles with metadata (title, slug, excerpt, featured image, date, category, tags, author)
 *
 * Usage:
 *   php /path/to/wordpress/mediachief-export.php > export.json
 *
 * Import with:
 *   php artisan wp:import-all --dir=exports/
 */

// Increase limits for large sites
@ini_set('memory_limit', '512M');
@set_time_limit(600);

// Load WordPress
define('SHORTINIT', false);
require_once __DIR__ . '/wp-load.php';

if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
}

global $wpdb;

$export = [
    'site_url'         => get_site_url(),
    'site_name'        => get_bloginfo('name'),
    'site_description' => get_bloginfo('description'),
    'exported_at'      => date('Y-m-d H:i:s'),
    'export_version'   => 2,
    'settings'         => [],
    'campaigns'        => [],
    'categories'       => [],
    'tags'             => [],
    'posts'            => [],
];

// ═══════════════════════════════════════════════════
// ══ 1. SITE SETTINGS - COMPREHENSIVE
// ═══════════════════════════════════════════════════

$favicon_id = get_option('site_icon', 0);
$favicon_url = $favicon_id ? wp_get_attachment_url($favicon_id) : null;
$custom_logo_id = get_theme_mod('custom_logo');
$logo_url = $custom_logo_id ? wp_get_attachment_url($custom_logo_id) : null;

$export['settings'] = [
    'favicon_url'        => $favicon_url,
    'logo_url'           => $logo_url,
    'language'           => get_locale(),
    'timezone'           => get_option('timezone_string', ''),
    'gmt_offset'         => get_option('gmt_offset', 0),
    'date_format'        => get_option('date_format', ''),
    'time_format'        => get_option('time_format', ''),
    'posts_per_page'     => get_option('posts_per_page', 10),
    'permalink_structure' => get_option('permalink_structure', ''),
    'blogname'           => get_option('blogname', ''),
    'blogdescription'    => get_option('blogdescription', ''),
    'admin_email'        => get_option('admin_email', ''),
    'total_posts'        => wp_count_posts()->publish,
    'total_pages'        => wp_count_posts('page')->publish,
    'total_drafts'       => wp_count_posts()->draft,
];

// ── Reading Settings ──
$export['settings']['reading'] = [
    'show_on_front'  => get_option('show_on_front', 'posts'),
    'page_on_front'  => get_option('page_on_front', 0),
    'page_for_posts' => get_option('page_for_posts', 0),
    'posts_per_rss'  => get_option('posts_per_rss', 10),
    'rss_use_excerpt' => get_option('rss_use_excerpt', 0),
    'blog_public'    => get_option('blog_public', 1),
];

// ── Writing Settings ──
$export['settings']['writing'] = [
    'default_category'    => get_option('default_category', 1),
    'default_post_format' => get_option('default_post_format', ''),
];

// ── Discussion Settings ──
$export['settings']['discussion'] = [
    'default_comment_status' => get_option('default_comment_status', 'open'),
    'default_ping_status'    => get_option('default_ping_status', 'open'),
    'comment_moderation'     => get_option('comment_moderation', 0),
    'comment_registration'   => get_option('comment_registration', 0),
    'require_name_email'     => get_option('require_name_email', 1),
    'comments_per_page'      => get_option('comments_per_page', 50),
];

// ═══════════════════════════════════════════════════
// ══ 2. GOOGLE ANALYTICS, GTM, ADSENSE, SEARCH CONSOLE
// ═══════════════════════════════════════════════════

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
if (!empty($sitekit_analytics4['webDataStreamID'])) {
    $tracking['ga4_web_data_stream'] = $sitekit_analytics4['webDataStreamID'];
}

// SiteKit Search Console
$sitekit_sc = get_option('googlesitekit_search-console_settings', []);
if (!empty($sitekit_sc['propertyID'])) {
    $tracking['search_console_property'] = $sitekit_sc['propertyID'];
}

// MonsterInsights
$mi_ua = get_option('monsterinsights_ua', '');
if (!empty($mi_ua)) $tracking['google_analytics_ua'] = $mi_ua;
$mi_v4 = get_option('monsterinsights_v4_id', '');
if (!empty($mi_v4)) $tracking['google_analytics_4'] = $mi_v4;

// GA Google Analytics plugin
$ga_options = get_option('gap_options', []);
if (!empty($ga_options['gap_id'])) $tracking['google_analytics_ua'] = $ga_options['gap_id'];

// Generic search for GA/GTM IDs in options
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
if (!empty($adsense['clientID'])) $tracking['google_adsense'] = $adsense['clientID'];
if (!empty($adsense['accountID'])) $tracking['google_adsense_account'] = $adsense['accountID'];

// Google Site Verification
$verification = get_option('googlesitekit_verification_meta', '');
if (!empty($verification)) $tracking['google_site_verification'] = $verification;

// Also check meta-based verification
$gsc_meta = get_option('google-site-verification', '');
if (!empty($gsc_meta)) $tracking['google_site_verification'] = $gsc_meta;

// Header/footer scripts (Insert Headers and Footers plugin, WPCode, etc.)
$header_scripts = get_option('ihaf_insert_header', get_option('wpcode_header_scripts', ''));
$footer_scripts = get_option('ihaf_insert_footer', get_option('wpcode_footer_scripts', ''));
if (!empty($header_scripts)) $tracking['header_scripts'] = $header_scripts;
if (!empty($footer_scripts)) $tracking['footer_scripts'] = $footer_scripts;

$export['settings']['tracking'] = $tracking;

// ═══════════════════════════════════════════════════
// ══ 3. SEO PLUGIN SETTINGS (Yoast, Rank Math, AIO SEO)
// ═══════════════════════════════════════════════════

$seo = [];

// Yoast SEO
$wpseo = get_option('wpseo', []);
$wpseo_titles = get_option('wpseo_titles', []);
$wpseo_social = get_option('wpseo_social', []);
if (!empty($wpseo) || !empty($wpseo_titles)) {
    $seo['plugin'] = 'yoast';
    $seo['yoast'] = [
        'general'       => is_array($wpseo) ? $wpseo : [],
        'titles'        => is_array($wpseo_titles) ? $wpseo_titles : [],
        'social'        => is_array($wpseo_social) ? $wpseo_social : [],
        'separator'     => $wpseo_titles['separator'] ?? '',
        'title_template' => $wpseo_titles['title-post'] ?? '',
        'meta_description_template' => $wpseo_titles['metadesc-post'] ?? '',
    ];
}

// Rank Math
$rank_math = get_option('rank-math-options-general', []);
$rank_math_titles = get_option('rank-math-options-titles', []);
if (!empty($rank_math) || !empty($rank_math_titles)) {
    $seo['plugin'] = 'rank_math';
    $seo['rank_math'] = [
        'general' => is_array($rank_math) ? $rank_math : [],
        'titles'  => is_array($rank_math_titles) ? $rank_math_titles : [],
    ];
}

// All in One SEO
$aioseo = get_option('aioseo_options', '');
if (!empty($aioseo)) {
    $seo['plugin'] = 'aioseo';
    $decoded = json_decode($aioseo, true);
    $seo['aioseo'] = is_array($decoded) ? $decoded : ['raw' => $aioseo];
}

$export['settings']['seo'] = $seo;

// ═══════════════════════════════════════════════════
// ══ 4. ACTIVE PLUGINS
// ═══════════════════════════════════════════════════

$active_plugins = get_option('active_plugins', []);
$plugin_details = [];
foreach ($active_plugins as $p) {
    $plugin_file = WP_PLUGIN_DIR . '/' . $p;
    if (file_exists($plugin_file)) {
        $data = get_plugin_data($plugin_file, false, false);
        $plugin_details[] = [
            'slug'    => explode('/', $p)[0],
            'file'    => $p,
            'name'    => $data['Name'] ?? explode('/', $p)[0],
            'version' => $data['Version'] ?? '',
        ];
    } else {
        $plugin_details[] = [
            'slug' => explode('/', $p)[0],
            'file' => $p,
            'name' => explode('/', $p)[0],
            'version' => '',
        ];
    }
}
$export['settings']['active_plugins'] = $plugin_details;

// ═══════════════════════════════════════════════════
// ══ 5. THEME SETTINGS
// ═══════════════════════════════════════════════════

$current_theme = wp_get_theme();
$theme_slug = get_option('stylesheet');
$theme_mods = get_theme_mods();

$export['settings']['theme'] = [
    'name'    => $current_theme->get('Name'),
    'version' => $current_theme->get('Version'),
    'slug'    => $theme_slug,
    'parent'  => $current_theme->parent() ? $current_theme->parent()->get('Name') : null,
    'template' => get_option('template', ''),
];

// Theme colors
$theme_colors = [];
$color_keys = [
    'header_textcolor', 'background_color', 'accent_color',
    'primary_color', 'secondary_color', 'link_color',
    'header_background_color', 'footer_background_color',
    'nav_text_color', 'nav_bg_color', 'button_color',
];
foreach ($color_keys as $key) {
    if (!empty($theme_mods[$key])) {
        $val = $theme_mods[$key];
        if (!str_starts_with($val, '#') && ctype_xdigit($val)) $val = '#' . $val;
        $theme_colors[$key] = $val;
    }
}

// Theme framework options (Flavor, flavor theme, etc.)
$theme_options = get_option($theme_slug . '_options', get_option('theme_options', []));
if (is_array($theme_options)) {
    foreach (['primary_color', 'accent_color', 'brand_color', 'link_color', 'nav_color'] as $key) {
        if (!empty($theme_options[$key]) && empty($theme_colors[$key])) {
            $theme_colors[$key] = $theme_options[$key];
        }
    }
}

$export['settings']['theme']['colors'] = $theme_colors;

// Header/background images
if (!empty($theme_mods['header_image']) && $theme_mods['header_image'] !== 'remove-header') {
    $export['settings']['theme']['header_image'] = $theme_mods['header_image'];
}
if (!empty($theme_mods['background_image'])) {
    $export['settings']['theme']['background_image'] = $theme_mods['background_image'];
}

// Custom CSS
$custom_css_post = wp_get_custom_css_post();
if ($custom_css_post) {
    $export['settings']['theme']['custom_css'] = $custom_css_post->post_content;
}

// ALL theme mods (catch everything we might have missed)
$export['settings']['theme']['all_mods'] = is_array($theme_mods) ? $theme_mods : [];

// ═══════════════════════════════════════════════════
// ══ 6. NAVIGATION MENUS
// ═══════════════════════════════════════════════════

$nav_menus = wp_get_nav_menus();
$export['settings']['menus'] = [];
$menu_locations = get_nav_menu_locations();

foreach ($nav_menus as $menu) {
    $items = wp_get_nav_menu_items($menu->term_id);
    $menu_data = [
        'name'     => $menu->name,
        'slug'     => $menu->slug,
        'location' => array_search($menu->term_id, $menu_locations) ?: null,
        'items'    => [],
    ];

    if ($items) {
        foreach ($items as $item) {
            $menu_data['items'][] = [
                'title'     => $item->title,
                'url'       => $item->url,
                'type'      => $item->type,
                'object'    => $item->object,
                'object_id' => $item->object_id,
                'parent'    => (int)$item->menu_item_parent ?: null,
                'order'     => $item->menu_order,
                'target'    => $item->target,
                'classes'   => array_filter($item->classes),
            ];
        }
    }

    $export['settings']['menus'][] = $menu_data;
}

// ═══════════════════════════════════════════════════
// ══ 7. WIDGETS
// ═══════════════════════════════════════════════════

$sidebars_widgets = get_option('sidebars_widgets', []);
$export['settings']['widgets'] = [];
foreach ($sidebars_widgets as $sidebar => $widgets) {
    if ($sidebar === 'wp_inactive_widgets' || !is_array($widgets)) continue;
    $widget_details = [];
    foreach ($widgets as $widget_id) {
        // Extract widget type and instance
        preg_match('/^(.+)-(\d+)$/', $widget_id, $m);
        if ($m) {
            $type = $m[1];
            $num = $m[2];
            $opts = get_option("widget_{$type}", []);
            $widget_details[] = [
                'id'       => $widget_id,
                'type'     => $type,
                'settings' => $opts[$num] ?? [],
            ];
        }
    }
    $export['settings']['widgets'][$sidebar] = $widget_details;
}

// ═══════════════════════════════════════════════════
// ══ 8. CATEGORIES (with full hierarchy)
// ═══════════════════════════════════════════════════

$wp_categories = get_categories(['hide_empty' => false]);
foreach ($wp_categories as $cat) {
    $export['categories'][] = [
        'id'          => $cat->term_id,
        'name'        => $cat->name,
        'slug'        => $cat->slug,
        'description' => $cat->description,
        'count'       => $cat->count,
        'parent_id'   => $cat->parent ?: null,
    ];
}

// ═══════════════════════════════════════════════════
// ══ 9. TAGS
// ═══════════════════════════════════════════════════

$wp_tags = get_tags(['hide_empty' => false]);
if (is_array($wp_tags)) {
    foreach ($wp_tags as $tag) {
        $export['tags'][] = [
            'id'    => $tag->term_id,
            'name'  => $tag->name,
            'slug'  => $tag->slug,
            'count' => $tag->count,
        ];
    }
}

// ═══════════════════════════════════════════════════
// ══ 10. WP AUTOMATIC - FULL CAMPAIGN EXPORT
// ═══════════════════════════════════════════════════

$table_name = $wpdb->prefix . 'automatic_camps';

if ($wpdb->get_var("SHOW TABLES LIKE '{$table_name}'") === $table_name) {
    $camps = $wpdb->get_results("SELECT * FROM {$table_name}", ARRAY_A);

    foreach ($camps as $camp) {
        $options = maybe_unserialize($camp['camp_options'] ?? '');
        $general = maybe_unserialize($camp['camp_general'] ?? '');

        // Extract feed URLs
        $feeds_str = $camp['feeds'] ?? ($general['feeds'] ?? '');
        $feed_urls = array_filter(array_map('trim', explode("\n", $feeds_str)));

        // Category mapping
        $category_id = $camp['camp_post_category'] ?? null;
        $category_ids = [];
        if (is_serialized($category_id)) {
            $cats = maybe_unserialize($category_id);
            $category_ids = is_array($cats) ? $cats : [$category_id];
        } elseif ($category_id) {
            $category_ids = [$category_id];
        }

        // Get category names for reference
        $category_names = [];
        foreach ($category_ids as $cid) {
            $cat = get_category($cid);
            if ($cat && !is_wp_error($cat)) {
                $category_names[] = $cat->name;
            }
        }

        // Full campaign data
        $campaign_data = [
            'source'             => 'wp_automatic',
            'camp_id'            => $camp['camp_id'] ?? null,
            'name'               => $camp['camp_name'] ?? 'Unnamed Campaign',
            'is_active'          => ($camp['camp_active'] ?? 1) == 1,
            'camp_type'          => $camp['camp_type'] ?? 'feed',
            'feed_urls'          => $feed_urls,
            'category_wp_ids'    => $category_ids,
            'category_names'     => $category_names,
            'post_status'        => $camp['camp_post_status'] ?? 'publish',
            'post_type'          => $camp['camp_post_type'] ?? 'post',
            'post_author'        => $camp['camp_post_author'] ?? 1,

            // Post template settings
            'post_title'         => $camp['camp_post_title'] ?? '',
            'post_content'       => $camp['camp_post_content'] ?? '',
            'post_template'      => $camp['camp_post_template'] ?? '',
            'post_excerpt'       => $camp['camp_post_excerpt'] ?? '',
            'post_custom_k'      => $camp['camp_post_custom_k'] ?? '',
            'post_custom_v'      => $camp['camp_post_custom_v'] ?? '',

            // Frequency & limits
            'frequency'          => $camp['camp_frequency'] ?? 30,
            'max'                => $camp['camp_max'] ?? '',
            'fetch_limit'        => $camp['camp_fetch_limit'] ?? '',
            'duplicate_title'    => $camp['camp_dup_title'] ?? 0,
            'duplicate_link'     => $camp['camp_dup_link'] ?? 0,

            // Translation settings
            'translate_from'     => $camp['camp_translate_from'] ?? '',
            'translate_to'       => $camp['camp_translate_to'] ?? '',
            'translate_to_2'     => $camp['camp_translate_to_2'] ?? '',

            // Featured image settings
            'featured_image'     => $camp['camp_featured_image'] ?? '',
            'del_image_after'    => $camp['camp_del_img'] ?? 0,
            'search_image'       => $camp['camp_search_image'] ?? '',

            // Tags
            'tags'               => $camp['camp_tags'] ?? '',
            'auto_tags'          => $camp['camp_auto_tags'] ?? 0,

            // Keyword filtering
            'keyword'            => $camp['camp_keyword'] ?? '',
            'keyword_not'        => $camp['camp_keyword_not'] ?? '',

            // Full options (serialized data preserved)
            'options'            => is_array($options) ? $options : [],
            'general'            => is_array($general) ? $general : [],

            // All raw columns (catch everything)
            'raw_data'           => $camp,
        ];

        // For each feed URL, also create individual campaign entries
        // (for easier import into MediaChief's per-feed model)
        foreach ($feed_urls as $url) {
            if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) continue;

            $export['campaigns'][] = [
                'source'          => 'wp_automatic',
                'name'            => $camp['camp_name'] ?? 'Unnamed Campaign',
                'url'             => $url,
                'category_wp_id'  => $category_ids[0] ?? null,
                'category_name'   => $category_names[0] ?? null,
                'is_active'       => ($camp['camp_active'] ?? 1) == 1,
                'fetch_interval'  => (int)($camp['camp_frequency'] ?? 30),
                'auto_publish'    => ($camp['camp_post_status'] ?? 'publish') === 'publish',
                'source_name'     => parse_url($url, PHP_URL_HOST),
                'meta' => [
                    'camp_id'          => $camp['camp_id'] ?? null,
                    'camp_type'        => $camp['camp_type'] ?? 'feed',
                    'post_status'      => $camp['camp_post_status'] ?? 'publish',
                    'translate_from'   => $camp['camp_translate_from'] ?? '',
                    'translate_to'     => $camp['camp_translate_to'] ?? '',
                    'keyword'          => $camp['camp_keyword'] ?? '',
                    'keyword_not'      => $camp['camp_keyword_not'] ?? '',
                    'featured_image'   => $camp['camp_featured_image'] ?? '',
                    'tags'             => $camp['camp_tags'] ?? '',
                    'auto_tags'        => $camp['camp_auto_tags'] ?? 0,
                    'max'              => $camp['camp_max'] ?? '',
                    'post_title'       => $camp['camp_post_title'] ?? '',
                    'post_template'    => $camp['camp_post_template'] ?? '',
                    'post_content'     => $camp['camp_post_content'] ?? '',
                ],
            ];
        }

        // Also store the full campaign object in a separate array
        if (!isset($export['wp_automatic_campaigns'])) {
            $export['wp_automatic_campaigns'] = [];
        }
        $export['wp_automatic_campaigns'][] = $campaign_data;
    }
}

// ═══════════════════════════════════════════════════
// ══ 11. WP RSS AGGREGATOR
// ═══════════════════════════════════════════════════

$wprss_feeds = get_posts([
    'post_type'      => 'wprss_feed',
    'post_status'    => 'any',
    'posts_per_page' => -1,
]);

foreach ($wprss_feeds as $feed) {
    $url = get_post_meta($feed->ID, 'wprss_url', true);
    if (empty($url)) continue;

    $category_id = null;
    $category_name = null;
    $terms = wp_get_post_terms($feed->ID, 'category');
    if (!empty($terms) && !is_wp_error($terms)) {
        $category_id = $terms[0]->term_id;
        $category_name = $terms[0]->name;
    }
    if (!$category_id) {
        $category_id = get_post_meta($feed->ID, 'wprss_feed_category', true) ?: null;
    }

    $export['campaigns'][] = [
        'source'         => 'wprss_aggregator',
        'name'           => $feed->post_title,
        'url'            => $url,
        'category_wp_id' => $category_id,
        'category_name'  => $category_name,
        'is_active'      => $feed->post_status === 'publish',
        'fetch_interval' => (int) get_post_meta($feed->ID, 'wprss_feed_interval', true) ?: 30,
        'auto_publish'   => true,
        'source_name'    => parse_url($url, PHP_URL_HOST),
        'meta' => [
            'limit'         => get_post_meta($feed->ID, 'wprss_feed_limit', true),
            'unique_titles' => get_post_meta($feed->ID, 'wprss_unique_titles', true),
            'post_status'   => $feed->post_status,
        ],
    ];
}

// ═══════════════════════════════════════════════════
// ══ 12. FLAVOR / FLAVOR FEEDS
// ═══════════════════════════════════════════════════

$flavor_feeds = get_posts([
    'post_type'      => 'flavor_feed',
    'post_status'    => 'any',
    'posts_per_page' => -1,
]);

foreach ($flavor_feeds as $feed) {
    $url = get_post_meta($feed->ID, '_flavor_feed_url', true)
        ?: get_post_meta($feed->ID, 'flavor_url', true);
    if (empty($url)) continue;

    $all_meta = get_post_meta($feed->ID);
    $meta_clean = [];
    foreach ($all_meta as $k => $v) {
        $meta_clean[$k] = maybe_unserialize($v[0] ?? '');
    }

    $export['campaigns'][] = [
        'source'         => 'flavor',
        'name'           => $feed->post_title,
        'url'            => $url,
        'category_wp_id' => null,
        'is_active'      => $feed->post_status === 'publish',
        'fetch_interval' => 30,
        'auto_publish'   => true,
        'source_name'    => parse_url($url, PHP_URL_HOST),
        'meta'           => $meta_clean,
    ];
}

// ═══════════════════════════════════════════════════
// ══ 13. CYBERSEO
// ═══════════════════════════════════════════════════

$cyberseo_feeds = get_option('cyberseo_feeds', []);
if (is_array($cyberseo_feeds)) {
    foreach ($cyberseo_feeds as $key => $feed_data) {
        $url = is_string($feed_data) ? $feed_data : ($feed_data['url'] ?? '');
        if (empty($url)) continue;

        $export['campaigns'][] = [
            'source'         => 'cyberseo',
            'name'           => is_array($feed_data) ? ($feed_data['name'] ?? "CyberSEO Feed") : "CyberSEO Feed",
            'url'            => $url,
            'category_wp_id' => is_array($feed_data) ? ($feed_data['category'] ?? null) : null,
            'is_active'      => true,
            'fetch_interval' => 30,
            'auto_publish'   => true,
            'source_name'    => parse_url($url, PHP_URL_HOST),
            'meta'           => is_array($feed_data) ? $feed_data : [],
        ];
    }
}

// ═══════════════════════════════════════════════════
// ══ 14. GOOGLE NEWS FEEDS (discovered in DB)
// ═══════════════════════════════════════════════════

$google_news_urls = $wpdb->get_col("
    SELECT DISTINCT meta_value FROM {$wpdb->postmeta}
    WHERE meta_value LIKE '%news.google.com%'
       OR meta_value LIKE '%google.com/rss%'
       OR meta_value LIKE '%google.com/news%'
    LIMIT 100
");

foreach ($google_news_urls as $url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) continue;

    $already = false;
    foreach ($export['campaigns'] as $c) {
        if ($c['url'] === $url) { $already = true; break; }
    }
    if ($already) continue;

    $export['campaigns'][] = [
        'source'         => 'google_news',
        'name'           => 'Google News Feed',
        'url'            => $url,
        'category_wp_id' => null,
        'is_active'      => true,
        'fetch_interval' => 15,
        'auto_publish'   => true,
        'source_name'    => 'Google News',
    ];
}

// ═══════════════════════════════════════════════════
// ══ 15. ARTICLES / POSTS (with metadata)
// ═══════════════════════════════════════════════════

// Export all published posts with essential data
// We do this in batches to avoid memory issues
$batch_size = 500;
$offset = 0;
$total_exported = 0;

while (true) {
    $posts = $wpdb->get_results($wpdb->prepare("
        SELECT
            p.ID,
            p.post_title,
            p.post_name AS slug,
            p.post_excerpt,
            p.post_content,
            p.post_status,
            p.post_date,
            p.post_date_gmt,
            p.post_modified,
            p.post_author,
            p.guid,
            p.post_type
        FROM {$wpdb->posts} p
        WHERE p.post_type = 'post'
          AND p.post_status IN ('publish', 'draft', 'pending', 'future')
        ORDER BY p.post_date DESC
        LIMIT %d OFFSET %d
    ", $batch_size, $offset), ARRAY_A);

    if (empty($posts)) break;

    foreach ($posts as $post) {
        // Get categories
        $cats = $wpdb->get_results($wpdb->prepare("
            SELECT t.term_id, t.name, t.slug
            FROM {$wpdb->terms} t
            JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
            JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
            WHERE tr.object_id = %d AND tt.taxonomy = 'category'
        ", $post['ID']), ARRAY_A);

        // Get tags
        $tags = $wpdb->get_col($wpdb->prepare("
            SELECT t.name
            FROM {$wpdb->terms} t
            JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
            JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
            WHERE tr.object_id = %d AND tt.taxonomy = 'post_tag'
        ", $post['ID']));

        // Get featured image
        $thumb_id = get_post_meta($post['ID'], '_thumbnail_id', true);
        $featured_image = $thumb_id ? wp_get_attachment_url($thumb_id) : null;
        $featured_image_alt = $thumb_id ? get_post_meta($thumb_id, '_wp_attachment_image_alt', true) : null;

        // Get author name
        $author_name = '';
        if ($post['post_author']) {
            $author = get_userdata($post['post_author']);
            $author_name = $author ? $author->display_name : '';
        }

        // Get source URL (from WP Automatic or other import plugins)
        $source_url = get_post_meta($post['ID'], 'original_link', true)
            ?: get_post_meta($post['ID'], '_original_url', true)
            ?: get_post_meta($post['ID'], 'wprss_item_permalink', true)
            ?: get_post_meta($post['ID'], '_wp_original_http_url', true)
            ?: '';

        $source_name = '';
        if ($source_url) {
            $source_name = parse_url($source_url, PHP_URL_HOST) ?: '';
        }

        $export['posts'][] = [
            'wp_id'              => (int)$post['ID'],
            'title'              => html_entity_decode($post['post_title'], ENT_QUOTES, 'UTF-8'),
            'slug'               => $post['slug'],
            'excerpt'            => html_entity_decode($post['post_excerpt'], ENT_QUOTES, 'UTF-8'),
            'body'               => $post['post_content'],
            'status'             => $post['post_status'],
            'published_at'       => $post['post_date_gmt'] !== '0000-00-00 00:00:00' ? $post['post_date_gmt'] : $post['post_date'],
            'modified_at'        => $post['post_modified'],
            'author'             => $author_name,
            'featured_image'     => $featured_image,
            'featured_image_alt' => $featured_image_alt,
            'categories'         => $cats,
            'tags'               => $tags,
            'source_url'         => $source_url,
            'source_name'        => $source_name,
            'original_guid'      => $post['guid'],
        ];

        $total_exported++;
    }

    $offset += $batch_size;

    // Safety: flush output buffer periodically
    if (function_exists('gc_collect_cycles')) {
        gc_collect_cycles();
    }
}

// ═══════════════════════════════════════════════════
// ══ 16. PAGES (basic info)
// ═══════════════════════════════════════════════════

$pages = get_posts([
    'post_type'      => 'page',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
]);

$export['pages'] = [];
foreach ($pages as $page) {
    $export['pages'][] = [
        'wp_id'   => $page->ID,
        'title'   => $page->post_title,
        'slug'    => $page->post_name,
        'content' => $page->post_content,
        'status'  => $page->post_status,
        'template' => get_page_template_slug($page->ID) ?: 'default',
    ];
}

// ═══════════════════════════════════════════════════
// ══ 17. USERS / AUTHORS
// ═══════════════════════════════════════════════════

$users = get_users(['role__in' => ['administrator', 'editor', 'author']]);
$export['authors'] = [];
foreach ($users as $user) {
    $export['authors'][] = [
        'id'           => $user->ID,
        'login'        => $user->user_login,
        'display_name' => $user->display_name,
        'email'        => $user->user_email,
        'role'         => implode(', ', $user->roles),
        'post_count'   => count_user_posts($user->ID),
    ];
}

// ═══════════════════════════════════════════════════
// ══ SUMMARY
// ═══════════════════════════════════════════════════

$export['summary'] = [
    'total_campaigns'            => count($export['campaigns']),
    'total_wp_automatic_campaigns' => count($export['wp_automatic_campaigns'] ?? []),
    'total_categories'           => count($export['categories']),
    'total_tags'                 => count($export['tags']),
    'total_posts_exported'       => count($export['posts']),
    'total_pages'                => count($export['pages']),
    'total_authors'              => count($export['authors']),
    'sources_found'              => array_values(array_unique(array_column($export['campaigns'], 'source'))),
    'active_plugins_count'       => count($export['settings']['active_plugins']),
];

// Output
echo json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
