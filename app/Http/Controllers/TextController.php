<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use App\Services\TextService;  
use App\Models\Tab;
use App\Models\TextChange;
use App\Models\UserText;

class TextController extends Controller
{
    protected $textService;
    
    public function __construct(TextService $textService)
    {
        $this->textService = $textService;
    }

    public function update(Request $request)
    {
        $request->validate([
            'tabId' => 'required|exists:tabs,id',
            'content' => 'required|string',
            'explanation' => 'nullable|string' // Add explanation validation
        ]);
        
        try {
            // Get current text record or create new one
            $text = UserText::where('tab_id', $request->tabId)
                        ->latest()
                        ->first();
        
            if ($text) {
                // Create new version with previous version reference
                $newText = UserText::create([
                    'user_id' => auth()->id(),
                    'tab_id' => $request->tabId,
                    'text_content' => $request->content,
                    'previous_version_id' => $text->id,
                    'explanation' => $request->explanation // Add explanation
                ]);
            } else {
                // First version
                $newText = UserText::create([
                    'user_id' => auth()->id(),
                    'tab_id' => $request->tabId,
                    'text_content' => $request->content,
                    'explanation' => $request->explanation // Add explanation
                ]);
            }
        
            // Record the change with explanation
            TextChange::create([
                'user_text_id' => $newText->id,
                'start_index' => $request->start_index ?? 0,
                'end_index' => $request->end_index ?? strlen($request->content),
                'original_text' => $text ? $text->text_content : '',
                'updated_text' => $request->content,
                'explanation' => $request->explanation // Add explanation
            ]);
        
            return response()->json([
                'success' => true,
                'message' => 'Text updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Text update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update text: ' . $e->getMessage()
            ], 500);
        }
    }

    public function history($tabId)
    {
        try {
            $changes = TextChange::join('user_texts', 'text_changes.user_text_id', '=', 'user_texts.id')
                ->where('user_texts.tab_id', $tabId)
                ->orderBy('text_changes.created_at', 'desc')
                ->select('text_changes.*')
                ->get();
        
            return response()->json($changes);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch history'
            ], 500);
        }
    }

    private function validateUpdateRequest(Request $request): array
    {
        return $request->validate([
            'start_index' => 'required|integer',
            'end_index' => 'required|integer',
            'original_text' => 'required|string',
            'updated_text' => 'required|string',
            'full_text' => 'required|string',
            'tab_id' => 'required|exists:tabs,id'
        ]);
    }
}
