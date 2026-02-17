@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(12)
        ->get();

    $menuPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('show_in_menu', true)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();
@endphp

{{-- Header --}}
<header class="bg-white">
    <div class="mx-auto max-w-7xl px-4">
        <div class="flex items-center justify-between py-6 md:py-8">
            {{-- Hamburger Menu Button --}}
            <button id="td-menu-btn" class="flex items-center gap-2 text-black hover:text-brand-red transition-colors" aria-label="Menu">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
            </button>

            {{-- Centered Logo --}}
            <a href="{{ route('home') }}" class="td-header-logo text-3xl md:text-5xl lg:text-[56px] leading-none">
                @if($currentSite->logo)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-10 md:h-14">
                @else
                    {{ $currentSite->name }}
                @endif
            </a>

            {{-- Search Button --}}
            <button id="td-search-btn" class="text-black hover:text-brand-red transition-colors" aria-label="Search">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="border-b-[3px] border-black"></div>
</header>

{{-- Mobile/Hamburger Menu Overlay --}}
<div id="td-menu-overlay" class="td-menu-overlay">
    <div class="td-menu-panel">
        {{-- Close Button --}}
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-600">
            <span class="text-white font-heading text-lg font-bold uppercase">Menu</span>
            <button id="td-menu-close" class="text-gray-400 hover:text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        {{-- Home --}}
        <a href="{{ route('home') }}">Home</a>

        {{-- Categories --}}
        @foreach($categories as $cat)
            <a href="{{ route('category.show', $cat) }}">{{ $cat->name }}</a>
        @endforeach

        {{-- Pages --}}
        @if($menuPages->isNotEmpty())
            <div class="border-t border-gray-600 mt-2 pt-2">
                @foreach($menuPages as $page)
                    <a href="{{ route('page.show', $page) }}">{{ $page->title }}</a>
                @endforeach
            </div>
        @endif
    </div>
</div>

{{-- Search Overlay --}}
<div id="td-search-overlay" class="fixed inset-0 z-[9998] bg-black/90" style="display:none;">
    <div class="flex h-full w-full items-center justify-center">
        <div class="w-full max-w-xl px-6">
            <form action="{{ route('home') }}" method="GET" class="relative">
                <input type="text" name="q" placeholder="Search..." autofocus
                       class="w-full border-b-2 border-white bg-transparent py-4 text-2xl text-white placeholder-gray-400 outline-none">
                <button type="submit" class="absolute right-0 top-1/2 -translate-y-1/2 text-white">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </button>
            </form>
        </div>
    </div>
    <button id="td-search-close" class="absolute top-8 right-8 text-gray-400 hover:text-white">
        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
    </button>
</div>

@push('scripts')
<script>
(function() {
    // Hamburger menu
    var menuBtn = document.getElementById('td-menu-btn');
    var menuOverlay = document.getElementById('td-menu-overlay');
    var menuClose = document.getElementById('td-menu-close');

    if (menuBtn && menuOverlay) {
        menuBtn.addEventListener('click', function() {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        function closeMenu() {
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (menuClose) menuClose.addEventListener('click', closeMenu);
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) closeMenu();
        });
    }

    // Search overlay
    var searchBtn = document.getElementById('td-search-btn');
    var searchOverlay = document.getElementById('td-search-overlay');
    var searchClose = document.getElementById('td-search-close');

    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', function() {
            searchOverlay.style.display = 'flex';
            var input = searchOverlay.querySelector('input');
            if (input) input.focus();
        });

        function closeSearch() {
            searchOverlay.style.display = 'none';
        }

        if (searchClose) searchClose.addEventListener('click', closeSearch);
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) closeSearch();
        });
    }
})();
</script>
@endpush
