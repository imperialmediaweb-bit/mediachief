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
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content (2/3) --}}
            <article class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-xs text-gray-400">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                    @if($article->category)
                        &raquo; <a href="{{ route('category.show', $article->category) }}" class="hover:text-brand-red">{{ $article->category->name }}</a>
                    @endif
                </div>

                {{-- Category badge --}}
                @if($article->category)
                    <span class="cat-badge mb-2">{{ $article->category->name }}</span>
                @endif

                {{-- Title --}}
                <h1 class="mt-2 font-heading text-2xl font-bold leading-tight text-gray-900 md:text-3xl">{{ $article->title }}</h1>

                {{-- Meta --}}
                <div class="mt-3 flex items-center gap-2 border-b border-gray-100 pb-4 text-xs text-gray-500">
                    @if($article->author)
                        <span class="font-semibold text-brand-red">{{ $article->author }}</span> -
                    @endif
                    @if($article->published_at)
                        <time datetime="{{ $article->published_at->toIso8601String() }}">{{ $article->published_at->format('F d, Y') }}</time>
                    @endif
                </div>

                {{-- Share --}}
                <div class="mt-3 flex gap-2">
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex items-center gap-1.5 bg-[#516eab] px-3 py-1.5 text-[11px] font-bold uppercase text-white hover:opacity-90">
                        <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex items-center gap-1.5 bg-[#1da1f2] px-3 py-1.5 text-[11px] font-bold uppercase text-white hover:opacity-90">
                        <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter
                    </a>
                </div>

                {{-- Featured image --}}
                @if($article->image_url)
                <div class="mt-5">
                    <img src="{{ $article->image_url }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="w-full">
                </div>
                @endif

                {{-- Article body --}}
                <div class="mc-post-content mt-6">
                    {!! $article->body !!}
                </div>

                {{-- Tags --}}
                @if($article->tags && count($article->tags) > 0)
                <div class="mt-6 border-t border-gray-100 pt-4">
                    <span class="text-xs font-bold text-gray-900">TAGS:</span>
                    @foreach($article->tags as $tag)
                        <a href="#" class="ml-1 inline-block border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-red hover:bg-brand-red hover:text-white">{{ $tag }}</a>
                    @endforeach
                </div>
                @endif

                {{-- Source --}}
                @if($article->source_url)
                <div class="mt-4 bg-gray-50 p-3 text-sm text-gray-600">
                    <strong class="text-gray-900">Source:</strong>
                    <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" class="text-brand-red hover:underline">{{ $article->source_name ?? $article->source_url }}</a>
                </div>
                @endif

                {{-- Bottom share --}}
                <div class="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                    <span class="text-xs font-bold text-gray-900">SHARE:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex items-center gap-1.5 bg-[#516eab] px-3 py-1.5 text-[11px] font-bold uppercase text-white hover:opacity-90">Facebook</a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex items-center gap-1.5 bg-[#1da1f2] px-3 py-1.5 text-[11px] font-bold uppercase text-white hover:opacity-90">Twitter</a>
                </div>

                {{-- Related Articles --}}
                @if(isset($related) && $related->isNotEmpty())
                <div class="mt-8">
                    <h3 class="section-header">Related Articles</h3>
                    <div class="grid gap-4 md:grid-cols-3">
                        @foreach($related as $rel)
                        <div class="article-card">
                            <a href="{{ route('article.show', $rel) }}">
                                <div class="aspect-video overflow-hidden">
                                    @if($rel->image_url)
                                    <img src="{{ $rel->image_url }}" alt="{{ $rel->title }}" class="h-full w-full object-cover transition-transform duration-300 hover:scale-105">
                                    @else
                                    <div class="h-full w-full bg-gray-200"></div>
                                    @endif
                                </div>
                            </a>
                            <h4 class="mt-2 text-sm font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $rel) }}" class="hover:text-brand-red">{{ Str::limit($rel->title, 60) }}</a></h4>
                            <span class="mt-1 block text-xs text-gray-500">{{ $rel->published_at?->format('M d, Y') }}</span>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </article>

            {{-- Sidebar --}}
            <aside>
                @include('frontend.partials.sidebar')
            </aside>
        </div>
    </div>
</div>
@endsection
