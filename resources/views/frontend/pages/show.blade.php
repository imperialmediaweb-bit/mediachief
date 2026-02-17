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
<div class="mc-container" style="padding-top:20px;padding-bottom:20px">
    <div class="mc-row">
        <div class="mc-span8">
            <div class="mc-block">
                <div class="mc-breadcrumb">
                    <a href="{{ route('home') }}">Home</a> &raquo;
                    <span style="color:#111">{{ $page->title }}</span>
                </div>

                <h1 class="mc-entry-title">{{ $page->title }}</h1>

                <div class="mc-post-content">
                    {!! $page->body !!}
                </div>
            </div>
        </div>

        <div class="mc-span4">
            @if(file_exists(storage_path('app/wp-theme/sidebar.html')))
                {!! file_get_contents(storage_path('app/wp-theme/sidebar.html')) !!}
            @else
                @include('frontend.partials.sidebar')
            @endif
        </div>
    </div>
</div>
@endsection
