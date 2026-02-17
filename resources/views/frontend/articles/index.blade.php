@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

@php
    // Pre-compute layout groups from category sections to match tagDiv Composer structure:
    // 1. First category → full-width grid block (6 article cards in 3x2)
    // 2. Popular row (4 cards)
    // 3. Next 3 categories → triple-column row (featured img + list per column)
    // 4. Next category → full-width featured + list block
    // 5. Next 3 categories → triple-column row
    // 6. Remaining categories → groups of 3 in triple-column rows, or full-width blocks
    // 7. Latest posts at the bottom

    $sections = collect($categorySections ?? []);
    $idx = 0;

    $gridSection = $sections->get($idx); // First category as grid block
    if ($gridSection) $idx++;

    $tripleRow1 = $sections->slice($idx, min(3, max(0, $sections->count() - $idx)))->values();
    $idx += $tripleRow1->count();

    $wideSection = $sections->get($idx); // Wide featured+list block
    if ($wideSection) $idx++;

    $tripleRow2 = $sections->slice($idx, min(3, max(0, $sections->count() - $idx)))->values();
    $idx += $tripleRow2->count();

    // Remaining categories grouped in threes
    $remaining = $sections->slice($idx)->values();
    $remainingChunks = $remaining->chunk(3);
@endphp

{{-- ═══ Hero Big Grid (3 Featured Articles) ═══ --}}
@if(isset($featured) && $featured->isNotEmpty())
<div class="mc-container" style="padding-top:20px;padding-bottom:4px">
    @if($featured->count() >= 3)
    <div class="mc-big-grid">
        @php $main = $featured->first(); @endphp
        <a href="{{ route('article.show', $main) }}" class="mc-big-grid-left mc-big-grid-item">
            @if($main->image_url)
                <img src="{{ $main->image_url }}" alt="{{ $main->title }}">
            @endif
            <div class="mc-big-grid-meta">
                @if($main->category)<span class="mc-cat">{{ $main->category->name }}</span>@endif
                <h3><a href="{{ route('article.show', $main) }}">{{ $main->title }}</a></h3>
                <div class="mc-module-meta" style="color:#ccc">
                    @if($main->author)<span>{{ $main->author }}</span> - @endif
                    <span>{{ $main->published_at?->format('F d, Y') }}</span>
                </div>
            </div>
        </a>
        <div class="mc-big-grid-right">
            @foreach($featured->skip(1)->take(2) as $feat)
            <a href="{{ route('article.show', $feat) }}" class="mc-big-grid-item">
                @if($feat->image_url)
                    <img src="{{ $feat->image_url }}" alt="{{ $feat->title }}">
                @endif
                <div class="mc-big-grid-meta mc-small">
                    @if($feat->category)<span class="mc-cat">{{ $feat->category->name }}</span>@endif
                    <h3><a href="{{ route('article.show', $feat) }}">{{ Str::limit($feat->title, 70) }}</a></h3>
                </div>
            </a>
            @endforeach
        </div>
    </div>
    @else
    <div class="mc-big-grid">
        @foreach($featured as $feat)
        <a href="{{ route('article.show', $feat) }}" class="mc-big-grid-item" style="flex:1;min-height:300px">
            @if($feat->image_url)<img src="{{ $feat->image_url }}" alt="{{ $feat->title }}">@endif
            <div class="mc-big-grid-meta">
                @if($feat->category)<span class="mc-cat">{{ $feat->category->name }}</span>@endif
                <h3><a href="{{ route('article.show', $feat) }}">{{ $feat->title }}</a></h3>
            </div>
        </a>
        @endforeach
    </div>
    @endif
</div>
@endif

