<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Services\TenantManager;

class CategoryController extends Controller
{
    public function __construct(
        protected TenantManager $tenant
    ) {}

    public function show(Category $category)
    {
        abort_unless($category->site_id === $this->tenant->id(), 404);

        $articles = Article::forSite($this->tenant->id())
            ->published()
            ->where('category_id', $category->id)
            ->orderByDesc('published_at')
            ->paginate(20);

        return view('frontend.categories.show', compact('category', 'articles'));
    }
}
