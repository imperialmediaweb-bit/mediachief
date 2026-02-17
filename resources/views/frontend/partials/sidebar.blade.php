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

<aside class="mc-sidebar">
    {{-- Popular Posts --}}
    <div class="mc-block">
        <h3 class="mc-block-title"><span>Most Popular</span></h3>
        @foreach($popularArticles as $index => $popular)
            <div class="mc-list" style="align-items:center">
                <span class="mc-popular-num">{{ $index + 1 }}</span>
                <div class="mc-list-info">
                    <h4 class="mc-list-title"><a href="{{ route('article.show', $popular) }}">{{ Str::limit($popular->title, 55) }}</a></h4>
                    <div class="mc-module-meta">{{ $popular->published_at?->diffForHumans() }}</div>
                </div>
            </div>
        @endforeach
    </div>

    {{-- Stay Connected --}}
    <div class="mc-block">
        <h3 class="mc-block-title"><span>Stay Connected</span></h3>
        <div style="display:flex;flex-direction:column;gap:8px;padding-top:4px">
            <a href="#" class="mc-social-btn" style="background:#516eab">
                <span style="display:flex;align-items:center;gap:8px">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span style="font-size:12px;font-weight:700;text-transform:uppercase">Facebook</span>
                </span>
                <span style="font-size:11px">Like</span>
            </a>
            <a href="#" class="mc-social-btn" style="background:#1da1f2">
                <span style="display:flex;align-items:center;gap:8px">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span style="font-size:12px;font-weight:700;text-transform:uppercase">Twitter</span>
                </span>
                <span style="font-size:11px">Follow</span>
            </a>
        </div>
    </div>

    {{-- Categories --}}
    <div class="mc-block">
        <h3 class="mc-block-title"><span>Categories</span></h3>
        @foreach($sidebarCategories as $cat)
            <a href="{{ route('category.show', $cat) }}" class="mc-sidebar-cat-link">
                <span>{{ $cat->name }}</span>
                <span style="font-size:11px;color:#aaa">({{ $cat->articles_count }})</span>
            </a>
        @endforeach
    </div>

    {{-- Newsletter --}}
    <div class="mc-block">
        <h3 class="mc-block-title"><span>Newsletter</span></h3>
        <p style="font-size:13px;line-height:1.6;color:#666;margin-bottom:12px">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" class="mc-input">
            <button type="submit" class="mc-btn-primary">Subscribe</button>
        </form>
    </div>
</aside>
