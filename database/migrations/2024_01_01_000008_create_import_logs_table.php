<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rss_feed_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 30); // rss, wordpress, manual
            $table->string('status', 20)->default('pending'); // pending, running, completed, failed
            $table->unsignedInteger('items_found')->default(0);
            $table->unsignedInteger('items_imported')->default(0);
            $table->unsignedInteger('items_skipped')->default(0);
            $table->unsignedInteger('items_failed')->default(0);
            $table->json('errors')->nullable();
            $table->text('summary')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'created_at']);
            $table->index(['rss_feed_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_logs');
    }
};
