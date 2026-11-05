<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class License extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_id',
        'buyer_address',
        'tier',
        'price_usd',
        'deposit_asset',
        'deposit_chain',
        'deposit_address',
        'quote_id',
        'quote_payload',
        'deposit_tx_hash',
        'proof_hash',
        'settlement_tx_hash',
        'status',
        'error_message',
        'settled_at',
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'quote_payload' => 'array',
        'settled_at' => 'datetime',
    ];

    public function work(): BelongsTo
    {
        return $this->belongsTo(Work::class);
    }
}
