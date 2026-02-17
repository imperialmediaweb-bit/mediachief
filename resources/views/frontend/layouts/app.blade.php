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

    // Include compiled Vite CSS for mc-* classes in WP shell mode too
    $headExtra .= app(\Illuminate\Foundation\Vite::class)(['resources/css/app.css']) . "\n";

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
{{-- ═══ Native Mode: Clean professional news design ═══ --}}
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
<body class="min-h-screen bg-[#f4f4f4] font-sans antialiased">

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
