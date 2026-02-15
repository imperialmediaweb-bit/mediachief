@extends('frontend.layouts.app')

@section('title', $currentSite->name)

@section('content')
<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
    @forelse($articles as $article)
        <article class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
            @if($article->featured_image)
                <a href="{{ route('article.show', $article) }}">
                    <img src="{{ $article->featured_image }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="h-48 w-full object-cover">
                </a>
            @endif

            <div class="p-5">
                @if($article->category)
                    <a href="{{ route('category.show', $article->category) }}" class="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-blue-600">
                        {{ $article->category->name }}
                    </a>
                @endif

                <h2 class="mb-2 text-lg font-bold leading-tight">
                    <a href="{{ route('article.show', $article) }}" class="text-gray-900 hover:text-blue-600">
                        {{ $article->title }}
                    </a>
                </h2>

                @if($article->excerpt)
                    <p class="mb-3 text-sm text-gray-600">
                        {{ Str::limit($article->excerpt, 150) }}
                    </p>
                @endif

                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>{{ $article->published_at?->diffForHumans() }}</span>
                    @if($article->author)
                        <span>{{ $article->author }}</span>
                    @endif
                </div>
            </div>
        </article>
    @empty
        <div class="col-span-full py-12 text-center text-gray-500">
            No articles published yet.
        </div>
    @endforelse
</div>

<div class="mt-8">
    {{ $articles->links() }}
</div>
@endsection
