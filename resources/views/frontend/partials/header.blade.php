@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();
@endphp

<header>
    {{-- Logo Area: Newsletter | Logo | Pricing Plans --}}
    <div class="bg-white py-5">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex items-center justify-between">
                {{-- Newsletter button (left) --}}
                <a href="#" class="td-header-newsletter hidden md:flex">
                    <svg class="td-nl-icon h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                    <span>Newsletter</span>
                </a>

                {{-- Centered Logo --}}
                <a href="{{ route('home') }}" class="text-center">
                    @if($currentSite->logo ?? false)
                        <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-[50px] md:h-[70px]">
                    @else
                        <span class="td-header-logo">{{ $currentSite->name }}</span>
                    @endif
                    <div class="td-header-tagline mt-1">"Informed, Involved, Inspired Together."</div>
                </a>

                {{-- Pricing Plans (right) --}}
                <a href="#" class="td-header-pricing hidden md:flex">
                    Pricing Plans
                </a>
            </div>
        </div>
    </div>

    {{-- Navigation Bar (white bg, black borders, centered nav) --}}
    <nav class="td-nav-bar">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex h-[48px] items-center justify-between">
                {{-- Mobile menu button --}}
                <button type="button" class="text-black md:hidden" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>

                {{-- Desktop nav (centered) --}}
                <div class="hidden h-full flex-1 items-center justify-center md:flex">
                    @foreach($categories as $cat)
                        <a href="{{ route('category.show', $cat) }}" class="td-nav-link">{{ $cat->name }}</a>
                    @endforeach
                </div>

                {{-- Search --}}
                <button type="button" class="flex h-[48px] items-center px-3 text-black hover:text-[var(--brand-primary,#E04040)]" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg class="h-[24px] w-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </nav>

    {{-- Mobile menu --}}
    <div id="mobile-menu" class="hidden bg-black md:hidden">
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
