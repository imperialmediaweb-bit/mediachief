@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

@php
    $sections = collect($categorySections ?? []);
    $idx = 0;

    $gridSection = $sections->get($idx);
    if ($gridSection) $idx++;

    $tripleRow1 = $sections->slice($idx, min(3, max(0, $sections->count() - $idx)))->values();
    $idx += $tripleRow1->count();

    $wideSection = $sections->get($idx);
    if ($wideSection) $idx++;

    $tripleRow2 = $sections->slice($idx, min(3, max(0, $sections->count() - $idx)))->values();
    $idx += $tripleRow2->count();

    $remaining = $sections->slice($idx)->values();
    $remainingChunks = $remaining->chunk(3);
@endphp

{{-- ═══ Hero Big Grid (td-big-grid style) ═══ --}}
@if(isset($featured) && $featured->isNotEmpty())
<div class="td-container" style="padding-top: 20px; padding-bottom: 4px;">
    @if($featured->count() >= 3)
    <div style="display: flex; gap: 4px; min-height: 380px; margin-bottom: 26px;">
        @php $main = $featured->first(); @endphp
        <a href="{{ route('article.show', $main) }}" style="flex: 2; position: relative; overflow: hidden; display: flex;">
            @if($main->image_url)<img src="{{ $main->image_url }}" alt="{{ $main->title }}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">@endif
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px 20px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff;">
                @if($main->category)<span class="td-post-category">{{ $main->category->name }}</span>@endif
                <h3 style="font-family: 'Roboto', sans-serif; font-size: 22px; font-weight: 500; line-height: 1.2; margin: 6px 0;"><a href="{{ route('article.show', $main) }}" style="color: #fff; text-decoration: none;">{{ $main->title }}</a></h3>
                <div class="td-module-meta-info" style="color: #ccc;">
                    @if($main->author)<span class="td-post-author-name"><a href="#" style="color: #ccc;">{{ $main->author }}</a></span> - @endif
                    <span class="td-post-date" style="color: #ccc;">{{ $main->published_at?->format('F d, Y') }}</span>
                </div>
            </div>
        </a>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            @foreach($featured->skip(1)->take(2) as $feat)
            <a href="{{ route('article.show', $feat) }}" style="position: relative; overflow: hidden; flex: 1; display: flex;">
                @if($feat->image_url)<img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" style="width: 100%; height: 100%; object-fit: cover;">@endif
                <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 15px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff;">
                    @if($feat->category)<span class="td-post-category">{{ $feat->category->name }}</span>@endif
                    <h3 style="font-family: 'Roboto', sans-serif; font-size: 15px; font-weight: 500; line-height: 1.2; margin: 4px 0;"><a href="{{ route('article.show', $feat) }}" style="color: #fff; text-decoration: none;">{{ Str::limit($feat->title, 70) }}</a></h3>
                </div>
            </a>
            @endforeach
        </div>
    </div>
    @else
    <div style="display: flex; gap: 4px; min-height: 300px; margin-bottom: 26px;">
        @foreach($featured as $feat)
        <a href="{{ route('article.show', $feat) }}" style="flex: 1; position: relative; overflow: hidden; display: flex;">
            @if($feat->image_url)<img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" style="width: 100%; height: 100%; object-fit: cover;">@endif
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px 20px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff;">
                @if($feat->category)<span class="td-post-category">{{ $feat->category->name }}</span>@endif
                <h3 style="font-family: 'Roboto', sans-serif; font-size: 18px; font-weight: 500; line-height: 1.2; margin: 4px 0;"><a href="{{ route('article.show', $feat) }}" style="color: #fff; text-decoration: none;">{{ $feat->title }}</a></h3>
            </div>
        </a>
        @endforeach
    </div>
    @endif
</div>
@endif

