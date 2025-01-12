<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use App\Services\TextService;  // Add this line

class TextController extends Controller
{
    protected $textService;
    
    public function __construct(TextService $textService)
    {
        $this->textService = $textService;
    }

    public function update(Request $request)
    {
        try {
            $validated = $this->validateUpdateRequest($request);
            $textData = $this->textService->createTextVersion($validated);
            
            return response()->json([
                'success' => true,
                'text' => $textData['text'],
                'change' => $textData['change']
            ]);
        } catch (\Exception $e) {
            Log::error('Text update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
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
