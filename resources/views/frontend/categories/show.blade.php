@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="td-container" style="padding-top: 20px; padding-bottom: 20px;">
    <div class="td-pb-row">
        <div class="td-pb-span8">
            <div class="td-crumb-container" style="padding-top: 0;">
                <div class="entry-crumbs">
                    <a href="{{ route('home') }}">Home</a>
                    <span class="td-bread-sep">&raquo;</span>
                    <span style="color: #111;">{{ $category->name }}</span>
                </div>
            </div>

            <div class="td-page-title">{{ $category->name }}</div>
            @if($category->description)<p style="font-size: 13px; color: #767676; margin-bottom: 15px;">{{ $category->description }}</p>@endif

            @if($articles->onFirstPage() && $articles->count() >= 3)
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 20px;">
                @foreach($articles->take(2) as $topArticle)
                <div style="position: relative; min-height: 180px; overflow: hidden;">
                    <a href="{{ route('article.show', $topArticle) }}">@if($topArticle->image_url)<img src="{{ $topArticle->image_url }}" alt="{{ $topArticle->title }}" style="width: 100%; height: 100%; object-fit: cover;">@endif</a>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 15px; background: linear-gradient(transparent, rgba(0,0,0,0.85));">
                        <span class="td-post-category">{{ $category->name }}</span>
                        <h3 style="font-family: 'Roboto', sans-serif; font-size: 15px; font-weight: 500; line-height: 1.3; margin: 4px 0 0;"><a href="{{ route('article.show', $topArticle) }}" style="color: #fff; text-decoration: none;">{{ Str::limit($topArticle->title, 70) }}</a></h3>
                    </div>
                </div>
                @endforeach
            </div>
            @endif

            @php $skipCount = ($articles->onFirstPage() && $articles->count() >= 3) ? 2 : 0; @endphp
            @forelse($articles->skip($skipCount) as $article)
            <div class="td_module_15" style="display: flex; gap: 15px; padding-bottom: 15px;">
                @if($article->image_url)
                <a href="{{ route('article.show', $article) }}" style="flex-shrink: 0; width: 200px; height: 130px; overflow: hidden;"><img src="{{ $article->image_url }}" alt="{{ $article->title }}" style="width: 100%; height: 100%; object-fit: cover;"></a>
                @endif
                <div style="flex: 1; min-width: 0;">
                    <h3 class="entry-title" style="font-size: 16px; line-height: 1.3;"><a href="{{ route('article.show', $article) }}">{{ $article->title }}</a></h3>
                    @if($article->excerpt)<div class="td-excerpt">{{ Str::limit($article->excerpt, 160) }}</div>@endif
                    <div class="td-module-meta-info" style="margin-top: 6px;">@if($article->author)<span class="td-post-author-name"><a href="#">{{ $article->author }}</a></span> - @endif<span class="td-post-date">{{ $article->published_at?->format('F d, Y') }}</span></div>
                </div>
            </div>
            @empty
            <div style="padding: 40px; text-align: center; font-size: 13px; color: #999;">No articles in this category yet.</div>
            @endforelse

            @if($articles->hasPages())
            <div class="page-nav">
                @if($articles->onFirstPage())<span style="opacity: .4;">&laquo;</span>@else<a href="{{ $articles->previousPageUrl() }}">&laquo;</a>@endif
                @foreach($articles->getUrlRange(1, $articles->lastPage()) as $page => $url)
                    @if($page == $articles->currentPage())<span class="current">{{ $page }}</span>@else<a href="{{ $url }}">{{ $page }}</a>@endif
                @endforeach
                @if($articles->hasMorePages())<a href="{{ $articles->nextPageUrl() }}">&raquo;</a>@else<span style="opacity: .4;">&raquo;</span>@endif
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
        .td_module_15 { flex-direction: column !important; }
        .td_module_15 > a { width: 100% !important; height: auto !important; aspect-ratio: 16/10; }
        [style*="grid-template-columns: repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
    }
</style>
@endsection
