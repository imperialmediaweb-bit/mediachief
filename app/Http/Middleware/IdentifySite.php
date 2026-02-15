<?php

namespace App\Http\Middleware;

use App\Models\Site;
use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifySite
{
    public function __construct(
        protected TenantManager $tenant
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $domain = $request->getHost();

        $site = Site::findByDomain($domain);

        if (! $site) {
            abort(404, 'Site not found.');
        }

        $this->tenant->set($site);
        app()->instance('currentSite', $site);
        view()->share('currentSite', $site);
        config(['app.timezone' => $site->timezone]);

        return $next($request);
    }
}
