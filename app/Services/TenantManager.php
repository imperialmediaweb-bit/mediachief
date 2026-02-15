<?php

namespace App\Services;

use App\Models\Site;

class TenantManager
{
    protected ?Site $currentSite = null;

    public function set(Site $site): void
    {
        $this->currentSite = $site;
    }

    public function get(): ?Site
    {
        return $this->currentSite;
    }

    public function id(): ?int
    {
        return $this->currentSite?->id;
    }

    public function check(): bool
    {
        return $this->currentSite !== null;
    }
}
