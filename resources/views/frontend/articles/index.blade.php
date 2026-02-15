@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')

{{-- ═══ LOCAL NEWS / FEATURED SECTION ═══ --}}
@if(isset($featured) && $featured->isNotEmpty())
<section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 pt-1">
        <h2 class="section-header">Local News</h2>
        <div class="grid gap-4 pb-6 md:grid-cols-3">
            @foreach($featured as $feat)
                <div class="article-card group relative overflow-hidden">
                    <a href="{{ route('article.show', $feat) }}" class="block">
                        <div class="relative aspect-[4/3] overflow-hidden">
                            @if($feat->image_url)
                                <img src="{{ $feat->image_url }}" alt="{{ $feat->title }}" class="article-card-img h-full w-full object-cover">
                            @else
                                <div class="flex h-full w-full items-center justify-center bg-gray-200">
                                    <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                            @endif
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-4">
                                @if($feat->category)
                                    <span class="cat-badge mb-2">{{ $feat->category->name }}</span>
                                @endif
                                <h3 class="text-base font-bold leading-tight text-white drop-shadow-lg md:text-lg">
                                    {{ Str::limit($feat->title, 80) }}
                                </h3>
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

{{-- ═══ POPULAR SECTION ═══ --}}
@if(isset($popular) && $popular->isNotEmpty())
<section class="bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 pt-1 pb-6">
        <h2 class="section-header">Popular</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @foreach($popular as $pop)
                <div class="article-card overflow-hidden bg-white shadow-sm">
                    <a href="{{ route('article.show', $pop) }}" class="block">
                        <div class="relative aspect-video overflow-hidden">
                            @if($pop->image_url)
                                <img src="{{ $pop->image_url }}" alt="{{ $pop->title }}" class="article-card-img h-full w-full object-cover">
                            @else
                                <div class="flex h-full w-full items-center justify-center bg-gray-200">
                                    <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                            @endif
                        </div>
                    </a>
                    <div class="p-3">
                        @if($pop->category)
                            <a href="{{ route('category.show', $pop->category) }}" class="cat-badge mb-1">{{ $pop->category->name }}</a>
                        @endif
                        <h3 class="text-sm font-bold leading-tight text-gray-900">
                            <a href="{{ route('article.show', $pop) }}" class="hover:text-brand-red">{{ Str::limit($pop->title, 65) }}</a>
                        </h3>
                        <span class="mt-1 block text-xs text-gray-500">{{ $pop->published_at?->format('M d, Y') }}</span>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</section>
@endif

{{-- ═══ NEWSLETTER / MEMBERSHIP BOX ═══ --}}
<section class="bg-white">
    <div class="mx-auto max-w-3xl px-4 py-6">
        <div class="border-2 border-gray-900 p-6 text-center">
            <h3 class="font-heading text-xl font-black uppercase text-gray-900">{{ $currentSite->name }}</h3>
            <p class="mt-2 text-sm text-gray-600">Subscribe and receive our latest stories and unbiased coverage.</p>
            <form action="#" method="POST" class="mt-4 flex items-center justify-center gap-2">
                @csrf
                <input type="email" name="email" placeholder="Your email address" class="w-full max-w-xs border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-red">
                <button type="submit" class="bg-brand-red px-6 py-2 text-sm font-bold uppercase text-white hover:bg-red-700">Subscribe</button>
            </form>
        </div>
    </div>
</section>

