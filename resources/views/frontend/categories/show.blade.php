@extends('frontend.layouts.app')

@section('title', $category->name . ' - ' . $currentSite->name)

@section('content')
<div class="bg-[#f9f9f9] py-6">
    <div class="mx-auto max-w-[1100px] px-4">
        <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div>
                <div class="bg-white p-5">
                    {{-- Breadcrumb --}}
                    <nav class="mb-3 text-[11px] text-gray-400">
                        <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                        <span class="mx-1">&raquo;</span>
                        <span class="text-[#111]">{{ $category->name }}</span>
                    </nav>

                    <h1 class="td-block-title"><span>{{ $category->name }}</span></h1>
                    @if($category->description)
                        <p class="mb-4 text-[13px] text-gray-500">{{ $category->description }}</p>
                    @endif

                    {{-- Top featured articles on first page --}}
                    @if($articles->onFirstPage() && $articles->count() >= 3)
                        <div class="mb-6 grid gap-[5px] sm:grid-cols-2">
                            @foreach($articles->take(2) as $topArticle)
                                <a href="{{ route('article.show', $topArticle) }}" class="td-featured-card group relative block overflow-hidden" style="min-height: 200px;">
                                    @if($topArticle->image_url)
                                        <img src="{{ $topArticle->image_url }}" alt="{{ $topArticle->title }}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
                                    @else
                                        <div class="h-full w-full bg-gray-200"></div>
                                    @endif
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <div class="absolute bottom-0 left-0 p-4">
                                        <span class="td-cat-badge mb-1">{{ $category->name }}</span>
                                        <h2 class="text-[15px] font-bold leading-[1.3] text-white">{{ Str::limit($topArticle->title, 70) }}</h2>
                                    </div>
                                </a>
                            @endforeach
                        </div>
                    @endif

                    {{-- Article list --}}
                    <div class="divide-y divide-gray-100">
                        @php $skipCount = ($articles->onFirstPage() && $articles->count() >= 3) ? 2 : 0; @endphp
                        @forelse($articles->skip($skipCount) as $article)
                            <article class="flex gap-4 py-4 first:pt-0">
                                @if($article->image_url)
                                    <a href="{{ route('article.show', $article) }}" class="shrink-0">
                                        <img src="{{ $article->image_url }}" alt="{{ $article->title }}" class="h-[100px] w-[150px] object-cover md:h-[120px] md:w-[200px]">
                                    </a>
                                @endif
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-[15px] font-bold leading-[1.3] text-[#111] md:text-[17px]">
                                        <a href="{{ route('article.show', $article) }}" class="hover:text-brand-red">{{ $article->title }}</a>
                                    </h3>
                                    @if($article->excerpt)
                                        <p class="mt-1 hidden text-[13px] leading-relaxed text-gray-500 md:block">{{ Str::limit($article->excerpt, 160) }}</p>
                                    @endif
                                    <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                                        @if($article->author)<span>{{ $article->author }}</span><span>-</span>@endif
                                        <span>{{ $article->published_at?->format('F d, Y') }}</span>
                                    </div>
                                </div>
                            </article>
                        @empty
                            <div class="py-12 text-center text-[13px] text-gray-400">
                                <p>No articles in this category yet.</p>
                            </div>
                        @endforelse
                    </div>

                    @if($articles->hasPages())
                        <div class="mt-6 flex items-center justify-center gap-2">
                            {{ $articles->links('frontend.partials.pagination') }}
                        </div>
                    @endif
                </div>
            </div>

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
