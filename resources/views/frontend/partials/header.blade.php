@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();
@endphp

<header>
    {{-- Mobile Header (phones only) --}}
    <div class="td-mobile-header md:hidden" style="border-bottom: 3px solid #000; background: #fff;">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex items-center justify-between py-2.5">
                <button type="button" class="text-black" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <a href="{{ route('home') }}" class="text-center">
                    <span class="td-header-logo">{{ $currentSite->name }}</span>
                </a>
                <button type="button" class="text-black" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </div>

    {{-- Desktop Header: 3-column layout (25% / 50% / 25%) --}}
    <div class="hidden bg-white md:block">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex items-center py-5">
                {{-- Left column (25%): Newsletter button --}}
                <div class="flex w-1/4 items-center justify-start">
                    <a href="#" class="td-header-newsletter">
                        <svg class="td-nl-icon h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                        <span>Newsletter</span>
                    </a>
                </div>

                {{-- Center column (50%): Logo + tagline --}}
                <div class="flex w-1/2 flex-col items-center">
                    <a href="{{ route('home') }}" class="text-center">
                        @if($currentSite->logo ?? false)
                            <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-[70px]">
                        @else
                            <span class="td-header-logo">{{ $currentSite->name }}</span>
                        @endif
                    </a>
                    <span class="td-header-tagline">"Informed, Involved, Inspired Together."</span>
                </div>

                {{-- Right column (25%): Pricing Plans button --}}
                <div class="flex w-1/4 items-center justify-end">
                    <a href="#" class="td-header-pricing">Pricing Plans</a>
                </div>
            </div>
        </div>
    </div>

    {{-- Navigation Bar (white bg, 1px top + 3px bottom black border) --}}
    <nav class="td-nav-bar">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="hidden h-[48px] items-center justify-center md:flex">
                {{-- "All" button (hamburger icon + label, black bg) --}}
                <button type="button" class="td-nav-all-btn" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="All categories">
                    <svg viewBox="0 0 1024 1024"><path d="M945.172 561.724h-866.376c-22.364 0-40.55-18.196-40.55-40.591 0-22.385 18.186-40.581 40.55-40.581h866.365c22.385 0 40.561 18.196 40.561 40.581 0.010 22.395-18.176 40.591-40.55 40.591v0zM945.183 330.403h-866.386c-22.374 0-40.55-18.196-40.55-40.571 0-22.405 18.176-40.612 40.55-40.612h866.376c22.374 0 40.561 18.207 40.561 40.612 0.010 22.364-18.186 40.571-40.55 40.571v0zM945.172 793.066h-866.376c-22.374 0-40.55-18.196-40.55-40.602 0-22.385 18.176-40.581 40.55-40.581h866.365c22.385 0 40.581 18.196 40.581 40.581 0.010 22.395-18.196 40.602-40.571 40.602v0z"></path></svg>
                    <span>All</span>
                </button>

                {{-- Category nav links --}}
                @foreach($categories as $cat)
                    <a href="{{ route('category.show', $cat) }}" class="td-nav-link">{{ $cat->name }}</a>
                @endforeach

                {{-- Search icon (right side) --}}
                <div class="ml-auto">
                    <button type="button" class="flex h-[48px] items-center px-3 text-black hover:text-[var(--brand-primary,#E04040)]" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                        <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </button>
                </div>
            </div>

            {{-- Mobile: hamburger + search only --}}
            <div class="flex h-[48px] items-center justify-between md:hidden">
                <button type="button" class="text-black" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <button type="button" class="text-black" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </nav>

    {{-- Mobile menu (slides down) --}}
    <div id="mobile-menu" class="hidden bg-black">
        <div class="border-t border-gray-800 px-4 py-2">
            <a href="{{ route('home') }}" class="block py-2.5 text-[13px] font-extrabold uppercase text-white" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif;">Home</a>
            @foreach($categories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="block border-t border-gray-800 py-2.5 text-[13px] font-extrabold uppercase text-gray-300 hover:text-white" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif;">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</header>

{{-- Search overlay --}}
<div id="search-overlay" class="fixed inset-0 z-50 hidden bg-black/90 backdrop-blur-sm">
    <div class="mx-auto flex max-w-2xl items-start justify-center pt-32">
        <form action="{{ route('home') }}" method="GET" class="w-full px-4">
            <div class="relative">
                <input type="text" name="q" placeholder="Search..." class="w-full border-b-2 border-white bg-transparent px-4 py-4 text-2xl text-white placeholder-gray-500 outline-none focus:border-[var(--brand-primary,#E04040)]" autofocus>
                <button type="button" class="absolute right-2 top-4 text-gray-400 hover:text-white" onclick="document.getElementById('search-overlay').classList.add('hidden')">
                    <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </form>
    </div>
</div>
