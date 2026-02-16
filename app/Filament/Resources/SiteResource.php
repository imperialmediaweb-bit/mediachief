<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteResource\Pages;
use App\Jobs\ImportWordPressJob;
use App\Jobs\ImportWordPressSiteSettingsJob;
use App\Models\Category;
use App\Models\RssFeed;
use App\Models\Site;
use App\Services\WordPressImportService;
use App\Services\WordPressSiteSettingsService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class SiteResource extends Resource
{
    protected static ?string $model = Site::class;

    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationGroup = 'Sites';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('General')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, Forms\Set $set) {
                                $set('slug', Str::slug($state));
                            }),
                        Forms\Components\TextInput::make('slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('domain')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('example.com'),
                        Forms\Components\TextInput::make('wordpress_url')
                            ->label('WordPress Source URL')
                            ->url()
                            ->maxLength(500)
                            ->placeholder('https://old-wordpress-site.com')
                            ->helperText('Original WP site for importing articles and RSS feeds'),
                        Forms\Components\Textarea::make('description')
                            ->maxLength(1000)
                            ->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('Branding')
                    ->schema([
                        Forms\Components\FileUpload::make('logo')
                            ->image()
                            ->directory('sites/logos'),
                        Forms\Components\FileUpload::make('favicon')
                            ->image()
                            ->directory('sites/favicons'),
                    ])->columns(2),

                Forms\Components\Section::make('Settings')
                    ->schema([
                        Forms\Components\Select::make('language')
                            ->options([
                                'ro' => 'Romana',
                                'en' => 'English',
                                'de' => 'Deutsch',
                                'fr' => 'Francais',
                            ])
                            ->default('ro'),
                        Forms\Components\Select::make('timezone')
                            ->options(
                                collect(timezone_identifiers_list())
                                    ->mapWithKeys(fn ($tz) => [$tz => $tz])
                                    ->toArray()
                            )
                            ->searchable()
                            ->default('Europe/Bucharest'),
                        Forms\Components\Select::make('theme')
                            ->options([
                                'default' => 'Default',
                                'news' => 'News',
                                'magazine' => 'Magazine',
                                'blog' => 'Blog',
                            ])
                            ->default('default'),
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),
                    ])->columns(2),

                Forms\Components\Section::make('Theme Customization')
                    ->description('Customize colors, fonts, and CSS for this site')
                    ->schema([
                        Forms\Components\ColorPicker::make('settings.theme.primary_color')
                            ->label('Primary Color (accent)')
                            ->helperText('Main brand color (buttons, links, badges)'),
                        Forms\Components\ColorPicker::make('settings.theme.secondary_color')
                            ->label('Secondary Color'),
                        Forms\Components\ColorPicker::make('settings.theme.nav_bg')
                            ->label('Navigation Background'),
                        Forms\Components\ColorPicker::make('settings.theme.nav_text')
                            ->label('Navigation Text Color'),
                        Forms\Components\TextInput::make('settings.theme.heading_font')
                            ->label('Heading Font')
                            ->placeholder('Roboto')
                            ->helperText('Google Font name for headings'),
                        Forms\Components\TextInput::make('settings.theme.body_font')
                            ->label('Body Font')
                            ->placeholder('Open Sans')
                            ->helperText('Google Font name for body text'),
                        Forms\Components\Textarea::make('settings.theme.custom_css')
                            ->label('Custom CSS')
                            ->rows(5)
                            ->placeholder('/* Custom CSS overrides */')
                            ->columnSpanFull(),
                    ])->columns(2)->collapsed(),

                Forms\Components\Section::make('SEO')
                    ->schema([
                        Forms\Components\KeyValue::make('seo_settings')
                            ->keyLabel('Meta Key')
                            ->valueLabel('Meta Value')
                            ->addActionLabel('Add Meta Tag'),
                    ])->collapsed(),

                Forms\Components\Section::make('Analytics')
                    ->schema([
                        Forms\Components\KeyValue::make('analytics')
                            ->keyLabel('Service')
                            ->valueLabel('Tracking ID')
                            ->addActionLabel('Add Tracking'),
                    ])->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('domain')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('wordpress_url')
                    ->label('WP Source')
                    ->limit(30)
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('language')
                    ->badge(),
                Tables\Columns\TextColumn::make('theme')
                    ->badge()
                    ->color('gray'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
                Tables\Columns\TextColumn::make('articles_count')
                    ->counts('articles')
                    ->label('Articles')
                    ->sortable(),
                Tables\Columns\TextColumn::make('rss_feeds_count')
                    ->counts('rssFeeds')
                    ->label('Feeds')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active'),
                Tables\Filters\SelectFilter::make('language')
                    ->options([
                        'ro' => 'Romana',
                        'en' => 'English',
                    ]),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\Action::make('wp_full_migration')
                        ->label('Full WordPress Migration')
                        ->icon('heroicon-o-rocket-launch')
                        ->color('primary')
                        ->visible(fn (Site $record) => ! empty($record->wordpress_url))
                        ->requiresConfirmation()
                        ->modalHeading('Complete WordPress Migration')
                        ->modalDescription(fn (Site $record) => "Import EVERYTHING from {$record->wordpress_url}: settings, favicon, analytics, categories, articles, and RSS feeds.")
                        ->modalIcon('heroicon-o-rocket-launch')
                        ->form([
                            Forms\Components\Section::make('What to import')
                                ->schema([
                                    Forms\Components\Toggle::make('import_settings')
                                        ->label('Site Settings (favicon, Google Analytics, Search Console)')
                                        ->default(true)
                                        ->helperText('Downloads favicon, extracts GA tracking ID and Search Console verification'),
                                    Forms\Components\Toggle::make('import_articles')
                                        ->label('All Articles (via WordPress REST API)')
                                        ->default(true)
                                        ->helperText('Imports all published articles with images, categories, tags'),
                                    Forms\Components\Toggle::make('import_feeds')
                                        ->label('RSS Feed Campaigns (auto-discover from WP categories)')
                                        ->default(true)
                                        ->helperText('Creates RSS feed campaigns for each WordPress category'),
                                ]),
                            Forms\Components\Section::make('Processing options')
                                ->schema([
                                    Forms\Components\Toggle::make('ai_rewrite')
                                        ->label('AI Rewrite articles')
                                        ->default(false),
                                    Forms\Components\Toggle::make('fetch_images')
                                        ->label('Pixabay images for articles without images')
                                        ->default(false),
                                    Forms\Components\Toggle::make('auto_publish')
                                        ->label('Auto-publish imported articles')
                                        ->default(true),
                                ]),
                        ])
                        ->action(function (Site $record, array $data) {
                            $wpUrl = $record->wordpress_url;
                            $queued = [];

                            // 1. Import site settings (favicon, GA, Search Console)
                            if ($data['import_settings'] ?? true) {
                                ImportWordPressSiteSettingsJob::dispatch(
                                    site: $record,
                                    wpUrl: $wpUrl,
                                );
                                $queued[] = 'settings (favicon, analytics, SEO)';
                            }

                            // 2. Import RSS feed campaigns
                            if ($data['import_feeds'] ?? true) {
                                $wpService = app(WordPressImportService::class);
                                $feeds = $wpService->discoverFeeds($wpUrl);
                                $created = 0;

                                foreach ($feeds as $feed) {
                                    $exists = RssFeed::where('site_id', $record->id)
                                        ->where('url', $feed['url'])
                                        ->exists();

                                    if ($exists) {
                                        continue;
                                    }

                                    $categoryId = null;
                                    if (! empty($feed['wp_category_slug'])) {
                                        $cat = Category::firstOrCreate(
                                            ['site_id' => $record->id, 'slug' => $feed['wp_category_slug']],
                                            ['name' => $feed['wp_category_name'], 'is_active' => true, 'sort_order' => 0]
                                        );
                                        $categoryId = $cat->id;
                                    }

                                    RssFeed::create([
                                        'site_id' => $record->id,
                                        'category_id' => $categoryId,
                                        'name' => $feed['title'],
                                        'url' => $feed['url'],
                                        'source_name' => parse_url($wpUrl, PHP_URL_HOST),
                                        'fetch_interval' => 30,
                                        'is_active' => true,
                                        'auto_publish' => $data['auto_publish'] ?? true,
                                        'ai_rewrite' => $data['ai_rewrite'] ?? false,
                                        'ai_language' => $record->language ?? 'en',
                                        'fetch_images' => $data['fetch_images'] ?? false,
                                    ]);
                                    $created++;
                                }

                                $queued[] = "{$created} RSS feeds";
                            }

                            // 3. Import all articles
                            if ($data['import_articles'] ?? true) {
                                ImportWordPressJob::dispatch(
                                    site: $record,
                                    wpUrl: $wpUrl,
                                    page: 1,
                                    aiProcess: $data['ai_rewrite'] ?? false,
                                );
                                $queued[] = 'all articles';
                            }

                            Notification::make()
                                ->title('Full WordPress Migration Started!')
                                ->body('Importing: ' . implode(', ', $queued))
                                ->success()
                                ->duration(10000)
                                ->send();
                        }),

                    Tables\Actions\Action::make('wp_import_settings')
                        ->label('Import WP Settings')
                        ->icon('heroicon-o-cog-6-tooth')
                        ->color('gray')
                        ->visible(fn (Site $record) => ! empty($record->wordpress_url))
                        ->requiresConfirmation()
                        ->modalHeading('Import WordPress Site Settings')
                        ->modalDescription(fn (Site $record) => "Extract favicon, Google Analytics, Search Console and SEO settings from {$record->wordpress_url}")
                        ->action(function (Site $record) {
                            ImportWordPressSiteSettingsJob::dispatch(
                                site: $record,
                                wpUrl: $record->wordpress_url,
                            );

                            Notification::make()
                                ->title('Settings import started')
                                ->body("Extracting favicon, analytics & SEO from {$record->wordpress_url}")
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\Action::make('wp_import_articles')
                        ->label('Import WP Articles')
                        ->icon('heroicon-o-arrow-down-tray')
                        ->color('success')
                        ->visible(fn (Site $record) => ! empty($record->wordpress_url))
                        ->requiresConfirmation()
                        ->modalHeading('Import WordPress Articles')
                        ->modalDescription(fn (Site $record) => "Import all articles from {$record->wordpress_url} into {$record->name}?")
                        ->form([
                            Forms\Components\Toggle::make('ai_rewrite')
                                ->label('AI Rewrite articles')
                                ->default(false)
                                ->helperText('Rewrite all imported articles with AI'),
                        ])
                        ->action(function (Site $record, array $data) {
                            ImportWordPressJob::dispatch(
                                site: $record,
                                wpUrl: $record->wordpress_url,
                                page: 1,
                                aiProcess: $data['ai_rewrite'] ?? false,
                            );

                            Notification::make()
                                ->title('WordPress import started')
                                ->body("Importing articles from {$record->wordpress_url}")
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\Action::make('wp_import_feeds')
                        ->label('Import WP Feeds')
                        ->icon('heroicon-o-rss')
                        ->color('warning')
                        ->visible(fn (Site $record) => ! empty($record->wordpress_url))
                        ->requiresConfirmation()
                        ->modalHeading('Auto-Create RSS Feed Campaigns')
                        ->modalDescription(fn (Site $record) => "Discover and create RSS feed campaigns from {$record->wordpress_url}?")
                        ->form([
                            Forms\Components\Toggle::make('ai_rewrite')
                                ->label('Enable AI Rewrite on feeds')
                                ->default(false),
                            Forms\Components\Toggle::make('fetch_images')
                                ->label('Enable Pixabay images')
                                ->default(false),
                            Forms\Components\Toggle::make('auto_publish')
                                ->label('Auto-publish new articles')
                                ->default(true),
                        ])
                        ->action(function (Site $record, array $data) {
                            $wpService = app(WordPressImportService::class);
                            $feeds = $wpService->discoverFeeds($record->wordpress_url);

                            if (empty($feeds)) {
                                Notification::make()
                                    ->title('No feeds found')
                                    ->body("Could not discover RSS feeds from {$record->wordpress_url}")
                                    ->warning()
                                    ->send();

                                return;
                            }

                            $created = 0;

                            foreach ($feeds as $feed) {
                                $exists = \App\Models\RssFeed::where('site_id', $record->id)
                                    ->where('url', $feed['url'])
                                    ->exists();

                                if ($exists) {
                                    continue;
                                }

                                $categoryId = null;
                                if (! empty($feed['wp_category_slug'])) {
                                    $cat = \App\Models\Category::firstOrCreate(
                                        ['site_id' => $record->id, 'slug' => $feed['wp_category_slug']],
                                        ['name' => $feed['wp_category_name'], 'is_active' => true, 'sort_order' => 0]
                                    );
                                    $categoryId = $cat->id;
                                }

                                \App\Models\RssFeed::create([
                                    'site_id' => $record->id,
                                    'category_id' => $categoryId,
                                    'name' => $feed['title'],
                                    'url' => $feed['url'],
                                    'source_name' => parse_url($record->wordpress_url, PHP_URL_HOST),
                                    'fetch_interval' => 30,
                                    'is_active' => true,
                                    'auto_publish' => $data['auto_publish'] ?? true,
                                    'ai_rewrite' => $data['ai_rewrite'] ?? false,
                                    'ai_language' => $record->language ?? 'ro',
                                    'fetch_images' => $data['fetch_images'] ?? false,
                                ]);

                                $created++;
                            }

                            Notification::make()
                                ->title("Created {$created} RSS feed campaigns")
                                ->body("From {$record->wordpress_url} (" . count($feeds) . " feeds discovered)")
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\Action::make('import_campaigns_json')
                        ->label('Import Campaigns (JSON)')
                        ->icon('heroicon-o-document-arrow-up')
                        ->color('info')
                        ->modalHeading('Import RSS Campaigns from JSON')
                        ->modalDescription('Upload the JSON file exported by mediachief-export.php from your WordPress site.')
                        ->form([
                            Forms\Components\FileUpload::make('json_file')
                                ->label('Campaign Export JSON')
                                ->required()
                                ->acceptedFileTypes(['application/json'])
                                ->directory('imports/campaigns')
                                ->helperText('Upload the JSON file from mediachief-export.php'),
                            Forms\Components\Toggle::make('ai_rewrite')
                                ->label('Enable AI Rewrite on campaigns')
                                ->default(false),
                            Forms\Components\Toggle::make('fetch_images')
                                ->label('Enable Pixabay images')
                                ->default(false),
                            Forms\Components\Toggle::make('auto_publish')
                                ->label('Auto-publish articles')
                                ->default(true),
                        ])
                        ->action(function (Site $record, array $data) {
                            $filePath = storage_path('app/public/' . $data['json_file']);

                            if (! file_exists($filePath)) {
                                Notification::make()
                                    ->title('File not found')
                                    ->danger()
                                    ->send();

                                return;
                            }

                            $json = file_get_contents($filePath);
                            $export = json_decode($json, true);

                            if (! $export || ! isset($export['campaigns'])) {
                                Notification::make()
                                    ->title('Invalid JSON format')
                                    ->body('Expected output from mediachief-export.php')
                                    ->danger()
                                    ->send();

                                return;
                            }

                            // Import categories
                            $categoryMap = [];
                            foreach ($export['categories'] ?? [] as $cat) {
                                $slug = Str::slug($cat['slug'] ?: $cat['name']);
                                $localCat = Category::firstOrCreate(
                                    ['site_id' => $record->id, 'slug' => $slug],
                                    [
                                        'name' => $cat['name'],
                                        'description' => $cat['description'] ?? null,
                                        'is_active' => true,
                                        'sort_order' => 0,
                                    ]
                                );
                                $categoryMap[$cat['id']] = $localCat->id;
                            }

                            // Import campaigns
                            $created = 0;
                            $skipped = 0;

                            foreach ($export['campaigns'] as $campaign) {
                                $url = $campaign['url'] ?? '';
                                if (empty($url)) {
                                    continue;
                                }

                                $exists = RssFeed::where('site_id', $record->id)
                                    ->where('url', $url)
                                    ->exists();

                                if ($exists) {
                                    $skipped++;

                                    continue;
                                }

                                $categoryId = null;
                                $wpCatId = $campaign['category_wp_id'] ?? null;
                                if ($wpCatId && isset($categoryMap[$wpCatId])) {
                                    $categoryId = $categoryMap[$wpCatId];
                                }

                                $fetchInterval = (int) ($campaign['fetch_interval'] ?? 30);
                                if (str_contains($url, 'news.google.com') && $fetchInterval > 15) {
                                    $fetchInterval = 15;
                                }

                                RssFeed::create([
                                    'site_id' => $record->id,
                                    'category_id' => $categoryId,
                                    'name' => $campaign['name'] ?? 'Imported Campaign',
                                    'url' => $url,
                                    'source_name' => $campaign['source_name'] ?? parse_url($url, PHP_URL_HOST),
                                    'fetch_interval' => $fetchInterval,
                                    'is_active' => $campaign['is_active'] ?? true,
                                    'auto_publish' => $data['auto_publish'] ?? true,
                                    'ai_rewrite' => $data['ai_rewrite'] ?? false,
                                    'ai_language' => $record->language ?? 'en',
                                    'fetch_images' => $data['fetch_images'] ?? false,
                                ]);

                                $created++;
                            }

                            // Clean up uploaded file
                            @unlink($filePath);

                            $sourceSite = $export['site_name'] ?? $export['site_url'] ?? 'WordPress';

                            Notification::make()
                                ->title("Imported {$created} campaigns from {$sourceSite}")
                                ->body("{$skipped} duplicates skipped. " . count($categoryMap) . " categories mapped.")
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\EditAction::make(),
                    Tables\Actions\DeleteAction::make(),
                ]),
            ])
            ->headerActions([
                Tables\Actions\Action::make('bulk_import_sites')
                    ->label('Import Sites from JSON')
                    ->icon('heroicon-o-cloud-arrow-up')
                    ->color('info')
                    ->modalHeading('Bulk Create Sites from JSON')
                    ->modalDescription('Upload a JSON file with site definitions (see config/sites-example.json for format).')
                    ->form([
                        Forms\Components\FileUpload::make('json_file')
                            ->label('Sites JSON File')
                            ->required()
                            ->acceptedFileTypes(['application/json'])
                            ->directory('imports/sites')
                            ->helperText('JSON file with "sites" array containing name, domain, wordpress_url'),
                        Forms\Components\Toggle::make('ai_rewrite')
                            ->label('Enable AI Rewrite on all campaigns')
                            ->default(true),
                        Forms\Components\Toggle::make('fetch_images')
                            ->label('Enable Pixabay images on all campaigns')
                            ->default(true),
                    ])
                    ->action(function (array $data) {
                        $filePath = storage_path('app/public/' . $data['json_file']);

                        if (! file_exists($filePath)) {
                            Notification::make()->title('File not found')->danger()->send();

                            return;
                        }

                        $config = json_decode(file_get_contents($filePath), true);

                        if (! $config || ! isset($config['sites'])) {
                            Notification::make()->title('Invalid JSON format')->danger()->send();

                            return;
                        }

                        $created = 0;
                        $skipped = 0;
                        $defaults = $config['defaults'] ?? [];

                        foreach ($config['sites'] as $siteData) {
                            if (empty($siteData['domain']) || empty($siteData['name'])) {
                                continue;
                            }

                            $existing = Site::where('domain', $siteData['domain'])->first();
                            if ($existing) {
                                if (empty($existing->wordpress_url) && ! empty($siteData['wordpress_url'])) {
                                    $existing->update(['wordpress_url' => $siteData['wordpress_url']]);
                                }
                                $skipped++;

                                continue;
                            }

                            Site::create([
                                'name' => $siteData['name'],
                                'slug' => Str::slug($siteData['name']),
                                'domain' => $siteData['domain'],
                                'wordpress_url' => $siteData['wordpress_url'] ?? null,
                                'language' => $siteData['language'] ?? $defaults['language'] ?? 'en',
                                'timezone' => $siteData['timezone'] ?? $defaults['timezone'] ?? 'America/New_York',
                                'description' => $siteData['description'] ?? "{$siteData['name']} - Local News",
                                'is_active' => true,
                            ]);
                            $created++;
                        }

                        @unlink($filePath);

                        Notification::make()
                            ->title("Created {$created} sites")
                            ->body("{$skipped} already existed.")
                            ->success()
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),

                    Tables\Actions\BulkAction::make('bulk_migrate')
                        ->label('Full Migration from WordPress')
                        ->icon('heroicon-o-rocket-launch')
                        ->color('primary')
                        ->requiresConfirmation()
                        ->modalHeading('Bulk Full WordPress Migration')
                        ->modalIcon('heroicon-o-rocket-launch')
                        ->modalDescription('Import EVERYTHING from WordPress for all selected sites: settings, favicon, analytics, articles, feeds.')
                        ->form([
                            Forms\Components\Section::make('What to import')
                                ->schema([
                                    Forms\Components\Toggle::make('import_settings')
                                        ->label('Site Settings (favicon, Google Analytics, Search Console)')
                                        ->default(true),
                                    Forms\Components\Toggle::make('import_articles')
                                        ->label('All Articles via WP REST API')
                                        ->default(true),
                                    Forms\Components\Toggle::make('import_feeds')
                                        ->label('Auto-discover RSS Feed Campaigns')
                                        ->default(true),
                                ]),
                            Forms\Components\Section::make('Processing options')
                                ->schema([
                                    Forms\Components\Toggle::make('ai_rewrite')
                                        ->label('Enable AI Rewrite')
                                        ->default(false),
                                    Forms\Components\Toggle::make('fetch_images')
                                        ->label('Enable Pixabay images')
                                        ->default(false),
                                    Forms\Components\Toggle::make('auto_publish')
                                        ->label('Auto-publish articles')
                                        ->default(true),
                                ]),
                        ])
                        ->action(function ($records, array $data) {
                            $queued = 0;
                            $settingsQueued = 0;
                            $feedsCreated = 0;

                            foreach ($records as $site) {
                                $wpUrl = $site->wordpress_url ?: "https://{$site->domain}";

                                // Import site settings
                                if ($data['import_settings'] ?? true) {
                                    ImportWordPressSiteSettingsJob::dispatch(
                                        site: $site,
                                        wpUrl: $wpUrl,
                                    );
                                    $settingsQueued++;
                                }

                                // Import RSS feeds
                                if ($data['import_feeds'] ?? true) {
                                    $wpService = app(WordPressImportService::class);
                                    $feeds = $wpService->discoverFeeds($wpUrl);

                                    foreach ($feeds as $feed) {
                                        $exists = RssFeed::where('site_id', $site->id)
                                            ->where('url', $feed['url'])
                                            ->exists();

                                        if ($exists) {
                                            continue;
                                        }

                                        $categoryId = null;
                                        if (! empty($feed['wp_category_slug'])) {
                                            $cat = Category::firstOrCreate(
                                                ['site_id' => $site->id, 'slug' => $feed['wp_category_slug']],
                                                ['name' => $feed['wp_category_name'], 'is_active' => true, 'sort_order' => 0]
                                            );
                                            $categoryId = $cat->id;
                                        }

                                        RssFeed::create([
                                            'site_id' => $site->id,
                                            'category_id' => $categoryId,
                                            'name' => $feed['title'],
                                            'url' => $feed['url'],
                                            'source_name' => parse_url($wpUrl, PHP_URL_HOST),
                                            'fetch_interval' => 30,
                                            'is_active' => true,
                                            'auto_publish' => $data['auto_publish'] ?? true,
                                            'ai_rewrite' => $data['ai_rewrite'] ?? false,
                                            'ai_language' => $site->language ?? 'en',
                                            'fetch_images' => $data['fetch_images'] ?? false,
                                        ]);
                                        $feedsCreated++;
                                    }
                                }

                                // Import articles
                                if ($data['import_articles'] ?? true) {
                                    ImportWordPressJob::dispatch(
                                        site: $site,
                                        wpUrl: $wpUrl,
                                        page: 1,
                                        aiProcess: $data['ai_rewrite'] ?? false,
                                    );
                                    $queued++;
                                }
                            }

                            $parts = [];
                            if ($settingsQueued > 0) {
                                $parts[] = "{$settingsQueued} site settings";
                            }
                            if ($feedsCreated > 0) {
                                $parts[] = "{$feedsCreated} RSS feeds";
                            }
                            if ($queued > 0) {
                                $parts[] = "articles from {$queued} sites";
                            }

                            Notification::make()
                                ->title("Full migration started for " . count($records) . " sites")
                                ->body('Importing: ' . implode(', ', $parts) . '. Check import logs for progress.')
                                ->success()
                                ->duration(10000)
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSites::route('/'),
            'create' => Pages\CreateSite::route('/create'),
            'edit' => Pages\EditSite::route('/{record}/edit'),
        ];
    }
}
