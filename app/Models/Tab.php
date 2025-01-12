<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tab extends Model
{
    protected $fillable = ['name', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function texts()
    {
        return $this->hasMany(UserText::class);
    }

    public function latestText()
    {
        return $this->texts()->latest()->first();
    
    }
    protected static function boot()
    {
        parent::boot();
        
        static::deleting(function($tab) {
            // Delete related texts and changes
            $tab->texts()->each(function($text) {
                $text->changes()->delete();
                $text->delete();
            });
        });
    }
}
