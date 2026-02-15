@php
    $trendingArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(5)
        ->get();
@endphp

@if($trendingArticles->isNotEmpty())
<div class="trending-bar">
    <div class="mx-auto max-w-7xl px-4">
        <div class="flex h-10 items-center gap-4 overflow-hidden">
            <span class="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-red">
                <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
                Trending
            </span>
            <div class="flex items-center gap-6 overflow-x-auto text-sm">
                @foreach($trendingArticles as $trending)
                    <a href="{{ route('article.show', $trending) }}" class="shrink-0 text-gray-400 transition-colors hover:text-white">
                        {{ Str::limit($trending->title, 60) }}
                    </a>
                @endforeach
            </div>
        </div>
    </div>
</div>
@endif
