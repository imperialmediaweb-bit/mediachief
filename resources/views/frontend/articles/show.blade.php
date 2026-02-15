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
    @if($article->image_url)
        <meta property="og:image" content="{{ $article->image_url }}">
    @endif
@endpush

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-8">
        <div class="grid gap-8 lg:grid-cols-3">
            <article class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <nav class="mb-4 text-xs text-gray-500">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                    @if($article->category)
                        <span class="mx-1">/</span>
                        <a href="{{ route('category.show', $article->category) }}" class="hover:text-brand-red">{{ $article->category->name }}</a>
                    @endif
                </nav>

                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="cat-badge mb-4">{{ $article->category->name }}</a>
                @endif

                <h1 class="mb-5 font-heading text-2xl font-black leading-tight text-gray-900 md:text-3xl lg:text-4xl">
                    {{ $article->title }}
                </h1>

                <div class="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-5 text-sm text-gray-500">
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
                </div>

                @if($article->image_url)
                    <figure class="mb-6">
                        <img src="{{ $article->image_url }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="w-full">
                    </figure>
                @endif

                <div class="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:w-full prose-blockquote:border-brand-red prose-blockquote:text-gray-600">
                    {!! $article->body !!}
                </div>

                @if($article->tags && count($article->tags) > 0)
                    <div class="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-6">
                        <span class="text-sm font-bold text-gray-900">Tags:</span>
                        @foreach($article->tags as $tag)
                            <span class="border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:border-brand-red hover:text-brand-red">{{ $tag }}</span>
                        @endforeach
                    </div>
                @endif

                @if($article->source_url)
                    <div class="mt-6 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        <span class="font-bold text-gray-900">Source:</span>
                        <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" class="ml-1 text-brand-red hover:underline">{{ $article->source_name ?? $article->source_url }}</a>
                    </div>
                @endif

                <div class="mt-6 flex items-center gap-3 border-t border-gray-200 pt-6">
                    <span class="text-sm font-bold text-gray-900">Share:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex h-9 w-9 items-center justify-center bg-[#3b5998] text-white hover:opacity-80"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex h-9 w-9 items-center justify-center bg-black text-white hover:opacity-80"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                </div>

                @if(isset($related) && $related->isNotEmpty())
                    <div class="mt-10">
                        <h3 class="section-header">Related Articles</h3>
                        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach($related as $rel)
                                <div class="article-card">
                                    <a href="{{ route('article.show', $rel) }}" class="block">
                                        @if($rel->image_url)
                                            <img src="{{ $rel->image_url }}" alt="{{ $rel->title }}" class="article-card-img mb-3 aspect-video w-full object-cover">
                                        @else
                                            <div class="mb-3 aspect-video w-full bg-gray-200"></div>
                                        @endif
                                    </a>
                                    <h4 class="text-sm font-bold leading-tight text-gray-900">
                                        <a href="{{ route('article.show', $rel) }}" class="hover:text-brand-red">{{ Str::limit($rel->title, 60) }}</a>
                                    </h4>
                                    <span class="mt-1 block text-xs text-gray-500">{{ $rel->published_at?->format('M d, Y') }}</span>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
            </article>

            <div>
                @include('frontend.partials.sidebar')
            </div>
        </div>
    </div>
</div>
@endsection
