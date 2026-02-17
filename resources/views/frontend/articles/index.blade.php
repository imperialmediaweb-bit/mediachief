@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-[1200px] px-4">
        @php $catSections = collect($categorySections); @endphp

        {{-- ═══ AD BANNER (light gray bg row) ═══ --}}
        <div class="td-ad-row">
            <div class="td-ad-banner">
                <a href="#">Promote your business. Contact us!</a>
            </div>
        </div>

        {{-- ═══ SECTION 1: LOCAL NEWS (3 equal columns) ═══ --}}
        @if($featured->isNotEmpty())
        <div class="py-4">
            <div class="td-section-red">{{ $catSections->first()['category']->name ?? 'Local News' }}</div>
            <div class="td-hero-grid">
                @foreach($featured->take(3) as $feat)
                <div class="td-hero-card">
                    <div class="td-module-image">
                        <a href="{{ route('article.show', $feat) }}">
                            @if($feat->featured_image)
                                <img src="{{ $feat->featured_image }}" alt="{{ $feat->title }}" class="td-hero-img" loading="lazy">
                            @else
                                <div class="td-hero-img bg-gray-200"></div>
                            @endif
                        </a>
                    </div>
                    <div class="td-hero-meta">
                        <h3 class="td-hero-title">
                            <a href="{{ route('article.show', $feat) }}">{{ $feat->title }}</a>
                        </h3>
                        @if($feat->category)
                            <a href="{{ route('category.show', $feat->category) }}" class="td-cat-badge">{{ $feat->category->name }}</a>
                        @endif
                        <p class="td-hero-excerpt">{{ Str::limit(strip_tags($feat->body), 120) }}</p>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        {{-- ═══ SECTION 2: POPULAR (4 articles in a row) ═══ --}}
        @if($popular->isNotEmpty())
        <div class="border-t border-gray-200 py-4">
            <div class="td-section-red">Popular</div>
            <div class="td-popular-grid">
                @foreach($popular as $pop)
                <div class="td-popular-card">
                    <div class="td-module-image">
                        <a href="{{ route('article.show', $pop) }}">
                            @if($pop->featured_image)
                                <img src="{{ $pop->featured_image }}" alt="{{ $pop->title }}" class="td-popular-img" loading="lazy">
                            @else
                                <div class="td-popular-img bg-gray-200"></div>
                            @endif
                        </a>
                    </div>
                    <div class="td-popular-meta">
                        <h3 class="td-popular-title">
                            <a href="{{ route('article.show', $pop) }}">{{ $pop->title }}</a>
                        </h3>
                        @if($pop->category)
                            <a href="{{ route('category.show', $pop->category) }}" class="td-cat-badge">{{ $pop->category->name }}</a>
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        {{-- ═══ NEWSLETTER BANNER ═══ --}}
        <div class="td-newsletter-banner">
            <div class="td-nl-logo">{{ $currentSite->name }}</div>
            <p class="td-nl-text">Subscribe and receive notifications. Join our membership program.</p>
        </div>

        {{-- ═══ SECTION 3: Three Editorial Columns (each with red header + image article) ═══ --}}
        @if($catSections->count() >= 3)
        <div class="grid grid-cols-1 gap-5 border-t border-gray-200 py-4 md:grid-cols-3">
            @foreach($catSections->slice(0, 3) as $section)
            <div>
                <div class="td-section-red text-[18px]">{{ $section['category']->name }}</div>
                @php $first = $section['articles']->first(); @endphp
                @if($first)
                <div class="mb-3">
                    <div class="td-module-image">
                        <a href="{{ route('article.show', $first) }}">
                            @if($first->featured_image)
                                <img src="{{ $first->featured_image }}" alt="{{ $first->title }}" class="aspect-[16/10] w-full object-cover" loading="lazy">
                            @else
                                <div class="aspect-[16/10] w-full bg-gray-200"></div>
                            @endif
                        </a>
                    </div>
                    <div class="td-module-meta mt-2">
                        <h3 class="td-title">
                            <a href="{{ route('article.show', $first) }}">{{ $first->title }}</a>
                        </h3>
                        <span class="td-date mt-1 block">{{ $first->published_at?->format('F j, Y') }}</span>
                    </div>
                </div>
                @endif
                @foreach($section['articles']->skip(1)->take(4) as $art)
                <div class="td-article-list-item">
                    <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                </div>
                @endforeach
            </div>
            @endforeach
        </div>
        @endif

        {{-- ═══ AD BANNER ═══ --}}
        <div class="td-ad-row">
            <div class="td-ad-banner">
                <a href="#">Promote your business. Contact us!</a>
            </div>
        </div>

        {{-- ═══ SECTION 4: Three Category Columns with DECORATED striped-line headers + thumbnails ═══ --}}
        @if($catSections->count() > 3)
        <div class="grid grid-cols-1 gap-6 border-t border-gray-200 py-4 md:grid-cols-3">
            @foreach($catSections->slice(3, 3) as $section)
            <div>
                <div class="td-section-decorated" style="padding: 20px 0; margin-bottom: 15px;">
                    <span class="td-section-title" style="font-size: 22px; padding: 3px 20px 2px;">{{ $section['category']->name }}</span>
                </div>
                @foreach($section['articles']->take(5) as $art)
                <a href="{{ route('article.show', $art) }}" class="td-article-thumb-item">
                    <span class="td-thumb-title">{{ $art->title }}</span>
                    @if($art->featured_image)
                        <img src="{{ $art->featured_image }}" alt="{{ $art->title }}" class="td-thumb-img" loading="lazy">
                    @else
                        <span class="td-thumb-img bg-gray-200"></span>
                    @endif
                </a>
                @endforeach
            </div>
            @endforeach
        </div>
        @endif

        {{-- ═══ SECTION 5: LATEST POSTS (decorated header + 2-column rows) ═══ --}}
        @if($latest->isNotEmpty())
        <div class="border-t border-gray-200">
            <div class="td-section-decorated">
                <span class="td-section-title">Latest Posts</span>
            </div>

            <div class="pb-8">
                @foreach($latest->chunk(2) as $pair)
                <div class="grid grid-cols-1 gap-6 border-b border-gray-100 pb-5 mb-5 md:grid-cols-2">
                    @foreach($pair as $art)
                    <div class="flex gap-4">
                        <div class="td-module-image w-[200px] shrink-0">
                            <a href="{{ route('article.show', $art) }}">
                                @if($art->featured_image)
                                    <img src="{{ $art->featured_image }}" alt="{{ $art->title }}" class="aspect-[4/3] w-full object-cover" loading="lazy">
                                @else
                                    <div class="aspect-[4/3] w-full bg-gray-200"></div>
                                @endif
                            </a>
                        </div>
                        <div class="td-module-meta flex-1">
                            @if($art->category)
                                <a href="{{ route('category.show', $art->category) }}" class="td-cat-badge">{{ $art->category->name }}</a>
                            @endif
                            <h3 class="td-title mt-1 text-[16px]">
                                <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                            </h3>
                            <span class="td-date mt-2 block">{{ $art->published_at?->format('F j, Y') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
                @endforeach
            </div>
        </div>
        @endif

        {{-- ═══ More Category Sections (if any remaining) ═══ --}}
        @if($catSections->count() > 6)
        <div class="grid grid-cols-1 gap-6 border-t border-gray-200 py-6 md:grid-cols-3">
            @foreach($catSections->slice(6) as $section)
            <div>
                <div class="td-section-decorated" style="padding: 20px 0; margin-bottom: 15px;">
                    <span class="td-section-title" style="font-size: 22px; padding: 3px 20px 2px;">{{ $section['category']->name }}</span>
                </div>
                @foreach($section['articles']->take(5) as $art)
                <div class="td-article-list-item">
                    <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                </div>
                @endforeach
            </div>
            @endforeach
        </div>
        @endif

    </div>
</div>
@endsection
