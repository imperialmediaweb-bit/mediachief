@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

{{-- Featured block --}}
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

{{-- Content + sidebar --}}
<div class="mc-container" style="padding-top:20px;padding-bottom:20px">
    <div class="mc-row">
        <div class="mc-span8">
            {{-- Category sections --}}
            @if(!empty($categorySections))
                @foreach($categorySections as $section)
                <div class="mc-block">
                    <h2 class="mc-block-title"><span>{{ $section['category']->name }}</span></h2>

                    @if($section['articles']->count() >= 3)
                    <div style="display:flex;gap:20px;flex-wrap:wrap">
                        @php $catFeat = $section['articles']->first(); @endphp
                        <div style="flex:1;min-width:250px">
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

                        <div style="flex:1;min-width:200px">
                            @foreach($section['articles']->skip(1) as $art)
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
                    @else
                    @foreach($section['articles'] as $art)
                    <div class="mc-list">
                        @if($art->image_url)
                        <a href="{{ route('article.show', $art) }}" class="mc-list-thumb">
                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                        </a>
                        @endif
                        <div class="mc-list-info">
                            <h4 class="mc-list-title"><a href="{{ route('article.show', $art) }}">{{ Str::limit($art->title, 60) }}</a></h4>
                            <div class="mc-module-meta">{{ $art->published_at?->format('F d, Y') }}</div>
                        </div>
                    </div>
                    @endforeach
                    @endif
                </div>
                @endforeach
            @endif

            {{-- Latest posts --}}
            @if(isset($latest) && $latest->isNotEmpty())
            <div class="mc-block">
                <h2 class="mc-block-title"><span>Latest Posts</span></h2>
                @foreach($latest as $art)
                <div class="mc-list" style="gap:15px;padding:15px 0">
                    @if($art->image_url)
                    <a href="{{ route('article.show', $art) }}" class="mc-list-thumb" style="width:200px;height:130px">
                        <img src="{{ $art->image_url }}" alt="{{ $art->title }}">
                    </a>
                    @endif
                    <div class="mc-list-info">
                        @if($art->category)
                        <a href="{{ route('category.show', $art->category) }}" class="mc-cat" style="margin-bottom:6px">{{ $art->category->name }}</a>
                        @endif
                        <h3 class="mc-module-title" style="font-size:16px"><a href="{{ route('article.show', $art) }}">{{ $art->title }}</a></h3>
                        @if($art->excerpt)
                        <div class="mc-excerpt">{{ Str::limit($art->excerpt, 150) }}</div>
                        @endif
                        <div class="mc-module-meta" style="margin-top:6px">
                            @if($art->author)<span class="mc-author">{{ $art->author }}</span> - @endif
                            <span>{{ $art->published_at?->format('F d, Y') }}</span>
                        </div>
                    </div>
                </div>
                @endforeach
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
