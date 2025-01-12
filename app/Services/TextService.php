<?php

namespace App\Services;

use App\Models\Tab;
use App\Models\UserText;
use App\Models\TextChange;

class TextService
{
    public function createTextVersion(array $data): array
    {
        $tab = Tab::findOrFail($data['tab_id']);
        
        $userText = $this->createUserText($tab, $data);
        $change = $this->createTextChange($userText, $data);
        
        return [
            'text' => $userText,
            'change' => $change
        ];
    }

    private function createUserText(Tab $tab, array $data): UserText
    {
        return UserText::create([
            'user_id' => auth()->id(),
            'tab_id' => $data['tab_id'],
            'text_content' => $data['full_text'],
            'previous_version_id' => $tab->latestText()?->id
        ]);
    }

    private function createTextChange(UserText $userText, array $data): TextChange
    {
        return TextChange::create([
            'user_text_id' => $userText->id,
            'start_index' => $data['start_index'],
            'end_index' => $data['end_index'],
            'original_text' => $data['original_text'],
            'updated_text' => $data['updated_text']
        ]);
    }
}