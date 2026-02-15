<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
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

        $featuredIds = $featured->pluck('id')->toArray();

        // Popular articles (4 items for the Popular row)
        $popular = Article::forSite($siteId)
            ->published()
            ->with('category')
            ->whereNotIn('id', $featuredIds)
            ->orderByDesc('views_count')
            ->limit(4)
            ->get();

        $usedIds = array_merge($featuredIds, $popular->pluck('id')->toArray());

        // Load all active categories with recent articles for category sections
        $categories = Category::where('site_id', $siteId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->limit(10)
            ->get();

        // For each category, load recent articles
        $categorySections = [];
        foreach ($categories as $category) {
            $catArticles = Article::forSite($siteId)
                ->published()
                ->where('category_id', $category->id)
                ->orderByDesc('published_at')
                ->limit(5)
                ->get();

            if ($catArticles->isNotEmpty()) {
                $categorySections[] = [
                    'category' => $category,
                    'articles' => $catArticles,
                ];
            }
        }

        // Latest posts for bottom section
        $latest = Article::forSite($siteId)
            ->published()
            ->with('category')
            ->whereNotIn('id', $usedIds)
            ->orderByDesc('published_at')
            ->limit(10)
            ->get();

        return view('frontend.articles.index', compact(
            'featured',
            'popular',
            'categorySections',
            'latest',
        ));
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
