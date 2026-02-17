@extends('frontend.layouts.app')

@section('title', $article->title . ' - ' . $currentSite->name)

@section('wp_head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{{ url()->current() }}">
    @if($article->featured_image)
    <meta property="og:image" content="{{ $article->featured_image }}">
    @endif
    <meta property="og:site_name" content="{{ $currentSite->name }}">
    @if($article->meta_description)
    <meta property="og:description" content="{{ $article->meta_description }}">
    <meta name="description" content="{{ $article->meta_description }}">
    @endif
@endsection

@push('head')
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{{ url()->current() }}">
    @if($article->featured_image)
    <meta property="og:image" content="{{ $article->featured_image }}">
    @endif
    <meta property="og:site_name" content="{{ $currentSite->name }}">
    @if($article->meta_description)
    <meta property="og:description" content="{{ $article->meta_description }}">
    <meta name="description" content="{{ $article->meta_description }}">
    @endif
@endpush

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-xs" style="font-family: 'Work Sans', sans-serif; color: #999;">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                    @if($article->category)
                        &raquo; <a href="{{ route('category.show', $article->category) }}" class="hover:text-brand-red">{{ $article->category->name }}</a>
                    @endif
                </div>

                {{-- Title --}}
                <h1 class="mb-3 font-heading text-3xl font-bold md:text-4xl" style="color: #000; line-height: 1.15;">{{ $article->title }}</h1>

                {{-- Meta --}}
                <div class="mb-5 flex flex-wrap items-center gap-3 text-sm" style="font-family: 'Work Sans', sans-serif; color: #999;">
                    @if($article->category)
                        <a href="{{ route('category.show', $article->category) }}" style="color: var(--brand-primary, #E04040); font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">{{ $article->category->name }}</a>
                        <span class="text-gray-300">|</span>
                    @endif
                    <time datetime="{{ $article->published_at?->toISOString() }}">{{ $article->published_at?->format('F j, Y') }}</time>
                    <span class="text-gray-300">|</span>
                    <span>{{ number_format($article->views_count) }} views</span>
                </div>

                {{-- Featured Image --}}
                @if($article->featured_image)
                <div class="mb-6">
                    <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="w-full" loading="lazy">
                </div>
                @endif

                {{-- Article Body --}}
                <div class="mc-post-content">
                    {!! $article->body !!}
                </div>
            </div>

            {{-- Sidebar --}}
            <aside>
                @include('frontend.partials.sidebar')

                {{-- Related Articles --}}
                @if($related->isNotEmpty())
                <div class="mt-6">
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                        <h3>Related Articles</h3>
                    </div>
                    @foreach($related as $rel)
                    <div class="td-article-list-item">
                        <a href="{{ route('article.show', $rel) }}">{{ $rel->title }}</a>
                    </div>
                    @endforeach
                </div>
                @endif
            </aside>
        </div>
    </div>
</div>
@endsection
