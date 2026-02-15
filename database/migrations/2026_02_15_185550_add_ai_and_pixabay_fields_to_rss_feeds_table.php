<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rss_feeds', function (Blueprint $table) {
            // AI Rewrite settings
            $table->boolean('ai_rewrite')->default(false)->after('auto_publish');
            $table->string('ai_language', 5)->nullable()->after('ai_rewrite');
            $table->text('ai_prompt')->nullable()->after('ai_language');

            // Pixabay image settings
            $table->boolean('fetch_images')->default(false)->after('ai_prompt');
        });
    }

    public function down(): void
    {
        Schema::table('rss_feeds', function (Blueprint $table) {
            $table->dropColumn(['ai_rewrite', 'ai_language', 'ai_prompt', 'fetch_images']);
        });
    }
};
