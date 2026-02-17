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
<div style="background: #222;">
    <div class="td-container">
        <div style="display: flex; align-items: center; height: 40px; overflow-x: auto; gap: 0; font-family: 'Open Sans', sans-serif;">
            <a href="{{ route('home') }}" style="display: flex; align-items: center; height: 100%; padding: 0 12px; background: var(--td_theme_color, #4db2ec); color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; text-decoration: none; white-space: nowrap;">Home</a>
            @foreach($footerCategories as $cat)
                <a href="{{ route('category.show', $cat) }}" style="display: flex; align-items: center; height: 100%; padding: 0 12px; color: #999; font-size: 11px; font-weight: 600; text-transform: uppercase; text-decoration: none; white-space: nowrap;">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</div>

{{-- Footer widget area --}}
<footer style="background: #222; border-top: 1px solid #333; font-family: 'Open Sans', sans-serif;">
    <div class="td-container" style="padding-top: 30px; padding-bottom: 30px;">
        <div class="td-pb-row">
            {{-- About --}}
            <div class="td-pb-span3">
                <div class="widget" style="margin-bottom: 30px;">
                    <div class="block-title" style="border-bottom-color: #444;"><span style="background: #444; color: #fff;">About Us</span></div>
                    @if($currentSite->logo ?? false)
                        <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" style="max-height: 28px; margin-bottom: 12px;">
                    @else
                        <span style="display: inline-block; font-family: 'Roboto', sans-serif; font-size: 16px; font-weight: 900; text-transform: uppercase; color: #fff; margin-bottom: 12px;">{{ $currentSite->name }}</span>
                    @endif
                    <p style="font-size: 13px; line-height: 1.6; color: #999; margin: 0;">{{ $currentSite->description ?? 'Your trusted source for local and national news.' }}</p>
                    <div style="margin-top: 12px; display: flex; gap: 4px;">
                        <a href="#" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #333; color: #999;"><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                        <a href="#" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #333; color: #999;"><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                    </div>
                </div>
            </div>

            {{-- Latest Articles --}}
            <div class="td-pb-span3">
                <div class="widget">
                    <div class="block-title" style="border-bottom-color: #444;"><span style="background: #444; color: #fff;">Latest Articles</span></div>
                    @foreach($latestArticles as $la)
                        <div style="padding-bottom: 12px; display: flex; gap: 12px;">
                            @if($la->image_url)
                                <a href="{{ route('article.show', $la) }}" style="flex-shrink: 0;"><img src="{{ $la->image_url }}" alt="{{ $la->title }}" style="width: 75px; height: 50px; object-fit: cover;"></a>
                            @endif
                            <div style="min-width: 0;">
                                <h5 style="font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 700; line-height: 1.3; margin: 0; color: #ccc;"><a href="{{ route('article.show', $la) }}" style="color: #ccc; text-decoration: none;">{{ Str::limit($la->title, 50) }}</a></h5>
                                <span style="display: block; font-size: 11px; color: #777; margin-top: 4px;">{{ $la->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            {{-- Most Popular --}}
            <div class="td-pb-span3">
                <div class="widget">
                    <div class="block-title" style="border-bottom-color: #444;"><span style="background: #444; color: #fff;">Most Popular</span></div>
                    @foreach($popularFooter as $pf)
                        <div style="padding-bottom: 12px; display: flex; gap: 12px;">
                            @if($pf->image_url)
                                <a href="{{ route('article.show', $pf) }}" style="flex-shrink: 0;"><img src="{{ $pf->image_url }}" alt="{{ $pf->title }}" style="width: 75px; height: 50px; object-fit: cover;"></a>
                            @endif
                            <div style="min-width: 0;">
                                <h5 style="font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 700; line-height: 1.3; margin: 0; color: #ccc;"><a href="{{ route('article.show', $pf) }}" style="color: #ccc; text-decoration: none;">{{ Str::limit($pf->title, 50) }}</a></h5>
                                <span style="display: block; font-size: 11px; color: #777; margin-top: 4px;">{{ $pf->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            {{-- Pages / Categories --}}
            <div class="td-pb-span3">
                <div class="widget">
                    <div class="block-title" style="border-bottom-color: #444;"><span style="background: #444; color: #fff;">Pages</span></div>
                    <ul style="list-style: none; margin: 0; padding: 0;">
                        @foreach($footerPages as $fp)
                            <li style="margin: 0; line-height: 28px;"><a href="{{ route('page.show', $fp) }}" style="color: #999; font-size: 13px; text-decoration: none;">{{ $fp->title }}</a></li>
                        @endforeach
                    </ul>
                    <div class="block-title" style="border-bottom-color: #444; margin-top: 20px;"><span style="background: #444; color: #fff;">Categories</span></div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        @foreach($footerCategories as $fc)
                            <a href="{{ route('category.show', $fc) }}" style="background: #333; padding: 4px 8px; font-size: 11px; color: #999; text-decoration: none;">{{ $fc->name }}</a>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Sub Footer / Copyright --}}
    <div class="td-sub-footer-container">
        <div class="td-container">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; flex-wrap: wrap; gap: 8px;">
                <span class="td-sub-footer-copy">&copy; {{ date('Y') }} {{ $currentSite->name }}. All Rights Reserved.</span>
                <span style="font-size: 12px; color: #777;">Part of Media Capital Trust Network</span>
            </div>
        </div>
    </div>
</footer>
