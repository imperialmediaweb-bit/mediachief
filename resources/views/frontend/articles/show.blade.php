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
    <div class="mx-auto max-w-[1200px] px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-[12px]" style="font-family: 'Work Sans', sans-serif; color: #999;">
                    <a href="{{ route('home') }}" class="hover:text-[var(--brand-primary,#E04040)]">Home</a>
                    @if($article->category)
                        &raquo; <a href="{{ route('category.show', $article->category) }}" class="hover:text-[var(--brand-primary,#E04040)]">{{ $article->category->name }}</a>
                    @endif
                </div>

                {{-- Category Badge --}}
                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="td-cat-badge">{{ $article->category->name }}</a>
                @endif

                {{-- Title --}}
                <h1 class="mt-3 text-[28px] font-bold leading-[1.15] md:text-[36px]" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif; color: #000;">{{ $article->title }}</h1>

                {{-- Meta --}}
                <div class="mt-3 mb-5 flex flex-wrap items-center gap-3" style="font-family: 'Work Sans', sans-serif;">
                    <time datetime="{{ $article->published_at?->toISOString() }}" class="text-[12px] text-gray-400">{{ $article->published_at?->format('F j, Y') }}</time>
                    <span class="text-gray-300">|</span>
                    <span class="text-[12px] text-gray-400">{{ number_format($article->views_count) }} views</span>
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

                {{-- Source --}}
                @if($article->source_url)
                <div class="mt-6 border-t border-gray-200 pt-4">
                    <span class="text-[12px] text-gray-400" style="font-family: 'Work Sans', sans-serif;">Source:
                        <a href="{{ $article->source_url }}" target="_blank" rel="noopener" class="text-[var(--brand-primary,#E04040)] hover:underline">{{ parse_url($article->source_url, PHP_URL_HOST) }}</a>
                    </span>
                </div>
                @endif

                {{-- Related Articles --}}
                @if($related->isNotEmpty())
                <div class="mt-8 border-t border-gray-200 pt-6">
                    <div class="td-section-red text-[18px]">Related Articles</div>
                    <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
                        @foreach($related as $rel)
                        <div>
                            <div class="td-module-image">
                                <a href="{{ route('article.show', $rel) }}">
                                    @if($rel->featured_image)
                                        <img src="{{ $rel->featured_image }}" alt="{{ $rel->title }}" class="aspect-[16/10] w-full object-cover" loading="lazy">
                                    @else
                                        <div class="aspect-[16/10] w-full bg-gray-200"></div>
                                    @endif
                                </a>
                            </div>
                            <div class="td-module-meta mt-2">
                                @if($rel->category)
                                    <a href="{{ route('category.show', $rel->category) }}" class="td-cat-badge">{{ $rel->category->name }}</a>
                                @endif
                                <h3 class="td-title mt-1 text-[14px]">
                                    <a href="{{ route('article.show', $rel) }}">{{ $rel->title }}</a>
                                </h3>
                                <span class="td-date mt-1 block">{{ $rel->published_at?->format('F j, Y') }}</span>
                            </div>
                        </div>
                        @endforeach
                    </div>
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
