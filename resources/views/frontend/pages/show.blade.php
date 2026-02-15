@extends('frontend.layouts.app')

@section('title', $page->title . ' - ' . $currentSite->name)

@push('head')
    @if($page->seo)
        @foreach($page->seo as $key => $value)
            <meta name="{{ $key }}" content="{{ $value }}">
        @endforeach
    @endif
@endpush

@section('content')
<div class="bg-brand-dark">
    <div class="mx-auto max-w-7xl px-4 py-8">
        <div class="grid gap-8 lg:grid-cols-3">
            <div class="lg:col-span-2">
                <nav class="mb-4 text-xs text-brand-text-muted">
                    <a href="{{ route('home') }}" class="hover:text-white">Home</a>
                    <span class="mx-1">/</span>
                    <span class="text-white">{{ $page->title }}</span>
                </nav>

                <h1 class="mb-6 font-heading text-2xl font-black text-white md:text-3xl lg:text-4xl">{{ $page->title }}</h1>

                <div class="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-white">
                    {!! $page->body !!}
                </div>
            </div>

            <div>
                @include('frontend.partials.sidebar')
            </div>
        </div>
    </div>
</div>
@endsection
