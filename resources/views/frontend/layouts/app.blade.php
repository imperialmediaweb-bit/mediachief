<!DOCTYPE html>
<html lang="{{ $currentSite->language ?? 'ro' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $currentSite->description ?? '' }}">

    <title>@yield('title', $currentSite->name ?? 'MediaChief')</title>

    @if($currentSite->favicon ?? false)
        <link rel="icon" href="{{ asset('storage/' . $currentSite->favicon) }}">
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @stack('head')
</head>
<body class="min-h-screen antialiased">

    {{-- Top bar --}}
    @include('frontend.partials.topbar')

    {{-- Header --}}
    @include('frontend.partials.header')

    {{-- Trending bar --}}
    @include('frontend.partials.trending')

    {{-- Main content --}}
    <main>
        @yield('content')
    </main>

    {{-- Footer --}}
    @include('frontend.partials.footer')

    @stack('scripts')
</body>
</html>
