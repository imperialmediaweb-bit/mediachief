@php
    $footerCategories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();

    $footerPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();

    $latestFooter = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('published_at')
        ->limit(4)
        ->get();

    $popularFooter = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(4)
        ->get();
@endphp

{{-- Footer Logo Bar --}}
<div class="td-footer-nav">
    <div class="mx-auto max-w-[1200px] px-4">
        <div class="flex h-[50px] items-center justify-between">
            <a href="{{ route('home') }}" class="td-footer-logo text-[20px]">{{ $currentSite->name }}</a>
            <div class="hidden items-center md:flex">
                @foreach($footerCategories->take(8) as $cat)
                    <a href="{{ route('category.show', $cat) }}">{{ $cat->name }}</a>
                @endforeach
            </div>
        </div>
    </div>
</div>

{{-- Footer Content --}}
<footer class="td-footer">
    <div class="mx-auto max-w-[1200px] px-4 py-10">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
            {{-- About --}}
            <div>
                <h4>About Us</h4>
                <p class="text-[13px] leading-relaxed text-gray-400">
                    {{ $currentSite->description ?? 'Your trusted source for the latest news, stories, and updates.' }}
                </p>
                <div class="mt-4 flex items-center gap-3">
                    <a href="#" class="text-gray-500 hover:text-[var(--brand-primary,#E04040)]"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="#" class="text-gray-500 hover:text-[var(--brand-primary,#E04040)]"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                    <a href="#" class="text-gray-500 hover:text-[var(--brand-primary,#E04040)]"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                </div>
            </div>

            {{-- Latest Notices --}}
            <div>
                <h4>Latest Notices</h4>
                @foreach($latestFooter->take(3) as $art)
                <div class="mb-3 border-b border-gray-800 pb-3">
                    <a href="{{ route('article.show', $art) }}" class="text-[13px] text-gray-300 hover:text-white" style="font-weight: 500;">{{ Str::limit($art->title, 55) }}</a>
                    <div class="mt-1 text-[11px] text-gray-500">{{ $art->published_at?->format('F j, Y') }}</div>
                </div>
                @endforeach
            </div>

            {{-- Posts Popular --}}
            <div>
                <h4>Posts Popular</h4>
                @foreach($popularFooter->take(3) as $art)
                <div class="mb-3 border-b border-gray-800 pb-3">
                    <a href="{{ route('article.show', $art) }}" class="text-[13px] text-gray-300 hover:text-white" style="font-weight: 500;">{{ Str::limit($art->title, 55) }}</a>
                    <div class="mt-1 text-[11px] text-gray-500">{{ $art->published_at?->format('F j, Y') }}</div>
                </div>
                @endforeach
            </div>

            {{-- Pages & Categories --}}
            <div>
                @if($footerPages->isNotEmpty())
                <h4>Pages</h4>
                @foreach($footerPages as $page)
                    <a href="{{ route('page.show', $page) }}" class="mb-1 block text-[13px] text-gray-400 hover:text-white">{{ $page->title }}</a>
                @endforeach
                @endif

                <h4 class="mt-6">Categories</h4>
                @foreach($footerCategories->take(6) as $cat)
                    <a href="{{ route('category.show', $cat) }}" class="mb-1 block text-[13px] text-gray-400 hover:text-white">{{ $cat->name }}</a>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Copyright Bar --}}
    <div class="border-t border-gray-800">
        <div class="mx-auto max-w-[1200px] px-4 py-4">
            <p class="text-center text-[11px] text-gray-500">&copy; {{ date('Y') }} {{ $currentSite->name }}. All Rights Reserved.</p>
        </div>
    </div>
</footer>
