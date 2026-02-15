<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\TenantManager;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function __construct(
        protected TenantManager $tenant
    ) {}

    public function index(Request $request)
    {
        $siteId = $this->tenant->id();

        // Featured articles for the hero grid (top 3 most recent)
        $featured = Article::forSite($siteId)
            ->published()
            ->with('category')
            ->orderByDesc('published_at')
            ->limit(3)
            ->get();

        // Main article list (skip the featured ones)
        $articles = Article::forSite($siteId)
            ->published()
            ->with('category')
            ->when($featured->isNotEmpty(), function ($q) use ($featured) {
                $q->whereNotIn('id', $featured->pluck('id'));
            })
            ->orderByDesc('published_at')
            ->paginate(15);

        return view('frontend.articles.index', compact('articles', 'featured'));
    }

    public function show(Article $article)
    {
        abort_unless($article->site_id === $this->tenant->id(), 404);
        abort_unless($article->isPublished(), 404);

        $article->load('category');
        $article->increment('views_count');

        // Related articles from same category
        $related = collect();
        if ($article->category_id) {
            $related = Article::forSite($this->tenant->id())
                ->published()
                ->where('category_id', $article->category_id)
                ->where('id', '!=', $article->id)
                ->with('category')
                ->orderByDesc('published_at')
                ->limit(3)
                ->get();
        }

        return view('frontend.articles.show', compact('article', 'related'));
    }
}
