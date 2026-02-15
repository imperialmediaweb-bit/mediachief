@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="bg-brand-dark">
    <div class="mx-auto max-w-7xl px-4 py-8">
        {{-- Category header --}}
        <div class="mb-8 border-b border-brand-border pb-6">
            <nav class="mb-3 text-xs text-brand-text-muted">
                <a href="{{ route('home') }}" class="hover:text-white">Home</a>
                <span class="mx-1">/</span>
                <span class="text-white">{{ $category->name }}</span>
            </nav>
            <h1 class="section-header">{{ $category->name }}</h1>
            @if($category->description)
                <p class="text-sm text-brand-text-muted">{{ $category->description }}</p>
            @endif
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Articles --}}
            <div class="lg:col-span-2">
                {{-- Top row: grid cards --}}
                @if($articles->onFirstPage() && $articles->count() >= 3)
                    <div class="mb-8 grid gap-5 sm:grid-cols-2">
                        @foreach($articles->take(2) as $topArticle)
                            <div class="article-card">
                                <a href="{{ route('article.show', $topArticle) }}" class="block">
                                    <div class="relative aspect-video overflow-hidden">
                                        @if($topArticle->featured_image)
                                            <img src="{{ $topArticle->featured_image }}" alt="{{ $topArticle->title }}" class="article-card-img h-full w-full object-cover">
                                        @else
                                            <div class="h-full w-full bg-brand-gray-medium"></div>
                                        @endif
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div class="absolute bottom-0 left-0 p-4">
                                            <span class="cat-badge mb-2 bg-brand-red">{{ $category->name }}</span>
                                            <h2 class="article-card-title text-base font-bold leading-tight text-white">
                                                {{ Str::limit($topArticle->title, 70) }}
                                            </h2>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>
                @endif

                {{-- List articles --}}
                <div class="space-y-6">
                    @php $skipCount = ($articles->onFirstPage() && $articles->count() >= 3) ? 2 : 0; @endphp
                    @forelse($articles->skip($skipCount) as $article)
                        <article class="article-card flex gap-5 border-b border-brand-border pb-6">
                            @if($article->featured_image)
                                <a href="{{ route('article.show', $article) }}" class="shrink-0">
                                    <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="article-card-img h-28 w-44 object-cover md:h-36 md:w-56">
                                </a>
                            @endif
                            <div class="min-w-0 flex-1">
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
                                    <span>{{ $article->published_at?->format('M d, Y') }}</span>
                                </div>
                            </div>
                        </article>
                    @empty
                        <div class="py-16 text-center text-brand-text-muted">
                            <p>No articles in this category yet.</p>
                        </div>
                    @endforelse
                </div>

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
</div>
@endsection
