@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();
@endphp

<header>
    {{-- Logo area --}}
    <div class="bg-white border-b border-gray-100">
        <div class="mx-auto max-w-[1100px] px-4">
            <div class="flex items-center justify-center py-5">
                <a href="{{ route('home') }}" class="block">
                    @if($currentSite->logo ?? false)
                        <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-[55px]">
                    @else
                        <span class="font-heading text-[38px] font-black uppercase leading-none tracking-tight text-gray-900">{{ $currentSite->name }}</span>
                    @endif
                </a>
            </div>
        </div>
    </div>

    {{-- Main navigation --}}
    <nav class="bg-[var(--nav-bg,#222)] sticky top-0 z-40 shadow-md">
        <div class="mx-auto max-w-[1100px] px-4">
            <div class="flex h-[46px] items-center justify-between">
                {{-- Mobile menu button --}}
                <button type="button" class="text-white md:hidden" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Menu">
                    <svg width="20" height="20" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>

                {{-- Desktop nav --}}
                <div class="hidden h-full items-center md:flex">
                    <a href="{{ route('home') }}" class="flex h-[46px] items-center bg-[var(--brand-primary,#e51a2f)] px-4 text-white transition-all hover:brightness-110">
                        <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                    </a>

                    @foreach($categories as $cat)
                        <a href="{{ route('category.show', $cat) }}" class="flex h-[46px] items-center px-[14px] text-[13px] font-semibold uppercase tracking-[0.03em] text-[var(--nav-text,#f5f5f5)] transition-colors hover:bg-[var(--brand-primary,#e51a2f)] hover:text-white">
                            {{ $cat->name }}
                        </a>
                    @endforeach
                </div>

                {{-- Search --}}
                <button type="button" class="flex h-[46px] items-center px-3 text-[var(--nav-text,#f5f5f5)] hover:text-white" onclick="document.getElementById('search-overlay').classList.toggle('hidden')" aria-label="Search">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
            </div>
        </div>
    </nav>

    {{-- Mobile menu --}}
    <div id="mobile-menu" class="hidden bg-[var(--nav-bg,#222)] md:hidden z-30 relative">
        <div class="border-t border-[#333] px-4 py-2">
            <a href="{{ route('home') }}" class="block py-2.5 text-[13px] font-semibold uppercase text-white">Home</a>
            @foreach($categories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="block border-t border-[#333]/50 py-2.5 text-[13px] font-semibold uppercase text-gray-300 hover:text-white">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</header>

{{-- Search overlay --}}
<div id="search-overlay" class="fixed inset-0 z-50 hidden bg-black/90 backdrop-blur-sm">
    <div class="mx-auto flex max-w-2xl items-start justify-center pt-32">
        <form action="{{ route('home') }}" method="GET" class="w-full px-4">
            <div class="relative">
                <input type="text" name="q" placeholder="Search..." class="w-full border-b-2 border-white bg-transparent px-4 py-4 text-2xl text-white placeholder-gray-500 outline-none focus:border-[var(--brand-primary,#e51a2f)]" autofocus>
                <button type="button" class="absolute right-2 top-4 text-gray-400 hover:text-white" onclick="document.getElementById('search-overlay').classList.add('hidden')">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </form>
    </div>
</div>
