@php
    $categories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(10)
        ->get();
@endphp

{{-- Logo Area - Newspaper Style 1 (centered) --}}
<div class="td-header-sp-logo" style="background: #fff;">
    <div class="td-container">
        <div class="td-logo-text-wrap" style="text-align: center; min-height: 100px; line-height: 100px;">
            <a href="{{ route('home') }}" style="display: inline-block; vertical-align: middle; line-height: 100px;">
                @if($currentSite->logo ?? false)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" style="max-height: 50px; vertical-align: middle;">
                @else
                    <div class="td-logo-text-container" style="line-height: 1;">
                        <span class="td-logo-text" style="font-size: 40px;">{{ $currentSite->name }}</span>
                    </div>
                @endif
            </a>
        </div>
    </div>
</div>

{{-- Main Menu Bar - Newspaper dark navigation --}}
<div class="td-header-menu-wrap-full" style="background-color: #222; position: relative;">
    <div class="td-container">
        <div class="td-header-main-menu" style="padding-right: 48px;">
            <div id="td-header-menu" style="display: inline-block; vertical-align: top;">
                <ul class="sf-menu">
                    <li class="menu-item" style="float: left;">
                        <a href="{{ route('home') }}" style="display: flex; align-items: center; height: 48px; padding: 0 14px; background: var(--td_theme_color, #4db2ec); color: #fff;">
                            <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                        </a>
                    </li>
                    @foreach($categories as $cat)
                    <li class="menu-item" style="float: left;">
                        <a href="{{ route('category.show', $cat) }}" style="display: block; line-height: 48px; padding: 0 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #f5f5f5; text-decoration: none; font-family: 'Open Sans', sans-serif;">
                            {{ $cat->name }}
                        </a>
                    </li>
                    @endforeach
                </ul>
            </div>

            {{-- Search button --}}
            <div class="header-search-wrap" style="position: absolute; top: 0; right: 0;">
                <span id="td-header-search-button" style="cursor: pointer; display: inline-block; width: 48px; line-height: 48px; text-align: center; color: #f5f5f5;" onclick="document.getElementById('search-overlay').classList.toggle('td-search-visible')">
                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
            </div>
        </div>
    </div>
</div>

{{-- Mobile menu toggle --}}
<div id="td-top-mobile-toggle" style="display: none;">
    <a href="javascript:void(0)" onclick="document.getElementById('td-mobile-menu').classList.toggle('td-mob-open')">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </a>
</div>

{{-- Mobile menu --}}
<div id="td-mobile-menu" style="display: none; background: #222;">
    <div style="padding: 10px 20px;">
        <a href="{{ route('home') }}" style="display: block; padding: 10px 0; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; text-transform: uppercase; border-bottom: 1px solid #333;">Home</a>
        @foreach($categories as $cat)
            <a href="{{ route('category.show', $cat) }}" style="display: block; padding: 10px 0; color: #ccc; font-weight: 600; font-size: 13px; text-decoration: none; text-transform: uppercase; border-bottom: 1px solid #333;">{{ $cat->name }}</a>
        @endforeach
    </div>
</div>

{{-- Search overlay --}}
<div id="search-overlay" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92);">
    <div style="max-width: 600px; margin: 120px auto 0; padding: 0 20px;">
        <form action="{{ route('home') }}" method="GET">
            <div style="position: relative;">
                <input type="text" name="q" placeholder="Search..." style="width: 100%; background: transparent; border: none; border-bottom: 2px solid #fff; padding: 10px 40px 10px 0; font-size: 24px; color: #fff; outline: none; font-family: 'Roboto', sans-serif;" autofocus>
                <span style="position: absolute; right: 0; top: 10px; cursor: pointer; color: #999; font-size: 28px;" onclick="document.getElementById('search-overlay').style.display='none'">&times;</span>
            </div>
        </form>
    </div>
</div>

<style>
    .td-search-visible { display: block !important; }
    @media (max-width: 767px) {
        .sf-menu { display: none !important; }
        #td-top-mobile-toggle { display: inline-block !important; position: absolute; left: 2px; top: 0; z-index: 10; }
        #td-top-mobile-toggle a { color: #fff; display: block; padding: 14px 16px; }
        .td-mob-open { display: block !important; }
        .td-header-menu-wrap-full .td-container { min-height: 54px; }
    }
</style>
