<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpcSettlementService
{
    protected string $baseRpcUrl;
    protected string $nearRpcUrl;
    protected string $mpcContract;
    protected ?string $licenseRegistryAddress;
    protected string $derivationPath;

    public function __construct(
        ?string $baseRpcUrl = null,
        ?string $nearRpcUrl = null,
        ?string $mpcContract = null,
        ?string $licenseRegistryAddress = null,
        string $derivationPath = 'ethereum-1'
    ) {
        $this->baseRpcUrl = $baseRpcUrl ?? config('services.base.rpc_url', env('BASE_RPC_URL', 'https://mainnet.base.org'));
        $this->nearRpcUrl = $nearRpcUrl ?? config('services.near.rpc_url', env('NEAR_NODE_URL', 'https://rpc.mainnet.near.org'));
        $this->mpcContract = $mpcContract ?? config('services.near.mpc_contract', env('NEAR_MPC_CONTRACT', 'v1.signer'));
        $this->licenseRegistryAddress = $licenseRegistryAddress ?? config('services.base.license_registry_address', env('LICENSE_REGISTRY_ADDRESS'));
        $this->derivationPath = $derivationPath;
    }

    /**
     * Check if a proofHash is already settled on-chain on LicenseRegistry.
     * Function selector for settled(bytes32): keccak256("settled(bytes32)")[0..4] = 0x27670732
     */
    public function isSettledOnChain(string $proofHash): bool
    {
        if (empty($this->licenseRegistryAddress) || $this->licenseRegistryAddress === 'stub') {
            return false;
        }

        // settled(bytes32) selector is keccak256("settled(bytes32)")[:4] -> 0x27670732
        $selector = '0x27670732';
        $cleanHash = ltrim(str_replace('0x', '', $proofHash), '');
        $data = $selector . str_pad($cleanHash, 64, '0', STR_PAD_LEFT);

        try {
            $response = Http::post($this->baseRpcUrl, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'eth_call',
                'params' => [
                    [
                        'to' => $this->licenseRegistryAddress,
                        'data' => $data,
                    ],
                    'latest',
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json('result');
                if ($result) {
                    // Non-zero hex return means true
                    $intVal = hexdec(str_replace('0x', '', $result));
                    return $intVal === 1;
                }
            }
        } catch (Exception $e) {
            Log::warning('Error checking on-chain settled status', ['error' => $e->getMessage()]);
        }

        return false;
    }

    /**
     * Encode recordLicense call data:
     * recordLicense(address buyer, bytes32 workId, string tier, bytes32 proofHash)
     * Selector: keccak256("recordLicense(address,bytes32,string,bytes32)") = 0x48967ddc
     */
    public function encodeRecordLicenseCall(string $buyer, string $workId, string $tier, string $proofHash): string
    {
        $selector = '0x48967ddc';

        $cleanBuyer = str_pad(ltrim(strtolower(str_replace('0x', '', $buyer)), ''), 64, '0', STR_PAD_LEFT);
        $cleanWorkId = str_pad(str_replace('0x', '', $workId), 64, '0', STR_PAD_RIGHT);
        $cleanProof = str_pad(str_replace('0x', '', $proofHash), 64, '0', STR_PAD_RIGHT);

        // String offset is 4 * 32 = 128 bytes (0x80)
        $offsetTier = str_pad(dechex(128), 64, '0', STR_PAD_LEFT);

        $tierBytes = $tier;
        $tierLen = str_pad(dechex(strlen($tierBytes)), 64, '0', STR_PAD_LEFT);
        $tierHex = str_pad(bin2hex($tierBytes), 64, '0', STR_PAD_RIGHT);

        return $selector . $cleanBuyer . $cleanWorkId . $offsetTier . $cleanProof . $tierLen . $tierHex;
    }

    /**
     * Request signature from NEAR MPC and relay signed transaction to Base.
     * In test/stub mode or without live keys, returns a deterministic simulated settlement.
     */
    public function settleOnBase(
        string $buyer,
        string $workId,
        string $tier,
        string $proofHash,
        bool $isStub = false
    ): array {
        if ($isStub || empty($this->licenseRegistryAddress) || $this->licenseRegistryAddress === 'stub') {
            $txHash = '0x' . hash('sha256', "base_settle_{$workId}_{$buyer}_{$proofHash}");
            return [
                'status' => 'settled',
                'txHash' => $txHash,
                'blockNumber' => 12345678,
                'relayedViaMpc' => true,
                'isStub' => true,
            ];
        }

        // Production MPC path:
        // 1. Build unsigned EIP-1559 tx
        // 2. Hash payload
        // 3. Call NEAR MPC contract `sign`
        // 4. Relay to Base RPC
        throw new Exception('Live MPC settlement requires NEAR credentials and deployed registry address.');
    }
}
