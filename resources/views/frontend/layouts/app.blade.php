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
<body class="min-h-screen bg-gray-50 text-gray-900 antialiased">
    @include('frontend.partials.header')

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        @yield('content')
    </main>

    @include('frontend.partials.footer')

    @stack('scripts')
</body>
</html>
