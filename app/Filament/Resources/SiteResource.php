<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteResource\Pages;
use App\Jobs\ImportWordPressJob;
use App\Models\Site;
use App\Services\WordPressImportService;
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

                    Tables\Actions\EditAction::make(),
                    Tables\Actions\DeleteAction::make(),
                ]),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
