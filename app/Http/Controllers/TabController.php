<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tab;

class TabController extends Controller
{
    public function store()
    {
        $tab = Tab::create([
            'user_id' => auth()->id(),
            'name' => 'New Tab'
        ]);

        return response()->json(['success' => true, 'tab' => $tab]);
    }

    public function getLatestText($tabId)
    {
        if (!$tabId) {
            return null;
        }
    
        $tab = Tab::find($tabId);
        return $tab?->latestText()?->text_content;
    }
}
