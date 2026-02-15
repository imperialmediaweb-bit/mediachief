<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use App\Models\ImportLog;
use App\Models\RssFeed;
use App\Models\Site;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Sites', Site::where('is_active', true)->count())
                ->description('Active sites')
                ->descriptionIcon('heroicon-m-globe-alt')
                ->color('primary'),

            Stat::make('Total Articles', Article::count())
                ->description(Article::where('status', 'published')->count().' published')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('success'),

            Stat::make('Active Feeds', RssFeed::where('is_active', true)->count())
                ->description(RssFeed::where('error_count', '>', 0)->count().' with errors')
                ->descriptionIcon('heroicon-m-rss')
                ->color('warning'),

            Stat::make('Imports Today', ImportLog::whereDate('created_at', today())->count())
                ->description(ImportLog::whereDate('created_at', today())->where('status', 'failed')->count().' failed')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('info'),
        ];
    }
}
