@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')
{{-- Hero Featured Section --}}
@if(isset($featured) && $featured->isNotEmpty())
<section class="bg-brand-darker">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
            {{-- Main featured article (large) --}}
            @if($featured->first())
                @php $main = $featured->first(); @endphp
                <div class="article-card relative lg:col-span-2 lg:row-span-2">
                    <a href="{{ route('article.show', $main) }}" class="block">
                        <div class="relative aspect-[16/9] overflow-hidden lg:aspect-auto lg:h-full">
                            @if($main->featured_image)
                                <img src="{{ $main->featured_image }}" alt="{{ $main->title }}" class="article-card-img h-full w-full object-cover">
                            @else
                                <div class="h-full w-full bg-brand-gray-medium"></div>
                            @endif
                            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-6 lg:p-8">
                                @if($main->category)
                                    <span class="cat-badge mb-3 bg-brand-red">{{ $main->category->name }}</span>
                                @endif
                                <h2 class="article-card-title text-xl font-bold leading-tight text-white md:text-2xl lg:text-3xl">
                                    {{ $main->title }}
                                </h2>
                                <div class="mt-3 flex items-center gap-3 text-xs text-gray-400">
                                    @if($main->author)
                                        <span>{{ $main->author }}</span>
                                        <span>&middot;</span>
                                    @endif
                                    <span>{{ $main->published_at?->diffForHumans() }}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            @endif

            {{-- Side featured articles (smaller) --}}
            <div class="grid gap-1">
                @foreach($featured->skip(1)->take(2) as $feat)
                    <div class="article-card relative">
                        <a href="{{ route('article.show', $feat) }}" class="block">
                            <div class="relative aspect-[16/9] overflow-hidden">
                                @if($feat->featured_image)
                                    <img src="{{ $feat->featured_image }}" alt="{{ $feat->title }}" class="article-card-img h-full w-full object-cover">
                                @else
                                    <div class="h-full w-full bg-brand-gray-medium"></div>
                                @endif
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                <div class="absolute bottom-0 left-0 p-4">
                                    @if($feat->category)
                                        <span class="cat-badge mb-2 bg-brand-red">{{ $feat->category->name }}</span>
                                    @endif
                                    <h3 class="article-card-title text-sm font-bold leading-tight text-white md:text-base">
                                        {{ Str::limit($feat->title, 70) }}
                                    </h3>
                                    <span class="mt-1 block text-xs text-gray-400">{{ $feat->published_at?->diffForHumans() }}</span>
                                </div>
                            </div>
                        </a>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
@endif

{{-- Main Content + Sidebar --}}
<section class="bg-brand-dark">
    <div class="mx-auto max-w-7xl px-4 py-8">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main column --}}
            <div class="lg:col-span-2">
                <h2 class="section-header">Latest News</h2>

                <div class="space-y-6">
                    @forelse($articles as $article)
                        <article class="article-card flex gap-5 border-b border-brand-border pb-6">
                            @if($article->featured_image)
                                <a href="{{ route('article.show', $article) }}" class="shrink-0">
                                    <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="article-card-img h-28 w-44 object-cover md:h-36 md:w-56">
                                </a>
                            @endif
                            <div class="min-w-0 flex-1">
                                @if($article->category)
                                    <a href="{{ route('category.show', $article->category) }}" class="cat-badge mb-2 bg-brand-red hover:bg-red-700">
                                        {{ $article->category->name }}
                                    </a>
                                @endif
                                <h3 class="article-card-title mb-2 text-lg font-bold leading-tight text-white">
                                    <a href="{{ route('article.show', $article) }}" class="hover:text-brand-red">
                                        {{ $article->title }}
                                    </a>
                                </h3>
                                @if($article->excerpt)
                                    <p class="mb-3 hidden text-sm leading-relaxed text-brand-text-muted md:block">
                                        {{ Str::limit($article->excerpt, 160) }}
                                    </p>
                                @endif
                                <div class="flex items-center gap-3 text-xs text-brand-text-muted">
                                    @if($article->author)
                                        <span>{{ $article->author }}</span>
                                        <span>&middot;</span>
                                    @endif
                                    <time datetime="{{ $article->published_at?->toIso8601String() }}">
                                        {{ $article->published_at?->format('M d, Y') }}
                                    </time>
                                    @if($article->views_count > 0)
                                        <span>&middot;</span>
                                        <span class="flex items-center gap-1">
                                            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                            {{ number_format($article->views_count) }}
                                        </span>
                                    @endif
                                </div>
                            </div>
                        </article>
                    @empty
                        <div class="py-16 text-center text-brand-text-muted">
                            <svg class="mx-auto mb-4 h-12 w-12 text-brand-gray-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                            <p>No articles published yet.</p>
                        </div>
                    @endforelse
                </div>

                {{-- Pagination --}}
                @if($articles->hasPages())
                    <div class="mt-8 flex items-center justify-center gap-2">
                        {{ $articles->links('frontend.partials.pagination') }}
                    </div>
                @endif
            </div>

            {{-- Sidebar --}}
            <div>
                @include('frontend.partials.sidebar')
            </div>
        </div>
    </div>
</section>
@endsection
