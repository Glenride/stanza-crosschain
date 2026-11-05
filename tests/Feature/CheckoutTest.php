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

    protected Work $work;

    protected function setUp(): void
    {
        parent::setUp();

        $this->work = Work::create([
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
    }

    public function test_checkout_page_renders_successfully(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('checkout')
            ->has('works', 1)
        );
    }

    public function test_checkout_route_alias_renders_successfully(): void
    {
        $response = $this->get('/checkout');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('checkout'));
    }

    public function test_api_quote_endpoint_creates_license_and_returns_deposit_info(): void
    {
        $payload = [
            'work_id' => $this->work->id,
            'tier' => 'read',
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'deposit_asset' => 'nep141:wrap.near',
            'deposit_chain' => 'near',
        ];

        $response = $this->postJson('/api/quote', $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success',
            'license' => [
                'id',
                'work_id',
                'buyer_address',
                'tier',
                'price_usd',
                'deposit_address',
                'quote_id',
                'status',
            ],
        ]);

        $this->assertDatabaseHas('licenses', [
            'work_id' => $this->work->id,
            'tier' => 'read',
            'buyer_address' => '0xB001234567890123456789012345678901234567',
        ]);
    }

    public function test_lookup_page_renders_successfully(): void
    {
        $response = $this->get('/lookup');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('lookup'));
    }

    public function test_api_lookup_resolves_test_tx_hash(): void
    {
        $testDepositTx = '0x' . hash('sha256', 'test-deposit-hash-123');
        $testProofHash = '0x' . hash('sha256', 'test-proof-hash-123');
        $testSettlementTx = '0x' . hash('sha256', 'test-base-settlement-hash-123');

        $license = License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xB001234567890123456789012345678901234567',
            'tier' => 'citation',
            'price_usd' => 25.00,
            'deposit_asset' => 'solana:native',
            'deposit_chain' => 'solana',
            'deposit_address' => '0x1clickdepositaddress',
            'quote_id' => 'quote_lookup_test',
            'deposit_tx_hash' => $testDepositTx,
            'proof_hash' => $testProofHash,
            'settlement_tx_hash' => $testSettlementTx,
            'status' => 'settled',
            'settled_at' => now(),
        ]);

        // Lookup by deposit tx hash
        $response1 = $this->getJson("/api/lookup?hash={$testDepositTx}");
        $response1->assertStatus(200);
        $response1->assertJsonPath('found', true);
        $response1->assertJsonPath('license.id', $license->id);
        $response1->assertJsonPath('license.tier', 'citation');

        // Lookup by proof hash
        $response2 = $this->getJson("/api/lookup?hash={$testProofHash}");
        $response2->assertStatus(200);
        $response2->assertJsonPath('found', true);
        $response2->assertJsonPath('license.id', $license->id);

        // Lookup by settlement tx hash
        $response3 = $this->getJson("/api/lookup?hash={$testSettlementTx}");
        $response3->assertStatus(200);
        $response3->assertJsonPath('found', true);
        $response3->assertJsonPath('license.id', $license->id);
    }
}
