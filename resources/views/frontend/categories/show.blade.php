@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content (2/3) --}}
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-xs text-gray-400">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a> &raquo;
                    <span class="text-gray-900">{{ $category->name }}</span>
                </div>

                <h1 class="section-header">{{ $category->name }}</h1>
                @if($category->description)
                    <p class="mb-4 text-sm text-gray-600">{{ $category->description }}</p>
                @endif

                {{-- Featured cards on first page --}}
                @if($articles->onFirstPage() && $articles->count() >= 3)
                <div class="mb-6 grid gap-4 md:grid-cols-2">
                    @foreach($articles->take(2) as $topArticle)
                    <div class="article-card group relative overflow-hidden">
                        <a href="{{ route('article.show', $topArticle) }}" class="block">
                            <div class="relative aspect-[4/3] overflow-hidden">
                                @if($topArticle->image_url)
                                <img src="{{ $topArticle->image_url }}" alt="{{ $topArticle->title }}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
                                @else
                                <div class="h-full w-full bg-gray-200"></div>
                                @endif
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div class="absolute bottom-0 left-0 p-4">
                                    <span class="cat-badge mb-1">{{ $category->name }}</span>
                                    <h3 class="text-sm font-bold leading-tight text-white md:text-base">{{ Str::limit($topArticle->title, 70) }}</h3>
                                </div>
                            </div>
                        </a>
                    </div>
                    @endforeach
                </div>
                @endif

                {{-- Article list --}}
                @php $skipCount = ($articles->onFirstPage() && $articles->count() >= 3) ? 2 : 0; @endphp
                @forelse($articles->skip($skipCount) as $article)
                <article class="flex gap-4 border-b border-gray-100 py-4">
                    @if($article->image_url)
                    <a href="{{ route('article.show', $article) }}" class="shrink-0">
                        <img src="{{ $article->image_url }}" alt="{{ $article->title }}" class="h-28 w-44 object-cover md:h-32 md:w-52">
                    </a>
                    @endif
                    <div class="min-w-0 flex-1">
                        <h3 class="text-base font-bold leading-tight text-gray-900 md:text-lg"><a href="{{ route('article.show', $article) }}" class="hover:text-brand-red">{{ $article->title }}</a></h3>
                        @if($article->excerpt)
                        <p class="mt-1 hidden text-sm text-gray-600 md:block">{{ Str::limit($article->excerpt, 160) }}</p>
                        @endif
                        <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            @if($article->author)<span class="font-semibold text-brand-red">{{ $article->author }}</span> - @endif
                            <span>{{ $article->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                </article>
                @empty
                <div class="py-10 text-center text-sm text-gray-500">
                    No articles in this category yet.
                </div>
                @endforelse

                {{-- Pagination --}}
                @if($articles->hasPages())
                <div class="flex items-center justify-center gap-1 py-6">
                    @if($articles->onFirstPage())
                        <span class="pagination-link opacity-40">&laquo;</span>
                    @else
                        <a href="{{ $articles->previousPageUrl() }}" class="pagination-link">&laquo;</a>
                    @endif

                    @foreach($articles->getUrlRange(1, $articles->lastPage()) as $page => $url)
                        @if($page == $articles->currentPage())
                            <span class="pagination-link active">{{ $page }}</span>
                        @else
                            <a href="{{ $url }}" class="pagination-link">{{ $page }}</a>
                        @endif
                    @endforeach

                    @if($articles->hasMorePages())
                        <a href="{{ $articles->nextPageUrl() }}" class="pagination-link">&raquo;</a>
                    @else
                        <span class="pagination-link opacity-40">&raquo;</span>
                    @endif
                </div>
                @endif
            </div>

            {{-- Sidebar --}}
            <aside>
                @include('frontend.partials.sidebar')
            </aside>
        </div>
    </div>
</div>
@endsection
