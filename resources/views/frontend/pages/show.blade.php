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
<div class="bg-[#f9f9f9] py-6">
    <div class="mx-auto max-w-[1100px] px-4">
        <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div class="bg-white p-6">
                <nav class="mb-4 text-[11px] text-gray-400">
                    <a href="{{ route('home') }}" class="hover:text-brand-red">Home</a>
                    <span class="mx-1">&raquo;</span>
                    <span class="text-[#111]">{{ $page->title }}</span>
                </nav>

                <h1 class="mb-5 font-heading text-[26px] font-bold leading-[1.2] text-[#111] md:text-[32px]">{{ $page->title }}</h1>

                <div class="td-article-content prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-[#111] prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-[#444] prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-[#111] prose-img:w-full">
                    {!! $page->body !!}
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
