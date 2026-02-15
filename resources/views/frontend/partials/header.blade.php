@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();

    $menuPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('show_in_menu', true)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();
@endphp

<header class="bg-brand-dark">
    {{-- Main header with logo --}}
    <div class="border-b border-brand-border">
        <div class="mx-auto max-w-7xl px-4">
            <div class="flex h-20 items-center justify-between">
                {{-- Mobile menu button --}}
                <button type="button" class="text-white md:hidden" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>

                {{-- Logo --}}
                <a href="{{ route('home') }}" class="flex items-center gap-3">
                    @if($currentSite->logo ?? false)
                        <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-10">
                    @else
                        <span class="font-heading text-2xl font-black uppercase tracking-tight text-white">
                            {{ $currentSite->name }}
                        </span>
                    @endif
                </a>

                {{-- Search button --}}
                <button type="button" class="text-white hover:text-brand-red" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </div>

    {{-- Navigation bar --}}
    <nav class="border-b border-brand-border bg-brand-gray">
        <div class="mx-auto max-w-7xl px-4">
            <div class="hidden h-12 items-center gap-0 md:flex">
                <a href="{{ route('home') }}" class="flex h-full items-center bg-brand-red px-5 text-sm font-bold uppercase tracking-wide text-white">
                    <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    Home
                </a>

                @foreach($categories as $cat)
                    <a href="{{ route('category.show', $cat) }}" class="flex h-full items-center px-4 text-[13px] font-semibold uppercase tracking-wide text-gray-300 transition-colors hover:bg-brand-red hover:text-white">
                        {{ $cat->name }}
                    </a>
                @endforeach

                @foreach($menuPages as $page)
                    <a href="{{ route('page.show', $page) }}" class="flex h-full items-center px-4 text-[13px] font-semibold uppercase tracking-wide text-gray-300 transition-colors hover:bg-brand-red hover:text-white">
                        {{ $page->title }}
                    </a>
                @endforeach
            </div>
        </div>
    </nav>

    {{-- Mobile menu --}}
    <div id="mobile-menu" class="hidden border-b border-brand-border bg-brand-gray md:hidden">
        <div class="px-4 py-3">
            <a href="{{ route('home') }}" class="block py-2 text-sm font-semibold uppercase text-white">Home</a>
            @foreach($categories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="block py-2 text-sm font-semibold uppercase text-gray-300 hover:text-white">{{ $cat->name }}</a>
            @endforeach
            @foreach($menuPages as $page)
                <a href="{{ route('page.show', $page) }}" class="block py-2 text-sm font-semibold uppercase text-gray-300 hover:text-white">{{ $page->title }}</a>
            @endforeach
        </div>
    </div>
</header>

{{-- Search overlay --}}
<div id="search-overlay" class="fixed inset-0 z-50 hidden bg-black/90 backdrop-blur-sm">
    <div class="mx-auto flex max-w-2xl items-start justify-center pt-32">
        <form action="{{ route('home') }}" method="GET" class="w-full px-4">
            <div class="relative">
                <input type="text" name="q" placeholder="Search articles..." class="w-full border-b-2 border-white bg-transparent px-4 py-4 text-2xl text-white placeholder-gray-500 outline-none focus:border-brand-red" autofocus>
                <button type="button" class="absolute right-2 top-4 text-gray-400 hover:text-white" onclick="document.getElementById('search-overlay').classList.add('hidden')">
                    <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </form>
    </div>
</div>
