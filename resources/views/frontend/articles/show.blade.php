@extends('frontend.layouts.app')

@section('title', $article->title . ' - ' . $currentSite->name)

@push('head')
    @if($article->seo)
        @foreach($article->seo as $key => $value)
            <meta name="{{ $key }}" content="{{ $value }}">
        @endforeach
    @endif
@endpush

@section('content')
<article class="mx-auto max-w-4xl">
    <header class="mb-8">
        @if($article->category)
            <a href="{{ route('category.show', $article->category) }}" class="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-blue-600">
                {{ $article->category->name }}
            </a>
        @endif

        <h1 class="mb-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            {{ $article->title }}
        </h1>

        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            @if($article->author)
                <span>By <strong>{{ $article->author }}</strong></span>
            @endif
            @if($article->published_at)
                <time datetime="{{ $article->published_at->toIso8601String() }}">
                    {{ $article->published_at->format('d M Y, H:i') }}
                </time>
            @endif
            @if($article->source_name)
                <span>Source: {{ $article->source_name }}</span>
            @endif
        </div>
    </header>

    @if($article->featured_image)
        <figure class="mb-8">
            <img src="{{ $article->featured_image }}" alt="{{ $article->featured_image_alt ?? $article->title }}" class="w-full rounded-lg">
        </figure>
    @endif

    <div class="prose prose-lg max-w-none">
        {!! $article->body !!}
    </div>

    @if($article->tags && count($article->tags) > 0)
        <div class="mt-8 flex flex-wrap gap-2">
            @foreach($article->tags as $tag)
                <span class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    {{ $tag }}
                </span>
            @endforeach
        </div>
    @endif

    @if($article->source_url)
        <div class="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Source: <a href="{{ $article->source_url }}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">{{ $article->source_name ?? $article->source_url }}</a>
        </div>
    @endif
</article>
@endsection
