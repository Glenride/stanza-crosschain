<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Work extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_id',
        'title',
        'slug',
        'scholar_name',
        'scholar_address',
        'metadata_uri',
        'description',
        'tiers',
        'is_active',
    ];

    protected $casts = [
        'tiers' => 'array',
        'is_active' => 'boolean',
    ];

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }
}
