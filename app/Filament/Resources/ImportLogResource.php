<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ImportLogResource\Pages;
use App\Models\ImportLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ImportLogResource extends Resource
{
    protected static ?string $model = ImportLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'System';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make()
                    ->schema([
                        Forms\Components\Select::make('site_id')
                            ->relationship('site', 'name')
                            ->disabled(),
                        Forms\Components\Select::make('rss_feed_id')
                            ->relationship('rssFeed', 'name')
                            ->disabled(),
                        Forms\Components\TextInput::make('type')
                            ->disabled(),
                        Forms\Components\TextInput::make('status')
                            ->disabled(),
                    ])->columns(2),

                Forms\Components\Section::make('Statistics')
                    ->schema([
                        Forms\Components\TextInput::make('items_found')->disabled(),
                        Forms\Components\TextInput::make('items_imported')->disabled(),
                        Forms\Components\TextInput::make('items_skipped')->disabled(),
                        Forms\Components\TextInput::make('items_failed')->disabled(),
                    ])->columns(4),

                Forms\Components\Section::make('Details')
                    ->schema([
                        Forms\Components\Textarea::make('summary')->disabled(),
                        Forms\Components\KeyValue::make('errors')->disabled(),
                        Forms\Components\DateTimePicker::make('started_at')->disabled(),
                        Forms\Components\DateTimePicker::make('completed_at')->disabled(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('site.name')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('rssFeed.name')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'rss' => 'info',
                        'wordpress' => 'warning',
                        'manual' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'running' => 'info',
                        'pending' => 'gray',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('items_imported')
                    ->label('Imported')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('items_failed')
                    ->label('Failed')
                    ->numeric()
                    ->color(fn (int $state): string => $state > 0 ? 'danger' : 'success'),
                Tables\Columns\TextColumn::make('started_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('completed_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('site')
                    ->relationship('site', 'name'),
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'running' => 'Running',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                    ]),
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'rss' => 'RSS',
                        'wordpress' => 'WordPress',
                        'manual' => 'Manual',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListImportLogs::route('/'),
            'view' => Pages\ViewImportLog::route('/{record}'),
        ];
    }
}
