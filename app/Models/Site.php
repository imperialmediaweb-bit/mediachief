<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Site extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'logo',
        'favicon',
        'description',
        'language',
        'timezone',
        'settings',
        'seo_settings',
        'analytics',
        'theme',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'seo_settings' => 'array',
        'analytics' => 'array',
        'is_active' => 'boolean',
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function rssFeeds(): HasMany
    {
        return $this->hasMany(RssFeed::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    public function importLogs(): HasMany
    {
        return $this->hasMany(ImportLog::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public static function findByDomain(string $domain): ?self
    {
        return static::where('domain', $domain)->where('is_active', true)->first();
    }
}
