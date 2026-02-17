@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-xs" style="font-family: 'Work Sans', sans-serif; color: #999;">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a> &raquo;
                    <span style="color: #000;">{{ $category->name }}</span>
                </div>

                {{-- Category Title --}}
                <div class="section-header mb-6">
                    <svg class="section-icon h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                    <h1 class="text-2xl md:text-3xl" style="font-family: var(--font-heading, 'Big Shoulders Text'), sans-serif; font-weight: 800; color: #000;">{{ $category->name }}</h1>
                </div>

                {{-- Articles --}}
                @foreach($articles as $article)
                <div class="mb-6 flex gap-4 border-b border-gray-100 pb-6">
                    <div class="td-module-image w-1/3 shrink-0">
                        <a href="{{ route('article.show', $article) }}">
                            @if($article->featured_image)
                                <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="w-full aspect-[4/3] object-cover" loading="lazy">
                            @else
                                <div class="aspect-[4/3] bg-gray-200"></div>
                            @endif
                        </a>
                    </div>
                    <div class="td-module-meta">
                        <h2 class="entry-title text-lg md:text-xl">
                            <a href="{{ route('article.show', $article) }}">{{ $article->title }}</a>
                        </h2>
                        <div class="td-excerpt mt-2">{{ Str::limit(strip_tags($article->body), 120) }}</div>
                        <div class="td-post-date mt-2">{{ $article->published_at?->format('F j, Y') }}</div>
                    </div>
                </div>
                @endforeach

                {{-- Pagination --}}
                <div class="mt-6">
                    {{ $articles->links('frontend.partials.pagination') }}
                </div>
            </div>

            {{-- Sidebar --}}
            <aside>
                @include('frontend.partials.sidebar')
            </aside>
        </div>
    </div>
</div>
@endsection
