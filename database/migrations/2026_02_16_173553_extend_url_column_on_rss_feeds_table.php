<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            $table->text('source_url')->nullable()->change();
            $table->text('original_guid')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('rss_feeds', function (Blueprint $table) {
            $table->string('url')->change();
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->string('source_url')->nullable()->change();
            $table->string('original_guid')->nullable()->change();
        });
    }
};
