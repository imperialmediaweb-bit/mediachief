@php
    // Check if WordPress shell templates exist (imported by wp:import-template command)
    $wpBeforePath = storage_path('app/wp-theme/shell_before.html');
    $wpAfterPath = storage_path('app/wp-theme/shell_after.html');
    $useWpShell = file_exists($wpBeforePath) && file_exists($wpAfterPath);
@endphp

@if($useWpShell)
{{-- ═══ WordPress Shell Mode: Exact design replica using imported WP HTML ═══ --}}
@php
    $shellBefore = file_get_contents($wpBeforePath);
    $shellAfter = file_get_contents($wpAfterPath);

    // Dynamic page title
    $pageTitle = $__env->yieldContent('title', $currentSite->name ?? 'MediaChief');
    $shellBefore = str_replace('<!-- MC_TITLE -->', e($pageTitle), $shellBefore);

    // Build analytics/extra head content
    $analytics = $currentSite->analytics ?? [];
    $headExtra = '';

    // Google Analytics 4
    if (!empty($analytics['google_analytics_4'])) {
        $gaId = e($analytics['google_analytics_4']);
        $headExtra .= "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$gaId}\"></script>\n";
        $headExtra .= "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{$gaId}');</script>\n";
    } elseif (!empty($analytics['google_analytics_ua'])) {
        $gaId = e($analytics['google_analytics_ua']);
        $headExtra .= "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$gaId}\"></script>\n";
        $headExtra .= "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{$gaId}');</script>\n";
    }

    // Google Tag Manager (head part)
    if (!empty($analytics['google_tag_manager'])) {
        $gtmId = e($analytics['google_tag_manager']);
        $headExtra .= "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{$gtmId}');</script>\n";
    }

    // Google AdSense
    if (!empty($analytics['google_adsense'])) {
        $adsId = e($analytics['google_adsense']);
        $headExtra .= "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={$adsId}\" crossorigin=\"anonymous\"></script>\n";
    }

    // Google Site Verification
    if (!empty($currentSite->seo_settings['google_site_verification'])) {
        $headExtra .= '<meta name="google-site-verification" content="' . e($currentSite->seo_settings['google_site_verification']) . "\">\n";
    }

    // Content area CSS - matches Newspaper theme style, no Tailwind needed
    $headExtra .= '<style>
    /* === MediaChief Content Area (Newspaper-compatible) === */
    .mc-container{max-width:1068px;margin:0 auto;padding:0 15px}
    .mc-row{display:flex;flex-wrap:wrap;margin:0 -15px}
    .mc-row:after{content:"";display:table;clear:both}
    .mc-span8{width:66.666%;padding:0 15px;float:left}
    .mc-span4{width:33.333%;padding:0 15px;float:left}
    .mc-span12{width:100%;padding:0 15px}
    @media(max-width:767px){.mc-span8,.mc-span4{width:100%;float:none}}

    .mc-block{background:#fff;margin-bottom:26px;padding:20px}
    .mc-block-title{font-family:"Roboto",sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;line-height:1;border-bottom:2px solid #eee;margin-bottom:18px;padding-bottom:10px}
    .mc-block-title span{display:inline-block;position:relative;padding-bottom:12px;margin-bottom:-2px;border-bottom:3px solid #e51a2f}
    .mc-module{margin-bottom:20px;overflow:hidden}
    .mc-module:after{content:"";display:table;clear:both}

    .mc-module-thumb{position:relative;overflow:hidden}
    .mc-module-thumb img{width:100%;height:auto;display:block;transition:opacity .3s}
    .mc-module-thumb:hover img{opacity:.9}
    .mc-module-title{font-family:"Roboto",sans-serif;font-weight:500;line-height:1.3;margin:0 0 6px}
    .mc-module-title a{color:#111;text-decoration:none}
    .mc-module-title a:hover{color:#e51a2f}
    .mc-module-meta{font-size:11px;color:#aaa;margin-bottom:5px}
    .mc-module-meta a{color:#aaa;text-decoration:none}
    .mc-module-meta .mc-author{color:#e51a2f;font-weight:600}
    .mc-excerpt{font-size:13px;line-height:1.6;color:#666;margin-top:6px}
    .mc-cat{display:inline-block;padding:3px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;background:#e51a2f;line-height:1;margin-bottom:8px}

    /* Featured/Big grid */
    .mc-big-grid{display:flex;gap:4px;min-height:380px;margin-bottom:26px}
    .mc-big-grid-left{flex:2;position:relative;overflow:hidden}
    .mc-big-grid-right{flex:1;display:flex;flex-direction:column;gap:4px}
    .mc-big-grid-item{position:relative;overflow:hidden;flex:1;display:flex}
    .mc-big-grid-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
    .mc-big-grid-item:hover img{transform:scale(1.04)}
    .mc-big-grid-meta{position:absolute;bottom:0;left:0;right:0;padding:15px 20px;background:linear-gradient(transparent,rgba(0,0,0,.85));color:#fff}
    .mc-big-grid-meta h3{font-family:"Roboto",sans-serif;font-size:22px;font-weight:500;line-height:1.2;margin:0 0 6px}
    .mc-big-grid-meta h3 a{color:#fff;text-decoration:none}
    .mc-big-grid-meta.mc-small h3{font-size:15px}
    @media(max-width:767px){.mc-big-grid{flex-direction:column;min-height:auto}.mc-big-grid-left,.mc-big-grid-item{min-height:200px}}

    /* Article list module */
    .mc-list{display:flex;gap:12px;padding:12px 0;border-top:1px solid #eee}
    .mc-list:first-child{border-top:none;padding-top:0}
    .mc-list-thumb{flex-shrink:0;width:100px;height:70px;overflow:hidden}
    .mc-list-thumb img{width:100%;height:100%;object-fit:cover}
    .mc-list-info{flex:1;min-width:0}
    .mc-list-title{font-family:"Roboto",sans-serif;font-size:13px;font-weight:500;line-height:1.3;margin:0 0 4px}
    .mc-list-title a{color:#111;text-decoration:none}
    .mc-list-title a:hover{color:#e51a2f}

    /* Single article */
    .mc-post-header{margin-bottom:20px}
    .mc-entry-title{font-family:"Roboto",sans-serif;font-size:30px;font-weight:500;line-height:1.2;color:#111;margin:0 0 12px}
    .mc-post-featured{margin-bottom:20px}
    .mc-post-featured img{width:100%;height:auto}
    .mc-post-content{font-size:14px;line-height:1.8;color:#444}
    .mc-post-content p{margin-bottom:20px}
    .mc-post-content img{max-width:100%;height:auto;margin:15px 0}
    .mc-post-content h2,.mc-post-content h3{font-family:"Roboto",sans-serif;font-weight:500;margin:20px 0 10px;color:#111}
    .mc-breadcrumb{font-size:11px;color:#aaa;margin-bottom:12px}
    .mc-breadcrumb a{color:#aaa;text-decoration:none}
    .mc-breadcrumb a:hover{color:#e51a2f}
    .mc-tags{margin-top:20px;padding-top:15px;border-top:1px solid #eee}
    .mc-tags a{display:inline-block;padding:4px 10px;border:1px solid #ddd;font-size:11px;color:#666;margin:0 4px 4px 0;text-decoration:none}
    .mc-tags a:hover{background:#e51a2f;color:#fff;border-color:#e51a2f}

    /* Share buttons */
    .mc-share{display:flex;gap:4px;margin:15px 0}
    .mc-share a{display:flex;align-items:center;gap:5px;padding:6px 12px;font-size:11px;font-weight:700;color:#fff;text-decoration:none;text-transform:uppercase}
    .mc-share .mc-fb{background:#516eab}
    .mc-share .mc-tw{background:#29c5f6}
    .mc-share .mc-pin{background:#ca212a}

    /* Pagination */
    .mc-pagination{display:flex;gap:3px;justify-content:center;padding:20px 0}
    .mc-pagination a,.mc-pagination span{display:flex;align-items:center;justify-content:center;width:32px;height:32px;font-size:12px;border:1px solid #ddd;color:#666;text-decoration:none}
    .mc-pagination .current{background:#222;color:#fff;border-color:#222}
    .mc-pagination a:hover{background:#e51a2f;color:#fff;border-color:#e51a2f}

    /* Related articles */
    .mc-related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}
    @media(max-width:767px){.mc-related-grid{grid-template-columns:1fr}}

    /* Article card grid (td_flex_block_1 style) */
    .mc-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .mc-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    @media(max-width:991px){.mc-grid-3{grid-template-columns:repeat(2,1fr)}.mc-grid-4{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:567px){.mc-grid-3{grid-template-columns:1fr}.mc-grid-4{grid-template-columns:repeat(2,1fr)}}

    /* Article card */
    .mc-card{overflow:hidden}
    .mc-card-thumb{display:block;overflow:hidden;aspect-ratio:16/10;background:#f0f0f0}
    .mc-card-thumb img{width:100%;height:100%;object-fit:cover;transition:opacity .3s}
    .mc-card-thumb:hover img{opacity:.88}
    .mc-card-placeholder{width:100%;height:100%;background:#e8e8e8}
    .mc-card-info{padding:10px 0 0}

    /* Triple-column category row */
    .mc-triple-row{display:flex;gap:0;margin-bottom:26px;border-top:2px solid #222}
    .mc-triple-col{flex:1;min-width:0;padding:0 15px;border-right:1px solid #eee}
    .mc-triple-col:first-child{padding-left:0}
    .mc-triple-col:last-child{border-right:none;padding-right:0}
    .mc-triple-col .mc-block-title{border-bottom:none;margin-bottom:14px;padding-top:14px}
    .mc-triple-col .mc-block-title span{border-bottom:none;padding-bottom:0;margin-bottom:0}
    @media(max-width:767px){.mc-triple-row{flex-direction:column;border-top:none}.mc-triple-col{padding:0;border-right:none;border-bottom:1px solid #eee;margin-bottom:20px;padding-bottom:20px}}

    /* Wide block (featured left + list right) */
    .mc-wide-block{display:flex;gap:20px;flex-wrap:wrap}
    .mc-wide-left{flex:1;min-width:250px}
    .mc-wide-right{flex:1;min-width:200px}

    /* Category grid (category page) */
    .mc-cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-bottom:20px}
    .mc-cat-grid-item{position:relative;min-height:180px;overflow:hidden}
    .mc-cat-grid-item img{width:100%;height:100%;object-fit:cover}
    @media(max-width:767px){.mc-cat-grid{grid-template-columns:1fr}}

    /* Sidebar WP already styled, this is for fallback */
    .mc-sidebar .mc-block{padding:15px 20px}
    .mc-popular-num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#222;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
    </style>' . "\n";

    // OG meta from child views
    $headExtra .= $__env->yieldContent('wp_head', '');

    $shellBefore = str_replace('<!-- MC_HEAD_EXTRA -->', $headExtra, $shellBefore);

    // GTM noscript for body start
    $bodyStart = '';
    if (!empty($analytics['google_tag_manager'])) {
        $gtmId = e($analytics['google_tag_manager']);
        $bodyStart = "<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id={$gtmId}\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>\n";
    }
    $shellBefore = str_replace('<!-- MC_BODY_START -->', $bodyStart, $shellBefore);
@endphp
{!! $shellBefore !!}

@yield('content')

{!! $shellAfter !!}

@else
{{-- ═══ Fallback Mode: Tailwind-based design (when WP templates not yet imported) ═══ --}}
<!DOCTYPE html>
<html lang="{{ $currentSite->language ?? 'en' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $currentSite->description ?? '' }}">

    <title>@yield('title', $currentSite->name ?? 'MediaChief')</title>

    @if($currentSite->favicon ?? false)
        <link rel="icon" href="{{ asset('storage/' . $currentSite->favicon) }}">
    @elseif(!empty($currentSite->seo_settings['wp_favicon_url']))
        <link rel="icon" href="{{ $currentSite->seo_settings['wp_favicon_url'] }}">
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @php
        $theme = $currentSite->settings['theme'] ?? [];
        $analytics = $currentSite->analytics ?? [];
    @endphp

    @if(!empty($theme))
    <style>
        :root {
            @if(!empty($theme['primary_color']))
            --brand-primary: {{ $theme['primary_color'] }};
            @endif
            @if(!empty($theme['secondary_color']))
            --brand-secondary: {{ $theme['secondary_color'] }};
            @endif
            @if(!empty($theme['nav_bg']))
            --nav-bg: {{ $theme['nav_bg'] }};
            @endif
            @if(!empty($theme['nav_text']))
            --nav-text: {{ $theme['nav_text'] }};
            @endif
            @if(!empty($theme['heading_font']))
            --font-heading: '{{ $theme['heading_font'] }}';
            @endif
            @if(!empty($theme['body_font']))
            --font-body: '{{ $theme['body_font'] }}';
            @endif
        }
    </style>
    @endif

    @if(!empty($theme['custom_css']))
    <style>{!! $theme['custom_css'] !!}</style>
    @endif

    @if(!empty($theme['heading_font']) || !empty($theme['body_font']))
    @php
        $fonts = collect([$theme['heading_font'] ?? null, $theme['body_font'] ?? null])
            ->filter()->unique()
            ->map(fn($f) => str_replace(' ', '+', $f) . ':wght@400;500;600;700;900')
            ->implode('&family=');
    @endphp
    @if($fonts)
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family={{ $fonts }}&display=swap" rel="stylesheet">
    @endif
    @endif

    @if(!empty($analytics['google_analytics_4']))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ $analytics['google_analytics_4'] }}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{{ $analytics['google_analytics_4'] }}');</script>
    @elseif(!empty($analytics['google_analytics_ua']))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ $analytics['google_analytics_ua'] }}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{{ $analytics['google_analytics_ua'] }}');</script>
    @endif

    @if(!empty($analytics['google_tag_manager']))
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{{ $analytics['google_tag_manager'] }}');</script>
    @endif

    @if(!empty($currentSite->seo_settings['google_site_verification']))
    <meta name="google-site-verification" content="{{ $currentSite->seo_settings['google_site_verification'] }}">
    @endif

    @if(!empty($analytics['google_adsense']))
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={{ $analytics['google_adsense'] }}" crossorigin="anonymous"></script>
    @endif

    @stack('head')
</head>
<body class="min-h-screen bg-[#f9f9f9] font-sans antialiased">

    @if(!empty($analytics['google_tag_manager']))
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $analytics['google_tag_manager'] }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    @endif

    @include('frontend.partials.topbar')
    @include('frontend.partials.header')
    @include('frontend.partials.trending')

    <main>
        @yield('content')
    </main>

    @include('frontend.partials.footer')

    @stack('scripts')
</body>
</html>
@endif
