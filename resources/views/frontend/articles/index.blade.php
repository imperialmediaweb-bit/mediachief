@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-8">

        {{-- Main 3-Column Grid (matching Alabama Express / Newspaper theme layout) --}}
        <div class="grid grid-cols-1 gap-8 md:grid-cols-12">

            {{-- ═══ LEFT COLUMN (Featured Articles with Images) ═══ --}}
            <div class="md:col-span-5 lg:col-span-5">
                @if($featured->isNotEmpty())
                    {{-- Main Featured Article --}}
                    @php $main = $featured->first(); @endphp
                    <div class="mb-8">
                        <div class="td-module-image">
                            <a href="{{ route('article.show', $main) }}">
                                @if($main->featured_image)
                                    <img src="{{ $main->featured_image }}" alt="{{ $main->title }}" class="w-full" loading="lazy">
                                @else
                                    <div class="aspect-video bg-gray-200"></div>
                                @endif
                            </a>
                        </div>
                        <div class="td-module-meta">
                            @if($main->category)
                                <a href="{{ route('category.show', $main->category) }}" class="td-post-category">{{ $main->category->name }}</a>
                            @endif
                            <h2 class="entry-title mt-2 text-2xl md:text-[28px]">
                                <a href="{{ route('article.show', $main) }}">{{ $main->title }}</a>
                            </h2>
                            <div class="td-excerpt">{{ Str::limit(strip_tags($main->body), 160) }}</div>
                            <div class="td-post-date mt-2">{{ $main->published_at?->format('F j, Y') }}</div>
                        </div>
                    </div>

                    {{-- More Featured Articles --}}
                    @foreach($featured->skip(1) as $feat)
                    <div class="mb-6 flex gap-4">
                        <div class="td-module-image w-1/3 shrink-0">
                            <a href="{{ route('article.show', $feat) }}">
                                @if($feat->featured_image)
                                    <img src="{{ $feat->featured_image }}" alt="{{ $feat->title }}" class="w-full aspect-[4/3] object-cover" loading="lazy">
                                @else
                                    <div class="aspect-[4/3] bg-gray-200"></div>
                                @endif
                            </a>
                        </div>
                        <div class="td-module-meta">
                            @if($feat->category)
                                <a href="{{ route('category.show', $feat->category) }}" class="td-post-category">{{ $feat->category->name }}</a>
                            @endif
                            <h3 class="entry-title mt-1 text-base md:text-lg">
                                <a href="{{ route('article.show', $feat) }}">{{ $feat->title }}</a>
                            </h3>
                            <div class="td-post-date mt-1">{{ $feat->published_at?->format('F j, Y') }}</div>
                        </div>
                    </div>
                    @endforeach
                @endif

                {{-- Latest Articles (below featured) --}}
                @if($latest->isNotEmpty())
                <div class="mt-6">
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                        <h3>Latest News</h3>
                    </div>
                    @foreach($latest->take(5) as $art)
                    <div class="mb-5 flex gap-4">
                        <div class="td-module-image w-1/3 shrink-0">
                            <a href="{{ route('article.show', $art) }}">
                                @if($art->featured_image)
                                    <img src="{{ $art->featured_image }}" alt="{{ $art->title }}" class="w-full aspect-[4/3] object-cover" loading="lazy">
                                @else
                                    <div class="aspect-[4/3] bg-gray-200"></div>
                                @endif
                            </a>
                        </div>
                        <div class="td-module-meta">
                            @if($art->category)
                                <a href="{{ route('category.show', $art->category) }}" class="td-post-category">{{ $art->category->name }}</a>
                            @endif
                            <h3 class="entry-title mt-1 text-[15px]">
                                <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                            </h3>
                            <div class="td-excerpt text-[13px] mt-1">{{ Str::limit(strip_tags($art->body), 80) }}</div>
                        </div>
                    </div>
                    @endforeach
                </div>
                @endif
            </div>

            {{-- ═══ MIDDLE COLUMN (Category Article Lists - Text Only) ═══ --}}
            <div class="md:col-span-4 lg:col-span-4 md:border-l md:border-r md:border-gray-200 md:px-6">
                @php $catSections = collect($categorySections); @endphp
                @foreach($catSections->slice(0, 5) as $index => $section)
                <div class="{{ $index > 0 ? 'mt-6' : '' }}">
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                        <h3><a href="{{ route('category.show', $section['category']) }}">{{ $section['category']->name }}</a></h3>
                    </div>
                    @foreach($section['articles']->take(5) as $art)
                    <div class="td-article-list-item">
                        <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                    </div>
                    @endforeach
                </div>
                @endforeach
            </div>

            {{-- ═══ RIGHT COLUMN (More Category Article Lists - Text Only) ═══ --}}
            <div class="md:col-span-3 lg:col-span-3">
                @foreach($catSections->slice(5, 5) as $index => $section)
                <div class="{{ $index > 0 ? 'mt-6' : '' }}">
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                        <h3><a href="{{ route('category.show', $section['category']) }}">{{ $section['category']->name }}</a></h3>
                    </div>
                    @foreach($section['articles']->take(5) as $art)
                    <div class="td-article-list-item">
                        <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                    </div>
                    @endforeach
                </div>
                @endforeach

                {{-- Popular Articles --}}
                @if($popular->isNotEmpty())
                <div class="mt-6">
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
                        <h3>Most Popular</h3>
                    </div>
                    @foreach($popular as $pop)
                    <div class="td-article-list-item">
                        <a href="{{ route('article.show', $pop) }}">{{ $pop->title }}</a>
                    </div>
                    @endforeach
                </div>
                @endif
            </div>

        </div>

        {{-- ═══ MORE CATEGORY SECTIONS (Full Width Below) ═══ --}}
        @if(count($categorySections) > 10)
        <div class="mt-10 border-t border-gray-200 pt-8">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
                @foreach($catSections->slice(10) as $section)
                <div>
                    <div class="section-header">
                        <svg class="section-icon h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                        <h3><a href="{{ route('category.show', $section['category']) }}">{{ $section['category']->name }}</a></h3>
                    </div>
                    @foreach($section['articles']->take(5) as $art)
                    <div class="td-article-list-item">
                        <a href="{{ route('article.show', $art) }}">{{ $art->title }}</a>
                    </div>
                    @endforeach
                </div>
                @endforeach
            </div>
        </div>
        @endif

    </div>
</div>
@endsection
