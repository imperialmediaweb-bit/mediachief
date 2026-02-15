<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Services\TenantManager;

class PageController extends Controller
{
    public function __construct(
        protected TenantManager $tenant
    ) {}

    public function show(Page $page)
    {
        abort_unless($page->site_id === $this->tenant->id(), 404);
        abort_unless($page->is_published, 404);

        return view('frontend.pages.show', compact('page'));
    }
}
