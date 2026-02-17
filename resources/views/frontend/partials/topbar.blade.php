@php
    $topMenuPages = \App\Models\Page::where('site_id', $currentSite->id)
        ->where('show_in_menu', true)
        ->where('is_published', true)
        ->orderBy('sort_order')
        ->get();
@endphp

<div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-[1200px] px-4">
        <div class="flex h-8 items-center justify-between text-[11px]" style="font-family: 'Work Sans', sans-serif;">
            <span class="text-gray-500">{{ now()->translatedFormat('l, F d, Y') }}</span>
            <div class="flex items-center gap-1">
                @foreach($topMenuPages as $page)
                    <a href="{{ route('page.show', $page) }}" class="px-2 py-1 font-semibold uppercase text-gray-600 hover:text-[var(--brand-primary,#E04040)]">{{ $page->title }}</a>
                    @if(!$loop->last)<span class="text-gray-300">|</span>@endif
                @endforeach
                @if($topMenuPages->isNotEmpty())
                    <span class="mx-1 text-gray-300">|</span>
                @endif
                <span class="text-gray-500">Our Socials</span>
                <a href="#" class="ml-1 text-[var(--brand-primary,#E04040)]" aria-label="Social">&#10084;</a>
            </div>
        </div>
    </div>
</div>
