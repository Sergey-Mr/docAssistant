<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessAnnotationsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'fullContext' => 'required|string',
            'annotations' => 'required|array',
            'annotations.*.text' => 'required|string',
            'annotations.*.comment' => 'required|string',
            'annotations.*.position' => 'required|integer'
        ];
    }
}
