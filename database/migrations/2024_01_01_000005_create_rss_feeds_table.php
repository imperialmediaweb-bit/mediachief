<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rss_feeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('url');
            $table->string('source_name')->nullable();
            $table->string('source_logo')->nullable();
            $table->integer('fetch_interval')->default(30); // minutes
            $table->timestamp('last_fetched_at')->nullable();
            $table->string('last_error')->nullable();
            $table->integer('error_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_publish')->default(false);
            $table->json('field_mapping')->nullable();
            $table->json('filters')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'is_active']);
            $table->index('last_fetched_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rss_feeds');
    }
};
