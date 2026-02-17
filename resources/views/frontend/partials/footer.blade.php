@php
    $footerCategories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(8)
        ->get();

    $latestArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('published_at')
        ->limit(3)
        ->get();

    $popularFooter = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(3)
        ->get();

    $footerPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();
@endphp

{{-- Bottom Navigation Bar --}}
<div class="bg-gray-900">
    <div class="mx-auto max-w-7xl px-4">
        <div class="flex h-10 items-center gap-0 overflow-x-auto">
            <a href="{{ route('home') }}" class="flex h-full shrink-0 items-center bg-brand-red px-4 text-xs font-bold uppercase text-white">Home</a>
            @foreach($footerCategories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="flex h-full shrink-0 items-center px-3 text-xs font-semibold uppercase text-gray-400 hover:text-white">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</div>

{{-- Footer --}}
<footer class="border-t border-gray-800 bg-gray-900">
    <div class="mx-auto max-w-7xl px-4 py-10">
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {{-- About --}}
            <div>
                <h4 class="mb-4 border-b-2 border-brand-red pb-2 text-sm font-bold uppercase text-white">About Us</h4>
                @if($currentSite->logo ?? false)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="mb-4 h-7" style="filter:brightness(0) invert(1)">
                @else
                    <span class="mb-4 inline-block font-heading text-lg font-black uppercase text-white">{{ $currentSite->name }}</span>
                @endif
                <p class="text-sm leading-relaxed text-gray-400">{{ $currentSite->description ?? 'Your trusted source for local and national news.' }}</p>
                <div class="mt-4 flex items-center gap-2">
                    <a href="#" class="flex h-8 w-8 items-center justify-center bg-gray-800 text-gray-400 hover:bg-brand-red hover:text-white"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="#" class="flex h-8 w-8 items-center justify-center bg-gray-800 text-gray-400 hover:bg-brand-red hover:text-white"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                    <a href="#" class="flex h-8 w-8 items-center justify-center bg-gray-800 text-gray-400 hover:bg-brand-red hover:text-white"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                </div>
            </div>

            {{-- Latest Articles --}}
            <div>
                <h4 class="mb-4 border-b-2 border-brand-red pb-2 text-sm font-bold uppercase text-white">Latest Articles</h4>
                <div class="space-y-4">
                    @foreach($latestArticles as $la)
                    <div class="flex gap-3">
                        @if($la->image_url)
                        <a href="{{ route('article.show', $la) }}" class="shrink-0"><img src="{{ $la->image_url }}" alt="{{ $la->title }}" class="h-14 w-20 object-cover"></a>
                        @endif
                        <div>
                            <h5 class="text-sm font-bold leading-tight text-gray-300"><a href="{{ route('article.show', $la) }}" class="hover:text-brand-red">{{ Str::limit($la->title, 50) }}</a></h5>
                            <span class="mt-1 block text-xs text-gray-500">{{ $la->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- Most Popular --}}
            <div>
                <h4 class="mb-4 border-b-2 border-brand-red pb-2 text-sm font-bold uppercase text-white">Most Popular</h4>
                <div class="space-y-4">
                    @foreach($popularFooter as $pf)
                    <div class="flex gap-3">
                        @if($pf->image_url)
                        <a href="{{ route('article.show', $pf) }}" class="shrink-0"><img src="{{ $pf->image_url }}" alt="{{ $pf->title }}" class="h-14 w-20 object-cover"></a>
                        @endif
                        <div>
                            <h5 class="text-sm font-bold leading-tight text-gray-300"><a href="{{ route('article.show', $pf) }}" class="hover:text-brand-red">{{ Str::limit($pf->title, 50) }}</a></h5>
                            <span class="mt-1 block text-xs text-gray-500">{{ $pf->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- Pages / Categories --}}
            <div>
                <h4 class="mb-4 border-b-2 border-brand-red pb-2 text-sm font-bold uppercase text-white">Pages</h4>
                <ul class="space-y-2">
                    @foreach($footerPages as $fp)
                        <li><a href="{{ route('page.show', $fp) }}" class="text-sm text-gray-400 hover:text-brand-red">{{ $fp->title }}</a></li>
                    @endforeach
                </ul>
                <h4 class="mb-3 mt-6 border-b-2 border-brand-red pb-2 text-sm font-bold uppercase text-white">Categories</h4>
                <div class="flex flex-wrap gap-1">
                    @foreach($footerCategories as $fc)
                        <a href="{{ route('category.show', $fc) }}" class="bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:bg-brand-red hover:text-white">{{ $fc->name }}</a>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Copyright --}}
    <div class="border-t border-gray-800">
        <div class="mx-auto max-w-7xl px-4 py-4">
            <div class="flex flex-col items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row">
                <span>&copy; {{ date('Y') }} {{ $currentSite->name }}. All Rights Reserved.</span>
                <span>Part of Media Capital Trust Network</span>
            </div>
        </div>
    </div>
</footer>