{{-- ═══ CATEGORY SECTIONS (3-column groups) ═══ --}}
@if(!empty($categorySections))
    @php $chunks = array_chunk($categorySections, 3); @endphp

    @foreach($chunks as $chunkIndex => $chunk)
        {{-- First chunk: 3-column layout with center featured --}}
        @if($chunkIndex === 0 && count($chunk) >= 3)
            <section class="bg-white">
                <div class="mx-auto max-w-7xl px-4 py-1">
                    <div class="grid gap-6 lg:grid-cols-3">
                        {{-- Left column --}}
                        <div>
                            <h2 class="section-header">{{ $chunk[0]['category']->name }}</h2>
                            <div class="space-y-4">
                                @foreach($chunk[0]['articles'] as $art)
                                    <div class="flex gap-3 border-b border-gray-100 pb-3">
                                        @if($art->image_url)
                                            <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover">
                                            </a>
                                        @endif
                                        <div class="min-w-0">
                                            <h4 class="text-sm font-bold leading-tight text-gray-900">
                                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                                            </h4>
                                            <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>

                        {{-- Center column - featured article --}}
                        <div>
                            <h2 class="section-header">{{ $chunk[1]['category']->name }}</h2>
                            @if($chunk[1]['articles']->first())
                                @php $centerFeat = $chunk[1]['articles']->first(); @endphp
                                <div class="article-card">
                                    <a href="{{ route('article.show', $centerFeat) }}" class="block">
                                        @if($centerFeat->image_url)
                                            <img src="{{ $centerFeat->image_url }}" alt="{{ $centerFeat->title }}" class="aspect-[4/3] w-full object-cover">
                                        @endif
                                    </a>
                                    <h3 class="mt-3 text-lg font-bold leading-tight text-gray-900">
                                        <a href="{{ route('article.show', $centerFeat) }}" class="hover:text-brand-red">{{ $centerFeat->title }}</a>
                                    </h3>
                                    <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ Str::limit($centerFeat->excerpt, 200) }}</p>
                                    <span class="mt-2 block text-xs text-gray-500">{{ $centerFeat->published_at?->format('M d, Y') }}</span>
                                </div>
                                @foreach($chunk[1]['articles']->skip(1) as $art)
                                    <div class="mt-3 flex gap-3 border-t border-gray-100 pt-3">
                                        @if($art->image_url)
                                            <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover">
                                            </a>
                                        @endif
                                        <div class="min-w-0">
                                            <h4 class="text-sm font-bold leading-tight text-gray-900">
                                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                                            </h4>
                                            <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                                        </div>
                                    </div>
                                @endforeach
                            @endif
                        </div>

                        {{-- Right column --}}
                        <div>
                            <h2 class="section-header">{{ $chunk[2]['category']->name }}</h2>
                            <div class="space-y-4">
                                @foreach($chunk[2]['articles'] as $art)
                                    <div class="flex gap-3 border-b border-gray-100 pb-3">
                                        @if($art->image_url)
                                            <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover">
                                            </a>
                                        @endif
                                        <div class="min-w-0">
                                            <h4 class="text-sm font-bold leading-tight text-gray-900">
                                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                                            </h4>
                                            <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        @else
            {{-- Remaining category chunks: section header + grid --}}
            @foreach($chunk as $section)
                <section class="bg-white">
                    <div class="mx-auto max-w-7xl px-4 pt-1 pb-6">
                        <h2 class="section-header">{{ $section['category']->name }}</h2>
                        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            @foreach($section['articles']->take(2) as $art)
                                <div class="article-card">
                                    <a href="{{ route('article.show', $art) }}" class="block">
                                        <div class="relative aspect-video overflow-hidden">
                                            @if($art->image_url)
                                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="article-card-img h-full w-full object-cover">
                                            @else
                                                <div class="flex h-full w-full items-center justify-center bg-gray-200">
                                                    <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                </div>
                                            @endif
                                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                            <div class="absolute bottom-0 left-0 p-3">
                                                <span class="cat-badge mb-1">{{ $section['category']->name }}</span>
                                                <h3 class="text-sm font-bold leading-tight text-white">{{ Str::limit($art->title, 65) }}</h3>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            @endforeach

                            <div class="space-y-3">
                                @foreach($section['articles']->skip(2) as $art)
                                    <div class="flex gap-3 border-b border-gray-100 pb-3">
                                        @if($art->image_url)
                                            <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover">
                                            </a>
                                        @endif
                                        <div class="min-w-0">
                                            <h4 class="text-sm font-bold leading-tight text-gray-900">
                                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                                            </h4>
                                            <span class="mt-1 block text-xs text-gray-500">{{ $art->published_at?->format('M d, Y') }}</span>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </section>
            @endforeach
        @endif
    @endforeach
@endif

{{-- ═══ AD BANNER SLOT ═══ --}}
<section class="bg-amber-400">
    <div class="mx-auto max-w-7xl px-4 py-3 text-center">
        <p class="text-sm font-bold text-gray-900">Promote your business. Contact us!</p>
    </div>
</section>

{{-- ═══ LATEST POSTS SECTION ═══ --}}
@if(isset($latest) && $latest->isNotEmpty())
<section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 pt-1 pb-8">
        <h2 class="section-header">Latest Posts</h2>
        <div class="grid gap-6 lg:grid-cols-3">
            {{-- Left: large article cards --}}
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
                                <a href="{{ route('category.show', $art->category) }}" class="cat-badge mb-1">{{ $art->category->name }}</a>
                            @endif
                            <h3 class="text-base font-bold leading-tight text-gray-900 md:text-lg">
                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ $art->title }}</a>
                            </h3>
                            @if($art->excerpt)
                                <p class="mt-1 hidden text-sm text-gray-600 md:block">{{ Str::limit($art->excerpt, 150) }}</p>
                            @endif
                            <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                @if($art->author)<span>{{ $art->author }}</span><span>&middot;</span>@endif
                                <span>{{ $art->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>

            {{-- Right: sidebar list --}}
            <div class="space-y-4">
                @foreach($latest->skip(5) as $art)
                    <div class="flex gap-3 border-b border-gray-100 pb-3">
                        @if($art->image_url)
                            <a href="{{ route('article.show', $art) }}" class="shrink-0">
                                <img src="{{ $art->image_url }}" alt="{{ $art->title }}" class="h-16 w-24 object-cover">
                            </a>
                        @endif
                        <div class="min-w-0">
                            @if($art->category)
                                <span class="cat-badge mb-1 text-[10px]">{{ $art->category->name }}</span>
                            @endif
                            <h4 class="text-sm font-bold leading-tight text-gray-900">
                                <a href="{{ route('article.show', $art) }}" class="hover:text-brand-red">{{ Str::limit($art->title, 55) }}</a>
                            </h4>
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
