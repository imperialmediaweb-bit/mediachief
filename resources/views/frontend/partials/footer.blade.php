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

{{-- Bottom navigation bar --}}
<div style="background:var(--nav-bg, #222)">
    <div class="mx-auto max-w-[1100px] px-4">
        <div style="display:flex;height:40px;align-items:center;gap:0;overflow-x:auto">
            <a href="{{ route('home') }}" style="display:flex;height:100%;align-items:center;padding:0 12px;background:var(--brand-primary,#e51a2f);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;text-decoration:none;flex-shrink:0">Home</a>
            @foreach($footerCategories as $cat)
                <a href="{{ route('category.show', $cat) }}" style="display:flex;height:100%;align-items:center;padding:0 12px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;text-decoration:none;flex-shrink:0">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</div>

<footer style="background:var(--nav-bg, #222);border-top:1px solid #333">
    <div class="mx-auto max-w-[1100px] px-4" style="padding-top:32px;padding-bottom:32px">
        <div class="mc-footer-grid">
            {{-- About --}}
            <div>
                <h4 class="td-footer-title">About Us</h4>
                @if($currentSite->logo ?? false)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" style="height:28px;margin-bottom:12px;filter:brightness(0) invert(1)">
                @else
                    <span style="display:inline-block;margin-bottom:12px;font-family:'Roboto',sans-serif;font-size:16px;font-weight:900;text-transform:uppercase;color:#fff">{{ $currentSite->name }}</span>
                @endif
                <p style="font-size:13px;line-height:1.7;color:#999">
                    {{ $currentSite->description ?? 'Your trusted source for local and national news.' }}
                </p>
                <div style="display:flex;align-items:center;gap:4px;margin-top:12px">
                    <a href="#" class="mc-footer-social"><svg style="width:12px;height:12px" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="#" class="mc-footer-social"><svg style="width:12px;height:12px" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                </div>
            </div>

            {{-- Latest Articles --}}
            <div>
                <h4 class="td-footer-title">Latest Articles</h4>
                @foreach($latestArticles as $la)
                    <div style="display:flex;gap:10px;margin-bottom:14px">
                        @if($la->image_url)
                            <a href="{{ route('article.show', $la) }}" style="flex-shrink:0">
                                <img src="{{ $la->image_url }}" alt="{{ $la->title }}" style="width:75px;height:50px;object-fit:cover">
                            </a>
                        @endif
                        <div style="min-width:0">
                            <h5 style="font-size:13px;font-weight:600;line-height:1.3;margin:0 0 4px">
                                <a href="{{ route('article.show', $la) }}" class="mc-footer-link">{{ Str::limit($la->title, 50) }}</a>
                            </h5>
                            <span style="font-size:11px;color:#666">{{ $la->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- Most Popular --}}
            <div>
                <h4 class="td-footer-title">Most Popular</h4>
                @foreach($popularFooter as $pf)
                    <div style="display:flex;gap:10px;margin-bottom:14px">
                        @if($pf->image_url)
                            <a href="{{ route('article.show', $pf) }}" style="flex-shrink:0">
                                <img src="{{ $pf->image_url }}" alt="{{ $pf->title }}" style="width:75px;height:50px;object-fit:cover">
                            </a>
                        @endif
                        <div style="min-width:0">
                            <h5 style="font-size:13px;font-weight:600;line-height:1.3;margin:0 0 4px">
                                <a href="{{ route('article.show', $pf) }}" class="mc-footer-link">{{ Str::limit($pf->title, 50) }}</a>
                            </h5>
                            <span style="font-size:11px;color:#666">{{ $pf->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- Pages / Categories --}}
            <div>
                <h4 class="td-footer-title">Pages</h4>
                <ul style="list-style:none;padding:0;margin:0 0 16px">
                    @foreach($footerPages as $fp)
                        <li style="margin-bottom:6px">
                            <a href="{{ route('page.show', $fp) }}" class="mc-footer-link" style="font-size:13px">{{ $fp->title }}</a>
                        </li>
                    @endforeach
                </ul>
                <h4 class="td-footer-title">Categories</h4>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                    @foreach($footerCategories as $fc)
                        <a href="{{ route('category.show', $fc) }}" class="mc-footer-tag">{{ $fc->name }}</a>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Copyright --}}
    <div style="border-top:1px solid #333">
        <div class="mx-auto max-w-[1100px] px-4" style="padding:12px 15px">
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#666;flex-wrap:wrap;gap:8px">
                <span>&copy; {{ date('Y') }} {{ $currentSite->name }}. All Rights Reserved.</span>
                <span>Part of Media Capital Trust Network</span>
            </div>
        </div>
    </div>
</footer>
