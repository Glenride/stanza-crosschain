# Order 9: Live 1Click quote + live MPC settlement

## Context (verified 2026-11-07 ~19:00 ET by Janine)

- LicenseRegistry is DEPLOYED on Base mainnet (chain 8453) at
  `0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00`
  Deploy tx: `0xf2769b808992a69969a5909e1b5359cfc375a6400092e546845b2639695d4065`
  Basescan: https://basescan.org/address/0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00
  Constructor arg (immutable relayer): `0x4D538abf011e0885a6f87667Db466837B10b49f9`
  (NEAR `stanza_glenride.near`, path `ethereum-1`, mainnet `v1.signer`). Verified live:
  runtime code present, `relayer()` returns the MPC address.
- Funding: deployer `0xc09ae916febb1d51de1a6eb5f4353ae48c348f84` received 0.00132853 ETH;
  0.0005 ETH forwarded to the relayer; deploy cost ~0.0000048 ETH. Deployer balance
  now ~0.00082357 ETH, relayer 0.0005 ETH.
- `ONECLICK_JWT` is PRESENT in the iMac app `.env` (verified presence only, never
  read or printed). The live 1Click key gate is closed.
- `ONECLICK_API_URL` was stale (`https://api.near-intents.org`, dead) and is now
  `https://1click.chaindefuser.com` in `.env` (fixed by Janine; verified live:
  `POST /v0/quote` with bad params returns 400, i.e. the route exists).
- `LICENSE_REGISTRY_ADDRESS` is currently `stub` in `.env`. Janine set it to the
  deployed address, saw 3 test failures, and reverted it to `stub` — the failures
  turned out to be the 1Click quote payload (below), NOT the registry address.
  This order sets it to the deployed address as its final step.
- Test suite right now: 11 passed, 3 failed (the 3 are the 1Click quote / job-chain
  tests). They now exercise the LIVE 1Click API because the JWT is present; they
  passed before only in stub mode.

## Task 1 — Fix the 1Click quote payload to the current API

The live API (`POST https://1click.chaindefuser.com/v0/quote`) returned 400 on
2026-11-07 ~19:03 ET. Verbatim requirements from its errors:

- Required and missing: `dry` (boolean), `swapType` (EXACT_INPUT, EXACT_OUTPUT,
  FLEX_INPUT, ANY_INPUT), `slippageTolerance` (integer 0–10000),
  `depositType` (ORIGIN_CHAIN, INTENTS, CONFIDENTIAL_INTENTS), `refundTo` (string),
  `refundType` (ORIGIN_CHAIN, INTENTS, CONFIDENTIAL_INTENTS),
  `recipientType` (DESTINATION_CHAIN, INTENTS, CONFIDENTIAL_INTENTS),
  `deadline` (valid ISO 8601 date string).
- Rejected: `amountOut` — "property amountOut should not exist".

Fix `app/Jobs/RequestLicenseQuote.php` (it currently sends `swapType`,
`originAsset`, `destinationAsset`, `amount`, `amountOut`, `recipient`,
`refundTo`, `dry`) and the direct-service call in
`tests/Feature/OneClickAgentTest.php` (it sends only `originAsset`,
`destinationAsset`, `amount`, `recipient`) to send the full required payload.
Remove `amountOut`. Keep the job's intent: EXACT_OUTPUT for the tier price in
micro-units. Do not change the destination asset (USDC on Base,
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) or the recipient (scholar address).

## Task 2 — Implement the live MPC settlement path

`app/Services/MpcSettlementService.php::settleOnBase` currently THROWS for the
live path (`'Live MPC settlement requires NEAR credentials and deployed registry
address.'`, line ~125). The stub path is fine and must keep working when the
registry address is `stub` or empty.

Implement the production path, no stubs, no simulated hashes:

1. Build the unsigned EIP-1559 `recordLicense(buyer, workId, tier, proofHash)`
   transaction for the deployed registry (use the existing
   `encodeRecordLicenseCall`; selector `0x48967ddc`).
2. Hash the payload and call the NEAR Chain Signatures contract `sign`
   (`v1.signer`, mainnet) with path `ethereum-1`.
3. Assemble the signed transaction and relay it to Base (chain 8453).
4. Wait for the receipt, verify the `LicenseRecorded` event, return
   `txHash` / `blockNumber` / `relayedViaMpc: true` / `isStub: false`.

NEAR credentials: use the app's NEAR account (`stanza_glenride.near`) and
whatever function-call key the app already has configured. Check `.env` for
what is present; NEVER print a key or seed. If the signing key the MPC call
needs is missing, STOP and report exactly which credential is missing — do
not stub around it and do not invent one.

## Task 3 — Go live in config and verify

1. Set `LICENSE_REGISTRY_ADDRESS=0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00`
   in the iMac app `.env` (replace the `stub` line; do not touch any other line).
2. Run `php artisan config:clear`, then the FULL test suite: it must be
   **14 passed, 0 failed**. A live quote must return a real `depositAddress`
   and `quoteId` (not a stub).
3. Verify `isSettledOnChain` reads live against the deployed contract.
4. `git status` must show no application-code change you did not intend; do not
   touch the catalog, the seeder, or the contract (it is already deployed).

## Task 4 — Report back

Report: test output, the live quote's `quoteId` + `depositAddress` (deposit
addresses are public; never print keys), the registry address now configured,
and anything still blocked. Do NOT run a live paid purchase — that costs real
money and is D'Vaughn's call, not this order's.

## Hard rules

- If a step fails, stop and report. Do not change application code to make a
  failing test pass by weakening it, and do not stub a live path.
- Never print secrets (JWT, keys, seeds). Never commit `.env`.
- The contract is deployed; do not redeploy it.
