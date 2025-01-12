<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatGPTService
{
    private $apiKey;
    
    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
    }

    public function processAnnotations(string $context, array $annotations): array
    {
        try {
            Log::info('Processing annotations request', [
                'context' => $context,
                'annotations' => $annotations
            ]);
        
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => "You are a text revision assistant. Analyze each text segment and its suggested changes. Return your response in JSON format with the following structure: {\"revisions\": [{\"original\": \"original text\", \"revised\": \"improved version\", \"explanation\": \"why changes were made\"}]}"
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'context' => $context,
                            'annotations' => $annotations
                        ])
                    ]
                ],
                'temperature' => 0.7
            ]);
        
            if (!$response->successful()) {
                Log::error('ChatGPT API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('ChatGPT API request failed: ' . $response->body());
            }
        
            $responseData = $response->json();
            Log::info('ChatGPT Response', ['response' => $responseData]);
        
            $content = $responseData['choices'][0]['message']['content'];
            $parsed = json_decode($content, true);
        
            if (!isset($parsed['revisions']) || !is_array($parsed['revisions'])) {
                throw new \Exception('Invalid response structure from ChatGPT API');
            }
        
            return $parsed['revisions'];
        
        } catch (\Exception $e) {
            Log::error('Annotation processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function formatResponse(array $response): array
    {
        // Process and format ChatGPT response
        return $response['choices'][0]['message']['content'];
    }
}