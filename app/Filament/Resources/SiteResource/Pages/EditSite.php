<?php

namespace App\Filament\Resources\SiteResource\Pages;

use App\Filament\Resources\SiteResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSite extends EditRecord
{
    protected static string $resource = SiteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    /**
     * Merge theme settings into existing settings instead of replacing them.
     * This preserves WP import data (menus, widgets, plugins, etc.)
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (isset($data['settings']) && is_array($data['settings'])) {
            $existing = $this->record->settings ?? [];
            $data['settings'] = array_replace_recursive($existing, $data['settings']);
        }

        return $data;
    }
}
