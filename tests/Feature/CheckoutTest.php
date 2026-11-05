<?php

namespace Tests\Feature;

use App\Models\License;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_page_renders_successfully(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('checkout'));
    }

    public function test_checkout_route_alias_renders_successfully(): void
    {
        $response = $this->get('/checkout');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('checkout'));
    }

    public function test_work_and_license_models_can_be_persisted(): void
    {
        $work = Work::create([
            'work_id' => '0x' . hash('sha256', 'manuscript-sample-1'),
            'title' => 'Cross-Chain Cryptographic Settlement in Scholarly Publishing',
            'slug' => 'cross-chain-settlement',
            'scholar_name' => 'Dr. Jane Scholar',
            'scholar_address' => '0x5C10a12345678901234567890123456789012345',
            'metadata_uri' => 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
            'description' => 'A decentralized peer-reviewed manuscript on cross-chain licensing.',
            'tiers' => [
                'read' => 5.00,
                'citation' => 25.00,
                'commercial' => 100.00,
            ],
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('works', [
            'slug' => 'cross-chain-settlement',
            'title' => 'Cross-Chain Cryptographic Settlement in Scholarly Publishing',
        ]);

        $license = License::create([
            'work_id' => $work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'read',
            'price_usd' => 5.00,
            'deposit_asset' => 'NEAR',
            'deposit_chain' => 'near',
            'deposit_address' => '0x1clickdepositaddress',
            'quote_id' => 'quote_123',
            'quote_payload' => ['amount_out' => '5.00', 'destination' => '0x5C10'],
            'deposit_tx_hash' => '0xdeposit123',
            'proof_hash' => '0x' . hash('sha256', 'proof-1'),
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('licenses', [
            'id' => $license->id,
            'work_id' => $work->id,
            'tier' => 'read',
            'deposit_asset' => 'NEAR',
        ]);

        $this->assertEquals($work->id, $license->work->id);
        $this->assertCount(1, $work->licenses);
    }
}
