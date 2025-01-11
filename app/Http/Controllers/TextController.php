<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\TextChange;
use App\Models\UserText;
use Illuminate\Support\Facades\Log;

class TextController extends Controller
{
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'start_index' => 'required|integer',
                'end_index' => 'required|integer',
                'original_text' => 'required|string',
                'updated_text' => 'required|string'
            ]);

            // First get or create UserText
            $userText = UserText::firstOrCreate(
                ['user_id' => auth()->id()],
                ['text_content' => $request->input('full_text', '')]
            );

            // Create TextChange linked to UserText
            $change = TextChange::create([
                'user_text_id' => $userText->id,
                'start_index' => $validated['start_index'],
                'end_index' => $validated['end_index'],
                'original_text' => $validated['original_text'],
                'updated_text' => $validated['updated_text']
            ]);

            return response()->json(['success' => true, 'change' => $change]);

        } catch (\Exception $e) {
            Log::error('Text update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    
    }
}
