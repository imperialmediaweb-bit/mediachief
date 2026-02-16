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

    {{-- Load imported WordPress theme CSS if available --}}
    @if(file_exists(public_path('css/wp-theme/newspaper.css')))
        <link rel="stylesheet" href="{{ asset('css/wp-theme/newspaper.css') }}">
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
