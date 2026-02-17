@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="mc-container" style="padding-top:20px;padding-bottom:20px">
    <div class="mc-row">
        <div class="mc-span8">
            <div class="mc-block">
                <div class="mc-breadcrumb">
                    <a href="{{ route('home') }}">Home</a> &raquo;
                    <span style="color:#111">{{ $category->name }}</span>
                </div>

                <h1 class="mc-block-title"><span>{{ $category->name }}</span></h1>
                @if($category->description)
                    <p style="font-size:13px;color:#666;margin-bottom:15px">{{ $category->description }}</p>
                @endif

                {{-- Featured cards on first page --}}
                @if($articles->onFirstPage() && $articles->count() >= 3)
                <div class="mc-cat-grid">
                    @foreach($articles->take(2) as $topArticle)
                    <div class="mc-cat-grid-item">
                        <a href="{{ route('article.show', $topArticle) }}">
                            @if($topArticle->image_url)
                            <img src="{{ $topArticle->image_url }}" alt="{{ $topArticle->title }}">
                            @endif
                        </a>
                        <div class="mc-big-grid-meta mc-small" style="position:absolute;bottom:0;left:0;right:0;padding:12px 15px;background:linear-gradient(transparent,rgba(0,0,0,.85))">
                            <span class="mc-cat">{{ $category->name }}</span>
                            <h3 style="font-family:'Roboto',sans-serif;font-size:15px;font-weight:500;line-height:1.3;margin:0"><a href="{{ route('article.show', $topArticle) }}" style="color:#fff;text-decoration:none">{{ Str::limit($topArticle->title, 70) }}</a></h3>
                        </div>
                    </div>
                    @endforeach
                </div>
                @endif

                {{-- Article list --}}
                @php $skipCount = ($articles->onFirstPage() && $articles->count() >= 3) ? 2 : 0; @endphp
                @forelse($articles->skip($skipCount) as $article)
                <div class="mc-list" style="gap:15px;padding:15px 0">
                    @if($article->image_url)
                    <a href="{{ route('article.show', $article) }}" class="mc-list-thumb" style="width:200px;height:130px">
                        <img src="{{ $article->image_url }}" alt="{{ $article->title }}">
                    </a>
                    @endif
                    <div class="mc-list-info">
                        <h3 class="mc-module-title" style="font-size:16px"><a href="{{ route('article.show', $article) }}">{{ $article->title }}</a></h3>
                        @if($article->excerpt)
                        <div class="mc-excerpt">{{ Str::limit($article->excerpt, 160) }}</div>
                        @endif
                        <div class="mc-module-meta" style="margin-top:6px">
                            @if($article->author)<span class="mc-author">{{ $article->author }}</span> - @endif
                            <span>{{ $article->published_at?->format('F d, Y') }}</span>
                        </div>
                    </div>
                </div>
                @empty
                <div style="padding:40px;text-align:center;font-size:13px;color:#999">
                    No articles in this category yet.
                </div>
                @endforelse

                @if($articles->hasPages())
                <div class="mc-pagination">
                    @if($articles->onFirstPage())
                        <span style="opacity:.4">&laquo;</span>
                    @else
                        <a href="{{ $articles->previousPageUrl() }}">&laquo;</a>
                    @endif

                    @foreach($articles->getUrlRange(1, $articles->lastPage()) as $page => $url)
                        @if($page == $articles->currentPage())
                            <span class="current">{{ $page }}</span>
                        @else
                            <a href="{{ $url }}">{{ $page }}</a>
                        @endif
                    @endforeach

                    @if($articles->hasMorePages())
                        <a href="{{ $articles->nextPageUrl() }}">&raquo;</a>
                    @else
                        <span style="opacity:.4">&raquo;</span>
                    @endif
                </div>
                @endif
            </div>
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
