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
    {{-- Popular Posts --}}
    <div class="border border-gray-200 p-4">
        <h3 class="section-header text-sm">Most Popular</h3>
        <div class="space-y-4">
            @foreach($popularArticles as $index => $popular)
                <div class="flex gap-3">
                    @if($popular->image_url)
                        <a href="{{ route('article.show', $popular) }}" class="shrink-0">
                            <img src="{{ $popular->image_url }}" alt="{{ $popular->title }}" class="h-16 w-24 object-cover">
                        </a>
                    @else
                        <div class="flex h-16 w-24 shrink-0 items-center justify-center bg-gray-100">
                            <span class="text-2xl font-black text-gray-400">{{ $index + 1 }}</span>
                        </div>
                    @endif
                    <div class="min-w-0">
                        <h4 class="text-sm font-bold leading-tight text-gray-900">
                            <a href="{{ route('article.show', $popular) }}" class="hover:text-brand-red">{{ Str::limit($popular->title, 55) }}</a>
                        </h4>
                        <span class="mt-1 block text-xs text-gray-500">{{ $popular->published_at?->diffForHumans() }}</span>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    {{-- Categories --}}
    <div class="border border-gray-200 p-4">
        <h3 class="section-header text-sm">Categories</h3>
        <ul class="space-y-0">
            @foreach($sidebarCategories as $cat)
                <li>
                    <a href="{{ route('category.show', $cat) }}" class="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm text-gray-600 transition-colors hover:text-brand-red">
                        <span>{{ $cat->name }}</span>
                        <span class="text-xs text-gray-400">({{ $cat->articles_count }})</span>
                    </a>
                </li>
            @endforeach
        </ul>
    </div>

    {{-- Newsletter --}}
    <div class="border border-gray-200 p-4">
        <h3 class="section-header text-sm">Newsletter</h3>
        <p class="mb-4 text-sm text-gray-600">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" class="mb-3 w-full border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-red">
            <button type="submit" class="w-full bg-brand-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700">Subscribe</button>
        </form>
    </div>
</aside>
