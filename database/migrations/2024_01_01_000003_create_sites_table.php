<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->unique();
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->text('description')->nullable();
            $table->string('language', 10)->default('ro');
            $table->string('timezone', 50)->default('Europe/Bucharest');
            $table->json('settings')->nullable();
            $table->json('seo_settings')->nullable();
            $table->json('analytics')->nullable();
            $table->string('theme', 50)->default('default');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('domain');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
