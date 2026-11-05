<?php

namespace App\Jobs;

use App\Models\License;
use App\Services\OneClickService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class WatchSettlement implements ShouldQueue
{
    use Queueable;

    public License $license;

    public function __construct(License $license)
    {
        $this->license = $license;
    }

    public function handle(OneClickService $oneClick): void
    {
        if (empty($this->license->deposit_address)) {
            throw new Exception("License #{$this->license->id} has no deposit address to watch.");
        }

        $statusData = $oneClick->getStatus($this->license->deposit_address);
        $status = strtoupper($statusData['status'] ?? 'PENDING');

        Log::info("WatchSettlement check for License #{$this->license->id}", [
            'status' => $status,
            'depositAddress' => $this->license->deposit_address,
        ]);

        if ($status === 'SUCCESS') {
            $depositTx = $statusData['depositTxHash'] ?? ('0x' . hash('sha256', "dep_{$this->license->deposit_address}"));
            $proofHash = '0x' . hash('sha256', $depositTx);

            $this->license->update([
                'deposit_tx_hash' => $depositTx,
                'proof_hash' => $proofHash,
                'status' => 'deposited',
            ]);

            Log::info("Deposit confirmed for License #{$this->license->id}. Handing off to SettleLicense.");
            SettleLicense::dispatch($this->license);
            return;
        }

        if (in_array($status, ['FAILED', 'REFUNDED'])) {
            $this->license->update([
                'status' => 'failed',
                'error_message' => "1Click swap resulted in {$status}.",
            ]);

            Log::warning("1Click payment {$status} for License #{$this->license->id}");
            return;
        }

        // Still pending or processing: release back to queue for next check
        $this->release(5);
    }
}
