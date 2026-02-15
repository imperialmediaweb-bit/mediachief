<?php

namespace App\Providers;

use App\Services\TenantManager;
use Illuminate\Support\ServiceProvider;

class TenantServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantManager::class);

        $this->app->bind('tenant', fn ($app) => $app->make(TenantManager::class));
    }

    public function boot(): void
    {
        //
    }
}
