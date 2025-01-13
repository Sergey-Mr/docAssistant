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
                        'content' => "
                        You are a text revision assistant. Your task is to revise specific parts of a given text based on annotations and comments. You will receive:
                        - A complete text (referred to as 'context').
                        - A list of annotations specifying the text to be revised and comments providing guidance on how to revise them.

                        ### Your Tasks:
                        1. Keep the entire original text intact except for the annotated parts.
                        2. Revise only the annotated parts based on the provided comments, ensuring that the revisions blend seamlessly with the rest of the text.
                        3. Return the complete text with all revisions applied. Do not return only the revised portions.
                        4. For each annotation, provide:
                           - The original text of the annotated part.
                           - The revised version of the annotated part.
                           - A clear explanation of the changes made and why they were necessary.

                        ### Response Format:
                        Return your response as a JSON object with the following structure, but always use double quotes instead of '' when formattign the response :
                        {
                          'revised_text': 'The full revised text with changes applied.',
                          'revisions': [
                            {
                              'original': 'original text',
                              'revised': 'revised version',
                              'explanation': 'why changes were made'
                            }
                          ]
                        }
                        "
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
        
            $responseData = $response->json();
        
        Log::info('ChatGPT Raw Response:', ['response' => $responseData]);
        
        if (!isset($responseData['choices'][0]['message']['content'])) {
            Log::error('Invalid ChatGPT response structure', ['response' => $responseData]);
            throw new \Exception('Invalid response structure from ChatGPT API');
        }

        $content = $responseData['choices'][0]['message']['content'];
        
        // Parse JSON once
        $parsed = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('JSON Parse Error', [
                'error' => json_last_error_msg(),
                'content' => $content
            ]);
            throw new \Exception('Failed to parse ChatGPT response');
        }

        // Validate response structure
        if (!isset($parsed['revised_text']) || !isset($parsed['revisions']) || !is_array($parsed['revisions'])) {
            Log::error('Invalid response format', ['parsed' => $parsed]);
            throw new \Exception('Invalid response format from ChatGPT');
        }

        // Validate each revision
        foreach ($parsed['revisions'] as $revision) {
            if (!isset($revision['original']) || !isset($revision['revised']) || !isset($revision['explanation'])) {
                Log::error('Invalid revision format', ['revision' => $revision]);
                throw new \Exception('Invalid revision format in ChatGPT response');
            }
        }

        // Return validated response
        return [
            'success' => true,
            'revised_text' => $parsed['revised_text'],
            'revisions' => $parsed['revisions']
        ];
    
    } catch (\Exception $e) {
        Log::error('Annotation processing failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return [
            'success' => false,
            'message' => 'Failed to process annotations: ' . $e->getMessage()
        ];
    }
    }

    private function formatResponse(array $response): array
    {
        if (!isset($response['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid ChatGPT response format');
        }
        return json_decode($response['choices'][0]['message']['content'], true);
    }
}