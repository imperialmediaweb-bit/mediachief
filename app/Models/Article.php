<?php

namespace App\Models;

use App\Services\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'site_id',
        'category_id',
        'rss_feed_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'featured_image',
        'featured_image_alt',
        'source_url',
        'source_name',
        'author',
        'status',
        'published_at',
        'scheduled_at',
        'views_count',
        'seo',
        'tags',
        'original_guid',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'seo' => 'array',
        'tags' => 'array',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function rssFeed(): BelongsTo
    {
        return $this->belongsTo(RssFeed::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopeForSite(Builder $query, int $siteId): Builder
    {
        return $query->where('site_id', $siteId);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at?->lte(now());
    }

    /**
     * Scope route model binding to the current site to prevent cross-site slug collisions.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $field = $field ?: $this->getRouteKeyName();
        $tenant = app(TenantManager::class);

        $query = $this->where($field, $value);

        if ($tenant->check()) {
            $query->where('site_id', $tenant->id());
        }

        return $query->first();
    }

    /**
     * Get the full URL for the featured image.
     * Handles both local storage paths and legacy external URLs.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(function () {
            if (empty($this->featured_image)) {
                return null;
            }

            // Already a full URL (legacy external)
            if (str_starts_with($this->featured_image, 'http://') || str_starts_with($this->featured_image, 'https://')) {
                return $this->featured_image;
            }

            // Local storage path
            return Storage::disk('public')->url($this->featured_image);
        });
    }
}
