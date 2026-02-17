@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-[1200px] px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-[12px]" style="font-family: 'Work Sans', sans-serif; color: #999;">
                    <a href="{{ route('home') }}" class="hover:text-[var(--brand-primary,#E04040)]">Home</a> &raquo;
                    <span style="color: #000;">{{ $category->name }}</span>
                </div>

                {{-- Category Title --}}
                <div class="td-section-red mb-6">{{ $category->name }}</div>

                {{-- Featured cards for first page --}}
                @if($articles->onFirstPage() && $articles->count() >= 3)
                <div class="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                    @foreach($articles->take(3) as $article)
                    <div>
                        <div class="td-module-image">
                            <a href="{{ route('article.show', $article) }}">
                                @if($article->featured_image)
                                    <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="aspect-[16/10] w-full object-cover" loading="lazy">
                                @else
                                    <div class="aspect-[16/10] w-full bg-gray-200"></div>
                                @endif
                            </a>
                        </div>
                        <div class="td-module-meta mt-2">
                            <h3 class="td-title text-[15px]">
                                <a href="{{ route('article.show', $article) }}">{{ $article->title }}</a>
                            </h3>
                            <span class="td-date mt-1 block">{{ $article->published_at?->format('F j, Y') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
                @php $skipCount = 3; @endphp
                @else
                @php $skipCount = 0; @endphp
                @endif

                {{-- Article list --}}
                @foreach($articles->skip($skipCount) as $article)
                <div class="flex gap-4 border-b border-gray-100 py-4">
                    <div class="td-module-image w-[200px] shrink-0">
                        <a href="{{ route('article.show', $article) }}">
                            @if($article->featured_image)
                                <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="aspect-[4/3] w-full object-cover" loading="lazy">
                            @else
                                <div class="aspect-[4/3] w-full bg-gray-200"></div>
                            @endif
                        </a>
                    </div>
                    <div class="td-module-meta">
                        <h2 class="td-title text-[17px] md:text-[20px]">
                            <a href="{{ route('article.show', $article) }}">{{ $article->title }}</a>
                        </h2>
                        <p class="td-excerpt mt-2">{{ Str::limit(strip_tags($article->body), 120) }}</p>
                        <span class="td-date mt-2 block">{{ $article->published_at?->format('F j, Y') }}</span>
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
