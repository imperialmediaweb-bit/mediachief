<header class="border-b border-gray-200 bg-white shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
            <div class="flex items-center gap-4">
                @if($currentSite->logo ?? false)
                    <img src="{{ asset('storage/' . $currentSite->logo) }}" alt="{{ $currentSite->name }}" class="h-8">
                @endif
                <a href="{{ route('home') }}" class="text-xl font-bold text-gray-900">
                    {{ $currentSite->name }}
                </a>
            </div>

            <nav class="hidden md:flex md:items-center md:gap-6">
                @php
                    $menuPages = \App\Models\Page::where('site_id', $currentSite->id)
                        ->where('show_in_menu', true)
                        ->where('is_published', true)
                        ->orderBy('sort_order')
                        ->get();
                    $categories = \App\Models\Category::where('site_id', $currentSite->id)
                        ->where('is_active', true)
                        ->whereNull('parent_id')
                        ->orderBy('sort_order')
                        ->limit(8)
                        ->get();
                @endphp

                @foreach($categories as $cat)
                    <a href="{{ route('category.show', $cat) }}" class="text-sm font-medium text-gray-600 hover:text-gray-900">
                        {{ $cat->name }}
                    </a>
                @endforeach

                @foreach($menuPages as $page)
                    <a href="{{ route('page.show', $page) }}" class="text-sm font-medium text-gray-600 hover:text-gray-900">
                        {{ $page->title }}
                    </a>
                @endforeach
            </nav>
        </div>
    </div>
</header>
