@php
    $trendingArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(5)
        ->get();
@endphp

@if($trendingArticles->isNotEmpty())
<div style="border-bottom: 1px solid #ededed; background: #fff;">
    <div class="td-container">
        <div style="display: flex; align-items: center; height: 38px; gap: 12px; overflow: hidden; font-family: 'Open Sans', sans-serif;">
            <span style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--td_theme_color, #4db2ec); white-space: nowrap; flex-shrink: 0;">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
                TRENDING NOW
            </span>
            <div style="position: relative; flex: 1; height: 38px; overflow: hidden;">
                @foreach($trendingArticles as $i => $trending)
                    <a href="{{ route('article.show', $trending) }}" class="td-ticker-item" style="position: absolute; inset: 0; display: flex; align-items: center; font-size: 13px; color: #444; text-decoration: none; transition: opacity 0.5s; {{ $i === 0 ? 'opacity:1' : 'opacity:0' }}">
                        {{ Str::limit($trending->title, 90) }}
                    </a>
                @endforeach
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
(function() {
    var items = document.querySelectorAll('.td-ticker-item');
    if (items.length <= 1) return;
    var current = 0;
    setInterval(function() {
        items[current].style.opacity = '0';
        current = (current + 1) % items.length;
        items[current].style.opacity = '1';
    }, 4000);
})();
</script>
@endpush
@endif
