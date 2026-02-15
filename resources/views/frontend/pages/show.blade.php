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
<div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 md:text-4xl">{{ $page->title }}</h1>

    <div class="prose prose-lg max-w-none">
        {!! $page->body !!}
    </div>
</div>
@endsection
