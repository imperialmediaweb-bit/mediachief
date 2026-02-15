<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RssFeed extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'category_id',
        'name',
        'url',
        'source_name',
        'source_logo',
        'fetch_interval',
        'last_fetched_at',
        'last_error',
        'error_count',
        'is_active',
        'auto_publish',
        'ai_rewrite',
        'ai_language',
        'ai_prompt',
        'fetch_images',
        'field_mapping',
        'filters',
    ];

    protected $casts = [
        'last_fetched_at' => 'datetime',
        'is_active' => 'boolean',
        'auto_publish' => 'boolean',
        'ai_rewrite' => 'boolean',
        'fetch_images' => 'boolean',
        'field_mapping' => 'array',
        'filters' => 'array',
    ];

    /**
     * Check if this feed needs AI processing (rewrite or image fetch).
     */
    public function needsProcessing(): bool
    {
        return $this->ai_rewrite || $this->fetch_images;
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function importLogs(): HasMany
    {
        return $this->hasMany(ImportLog::class);
    }

    public function markAsError(string $error): void
    {
        $this->update([
            'last_error' => $error,
            'error_count' => $this->error_count + 1,
        ]);
    }

    public function markAsFetched(): void
    {
        $this->update([
            'last_fetched_at' => now(),
            'last_error' => null,
            'error_count' => 0,
        ]);
    }
}
