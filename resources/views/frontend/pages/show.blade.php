@extends('frontend.layouts.app')

@section('title', $page->title . ' - ' . $currentSite->name)

@section('wp_head')
    @if($page->seo)@foreach($page->seo as $key => $value)<meta name="{{ $key }}" content="{{ $value }}">@endforeach @endif
@endsection

@push('head')
    @if($page->seo)@foreach($page->seo as $key => $value)<meta name="{{ $key }}" content="{{ $value }}">@endforeach @endif
@endpush

@section('content')
<div class="td-container" style="padding-top: 20px; padding-bottom: 20px;">
    <div class="td-pb-row">
        <div class="td-pb-span8">
            <div class="td-crumb-container" style="padding-top: 0;">
                <div class="entry-crumbs">
                    <a href="{{ route('home') }}">Home</a>
                    <span class="td-bread-sep">&raquo;</span>
                    <span style="color: #111;">{{ $page->title }}</span>
                </div>
            </div>

            <h1 class="entry-title" style="font-size: 30px; line-height: 38px;">{{ $page->title }}</h1>

            <div class="td-page-content tagdiv-type">{!! $page->body !!}</div>
        </div>

        <div class="td-pb-span4">
            @if(file_exists(storage_path('app/wp-theme/sidebar.html')))
                {!! file_get_contents(storage_path('app/wp-theme/sidebar.html')) !!}
            @else
                @include('frontend.partials.sidebar')
            @endif
        </div>
    </div>
</div>
@endsection
