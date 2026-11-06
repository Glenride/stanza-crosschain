<?php

namespace Tests\Feature;

use App\Models\License;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ScholarTest extends TestCase
{
    use RefreshDatabase;

    protected string $scholarAddress = '0x5C10a12345678901234567890123456789012345';
    protected Work $work;

    protected function setUp(): void
    {
        parent::setUp();

        $this->work = Work::create([
            'work_id' => '0x' . hash('sha256', 'scholar-manuscript-1'),
            'title' => 'Decentralized Scholarly Attribution over NEAR Chain Signatures',
            'slug' => 'scholar-attribution-near',
            'scholar_name' => 'Prof. Katherine Vance',
            'scholar_address' => $this->scholarAddress,
            'metadata_uri' => 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
            'description' => 'Peer-reviewed research into cross-chain settlement architectures.',
            'tiers' => [
                'read' => 5.00,
                'citation' => 25.00,
                'commercial' => 100.00,
            ],
            'is_active' => true,
        ]);
    }

    public function test_scholar_page_renders_with_works_and_licenses(): void
    {
        // 1 settled license ($25.00)
        License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xBuyer111111111111111111111111111111111111',
            'tier' => 'citation',
            'price_usd' => 25.00,
            'deposit_asset' => 'nep141:wrap.near',
            'deposit_chain' => 'near',
            'deposit_address' => '1click-dep-1',
            'quote_id' => 'q_1',
            'deposit_tx_hash' => '0x' . hash('sha256', 'dep_tx_1'),
            'proof_hash' => '0x' . hash('sha256', 'proof_1'),
            'settlement_tx_hash' => '0x' . hash('sha256', 'base_settle_1'),
            'status' => 'settled',
            'settled_at' => now(),
        ]);

        // 1 pending/quoted license ($100.00)
        License::create([
            'work_id' => $this->work->id,
            'buyer_address' => '0xBuyer222222222222222222222222222222222222',
            'tier' => 'commercial',
            'price_usd' => 100.00,
            'deposit_asset' => 'solana:native',
            'deposit_chain' => 'solana',
            'deposit_address' => '1click-dep-2',
            'quote_id' => 'q_2',
            'status' => 'quoted',
        ]);

        $response = $this->get("/scholar/{$this->scholarAddress}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scholar')
            ->where('scholarAddress', $this->scholarAddress)
            ->where('scholarName', 'Prof. Katherine Vance')
            ->has('works', 1)
            ->has('licenses', 2)
            ->where('stats.totalWorks', 1)
            ->where('stats.totalLicenses', 2)
            ->where('stats.settledLicenses', 1)
            ->where('stats.totalRevenueUsd', '25.00')
        );
    }

    public function test_scholar_page_case_insensitive_lookup(): void
    {
        $lowercaseAddress = strtolower($this->scholarAddress);

        $response = $this->get("/scholar/{$lowercaseAddress}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scholar')
            ->where('scholarName', 'Prof. Katherine Vance')
            ->has('works', 1)
        );
    }

    public function test_scholar_page_empty_state_for_unknown_address(): void
    {
        $unknownAddress = '0x000000000000000000000000000000000000dEaD';

        $response = $this->get("/scholar/{$unknownAddress}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('scholar')
            ->where('scholarAddress', $unknownAddress)
            ->where('scholarName', null)
            ->has('works', 0)
            ->has('licenses', 0)
            ->where('stats.totalWorks', 0)
            ->where('stats.totalLicenses', 0)
            ->where('stats.settledLicenses', 0)
            ->where('stats.totalRevenueUsd', '0.00')
        );
    }
}
