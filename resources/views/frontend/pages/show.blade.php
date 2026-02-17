@extends('frontend.layouts.app')

@section('title', $page->title . ' - ' . $currentSite->name)

@section('wp_head')
    @if($page->seo)
        @foreach($page->seo as $key => $value)
            <meta name="{{ $key }}" content="{{ $value }}">
        @endforeach
    @endif
@endsection

@push('head')
    @if($page->seo)
        @foreach($page->seo as $key => $value)
            <meta name="{{ $key }}" content="{{ $value }}">
        @endforeach
    @endif
@endpush

@section('content')
<div class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid gap-8 lg:grid-cols-3">
            <div class="lg:col-span-2">
                {{-- Breadcrumb --}}
                <div class="mb-3 text-xs text-gray-400">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a> &raquo;
                    <span class="text-gray-900">{{ $page->title }}</span>
                </div>

                <h1 class="mb-4 font-heading text-2xl font-bold text-gray-900 md:text-3xl">{{ $page->title }}</h1>

                <div class="mc-post-content">
                    {!! $page->body !!}
                </div>
            </div>

            <aside>
                @include('frontend.partials.sidebar')
            </aside>
        </div>
    </div>
</div>
@endsection
