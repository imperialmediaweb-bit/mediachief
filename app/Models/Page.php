<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'site_id',
        'title',
        'slug',
        'body',
        'template',
        'sort_order',
        'show_in_menu',
        'is_published',
        'seo',
    ];

    protected $casts = [
        'show_in_menu' => 'boolean',
        'is_published' => 'boolean',
        'seo' => 'array',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
