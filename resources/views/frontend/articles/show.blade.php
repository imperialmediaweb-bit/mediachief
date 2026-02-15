@extends('frontend.layouts.app')

@section('title', $article->title . ' - ' . $currentSite->name)

@push('head')
    @if($article->seo)
        @foreach($article->seo as $key => $value)
            <meta name="{{ $key }}" content="{{ $value }}">
        @endforeach
    @endif
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? '' }}">
    @if($article->featured_image)
        <meta property="og:image" content="{{ $article->featured_image }}">
    @endif
@endpush

@section('content')
<div class="bg-brand-dark">
    <div class="mx-auto max-w-7xl px-4 py-8">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Article content --}}
            <article class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <nav class="mb-4 text-xs text-brand-text-muted">
                    <a href="{{ route('home') }}" class="hover:text-white">Home</a>
                    @if($article->category)
                        <span class="mx-1">/</span>
                        <a href="{{ route('category.show', $article->category) }}" class="hover:text-white">{{ $article->category->name }}</a>
                    @endif
                </nav>

                {{-- Category badge --}}
                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="cat-badge mb-4 bg-brand-red hover:bg-red-700">
                        {{ $article->category->name }}
                    </a>
                @endif

                {{-- Title --}}
                <h1 class="mb-5 font-heading text-2xl font-black leading-tight text-white md:text-3xl lg:text-4xl">
                    {{ $article->title }}
                </h1>

                {{-- Meta info --}}
                <div class="mb-6 flex flex-wrap items-center gap-4 border-b border-brand-border pb-5 text-sm text-brand-text-muted">
                    @if($article->author)
                        <span class="flex items-center gap-1.5">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            {{ $article->author }}
                        </span>
                    @endif
                    @if($article->published_at)
                        <time datetime="{{ $article->published_at->toIso8601String() }}" class="flex items-center gap-1.5">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {{ $article->published_at->format('F d, Y') }}
                        </time>
                    @endif
                    @if($article->views_count > 0)
                        <span class="flex items-center gap-1.5">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            {{ number_format($article->views_count) }} views
                        </span>
                    @endif
                </div>

                {{-- Featured image --}}
                @if($article->featured_image)
                    <figure class="mb-6">
                        <img src="{{ $article->featured_image }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="w-full">
                    </figure>
                @endif

                {{-- Article body --}}
                <div class="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-img:w-full prose-blockquote:border-brand-red prose-blockquote:text-gray-400">
                    {!! $article->body !!}
                </div>

                {{-- Tags --}}
                @if($article->tags && count($article->tags) > 0)
                    <div class="mt-8 flex flex-wrap items-center gap-2 border-t border-brand-border pt-6">
                        <span class="text-sm font-bold text-white">Tags:</span>
                        @foreach($article->tags as $tag)
                            <span class="border border-brand-border px-3 py-1 text-xs text-brand-text-muted transition-colors hover:border-brand-red hover:text-white">
                                {{ $tag }}
                            </span>
                        @endforeach
                    </div>
                @endif

                {{-- Source --}}
                @if($article->source_url)
                    <div class="mt-6 border border-brand-border bg-brand-gray-light p-4 text-sm text-brand-text-muted">
                        <span class="font-bold text-white">Source:</span>
                        <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" class="ml-1 text-brand-red hover:underline">
                            {{ $article->source_name ?? $article->source_url }}
                        </a>
                    </div>
                @endif

                {{-- Share buttons --}}
                <div class="mt-6 flex items-center gap-3 border-t border-brand-border pt-6">
                    <span class="text-sm font-bold text-white">Share:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex h-9 w-9 items-center justify-center bg-[#3b5998] text-white transition-opacity hover:opacity-80">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex h-9 w-9 items-center justify-center bg-black text-white transition-opacity hover:opacity-80">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                </div>

                {{-- Related articles --}}
                @if(isset($related) && $related->isNotEmpty())
                    <div class="mt-10">
                        <h3 class="section-header">Related Articles</h3>
                        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach($related as $rel)
                                <div class="article-card">
                                    <a href="{{ route('article.show', $rel) }}" class="block">
                                        @if($rel->featured_image)
                                            <img src="{{ $rel->featured_image }}" alt="{{ $rel->title }}" class="article-card-img mb-3 aspect-video w-full object-cover">
                                        @else
                                            <div class="mb-3 aspect-video w-full bg-brand-gray-medium"></div>
                                        @endif
                                    </a>
                                    <h4 class="article-card-title text-sm font-bold leading-tight text-white">
                                        <a href="{{ route('article.show', $rel) }}" class="hover:text-brand-red">{{ Str::limit($rel->title, 60) }}</a>
                                    </h4>
                                    <span class="mt-1 block text-xs text-brand-text-muted">{{ $rel->published_at?->format('M d, Y') }}</span>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
            </article>

            {{-- Sidebar --}}
            <div>
                @include('frontend.partials.sidebar')
            </div>
        </div>
    </div>
</div>
@endsection
