<?php

namespace Tests\Feature;

use App\Jobs\RequestLicenseQuote;
use App\Jobs\SettleLicense;
use App\Jobs\WatchSettlement;
use App\Models\License;
use App\Models\Work;
use App\Services\MpcSettlementService;
use App\Services\OneClickService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OneClickAgentTest extends TestCase
{
    use RefreshDatabase;

    protected Work $work;

    protected function setUp(): void
    {
        parent::setUp();

        $this->work = Work::create([
            'work_id' => '0x' . hash('sha256', 'sample-work-1'),
            'title' => 'Decentralized Academic Attribution',
            'slug' => 'decentralized-academic-attribution',
            'scholar_name' => 'Prof. Alistair Finch',
            'scholar_address' => '0x5C10a12345678901234567890123456789012345',
            'metadata_uri' => 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
            'tiers' => [
                'read' => 5.00,
                'citation' => 25.00,
                'commercial' => 100.00,
            ],
            'is_active' => true,
        ]);
    }

    public function test_oneclick_service_generates_quote_and_status(): void
    {
        $service = new OneClickService();
        $quote = $service->requestQuote([
            'originAsset' => 'nep141:wrap.near',
            'destinationAsset' => 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near',
            'amount' => '5000000',
            'recipient' => $this->work->scholar_address,
            'refundTo' => $this->work->scholar_address,
            'dry' => false,
            // Required by the current 1Click API (verified 2026-11-07).
            'swapType' => 'EXACT_OUTPUT',
            'slippageTolerance' => 100,
            'depositType' => 'ORIGIN_CHAIN',
            'refundType' => 'ORIGIN_CHAIN',
            'recipientType' => 'DESTINATION_CHAIN',
            'deadline' => date('c', time() + 1800),
        ]);

        $this->assertNotEmpty($quote['depositAddress']);
        $this->assertNotEmpty($quote['quoteId']);

        $status = $service->getStatus($quote['depositAddress']);
        $this->assertEquals('SUCCESS', $status['status']);
    }

    public function test_end_to_end_job_chain_runs_cleanly(): void
    {
        $license = License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'read',
            'price_usd' => 5.00,
            'deposit_asset' => 'nep141:wrap.near',
            'deposit_chain' => 'near',
            'status' => 'pending',
        ]);

        $oneClick = new OneClickService();
        $mpcService = new MpcSettlementService();

        // When queue driver is sync, dispatching RequestLicenseQuote triggers
        // the entire job chain: RequestLicenseQuote -> WatchSettlement -> SettleLicense
        $quoteJob = new RequestLicenseQuote($license);
        $quoteJob->handle($oneClick);

        $license->refresh();
        $this->assertEquals('settled', $license->status);
        $this->assertNotEmpty($license->deposit_address);
        $this->assertNotEmpty($license->quote_id);
        $this->assertNotEmpty($license->deposit_tx_hash);
        $this->assertNotEmpty($license->proof_hash);
        $this->assertNotEmpty($license->settlement_tx_hash);
        $this->assertNotNull($license->settled_at);
    }

    public function test_settle_license_fails_if_status_not_success(): void
    {
        $license = License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'read',
            'price_usd' => 5.00,
            'deposit_address' => '0xdepfail',
            'proof_hash' => '0x' . hash('sha256', 'fail'),
            'quote_payload' => [
                'amountOut' => '5000000',
                'recipient' => $this->work->scholar_address,
            ],
            'status' => 'deposited',
        ]);

        // Mock OneClickService to return PENDING status instead of SUCCESS
        $mockOneClick = $this->createMock(OneClickService::class);
        $mockOneClick->method('getStatus')->willReturn(['status' => 'PENDING']);

        $mpcService = new MpcSettlementService();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Pre-signing verification failed: 1Click status is PENDING, expected SUCCESS.');

        $job = new SettleLicense($license);
        $job->handle($mockOneClick, $mpcService);
    }

    public function test_settle_license_fails_if_amount_mismatch(): void
    {
        $license = License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'read',
            'price_usd' => 5.00,
            'deposit_address' => '0xdepamountmismatch',
            'proof_hash' => '0x' . hash('sha256', 'amountmismatch'),
            'quote_payload' => [
                'amountOut' => '1000000', // Only 1.00 USD instead of 5.00 USD!
                'recipient' => $this->work->scholar_address,
            ],
            'status' => 'deposited',
        ]);

        $mockOneClick = $this->createMock(OneClickService::class);
        $mockOneClick->method('getStatus')->willReturn(['status' => 'SUCCESS']);

        $mpcService = new MpcSettlementService();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Pre-signing verification failed: amountOut mismatch.');

        $job = new SettleLicense($license);
        $job->handle($mockOneClick, $mpcService);
    }

    public function test_settle_license_fails_if_destination_mismatch(): void
    {
        $license = License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'read',
            'price_usd' => 5.00,
            'deposit_address' => '0xdepdestmismatch',
            'proof_hash' => '0x' . hash('sha256', 'destmismatch'),
            'quote_payload' => [
                'amountOut' => '5000000',
                'recipient' => '0xAttackerAddress123456789012345678901234',
            ],
            'status' => 'deposited',
        ]);

        $mockOneClick = $this->createMock(OneClickService::class);
        $mockOneClick->method('getStatus')->willReturn(['status' => 'SUCCESS']);

        $mpcService = new MpcSettlementService();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Pre-signing verification failed: destination mismatch.');

        $job = new SettleLicense($license);
        $job->handle($mockOneClick, $mpcService);
    }
}
