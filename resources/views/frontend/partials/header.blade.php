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
    <div class="bg-white py-4">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex items-center justify-between">
                {{-- Newsletter icon (left) --}}
                <a href="#" class="hidden items-center gap-2 text-black md:flex">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                    <span class="text-[11px] font-bold uppercase tracking-wider" style="font-family: 'Work Sans', sans-serif;">Newsletter</span>
                </a>

                {{-- Centered Logo --}}
                <a href="{{ route('home') }}" class="text-center">
                    @if($currentSite->logo ?? false)
                        <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-[50px] md:h-[65px]">
                    @else
                        <span class="td-header-logo text-[32px] md:text-[48px]">{{ $currentSite->name }}</span>
                    @endif
                    @if($currentSite->description ?? false)
                        <div class="mt-1 text-[12px] italic text-gray-500" style="font-family: 'Work Sans', sans-serif;">"{{ Str::limit($currentSite->description, 50) }}"</div>
                    @endif
                </a>

                {{-- Pricing Plans (right) --}}
                <a href="#" class="hidden items-center border-2 border-black px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white md:flex" style="font-family: 'Work Sans', sans-serif;">
                    Pricing Plans
                </a>
            </div>
        </div>
    </div>

    {{-- Dark Navigation Bar --}}
    <nav class="td-nav-bar">
        <div class="mx-auto max-w-[1200px] px-4">
            <div class="flex h-[46px] items-center justify-between">
                {{-- Mobile menu button --}}
                <button type="button" class="text-white md:hidden" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>

                {{-- Desktop nav --}}
                <div class="hidden h-full items-center md:flex">
                    <a href="{{ route('home') }}" class="td-nav-link" style="background: var(--brand-primary, #E04040);">
                        <svg class="mr-1 h-[14px] w-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                        ALL
                    </a>
                    @foreach($categories as $cat)
                        <a href="{{ route('category.show', $cat) }}" class="td-nav-link">{{ $cat->name }}</a>
                    @endforeach
                </div>

                {{-- Search --}}
                <button type="button" class="flex h-[46px] items-center px-3 text-white hover:text-gray-300" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg class="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </nav>

    {{-- Mobile menu --}}
    <div id="mobile-menu" class="hidden bg-black md:hidden">
        <div class="border-t border-gray-800 px-4 py-2">
            <a href="{{ route('home') }}" class="block py-2.5 text-[13px] font-bold uppercase text-white" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif;">Home</a>
            @foreach($categories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="block border-t border-gray-800 py-2.5 text-[13px] font-bold uppercase text-gray-300 hover:text-white" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif;">{{ $cat->name }}</a>
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