{{-- ═══ Content + Sidebar ═══ --}}
<div class="td-container" style="padding-top: 20px; padding-bottom: 20px;">
    <div class="td-pb-row">
        <div class="td-pb-span8">

            {{-- First Category Grid Block --}}
            @if($gridSection)
            <div class="td_block_wrap">
                <div class="block-title td_block_template_1"><span>{{ $gridSection['category']->name }}</span></div>
                <div class="td-block-row">
                    @foreach($gridSection['articles']->take(6) as $art)
                    <div class="td-block-span4" style="margin-bottom: 26px;">
                        <div class="td_module_wrap" style="padding-bottom: 0;">
                            <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@else<div style="width: 100%; aspect-ratio: 16/10; background: #f0f0f0;"></div>@endif</a></div>
                            <h3 class="entry-title" style="font-size: 14px; line-height: 1.3;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 60) }}</a></h3>
                            <div class="td-module-meta-info">@if($art->author)<span class="td-post-author-name"><a href="#">{{ $art->author }}</a></span> - @endif<span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif

            {{-- Popular --}}
            @if(isset($popular) && $popular->isNotEmpty())
            <div class="td_block_wrap">
                <div class="block-title td_block_template_1"><span>Popular</span></div>
                <div class="td-block-row">
                    @foreach($popular as $art)
                    <div class="td-block-span3" style="margin-bottom: 26px;">
                        <div class="td_module_wrap" style="padding-bottom: 0;">
                            <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@else<div style="width: 100%; aspect-ratio: 16/10; background: #f0f0f0;"></div>@endif</a></div>
                            @if($art->category)<div class="td-module-meta-info"><a href="{{ route('category.show', $art->category) }}" class="td-post-category">{{ $art->category->name }}</a></div>@endif
                            <h3 class="entry-title" style="font-size: 13px; line-height: 1.3;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h3>
                            <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif

            {{-- Triple-Column Rows and remaining sections --}}
            @foreach([$tripleRow1, $tripleRow2] as $tripleRow)
            @if($tripleRow->isNotEmpty())
            <div style="display: flex; gap: 0; margin-bottom: 26px; border-top: 2px solid #222;">
                @foreach($tripleRow as $s)
                <div style="flex: 1; min-width: 0; padding: 0 15px; {{ !$loop->last ? 'border-right: 1px solid #eee;' : '' }} {{ $loop->first ? 'padding-left: 0;' : '' }} {{ $loop->last ? 'padding-right: 0;' : '' }}">
                    <div class="block-title" style="border-bottom: none; margin-bottom: 14px; padding-top: 14px;"><span style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;">{{ $s['category']->name }}</span></div>
                    @foreach($s['articles']->take(5) as $i => $art)
                    @if($i === 0)
                    <div class="td_module_wrap" style="padding-bottom: 12px;">
                        <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@endif</a></div>
                        <h4 class="entry-title" style="font-size: 14px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                        <div class="td-module-meta-info">@if($art->author)<span class="td-post-author-name"><a href="#">{{ $art->author }}</a></span> - @endif<span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                    </div>
                    @else
                    <div style="display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid #eee;">
                        @if($art->image_url)<a href="{{ route('article.show', $art) }}" style="flex-shrink: 0; width: 100px; height: 70px; overflow: hidden;"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="width: 100%; height: 100%; object-fit: cover;"></a>@endif
                        <div style="flex: 1; min-width: 0;">
                            <h4 class="entry-title" style="font-size: 13px; line-height: 1.3; margin: 0 0 4px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 50) }}</a></h4>
                            <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    @endif
                    @endforeach
                </div>
                @endforeach
            </div>
            @endif
            @endforeach

            {{-- Wide Category Block --}}
            @if($wideSection)
            <div class="td_block_wrap">
                <div class="block-title td_block_template_1"><span>{{ $wideSection['category']->name }}</span></div>
                <div class="td-block-row">
                    @php $catFeat = $wideSection['articles']->first(); @endphp
                    <div class="td-block-span6">
                        <div class="td_module_wrap" style="padding-bottom: 0;">
                            <div class="td-module-thumb"><a href="{{ route('article.show', $catFeat) }}">@if($catFeat->image_url)<img src="{{ $catFeat->image_url }}" alt="{{ $catFeat->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 4/3; object-fit: cover;">@endif</a></div>
                            <h3 class="entry-title" style="font-size: 16px;"><a href="{{ route('article.show', $catFeat) }}">{{ $catFeat->title }}</a></h3>
                            @if($catFeat->excerpt)<div class="td-excerpt">{{ Str::limit($catFeat->excerpt, 120) }}</div>@endif
                            <div class="td-module-meta-info" style="margin-top: 6px;">@if($catFeat->author)<span class="td-post-author-name"><a href="#">{{ $catFeat->author }}</a></span> - @endif<span class="td-post-date">{{ $catFeat->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    <div class="td-block-span6">
                        @foreach($wideSection['articles']->skip(1) as $art)
                        <div style="display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid #eee;">
                            @if($art->image_url)<a href="{{ route('article.show', $art) }}" style="flex-shrink: 0; width: 100px; height: 70px; overflow: hidden;"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="width: 100%; height: 100%; object-fit: cover;"></a>@endif
                            <div style="flex: 1; min-width: 0;">
                                <h4 class="entry-title" style="font-size: 13px; line-height: 1.3; margin: 0 0 4px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                                <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

            {{-- Remaining Categories --}}
            @foreach($remainingChunks as $chunk)
            @if($chunk->count() >= 3)
            <div style="display: flex; gap: 0; margin-bottom: 26px; border-top: 2px solid #222;">
                @foreach($chunk as $s)
                <div style="flex: 1; min-width: 0; padding: 0 15px; {{ !$loop->last ? 'border-right: 1px solid #eee;' : '' }} {{ $loop->first ? 'padding-left: 0;' : '' }} {{ $loop->last ? 'padding-right: 0;' : '' }}">
                    <div class="block-title" style="border-bottom: none; margin-bottom: 14px; padding-top: 14px;"><span style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;">{{ $s['category']->name }}</span></div>
                    @foreach($s['articles']->take(5) as $i => $art)
                    @if($i === 0)
                    <div class="td_module_wrap" style="padding-bottom: 12px;">
                        <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@endif</a></div>
                        <h4 class="entry-title" style="font-size: 14px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                        <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                    </div>
                    @else
                    <div style="display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid #eee;">
                        @if($art->image_url)<a href="{{ route('article.show', $art) }}" style="flex-shrink: 0; width: 100px; height: 70px; overflow: hidden;"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="width: 100%; height: 100%; object-fit: cover;"></a>@endif
                        <div style="flex: 1; min-width: 0;">
                            <h4 class="entry-title" style="font-size: 13px; line-height: 1.3; margin: 0 0 4px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 50) }}</a></h4>
                            <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    @endif
                    @endforeach
                </div>
                @endforeach
            </div>
            @else
            @foreach($chunk as $s)
            <div class="td_block_wrap">
                <div class="block-title td_block_template_1"><span>{{ $s['category']->name }}</span></div>
                <div class="td-block-row">
                    @foreach($s['articles']->take(6) as $art)
                    <div class="td-block-span4" style="margin-bottom: 26px;">
                        <div class="td_module_wrap" style="padding-bottom: 0;">
                            <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@else<div style="width: 100%; aspect-ratio: 16/10; background: #f0f0f0;"></div>@endif</a></div>
                            <h3 class="entry-title" style="font-size: 14px; line-height: 1.3;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 60) }}</a></h3>
                            <div class="td-module-meta-info"><span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endforeach
            @endif
            @endforeach

            {{-- Latest Posts --}}
            @if(isset($latest) && $latest->isNotEmpty())
            <div class="td_block_wrap">
                <div class="block-title td_block_template_1"><span>Latest Posts</span></div>
                <div class="td-block-row">
                    <div class="td-block-span6">
                        @foreach($latest->take(3) as $art)
                        <div class="td_module_wrap" style="padding-bottom: 18px;">
                            <div class="td-module-thumb"><a href="{{ route('article.show', $art) }}">@if($art->image_url)<img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@endif</a></div>
                            @if($art->category)<div class="td-module-meta-info" style="margin-top: 10px;"><a href="{{ route('category.show', $art->category) }}" class="td-post-category">{{ $art->category->name }}</a></div>@endif
                            <h3 class="entry-title" style="font-size: 16px;"><a href="{{ route('article.show', $art) }}">{{ $art->title }}</a></h3>
                            @if($art->excerpt)<div class="td-excerpt">{{ Str::limit($art->excerpt, 120) }}</div>@endif
                            <div class="td-module-meta-info" style="margin-top: 6px;">@if($art->author)<span class="td-post-author-name"><a href="#">{{ $art->author }}</a></span> - @endif<span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                        </div>
                        @endforeach
                    </div>
                    <div class="td-block-span6">
                        @foreach($latest->skip(3) as $art)
                        <div style="display: flex; gap: 15px; padding: 12px 0; border-top: 1px solid #eee;">
                            @if($art->image_url)<a href="{{ route('article.show', $art) }}" style="flex-shrink: 0; width: 120px; height: 80px; overflow: hidden;"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" style="width: 100%; height: 100%; object-fit: cover;"></a>@endif
                            <div style="flex: 1; min-width: 0;">
                                @if($art->category)<a href="{{ route('category.show', $art->category) }}" class="td-post-category" style="margin-bottom: 4px;">{{ $art->category->name }}</a>@endif
                                <h4 class="entry-title" style="font-size: 13px; line-height: 1.3; margin: 0 0 4px;"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 55) }}</a></h4>
                                <div class="td-module-meta-info">@if($art->author)<span class="td-post-author-name"><a href="#">{{ $art->author }}</a></span> - @endif<span class="td-post-date">{{ $art->published_at?->format('F d, Y') }}</span></div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

        </div>

        <div class="td-pb-span4">
            @if(file_exists(storage_path('app/wp-theme/sidebar.html')))
                {!! file_get_contents(storage_path('app/wp-theme/sidebar.html')) !!}
            @else
                @include('frontend.partials.sidebar')
            @endif
        </div>
    </div>
</div>

<style>
    @media (max-width: 767px) {
        [style*="display: flex"][style*="border-top: 2px solid #222"] { flex-direction: column !important; border-top: none !important; }
        [style*="display: flex"][style*="border-top: 2px solid #222"] > div { padding: 0 !important; border-right: none !important; border-bottom: 1px solid #eee; margin-bottom: 20px; padding-bottom: 20px !important; }
        [style*="display: flex"][style*="min-height: 380px"],
        [style*="display: flex"][style*="min-height: 300px"] { flex-direction: column !important; min-height: auto !important; }
        [style*="display: flex"][style*="min-height: 380px"] > a,
        [style*="display: flex"][style*="min-height: 380px"] > div > a,
        [style*="display: flex"][style*="min-height: 300px"] > a { min-height: 200px; }
    }
</style>

@endsection
