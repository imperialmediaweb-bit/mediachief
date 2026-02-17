@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

@php
    $sections = collect($categorySections ?? []);
    // Group categories into chunks of 3 for the 3-column layout
    $sectionChunks = $sections->chunk(3);
@endphp

{{-- ═══ FEATURED SECTION (3 Overlay Cards) ═══ --}}
@if(isset($featured) && $featured->isNotEmpty())
<section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 pt-4">
        @if($featured->first()->category)
        <h2 class="section-header">{{ $featured->first()->category->name }}</h2>
        @else
        <h2 class="section-header">Featured</h2>
        @endif
        <div class="grid gap-4 pb-6 md:grid-cols-3">
            @foreach($featured as $feat)
            <div class="article-card group relative overflow-hidden">
                <a href="{{ route('article.show', $feat) }}" class="block">
                    <div class="relative aspect-[4/3] overflow-hidden">
                        @if($feat->image_url)
                        <img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
                        @else
                        <div class="h-full w-full bg-gray-200"></div>
                        @endif
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 p-4">
                            @if($feat->category)
                            <span class="cat-badge mb-2">{{ $feat->category->name }}</span>
                            @endif
                            <h3 class="text-base font-bold leading-tight text-white drop-shadow-lg md:text-lg">{{ Str::limit($feat->title, 80) }}</h3>
                            <div class="mt-2 flex items-center gap-2 text-xs text-gray-300">
                                @if($feat->author)<span>{{ $feat->author }}</span><span>&middot;</span>@endif
                                <span>{{ $feat->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
            @endforeach
        </div>
    </div>
</section>
@endif

{{-- ═══ POPULAR SECTION (4 Cards) ═══ --}}
@if(isset($popular) && $popular->isNotEmpty())
<section class="bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 pt-4 pb-6">
        <h2 class="section-header">Popular</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @foreach($popular as $art)
            <div class="article-card overflow-hidden bg-white shadow-sm">
                <a href="{{ route('article.show', $art) }}">
                    <div class="aspect-video overflow-hidden">
                        @if($art->image_url)
                        <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-full w-full object-cover transition-transform duration-300 hover:scale-105">
                        @else
                        <div class="h-full w-full bg-gray-200"></div>
                        @endif
                    </div>
                </a>
                <div class="p-3">
                    @if($art->category)
                    <span class="cat-badge mb-1">{{ $art->category->name }}</span>
                    @endif
                    <h3 class="text-sm font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 60) }}</a></h3>
                    <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</section>
@endif

{{-- ═══ NEWSLETTER BOX ═══ --}}
<section class="bg-white">
    <div class="mx-auto max-w-3xl px-4 py-6">
        <div class="border-2 border-gray-900 p-6 text-center">
            <h3 class="font-heading text-xl font-black uppercase text-gray-900">{{ $currentSite->name }}</h3>
            <p class="mt-2 text-sm text-gray-600">{{ $currentSite->description ?? 'Subscribe and receive the latest news delivered to your inbox.' }}</p>
            <div class="mt-4 flex items-center justify-center gap-2">
                <input type="email" placeholder="Your email address" class="w-full max-w-xs border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-red">
                <button class="bg-brand-red px-6 py-2 text-sm font-bold uppercase text-white hover:opacity-90">Subscribe</button>
            </div>
        </div>
    </div>
</section>

{{-- ═══ CATEGORY SECTIONS (Groups of 3 columns) ═══ --}}
@foreach($sectionChunks as $chunkIndex => $chunk)
<section class="{{ $chunkIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50' }}">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-6 lg:grid-cols-3">
            @foreach($chunk as $sectionIndex => $section)
            <div>
                <h2 class="section-header {{ $chunk->count() > 1 ? 'text-sm' : '' }}">{{ $section['category']->name }}</h2>

                @if($sectionIndex === 1 && $chunk->count() === 3 && $section['articles']->count() >= 2)
                {{-- Middle column: featured article with larger image --}}
                <div class="article-card">
                    @php $first = $section['articles']->first(); @endphp
                    <a href="{{ route('article.show', $first) }}">
                        @if($first->image_url)
                        <img src="{{ $first->image_url }}" alt="{{ $first->title }}" class="aspect-[4/3] w-full object-cover">
                        @endif
                    </a>
                    <h3 class="mt-3 text-lg font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $first) }}" class="hover:text-brand-red">{{ Str::limit($first->title, 70) }}</a></h3>
                    @if($first->excerpt)
                    <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ Str::limit($first->excerpt, 150) }}</p>
                    @endif
                    <span class="mt-2 block text-xs text-gray-500">{{ $first->published_at?->format('M d, Y') }}</span>
                </div>
                {{-- Additional articles as list --}}
                @foreach($section['articles']->skip(1)->take(2) as $art)
                <div class="mt-3 flex gap-3 border-t border-gray-100 pt-3">
                    @if($art->image_url)
                    <a href="{{ route('article.show', $art) }}" class="shrink-0"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover"></a>
                    @endif
                    <div>
                        <h4 class="text-sm font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a></h4>
                        <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                    </div>
                </div>
                @endforeach

                @else
                {{-- Side columns: list of articles with thumbnails --}}
                <div class="space-y-4">
                    @foreach($section['articles']->take(4) as $art)
                    <div class="flex gap-3 border-b border-gray-100 pb-3">
                        @if($art->image_url)
                        <a href="{{ route('article.show', $art) }}" class="shrink-0"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover"></a>
                        @endif
                        <div>
                            <h4 class="text-sm font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a></h4>
                            <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
                @endif
            </div>
            @endforeach
        </div>
    </div>
