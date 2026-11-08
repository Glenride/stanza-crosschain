<?php

namespace App\Jobs;

use App\Models\License;
use App\Services\OneClickService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RequestLicenseQuote implements ShouldQueue
{
    use Queueable;

    public License $license;

    public function __construct(License $license)
    {
        $this->license = $license;
    }

    public function handle(OneClickService $oneClick): void
    {
        $work = $this->license->work;
        if (!$work) {
            throw new Exception("License #{$this->license->id} has no associated work.");
        }

        // Amount in micro-units (e.g., USDC 6 decimals)
        $amountUnits = (string) (int) ($this->license->price_usd * 1_000_000);

        $params = [
            'swapType' => 'EXACT_OUTPUT',
            'originAsset' => $this->license->deposit_asset ?? 'nep141:wrap.near',
            'destinationAsset' => 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near', // USDC Base (verified against live /v0/tokens 2026-11-07)
            'amount' => $amountUnits,
            'recipient' => $work->scholar_address,
            'refundTo' => $this->license->buyer_address,
            'dry' => false,
            // Required by the current 1Click API (verified 2026-11-07: 400 without them;
            // `amountOut` is rejected — "property amountOut should not exist").
            'slippageTolerance' => 100,
            'depositType' => 'ORIGIN_CHAIN',
            'refundType' => 'ORIGIN_CHAIN',
            'recipientType' => 'DESTINATION_CHAIN',
            'deadline' => now()->addMinutes(30)->toIso8601String(),
        ];

        Log::info("Requesting 1Click quote for License #{$this->license->id}", $params);

        $quote = $oneClick->requestQuote($params);

        $this->license->update([
            'quote_id' => $quote['quoteId'] ?? null,
            'deposit_address' => $quote['depositAddress'] ?? null,
            'quote_payload' => $quote,
            'status' => 'quoted',
        ]);

        Log::info("1Click quote received for License #{$this->license->id}", [
            'quoteId' => $this->license->quote_id,
            'depositAddress' => $this->license->deposit_address,
        ]);

        // Dispatch settlement watcher
        WatchSettlement::dispatch($this->license);
    }
}
