@extends('frontend.layouts.app')

@section('title', $article->title . ' - ' . $currentSite->name)

@section('wp_head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? '' }}">
    @if($article->image_url)<meta property="og:image" content="{{ $article->image_url }}">@endif
@endsection

@push('head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? '' }}">
    @if($article->image_url)<meta property="og:image" content="{{ $article->image_url }}">@endif
@endpush

@section('content')
<div class="td-container" style="padding-top: 20px; padding-bottom: 20px;">
    <div class="td-pb-row">
        <div class="td-pb-span8">
            <article class="post td-post-template-default">
                <div class="td-crumb-container" style="padding-top: 0;">
                    <div class="entry-crumbs">
                        <a href="{{ route('home') }}">Home</a>
                        @if($article->category)<span class="td-bread-sep">&raquo;</span><a href="{{ route('category.show', $article->category) }}">{{ $article->category->name }}</a>@endif
                    </div>
                </div>

                <header>
                    @if($article->category)
                    <ul class="td-category"><li><a href="{{ route('category.show', $article->category) }}">{{ $article->category->name }}</a></li></ul>
                    @endif

                    <h1 class="entry-title">{{ $article->title }}</h1>

                    <div class="td-module-meta-info" style="padding-bottom: 12px; border-bottom: 1px solid var(--td_grid_border_color, #ededed);">
                        @if($article->author)<span class="td-post-author-name"><a href="#">{{ $article->author }}</a> - </span>@endif
                        @if($article->published_at)<span class="td-post-date"><time datetime="{{ $article->published_at->toIso8601String() }}">{{ $article->published_at->format('F d, Y') }}</time></span>@endif
                    </div>
                </header>

                <div class="td-post-sharing" style="display: flex; gap: 4px; margin: 15px 0;">
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="td-share-facebook"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook</a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="td-share-twitter"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter</a>
                </div>

                @if($article->image_url)
                <div class="td-post-featured-image"><img src="{{ $article->image_url }}" alt="{{ $article->featured_image_alt ?? $article->title }}"></div>
                @endif

                <div class="td-post-content tagdiv-type">{!! $article->body !!}</div>

                @if($article->tags && count($article->tags) > 0)
                <div class="td-post-source-tags">
                    <div class="td-tags">
                        <li><span>TAGS</span></li>
                        @foreach($article->tags as $tag)<li><a href="#">{{ $tag }}</a></li>@endforeach
                    </div>
                </div>
                @endif

                @if($article->source_url)
                <div class="td-post-source-tags">
                    <div class="td-post-small-box"><span>Source</span><a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer">{{ $article->source_name ?? $article->source_url }}</a></div>
                </div>
                @endif

                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--td_grid_border_color, #ededed); display: flex; align-items: center; gap: 8px;">
                    <span style="font-family: 'Open Sans', sans-serif; font-size: 12px; font-weight: 700; color: #111;">SHARE:</span>
                    <div class="td-post-sharing" style="display: flex; gap: 4px; margin: 0;">
                        <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="td-share-facebook">Facebook</a>
                        <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="td-share-twitter">Twitter</a>
                    </div>
                </div>

                @if(isset($related) && $related->isNotEmpty())
                <div style="margin-top: 25px;">
                    <div class="block-title td_block_template_1"><span>Related Articles</span></div>
                    <div class="td-block-row">
                        @foreach($related as $rel)
                        <div class="td-block-span4">
                            <div class="td_module_wrap" style="padding-bottom: 0;">
                                <div class="td-module-thumb"><a href="{{ route('article.show', $rel) }}">@if($rel->image_url)<img src="{{ $rel->image_url }}" alt="{{ $rel->title }}" class="entry-thumb" style="width: 100%; aspect-ratio: 16/10; object-fit: cover;">@else<div style="width: 100%; aspect-ratio: 16/10; background: #eee;"></div>@endif</a></div>
                                <h4 class="entry-title" style="font-size: 13px;"><a href="{{ route('article.show', $rel) }}">{{ Str::limit($rel->title, 60) }}</a></h4>
                                <div class="td-module-meta-info"><span class="td-post-date">{{ $rel->published_at?->format('F d, Y') }}</span></div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </article>
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
@endsection