</section>
@endforeach

{{-- ═══ LATEST POSTS (2/3 articles + 1/3 sidebar items) ═══ --}}
@if(isset($latest) && $latest->isNotEmpty())
<section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 pt-4 pb-8">
        <h2 class="section-header">Latest Posts</h2>
        <div class="grid gap-6 lg:grid-cols-3">
            {{-- Left: full articles (2 cols wide) --}}
            <div class="space-y-5 lg:col-span-2">
                @foreach($latest->take(5) as $art)
                <article class="flex gap-4 border-b border-gray-100 pb-5">
                    @if($art->image_url)
                    <a href="{{ route('article.show', $art) }}" class="shrink-0">
                        <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-28 w-44 object-cover md:h-36 md:w-56">
                    </a>
                    @endif
                    <div class="min-w-0 flex-1">
                        @if($art->category)
                        <span class="cat-badge mb-1">{{ $art->category->name }}</span>
                        @endif
                        <h3 class="text-base font-bold leading-tight text-gray-900 md:text-lg"><a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 80) }}</a></h3>
                        @if($art->excerpt)
                        <p class="mt-1 hidden text-sm text-gray-600 md:block">{{ Str::limit($art->excerpt, 140) }}</p>
                        @endif
                        <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            @if($art->author)<span>{{ $art->author }}</span><span>&middot;</span>@endif
                            <span>{{ $art->published_at?->format('M d, Y') }}</span>
                        </div>
                    </div>
                </article>
                @endforeach
            </div>

            {{-- Right: small article items --}}
            <div class="space-y-4">
                @foreach($latest->skip(5) as $art)
                <div class="flex gap-3 border-b border-gray-100 pb-3">
                    @if($art->image_url)
                    <a href="{{ route('article.show', $art) }}" class="shrink-0"><img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover"></a>
                    @endif
                    <div>
                        @if($art->category)
                        <span class="cat-badge mb-1 text-[10px]">{{ $art->category->name }}</span>
                        @endif
                        <h4 class="text-sm font-bold leading-tight text-gray-900"><a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 50) }}</a></h4>
                        <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
@endif

@endsection