{{-- ═══ Content + Sidebar ═══ --}}
<div class="mc-container" style="padding-top:20px;padding-bottom:20px">
    <div class="mc-row">
        <div class="mc-span8">

            {{-- ═══ Section 1: First Category – Grid Block (td_flex_block_1 style) ═══ --}}
            @if($gridSection)
            <div class="mc-block">
                <h2 class="mc-block-title"><span>{{ $gridSection['category']->name }}</span></h2>
                <div class="mc-grid-3">
                    @foreach($gridSection['articles']->take(6) as $art)
                    <div class="mc-card">
                        <a href="{{ route('article.show', $art) }}" class="mc-card-thumb">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                            @else
                            <div class="mc-card-placeholder"></div>
                            @endif
                        </a>
                        <div class="mc-card-info">
                            <h3 class="mc-module-title" style="font-size:14px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 60) }}</a></h3>
                            <div class="mc-module-meta">
                                @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                                <span>{{ $art->published_at?->format('F d, Y') }}</span>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif

            {{-- ═══ Popular Section (4 cards sorted by views) ═══ --}}
            @if(isset($popular) && $popular->isNotEmpty())
            <div class="mc-block">
                <h2 class="mc-block-title"><span>Popular</span></h2>
                <div class="mc-grid-4">
                    @foreach($popular as $art)
                    <div class="mc-card">
                        <a href="{{ route('article.show', $art) }}" class="mc-card-thumb">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                            @else
                            <div class="mc-card-placeholder"></div>
                            @endif
                        </a>
                        <div class="mc-card-info">
                            @if($art->category)
                            <a href="{{ route('category.show', $art->category) }}" class="mc-cat">{{ $art->category->name }}</a>
                            @endif
                            <h3 class="mc-module-title" style="font-size:13px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h3>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif

            {{-- ═══ Triple-Column Row #1 (3 categories side by side) ═══ --}}
            @if($tripleRow1->isNotEmpty())
            <div class="mc-triple-row">
                @foreach($tripleRow1 as $s)
                <div class="mc-triple-col">
                    <h3 class="mc-block-title"><span>{{ $s['category']->name }}</span></h3>
                    @foreach($s['articles']->take(5) as $i => $art)
                    @if($i === 0)
                    {{-- First article: featured image + title --}}
                    <div class="mc-module" style="margin-bottom:12px">
                        <a href="{{ route('article.show', $art) }}" class="mc-module-thumb" style="display:block">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="aspect-ratio:16/10;object-fit:cover">
                            @endif
                        </a>
                        <h4 class="mc-module-title" style="font-size:14px;margin-top:8px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                        <div class="mc-module-meta">
                            @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                            {{ $art->published_at?->format('F d, Y') }}
                        </div>
                    </div>
                    @else
                    {{-- Remaining articles: small thumb + title list --}}
                    <div class="mc-list">
                        @if($art->image_url)
                        <a href="{{ route('article.show', $art) }}" class="mc-list-thumb">
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                        </a>
                        @endif
                        <div class="mc-list-info">
                            <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 50) }}</a></h4>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endif
                    @endforeach
                </div>
                @endforeach
            </div>
            @endif

            {{-- ═══ Wide Category Block (featured left + list right) ═══ --}}
            @if($wideSection)
            <div class="mc-block">
                <h2 class="mc-block-title"><span>{{ $wideSection['category']->name }}</span></h2>
                <div class="mc-wide-block">
                    @php $catFeat = $wideSection['articles']->first(); @endphp
                    <div class="mc-wide-left">
                        <div class="mc-module-thumb">
                            <a href="{{ route('article.show', $catFeat) }}">
                                @if($catFeat->image_url)
                                <img src="{{ $catFeat->image_url }}" alt="{{ $catFeat->title }}" style="aspect-ratio:4/3;object-fit:cover">
                                @endif
                            </a>
                        </div>
                        <h3 class="mc-module-title" style="font-size:16px;margin-top:10px">
                            <a href="{{ route('article.show', $catFeat) }}">{{ $catFeat->title }}</a>
                        </h3>
                        @if($catFeat->excerpt)
                        <div class="mc-excerpt">{{ Str::limit($catFeat->excerpt, 120) }}</div>
                        @endif
                        <div class="mc-module-meta" style="margin-top:6px">
                            @if($catFeat->author)<span class="mc-author">{{ $catFeat->author }}</span> - @endif
                            <span>{{ $catFeat->published_at?->format('F d, Y') }}</span>
                        </div>
                    </div>
                    <div class="mc-wide-right">
                        @foreach($wideSection['articles']->skip(1) as $art)
                        <div class="mc-list">
                            @if($art->image_url)
                            <a href="{{ route('article.show', $art) }}" class="mc-list-thumb">
                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                            </a>
                            @endif
                            <div class="mc-list-info">
                                <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                                <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

            {{-- ═══ Triple-Column Row #2 ═══ --}}
            @if($tripleRow2->isNotEmpty())
            <div class="mc-triple-row">
                @foreach($tripleRow2 as $s)
                <div class="mc-triple-col">
                    <h3 class="mc-block-title"><span>{{ $s['category']->name }}</span></h3>
                    @foreach($s['articles']->take(5) as $i => $art)
                    @if($i === 0)
                    <div class="mc-module" style="margin-bottom:12px">
                        <a href="{{ route('article.show', $art) }}" class="mc-module-thumb" style="display:block">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="aspect-ratio:16/10;object-fit:cover">
                            @endif
                        </a>
                        <h4 class="mc-module-title" style="font-size:14px;margin-top:8px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                        <div class="mc-module-meta">
                            @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                            {{ $art->published_at?->format('F d, Y') }}
                        </div>
                    </div>
                    @else
                    <div class="mc-list">
                        @if($art->image_url)
                        <a href="{{ route('article.show', $art) }}" class="mc-list-thumb">
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                        </a>
                        @endif
                        <div class="mc-list-info">
                            <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 50) }}</a></h4>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endif
                    @endforeach
                </div>
                @endforeach
            </div>
            @endif

            {{-- ═══ Remaining Categories (grouped in threes) ═══ --}}
            @foreach($remainingChunks as $chunk)
            @if($chunk->count() >= 3)
            <div class="mc-triple-row">
                @foreach($chunk as $s)
                <div class="mc-triple-col">
                    <h3 class="mc-block-title"><span>{{ $s['category']->name }}</span></h3>
                    @foreach($s['articles']->take(5) as $i => $art)
                    @if($i === 0)
                    <div class="mc-module" style="margin-bottom:12px">
                        <a href="{{ route('article.show', $art) }}" class="mc-module-thumb" style="display:block">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="aspect-ratio:16/10;object-fit:cover">
                            @endif
                        </a>
                        <h4 class="mc-module-title" style="font-size:14px;margin-top:8px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                        <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                    </div>
                    @else
                    <div class="mc-list">
                        @if($art->image_url)
                        <a href="{{ route('article.show', $art) }}" class="mc-list-thumb">
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                        </a>
                        @endif
                        <div class="mc-list-info">
                            <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 50) }}</a></h4>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endif
                    @endforeach
                </div>
                @endforeach
            </div>
            @else
            {{-- Leftover 1-2 categories as full-width blocks --}}
            @foreach($chunk as $s)
            <div class="mc-block">
                <h2 class="mc-block-title"><span>{{ $s['category']->name }}</span></h2>
                <div class="mc-grid-3">
                    @foreach($s['articles']->take(6) as $art)
                    <div class="mc-card">
                        <a href="{{ route('article.show', $art) }}" class="mc-card-thumb">
                            @if($art->image_url)
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                            @else
                            <div class="mc-card-placeholder"></div>
                            @endif
                        </a>
                        <div class="mc-card-info">
                            <h3 class="mc-module-title" style="font-size:14px"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 60) }}</a></h3>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endforeach
            @endif
            @endforeach

            {{-- ═══ Latest Posts (50/50 featured+list like tagDiv) ═══ --}}
            @if(isset($latest) && $latest->isNotEmpty())
            <div class="mc-block">
                <h2 class="mc-block-title"><span>Latest Posts</span></h2>
                <div class="mc-wide-block">
                    <div class="mc-wide-left">
                        @foreach($latest->take(3) as $art)
                        <div class="mc-module" style="margin-bottom:18px">
                            <a href="{{ route('article.show', $art) }}" class="mc-module-thumb" style="display:block">
                                @if($art->image_url)
                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="aspect-ratio:16/10;object-fit:cover">
                                @endif
                            </a>
                            @if($art->category)
                            <a href="{{ route('category.show', $art->category) }}" class="mc-cat" style="margin-top:10px">{{ $art->category->name }}</a>
                            @endif
                            <h3 class="mc-module-title" style="font-size:16px;margin-top:6px">
                                <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                            </h3>
                            @if($art->excerpt)
                            <div class="mc-excerpt">{{ Str::limit($art->excerpt, 120) }}</div>
                            @endif
                            <div class="mc-module-meta" style="margin-top:6px">
                                @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                                <span>{{ $art->published_at?->format('F d, Y') }}</span>
                            </div>
                        </div>
                        @endforeach
                    </div>
                    <div class="mc-wide-right">
                        @foreach($latest->skip(3) as $art)
                        <div class="mc-list" style="gap:15px;padding:12px 0">
                            @if($art->image_url)
                            <a href="{{ route('article.show', $art) }}" class="mc-list-thumb" style="width:120px;height:80px">
                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                            </a>
                            @endif
                            <div class="mc-list-info">
                                @if($art->category)
                                <a href="{{ route('category.show', $art->category) }}" class="mc-cat" style="margin-bottom:4px">{{ $art->category->name }}</a>
                                @endif
                                <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                                <div class="mc-module-meta">
                                    @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                                    {{ $art->published_at?->format('F d, Y') }}
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

        </div>

        <div class="mc-span4">
            @if(file_exists(storage_path('app/wp-theme/sidebar.html')))
                {!! file_get_contents(storage_path('app/wp-theme/sidebar.html')) !!}
            @else
                @include('frontend.partials.sidebar')
            @endif
        </div>
    </div>
</div>

@endsection
