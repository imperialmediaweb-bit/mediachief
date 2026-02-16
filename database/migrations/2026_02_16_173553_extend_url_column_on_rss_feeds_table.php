<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rss_feeds', function (Blueprint $table) {
            $table->text('url')->change();
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['original_guid']);
            $table->text('source_url')->nullable()->change();
            $table->text('original_guid')->nullable()->change();
        });

        DB::statement('CREATE INDEX articles_original_guid_index ON articles (original_guid(191))');
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('articles_original_guid_index');
            $table->string('source_url')->nullable()->change();
            $table->string('original_guid')->nullable()->change();
            $table->index('original_guid');
        });

        Schema::table('rss_feeds', function (Blueprint $table) {
            $table->string('url')->change();
        });
    }
};
