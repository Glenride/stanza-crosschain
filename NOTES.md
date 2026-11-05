# LicenseRegistry draft — for Thu Nov 5, 2026, 10:00 AM-12:00 PM ET block

Status: DRAFT only. Nothing deployed, nothing submitted, no repo created.
Calendar: Thu Nov 5 build (LicenseRegistry + Foundry tests), Fri Nov 6 deploy to Base,
per the calendar blocks. Scope doc said Nov 4-5; calendar has deploy on Nov 6 — follow the calendar.

What this draft follows (scope, not invention):
- registerWork / recordLicense(buyer, work, tier, 1Click proof) on Base (chain 8453)
- onlyRelayer: only the Chain Signatures derived address may call recordLicense
- replay protection: settled[proofHash] mapping, revert on second use
- events for every license, so the demo is BaseScan-verifiable
- NO EVM private key anywhere in this build; no WorkOS, no Cashier, no Stripe

Open points for D'Vaughn in the block (not decided here):
1. Relayer address: pass the MPC derived address (path ethereum-1) to the constructor
   at deploy time. It is not on file yet — that is why it is a constructor argument.
2. STANZA credit: this draft records it as an event + on-chain record (recognition
   only, per the frozen spec). An actual STANZA token transfer would be a separate
   decision before deploy — do not assume it.
3. registerWork access: this draft leaves it open (anyone may register a work).
   If registration should be restricted, add that gate in the block, not silently.

Run the tests: export PATH="$HOME/.foundry/bin:$PATH" && forge test

Verified 2026-11-04: forge test, Solc 0.8.24 — 4 passed, 0 failed
(relayer record, non-relayer revert, replay revert, unknown-work revert).
forge-std in lib/ is a local copy from the fractional-mutual-fund prototype
(network fetch was blocked in this run); in the real repo, use the normal
forge install so lib/ is a submodule, not a copy.
