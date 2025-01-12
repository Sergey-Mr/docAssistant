<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class UserText extends Model
{
    protected $fillable = [
        'user_id',
        'tab_id',
        'text_content',
        'previous_version_id'
    ];

    public function changes(): HasMany
    {
        return $this->hasMany(TextChange::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function previousVersion(): BelongsTo
    {
        return $this->belongsTo(UserText::class, 'previous_version_id');
    }
}
