<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TextChange extends Model
{
    protected $fillable = [
        'user_text_id',
        'start_index',
        'end_index',
        'original_text',
        'updated_text'
    ];

    public function userText(): BelongsTo
    {
        return $this->belongsTo(UserText::class);
    }
}
