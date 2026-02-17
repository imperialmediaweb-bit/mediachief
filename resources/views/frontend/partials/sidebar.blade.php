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

<aside>
    {{-- Popular Posts --}}
    <div class="widget">
        <div class="block-title"><span>Most Popular</span></div>
        @foreach($popularArticles as $index => $popular)
            <div style="padding-bottom: 12px; display: flex; gap: 10px; border-bottom: 1px dashed #f1f1f1; margin-bottom: 10px;">
                <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: var(--td_black, #222); color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; font-family: 'Open Sans', sans-serif;">{{ $index + 1 }}</span>
                <div style="min-width: 0; flex: 1;">
                    <h4 style="font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 500; line-height: 1.3; margin: 0 0 4px;"><a href="{{ route('article.show', $popular) }}" style="color: #111; text-decoration: none;">{{ Str::limit($popular->title, 55) }}</a></h4>
                    <span class="td-post-date" style="font-size: 11px;">{{ $popular->published_at?->diffForHumans() }}</span>
                </div>
            </div>
        @endforeach
    </div>

    {{-- Stay Connected --}}
    <div class="widget">
        <div class="block-title"><span>Stay Connected</span></div>
        <div style="padding-top: 5px;">
            <a href="#" style="display: flex; align-items: center; justify-content: space-between; background: #516eab; padding: 8px 12px; color: #fff; text-decoration: none; margin-bottom: 6px;">
                <span style="display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg><span style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Facebook</span></span>
                <span style="font-size: 11px;">Like</span>
            </a>
            <a href="#" style="display: flex; align-items: center; justify-content: space-between; background: #29c5f6; padding: 8px 12px; color: #fff; text-decoration: none;">
                <span style="display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Twitter</span></span>
                <span style="font-size: 11px;">Follow</span>
            </a>
        </div>
    </div>

    {{-- Categories --}}
    <div class="widget widget_categories">
        <div class="block-title"><span>Categories</span></div>
        <ul style="list-style: none; margin: 0; padding: 0;">
            @foreach($sidebarCategories as $cat)
                <li style="margin: 0; border-bottom: 1px solid #f1f1f1;">
                    <a href="{{ route('category.show', $cat) }}" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 0; font-size: 13px; color: #111; text-decoration: none;">
                        <span>{{ $cat->name }}</span>
                        <span style="font-size: 11px; color: #aaa;">({{ $cat->articles_count }})</span>
                    </a>
                </li>
            @endforeach
        </ul>
    </div>

    {{-- Newsletter --}}
    <div class="widget">
        <div class="block-title"><span>Newsletter</span></div>
        <p style="font-size: 13px; line-height: 1.6; color: #767676; margin-bottom: 12px;">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" style="width: 100%; border: 1px solid #e1e1e1; padding: 6px 9px; font-size: 12px; margin-bottom: 8px; height: 34px;">
            <input type="submit" value="SUBSCRIBE" style="width: 100%; font-size: 11px; font-weight: 700; letter-spacing: 1px;">
        </form>
    </div>
</aside>
