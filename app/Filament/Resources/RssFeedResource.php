<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RssFeedResource\Pages;
use App\Jobs\FetchRssFeedJob;
use App\Models\RssFeed;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RssFeedResource extends Resource
{
    protected static ?string $model = RssFeed::class;

    protected static ?string $navigationIcon = 'heroicon-o-rss';

    protected static ?string $navigationGroup = 'RSS';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Feed Details')
                    ->schema([
                        Forms\Components\Select::make('site_id')
                            ->relationship('site', 'name')
                            ->required()
                            ->searchable()
                            ->preload()
                            ->live(),
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('url')
                            ->required()
                            ->url()
                            ->maxLength(500)
                            ->placeholder('https://example.com/feed/rss'),
                        Forms\Components\Select::make('category_id')
                            ->relationship(
                                'category',
                                'name',
                                fn ($query, Forms\Get $get) => $query->where('site_id', $get('site_id'))
                            )
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ])->columns(2),

                Forms\Components\Section::make('Source Info')
                    ->schema([
                        Forms\Components\TextInput::make('source_name')
                            ->maxLength(255)
                            ->placeholder('Source display name'),
                        Forms\Components\FileUpload::make('source_logo')
                            ->image()
                            ->directory('feeds/logos'),
                    ])->columns(2),

                Forms\Components\Section::make('Fetch Settings')
                    ->schema([
                        Forms\Components\TextInput::make('fetch_interval')
                            ->numeric()
                            ->default(30)
                            ->suffix('minutes')
                            ->minValue(5)
                            ->maxValue(1440),
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),
                        Forms\Components\Toggle::make('auto_publish')
                            ->default(false)
                            ->helperText('Automatically publish imported articles'),
                    ])->columns(3),

                Forms\Components\Section::make('AI Rewrite')
                    ->description('Automatically rewrite imported articles using AI to make them unique')
                    ->schema([
                        Forms\Components\Toggle::make('ai_rewrite')
                            ->label('Enable AI Rewriting')
                            ->default(false)
                            ->live()
                            ->helperText('Rewrite title, body and excerpt using OpenAI'),
                        Forms\Components\Select::make('ai_language')
                            ->label('Output Language')
                            ->options([
                                'ro' => 'Romana',
                                'en' => 'English',
                                'de' => 'Deutsch',
                                'fr' => 'Francais',
                                'es' => 'Espanol',
                                'it' => 'Italiano',
                            ])
                            ->default('ro')
                            ->visible(fn (Forms\Get $get) => $get('ai_rewrite'))
                            ->helperText('Language for the rewritten article'),
                        Forms\Components\Textarea::make('ai_prompt')
                            ->label('Custom Instructions')
                            ->placeholder("E.g.: Write in a casual, conversational tone. Keep paragraphs short. Add a catchy intro.")
                            ->rows(3)
                            ->maxLength(1000)
                            ->visible(fn (Forms\Get $get) => $get('ai_rewrite'))
                            ->helperText('Optional extra instructions for the AI rewriter'),
                    ])->columns(1),

                Forms\Components\Section::make('Auto Images (Pixabay)')
                    ->description('Automatically fetch a relevant image from Pixabay when article has no image')
                    ->schema([
                        Forms\Components\Toggle::make('fetch_images')
                            ->label('Enable Pixabay Images')
                            ->default(false)
                            ->helperText('Search Pixabay for a photo matching the article title'),
                    ]),

                Forms\Components\Section::make('Field Mapping')
                    ->schema([
                        Forms\Components\KeyValue::make('field_mapping')
                            ->keyLabel('RSS Field')
                            ->valueLabel('Article Field')
                            ->addActionLabel('Add Mapping'),
                    ])->collapsed(),

                Forms\Components\Section::make('Filters')
                    ->schema([
                        Forms\Components\KeyValue::make('filters')
                            ->keyLabel('Filter Type')
                            ->valueLabel('Filter Value')
                            ->addActionLabel('Add Filter'),
                    ])->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('site.name')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('source_name')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('category.name')
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('fetch_interval')
                    ->suffix(' min')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
                Tables\Columns\IconColumn::make('auto_publish')
                    ->boolean()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\IconColumn::make('ai_rewrite')
                    ->label('AI')
                    ->boolean()
                    ->trueIcon('heroicon-o-sparkles')
                    ->falseIcon('heroicon-o-minus')
                    ->trueColor('warning')
                    ->toggleable(),
                Tables\Columns\IconColumn::make('fetch_images')
                    ->label('Img')
                    ->boolean()
                    ->trueIcon('heroicon-o-photo')
                    ->falseIcon('heroicon-o-minus')
                    ->trueColor('info')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('last_fetched_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('error_count')
                    ->badge()
                    ->color(fn (int $state): string => $state > 0 ? 'danger' : 'success')
                    ->sortable(),
                Tables\Columns\TextColumn::make('articles_count')
                    ->counts('articles')
                    ->label('Articles')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('site')
                    ->relationship('site', 'name'),
                Tables\Filters\TernaryFilter::make('is_active'),
                Tables\Filters\Filter::make('has_errors')
                    ->query(fn ($query) => $query->where('error_count', '>', 0))
                    ->toggle(),
                Tables\Filters\TernaryFilter::make('ai_rewrite')
                    ->label('AI Rewrite'),
            ])
            ->actions([
                Tables\Actions\Action::make('fetch_now')
                    ->label('Fetch Now')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (RssFeed $record) {
                        FetchRssFeedJob::dispatch($record);
                        Notification::make()
                            ->title('Feed fetch job dispatched')
                            ->body("Fetching: {$record->name}")
                            ->success()
                            ->send();
                    }),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index' => Pages\ListRssFeeds::route('/'),
            'create' => Pages\CreateRssFeed::route('/create'),
            'edit' => Pages\EditRssFeed::route('/{record}/edit'),
        ];
    }
}
