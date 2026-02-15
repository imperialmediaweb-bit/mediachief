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
        $articles = Article::forSite($this->tenant->id())
            ->published()
            ->with('category')
            ->orderByDesc('published_at')
            ->paginate(20);

        return view('frontend.articles.index', compact('articles'));
    }

    public function show(Article $article)
    {
        abort_unless($article->site_id === $this->tenant->id(), 404);
        abort_unless($article->isPublished(), 404);

        $article->increment('views_count');

        return view('frontend.articles.show', compact('article'));
    }
}
