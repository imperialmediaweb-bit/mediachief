@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

{{-- ═══ FEATURED BLOCK - Newspaper style: big left + 2 stacked right ═══ --}}
@if(isset($featured) && $featured->isNotEmpty())
<section class="bg-white py-4">
    <div class="mx-auto max-w-[1100px] px-4">
        @if($featured->count() >= 3)
            <div class="grid gap-[5px] md:grid-cols-[2fr_1fr]" style="min-height: 400px;">
                {{-- Big featured article (left) --}}
                @php $main = $featured->first(); @endphp
                <a href="{{ route('article.show', $main) }}" class="td-featured-card group relative block overflow-hidden">
                    @if($main->image_url)
                        <img src="{{ $main->image_url }}" alt="{{ $main->title }}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                    @else
                        <div class="h-full w-full bg-gray-300"></div>
                    @endif
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 p-5">
                        @if($main->category)
                            <span class="td-cat-badge mb-2">{{ $main->category->name }}</span>
                        @endif
                        <h2 class="text-[22px] font-bold leading-[1.2] text-white md:text-[26px]">{{ $main->title }}</h2>
                        <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-300">
                            @if($main->author)<span>{{ $main->author }}</span><span>-</span>@endif
                            <span>{{ $main->published_at?->format('F d, Y') }}</span>
                        </div>
                    </div>
                </a>

                {{-- Two stacked articles (right) --}}
                <div class="flex flex-col gap-[5px]">
                    @foreach($featured->skip(1)->take(2) as $feat)
                        <a href="{{ route('article.show', $feat) }}" class="td-featured-card group relative flex-1 overflow-hidden">
                            @if($feat->image_url)
                                <img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            @else
                                <div class="h-full w-full bg-gray-300"></div>
                            @endif
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-4">
                                @if($feat->category)
                                    <span class="td-cat-badge mb-1">{{ $feat->category->name }}</span>
                                @endif
                                <h3 class="text-[15px] font-bold leading-[1.3] text-white">{{ Str::limit($feat->title, 70) }}</h3>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        @else
            {{-- Fallback: fewer than 3 featured articles --}}
            <div class="grid gap-[5px] md:grid-cols-{{ $featured->count() }}">
                @foreach($featured as $feat)
                    <a href="{{ route('article.show', $feat) }}" class="td-featured-card group relative block overflow-hidden" style="min-height: 300px;">
                        @if($feat->image_url)
                            <img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                        @endif
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 p-4">
                            @if($feat->category)
                                <span class="td-cat-badge mb-2">{{ $feat->category->name }}</span>
                            @endif
                            <h3 class="text-lg font-bold leading-tight text-white">{{ $feat->title }}</h3>
                        </div>
                    </a>
                @endforeach
            </div>
        @endif
    </div>
</section>
@endif

{{-- ═══ CONTENT AREA WITH SIDEBAR ═══ --}}
<div class="bg-[#f9f9f9] py-6">
    <div class="mx-auto max-w-[1100px] px-4">
        <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
            {{-- Main content column --}}
            <div>
                {{-- CATEGORY SECTIONS - Newspaper style --}}
                @if(!empty($categorySections))
                    @foreach($categorySections as $i => $section)
                        <div class="mb-8 bg-white p-5">
                            <h2 class="td-block-title"><span>{{ $section['category']->name }}</span></h2>

                            @if($section['articles']->count() >= 3)
                                {{-- Layout: big featured left + list right --}}
                                <div class="grid gap-5 md:grid-cols-2">
                                    {{-- Featured article with image --}}
                                    @php $catFeat = $section['articles']->first(); @endphp
                                    <div>
                                        <a href="{{ route('article.show', $catFeat) }}" class="group block">
                                            @if($catFeat->image_url)
                                                <div class="relative overflow-hidden">
                                                    <img src="{{ $catFeat->image_url }}" alt="{{ $catFeat->title }}" class="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105">
                                                </div>
                                            @endif
                                        </a>
                                        <h3 class="mt-2 text-[16px] font-bold leading-[1.3] text-[#111]">
                                            <a href="{{ route('article.show', $catFeat) }}" class="hover:text-brand-red">{{ $catFeat->title }}</a>
                                        </h3>
                                        @if($catFeat->excerpt)
                                            <p class="mt-1 text-[13px] leading-relaxed text-gray-500">{{ Str::limit($catFeat->excerpt, 120) }}</p>
                                        @endif
                                        <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                                            @if($catFeat->author)<span>{{ $catFeat->author }}</span><span>-</span>@endif
                                            <span>{{ $catFeat->published_at?->format('F d, Y') }}</span>
                                        </div>
                                    </div>

                                    {{-- Article list --}}
                                    <div class="divide-y divide-gray-100">
                                        @foreach($section['articles']->skip(1) as $art)
                                            <div class="flex gap-3 py-3 first:pt-0">
                                                @if($art->image_url)
                                                    <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                        <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-[60px] w-[90px] object-cover">
                                                    </a>
                                                @endif
                                                <div class="min-w-0">
                                                    <h4 class="text-[13px] font-bold leading-[1.3] text-[#111]">
                                                        <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                                                    </h4>
                                                    <span class="mt-1 block text-[11px] text-gray-400">{{ $art->published_at?->format('F d, Y') }}</span>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @else
                                {{-- Fewer articles: simple list --}}
                                <div class="divide-y divide-gray-100">
                                    @foreach($section['articles'] as $art)
                                        <div class="flex gap-3 py-3 first:pt-0">
                                            @if($art->image_url)
                                                <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                    <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-[60px] w-[90px] object-cover">
                                                </a>
                                            @endif
                                            <div class="min-w-0">
                                                <h4 class="text-[13px] font-bold leading-[1.3] text-[#111]">
                                                    <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 60) }}</a>
                                                </h4>
                                                <span class="mt-1 block text-[11px] text-gray-400">{{ $art->published_at?->format('F d, Y') }}</span>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @endif
                        </div>
                    @endforeach
                @endif

                {{-- LATEST POSTS --}}
                @if(isset($latest) && $latest->isNotEmpty())
                    <div class="mb-8 bg-white p-5">
                        <h2 class="td-block-title"><span>Latest Posts</span></h2>
                        <div class="divide-y divide-gray-100">
                            @foreach($latest as $art)
                                <article class="flex gap-4 py-4 first:pt-0">
                                    @if($art->image_url)
                                        <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                            <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-[100px] w-[150px] object-cover md:h-[120px] md:w-[200px]">
                                        </a>
                                    @endif
                                    <div class="min-w-0 flex-1">
                                        @if($art->category)
                                            <a href="{{ route('category.show', $art->category) }}" class="td-cat-badge mb-1">{{ $art->category->name }}</a>
                                        @endif
                                        <h3 class="text-[15px] font-bold leading-[1.3] text-[#111] md:text-[17px]">
                                            <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ $art->title }}</a>
                                        </h3>
                                        @if($art->excerpt)
                                            <p class="mt-1 hidden text-[13px] leading-relaxed text-gray-500 md:block">{{ Str::limit($art->excerpt, 150) }}</p>
                                        @endif
                                        <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                                            @if($art->author)<span>{{ $art->author }}</span><span>-</span>@endif
                                            <span>{{ $art->published_at?->format('F d, Y') }}</span>
                                        </div>
                                    </div>
                                </article>
                            @endforeach
                        </div>
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
