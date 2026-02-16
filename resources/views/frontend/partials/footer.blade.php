@php
    $footerCategories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->limit(8)
        ->get();

    $latestArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('published_at')
        ->limit(3)
        ->get();

    $popularFooter = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(3)
        ->get();

    $footerPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();
@endphp

{{-- Bottom navigation bar - Newspaper style --}}
<div class="bg-[#222222]">
    <div class="mx-auto max-w-[1100px] px-4">
        <div class="flex h-[40px] items-center gap-0 overflow-x-auto">
            <a href="{{ route('home') }}" class="flex h-full shrink-0 items-center bg-brand-red px-3 text-[11px] font-bold uppercase tracking-wide text-white">Home</a>
            @foreach($footerCategories as $cat)
                <a href="{{ route('category.show', $cat) }}" class="flex h-full shrink-0 items-center px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-white">{{ $cat->name }}</a>
            @endforeach
        </div>
    </div>
</div>

<footer class="bg-[#222222] border-t border-[#333]">
    <div class="mx-auto max-w-[1100px] px-4 py-8">
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {{-- About --}}
            <div>
                <h4 class="td-footer-title">About Us</h4>
                @if($currentSite->logo ?? false)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="mb-3 h-7">
                @else
                    <span class="mb-3 inline-block font-heading text-base font-black uppercase text-white">{{ $currentSite->name }}</span>
                @endif
                <p class="text-[13px] leading-relaxed text-gray-400">
                    {{ $currentSite->description ?? 'Your trusted source for local and national news.' }}
                </p>
                <div class="mt-3 flex items-center gap-1">
                    <a href="#" class="flex h-7 w-7 items-center justify-center bg-[#333] text-gray-400 hover:bg-brand-red hover:text-white"><svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                    <a href="#" class="flex h-7 w-7 items-center justify-center bg-[#333] text-gray-400 hover:bg-brand-red hover:text-white"><svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                </div>
            </div>

            {{-- Latest Articles --}}
            <div>
                <h4 class="td-footer-title">Latest Articles</h4>
                <div class="space-y-3">
                    @foreach($latestArticles as $la)
                        <div class="flex gap-3">
                            @if($la->image_url)
                                <a href="{{ route('article.show', $la) }}" class="shrink-0">
                                    <img src="{{ $la->image_url }}" alt="{{ $la->title }}" class="h-[50px] w-[75px] object-cover">
                                </a>
                            @endif
                            <div class="min-w-0">
                                <h5 class="text-[13px] font-bold leading-tight text-gray-300">
                                    <a href="{{ route('article.show', $la) }}" class="hover:text-brand-red">{{ Str::limit($la->title, 50) }}</a>
                                </h5>
                                <span class="mt-1 block text-[11px] text-gray-500">{{ $la->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            {{-- Most Popular --}}
            <div>
                <h4 class="td-footer-title">Most Popular</h4>
                <div class="space-y-3">
                    @foreach($popularFooter as $pf)
                        <div class="flex gap-3">
                            @if($pf->image_url)
                                <a href="{{ route('article.show', $pf) }}" class="shrink-0">
                                    <img src="{{ $pf->image_url }}" alt="{{ $pf->title }}" class="h-[50px] w-[75px] object-cover">
                                </a>
                            @endif
                            <div class="min-w-0">
                                <h5 class="text-[13px] font-bold leading-tight text-gray-300">
                                    <a href="{{ route('article.show', $pf) }}" class="hover:text-brand-red">{{ Str::limit($pf->title, 50) }}</a>
                                </h5>
                                <span class="mt-1 block text-[11px] text-gray-500">{{ $pf->published_at?->format('M d, Y') }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            {{-- Pages / Categories --}}
            <div>
                <h4 class="td-footer-title">Pages</h4>
                <ul class="space-y-1.5">
                    @foreach($footerPages as $fp)
                        <li>
                            <a href="{{ route('page.show', $fp) }}" class="text-[13px] text-gray-400 hover:text-brand-red">{{ $fp->title }}</a>
                        </li>
                    @endforeach
                </ul>
                <h4 class="td-footer-title mt-5">Categories</h4>
                <div class="flex flex-wrap gap-1">
                    @foreach($footerCategories as $fc)
                        <a href="{{ route('category.show', $fc) }}" class="bg-[#333] px-2 py-1 text-[11px] text-gray-400 hover:bg-brand-red hover:text-white">{{ $fc->name }}</a>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Copyright --}}
    <div class="border-t border-[#333]">
        <div class="mx-auto max-w-[1100px] px-4 py-3">
            <div class="flex flex-col items-center justify-between gap-2 text-[11px] text-gray-500 sm:flex-row">
                <span>&copy; {{ date('Y') }} {{ $currentSite->name }}. All Rights Reserved.</span>
                <span>Part of Media Capital Trust Network</span>
            </div>
        </div>
    </div>
</footer>
