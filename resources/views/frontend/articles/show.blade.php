@extends('frontend.layouts.app')

@section('title', $article->title . ' - ' . $currentSite->name)

@section('wp_head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? '' }}">
    @if($article->image_url)
        <meta property="og:image" content="{{ $article->image_url }}">
    @endif
@endsection

@push('head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? '' }}">
    @if($article->image_url)
        <meta property="og:image" content="{{ $article->image_url }}">
    @endif
@endpush

@section('content')
<div class="mc-container" style="padding-top:20px;padding-bottom:20px">
    <div class="mc-row">
        <div class="mc-span8">
            <article class="mc-block">
                {{-- Breadcrumb --}}
                <div class="mc-breadcrumb">
                    <a href="{{ route('home') }}">Home</a>
                    @if($article->category)
                        &raquo; <a href="{{ route('category.show', $article->category) }}">{{ $article->category->name }}</a>
                    @endif
                </div>

                {{-- Category badge --}}
                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="mc-cat">{{ $article->category->name }}</a>
                @endif

                {{-- Title --}}
                <h1 class="mc-entry-title">{{ $article->title }}</h1>

                {{-- Meta --}}
                <div class="mc-module-meta" style="margin-bottom:15px;padding-bottom:12px;border-bottom:1px solid #eee;font-size:12px">
                    @if($article->author)
                        <span class="mc-author">{{ $article->author }}</span> -
                    @endif
                    @if($article->published_at)
                        <time datetime="{{ $article->published_at->toIso8601String() }}">{{ $article->published_at->format('F d, Y') }}</time>
                    @endif
                </div>

                {{-- Share --}}
                <div class="mc-share">
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="mc-fb">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="mc-tw">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter
                    </a>
                </div>

                {{-- Featured image --}}
                @if($article->image_url)
                <div class="mc-post-featured">
                    <img src="{{ $article->image_url }}" alt="{{ $article->featured_image_alt ?? $article->title }}">
                </div>
                @endif

                {{-- Article body --}}
                <div class="mc-post-content">
                    {!! $article->body !!}
                </div>

                {{-- Tags --}}
                @if($article->tags && count($article->tags) > 0)
                <div class="mc-tags">
                    <span style="font-size:12px;font-weight:700;color:#111">TAGS:</span>
                    @foreach($article->tags as $tag)
                        <a href="#">{{ $tag }}</a>
                    @endforeach
                </div>
                @endif

                {{-- Source --}}
                @if($article->source_url)
                <div style="margin-top:15px;padding:12px;background:#f9f9f9;font-size:13px;color:#666">
                    <strong style="color:#111">Source:</strong>
                    <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" style="color:#e51a2f">{{ $article->source_name ?? $article->source_url }}</a>
                </div>
                @endif

                {{-- Bottom share --}}
                <div style="margin-top:15px;padding-top:15px;border-top:1px solid #eee;display:flex;align-items:center;gap:8px">
                    <span style="font-size:12px;font-weight:700;color:#111">SHARE:</span>
                    <div class="mc-share" style="margin:0">
                        <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="mc-fb">Facebook</a>
                        <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="mc-tw">Twitter</a>
                    </div>
                </div>

                {{-- Related --}}
                @if(isset($related) && $related->isNotEmpty())
                <div style="margin-top:25px">
                    <h3 class="mc-block-title"><span>Related Articles</span></h3>
                    <div class="mc-related-grid">
                        @foreach($related as $rel)
                        <div class="mc-module">
                            <div class="mc-module-thumb">
                                <a href="{{ route('article.show', $rel) }}">
                                    @if($rel->image_url)
                                    <img src="{{ $rel->image_url }}" alt="{{ $rel->title }}" style="aspect-ratio:16/10;object-fit:cover">
                                    @else
                                    <div style="aspect-ratio:16/10;background:#eee"></div>
                                    @endif
                                </a>
                            </div>
                            <h4 class="mc-module-title" style="font-size:13px;margin-top:8px">
                                <a href="{{ route('article.show', $rel) }}">{{ Str::limit($rel->title, 60) }}</a>
                            </h4>
                            <div class="mc-module-meta">{{ $rel->published_at?->format('F d, Y') }}</div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </article>
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
