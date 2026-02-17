@php
    $popularArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(5)
        ->get();

    $sidebarCategories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->withCount(['articles' => fn($q) => $q->where('status', 'published')])
        ->orderBy('sort_order')
        ->get();
@endphp

<div class="space-y-6">
    {{-- Popular Posts --}}
    <div>
        <div class="section-header">
            <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
            <h3>Most Popular</h3>
        </div>
        @foreach($popularArticles as $popular)
        <div class="td-article-list-item">
            <a href="{{ route('article.show', $popular) }}">{{ $popular->title }}</a>
        </div>
        @endforeach
    </div>

    {{-- Stay Connected --}}
    <div>
        <div class="section-header">
            <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
            <h3>Stay Connected</h3>
        </div>
        <div class="space-y-2 pt-1">
            <a href="#" class="flex items-center justify-between bg-[#516eab] px-3 py-2.5 text-white hover:opacity-90">
                <span class="flex items-center gap-2">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span class="text-xs font-bold uppercase" style="font-family: 'Work Sans', sans-serif;">Facebook</span>
                </span>
                <span class="text-[11px]">Like</span>
            </a>
            <a href="#" class="flex items-center justify-between bg-[#1da1f2] px-3 py-2.5 text-white hover:opacity-90">
                <span class="flex items-center gap-2">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span class="text-xs font-bold uppercase" style="font-family: 'Work Sans', sans-serif;">Twitter</span>
                </span>
                <span class="text-[11px]">Follow</span>
            </a>
        </div>
    </div>

    {{-- Categories --}}
    <div>
        <div class="section-header">
            <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
            <h3>Categories</h3>
        </div>
        @foreach($sidebarCategories as $cat)
            <a href="{{ route('category.show', $cat) }}" class="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm hover:text-brand-red" style="font-family: 'Work Sans', sans-serif; color: #333;">
                <span>{{ $cat->name }}</span>
                <span class="text-xs text-gray-400">({{ $cat->articles_count }})</span>
            </a>
        @endforeach
    </div>

    {{-- Newsletter --}}
    <div>
        <div class="section-header">
            <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            <h3>Newsletter</h3>
        </div>
        <p class="mb-3 text-sm" style="font-family: 'Work Sans', sans-serif; color: #666;">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" class="mb-2 w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red" style="font-family: 'Work Sans', sans-serif;">
            <button type="submit" class="w-full bg-brand-red py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90" style="font-family: 'Work Sans', sans-serif;">Subscribe</button>
        </form>
    </div>
</div>
