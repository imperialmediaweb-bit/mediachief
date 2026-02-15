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

<aside class="space-y-0">
    {{-- Popular Posts --}}
    <div class="widget-card">
        <h3 class="widget-card-title">Popular Posts</h3>
        <div class="space-y-4">
            @foreach($popularArticles as $index => $popular)
                <div class="article-card flex gap-4">
                    @if($popular->featured_image)
                        <a href="{{ route('article.show', $popular) }}" class="shrink-0">
                            <img src="{{ $popular->featured_image }}" alt="{{ $popular->title }}" class="article-card-img h-16 w-24 object-cover">
                        </a>
                    @else
                        <div class="flex h-16 w-24 shrink-0 items-center justify-center bg-brand-gray-medium">
                            <span class="text-2xl font-black text-brand-text-muted">{{ $index + 1 }}</span>
                        </div>
                    @endif
                    <div class="min-w-0">
                        <h4 class="article-card-title text-sm font-bold leading-tight text-white">
                            <a href="{{ route('article.show', $popular) }}" class="hover:text-brand-red">
                                {{ Str::limit($popular->title, 55) }}
                            </a>
                        </h4>
                        <span class="mt-1 block text-xs text-brand-text-muted">{{ $popular->published_at?->diffForHumans() }}</span>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    {{-- Categories --}}
    <div class="widget-card">
        <h3 class="widget-card-title">Categories</h3>
        <ul class="space-y-0">
            @foreach($sidebarCategories as $cat)
                <li>
                    <a href="{{ route('category.show', $cat) }}" class="flex items-center justify-between border-b border-brand-border py-2.5 text-sm text-gray-400 transition-colors hover:text-brand-red">
                        <span>{{ $cat->name }}</span>
                        <span class="text-xs text-brand-text-muted">({{ $cat->articles_count }})</span>
                    </a>
                </li>
            @endforeach
        </ul>
    </div>

    {{-- Newsletter --}}
    <div class="widget-card">
        <h3 class="widget-card-title">Newsletter</h3>
        <p class="mb-4 text-sm text-brand-text-muted">Get the latest news delivered to your inbox.</p>
        <form action="#" method="POST">
            @csrf
            <input type="email" name="email" placeholder="Your email address" class="mb-3 w-full border border-brand-border bg-brand-gray-medium px-4 py-2.5 text-sm text-white placeholder-brand-text-muted outline-none focus:border-brand-red">
            <button type="submit" class="w-full bg-brand-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700">
                Subscribe
            </button>
        </form>
    </div>
</aside>
