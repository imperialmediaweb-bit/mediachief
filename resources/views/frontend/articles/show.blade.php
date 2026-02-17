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

@section('wp_head')
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
@endsection

@section('content')
<div class="bg-[#f9f9f9] py-6">
    <div class="mx-auto max-w-[1100px] px-4">
        <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <article class="bg-white p-6">
                {{-- Breadcrumb --}}
                <nav class="mb-4 text-[11px] text-gray-400">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                    @if($article->category)
                        <span class="mx-1">&raquo;</span>
                        <a href="{{ route('category.show', $article->category) }}" class="hover:text-brand-red">{{ $article->category->name }}</a>
                    @endif
                </nav>

                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="td-cat-badge mb-3">{{ $article->category->name }}</a>
                @endif

                <h1 class="mb-4 font-heading text-[26px] font-bold leading-[1.2] text-[#111] md:text-[32px]">
                    {{ $article->title }}
                </h1>

                <div class="mb-5 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4 text-[12px] text-gray-400">
                    @if($article->author)
                        <span class="font-semibold text-brand-red">{{ $article->author }}</span>
                        <span>-</span>
                    @endif
                    @if($article->published_at)
                        <time datetime="{{ $article->published_at->toIso8601String() }}">
                            {{ $article->published_at->format('F d, Y') }}
                        </time>
                    @endif
                </div>

                {{-- Social share bar --}}
                <div class="mb-5 flex items-center gap-2">
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex h-8 w-8 items-center justify-center bg-[#516eab] text-white hover:opacity-90"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex h-8 w-8 items-center justify-center bg-[#29c5f6] text-white hover:opacity-90"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                </div>

                @if($article->image_url)
                    <figure class="mb-6">
                        <img src="{{ $article->image_url }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="w-full">
                    </figure>
                @endif

                <div class="td-article-content prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-[#111] prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-[#444] prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-[#111] prose-img:w-full prose-blockquote:border-brand-red prose-blockquote:text-gray-600">
                    {!! $article->body !!}
                </div>

                @if($article->tags && count($article->tags) > 0)
                    <div class="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-5">
                        <span class="text-[12px] font-bold text-[#111]">TAGS:</span>
                        @foreach($article->tags as $tag)
                            <span class="border border-gray-300 px-2.5 py-1 text-[11px] text-gray-500 transition-colors hover:border-brand-red hover:text-brand-red">{{ $tag }}</span>
                        @endforeach
                    </div>
                @endif

                @if($article->source_url)
                    <div class="mt-5 bg-[#f9f9f9] p-4 text-[13px] text-gray-500">
                        <span class="font-bold text-[#111]">Source:</span>
                        <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" class="ml-1 text-brand-red hover:underline">{{ $article->source_name ?? $article->source_url }}</a>
                    </div>
                @endif

                {{-- Bottom share --}}
                <div class="mt-5 flex items-center gap-2 border-t border-gray-200 pt-5">
                    <span class="text-[12px] font-bold text-[#111]">SHARE:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode(request()->url()) }}" target="_blank" rel="noopener" class="flex h-8 w-8 items-center justify-center bg-[#516eab] text-white hover:opacity-90"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="https://twitter.com/intent/tweet?url={{ urlencode(request()->url()) }}&text={{ urlencode($article->title) }}" target="_blank" rel="noopener" class="flex h-8 w-8 items-center justify-center bg-[#29c5f6] text-white hover:opacity-90"><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                </div>

                @if(isset($related) && $related->isNotEmpty())
                    <div class="mt-8">
                        <h3 class="td-block-title"><span>Related Articles</span></h3>
                        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach($related as $rel)
                                <div class="group">
                                    <a href="{{ route('article.show', $rel) }}" class="block overflow-hidden">
                                        @if($rel->image_url)
                                            <img src="{{ $rel->image_url }}" alt="{{ $rel->title }}" class="mb-2 aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105">
                                        @else
                                            <div class="mb-2 aspect-video w-full bg-gray-200"></div>
                                        @endif
                                    </a>
                                    <h4 class="text-[13px] font-bold leading-[1.3] text-[#111]">
                                        <a href="{{ route('article.show', $rel) }}" class="hover:text-brand-red">{{ Str::limit($rel->title, 60) }}</a>
                                    </h4>
                                    <span class="mt-1 block text-[11px] text-gray-400">{{ $rel->published_at?->format('F d, Y') }}</span>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
            </article>

            <div>
                @if(file_exists(storage_path('app/wp-theme/sidebar.html')))
                    {!! file_get_contents(storage_path('app/wp-theme/sidebar.html')) !!}
                @else
                    @include('frontend.partials.sidebar')
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
