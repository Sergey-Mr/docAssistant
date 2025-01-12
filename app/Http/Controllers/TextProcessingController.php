<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ChatGPTService;
use App\Http\Requests\ProcessAnnotationsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TextProcessingController extends Controller
{
    public function __construct(
        private ChatGPTService $chatGPTService
    ) {}

    public function process(ProcessAnnotationsRequest $request): JsonResponse
    {
        try {
            $result = $this->chatGPTService->processAnnotations(
                $request->get('fullContext'),
                $request->get('annotations')
            );
    
            return response()->json([
                'success' => true,
                'revisions' => $result
            ]);
    
        } catch (\Exception $e) {
            Log::error('Annotation processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
    
            return response()->json([
                'success' => false,
                'message' => 'Failed to process annotations: ' . $e->getMessage()
            ], 500);
        }
    }
}
