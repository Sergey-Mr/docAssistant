<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tab;
use Illuminate\Support\Facades\Log;

class TabController extends Controller
{
    public function store()
    {
        $userTabCount = Tab::where('user_id', auth()->id())->count();
        $newTabNumber = $userTabCount + 1;
        
        $tab = Tab::create([
            'user_id' => auth()->id(),
            'name' => "Tab #$newTabNumber"
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

    public function getContent($id)
    {
        $tab = Tab::findOrFail($id);
        return response()->json([
            'content' => $tab->latestText()?->text_content ?? ''
        ]);
    }

    public function destroy($id)
    {
        try {
            $tab = Tab::findOrFail($id);
            $tab->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tab deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
