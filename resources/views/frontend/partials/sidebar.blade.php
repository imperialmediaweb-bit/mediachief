@php
    $popularArticles = \App\Models\Article::where('site_id', $currentSite->id)
        ->where('status', 'published')
        ->where('published_at', '<=', now())
        ->orderByDesc('views_count')
        ->limit(5)
        ->get();

    $sidebarCategories = \App\Models\Category::where('site_id', $currentSite->id)
        ->where('is_active', true)
        ->whereNull('parent_id')
        ->withCount(['articles' => fn($q) => $q->where('status', 'published')])
        ->orderBy('sort_order')
        ->get();
@endphp

<aside class="space-y-6">
    {{-- Popular Posts - Newspaper style with numbering --}}
    <div class="bg-white">
        <h3 class="td-block-title"><span>Most Popular</span></h3>
        <div class="divide-y divide-gray-100">
            @foreach($popularArticles as $index => $popular)
                <div class="flex gap-3 py-3">
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center bg-[#222222] text-[11px] font-bold text-white">{{ $index + 1 }}</span>
                    <div class="min-w-0 flex-1">
                        <h4 class="text-[13px] font-bold leading-[1.3] text-[#111]">
                            <a href="{{ route('article.show', $popular) }}" class="hover:text-brand-red">{{ Str::limit($popular->title, 55) }}</a>
                        </h4>
                        <span class="mt-1 block text-[11px] text-gray-400">{{ $popular->published_at?->diffForHumans() }}</span>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    {{-- Stay Connected - Newspaper style social counters --}}
    <div class="bg-white">
        <h3 class="td-block-title"><span>Stay Connected</span></h3>
        <div class="space-y-2 pt-2">
            <a href="#" class="flex items-center justify-between bg-[#516eab] px-3 py-2 text-white transition-opacity hover:opacity-90">
                <div class="flex items-center gap-2">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span class="text-[12px] font-bold uppercase">Facebook</span>
                </div>
                <span class="text-[11px]">Like</span>
            </a>
            <a href="#" class="flex items-center justify-between bg-[#29c5f6] px-3 py-2 text-white transition-opacity hover:opacity-90">
                <div class="flex items-center gap-2">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span class="text-[12px] font-bold uppercase">Twitter</span>
                </div>
                <span class="text-[11px]">Follow</span>
            </a>
        </div>
    </div>

    {{-- Categories --}}
    <div class="bg-white">
        <h3 class="td-block-title"><span>Categories</span></h3>
        <ul>
            @foreach($sidebarCategories as $cat)
                <li>
                    <a href="{{ route('category.show', $cat) }}" class="flex items-center justify-between border-b border-gray-100 py-2 text-[13px] text-gray-600 transition-colors hover:text-brand-red">
                        <span>{{ $cat->name }}</span>
                        <span class="text-[11px] text-gray-400">({{ $cat->articles_count }})</span>
                    </a>
                </li>
            @endforeach
        </ul>
    </div>

    {{-- Newsletter --}}
    <div class="bg-white">
        <h3 class="td-block-title"><span>Newsletter</span></h3>
        <p class="mb-3 text-[13px] leading-relaxed text-gray-500">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" class="mb-2 w-full border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-brand-red">
            <button type="submit" class="w-full bg-brand-red px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700">Subscribe</button>
        </form>
    </div>
</aside>
