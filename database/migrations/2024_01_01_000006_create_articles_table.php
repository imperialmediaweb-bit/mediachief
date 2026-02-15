<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rss_feed_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->string('featured_image')->nullable();
            $table->string('featured_image_alt')->nullable();
            $table->string('source_url')->nullable();
            $table->string('source_name')->nullable();
            $table->string('author')->nullable();
            $table->string('status', 20)->default('draft'); // draft, published, scheduled, archived
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->json('seo')->nullable();
            $table->json('tags')->nullable();
            $table->string('original_guid')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['site_id', 'slug']);
            $table->index(['site_id', 'status', 'published_at']);
            $table->index(['site_id', 'category_id']);
            $table->index('original_guid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
