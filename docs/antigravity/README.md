# Antigravity — NEAR build "License It From Anywhere"

**Start here.** This folder is the whole assignment. Read `SCOPE.md` first (frozen plan, scoped Oct 23, corrected Oct 26), then pick an order below.

**Repo state:** `src/LicenseRegistry.sol` + 4 passing Foundry tests are done and on `main`. Nothing is deployed or submitted. The build starts today (Nov 5, 2026) — there is no prior scaffold or spike anywhere; build fresh.

**Submission deadline:** Nov 14, 2026, 6:59 PM EST. One-shot, uneditable. Feature freeze Nov 11 night.

## Locked rules (do not break these)
- NO EVM private key anywhere — not in the repo, not in `.env`, not on the server, not in chat. Settlement signs via NEAR Chain Signatures MPC only.
- Laravel is the shell, lean only: routing, Inertia React pages, Eloquent models + migrations, Queue jobs. Do NOT wire WorkOS auth or Cashier/Stripe — this build has no login system and no Stripe payment.
- STANZA is NOT the payment asset — recognition only (event + on-chain record). No fake swaps, no STANZA transfer.
- Do NOT build: marketplace, logins/account dashboard, procurement pivot, Solana-native settlement.
- Branch discipline: one feature branch per order (named below), push to GitHub, never force-push `main`. Janine works on `main` from another machine; the repo is the shared source of truth.
- Run the contract tests with: `export PATH="$HOME/.foundry/bin:$PATH" && forge test` (expect 4 passed).

## Order 1 — Laravel lean scaffold (branch: `antigravity/laravel-scaffold`)
Official laravel/react-starter-kit: Laravel 12 + Inertia 2 + React 19. Lean surface only (see rules). Models + migrations: Work, License. No auth scaffolding, no billing pages. Done when: `php artisan migrate` runs clean and a blank Inertia checkout page renders.

## Order 2 — OneClickService + agent jobs (branch: `antigravity/oneclick-agent`)
Build `OneClickService` (1Click API: quote → deposit address → poll `/v0/status`) and three Queue jobs: RequestLicenseQuote, WatchSettlement, SettleLicense. On 1Click SUCCESS, verify before any signing: status SUCCESS, amountOut/asset/destination match the stored quote exactly, work/tier/buyer match, on-chain `isSettled` is false. Then request the Chain Signatures MPC signature (contract `sign`, payload = tx hash, path `ethereum-1`, keyType `Ecdsa`), format it, relay the signed tx to Base (chain 8453), wait for receipt, verify the LicenseRecorded event, mark settled.
Live testing needs the 1Click API key (`ONECLICK_JWT`) — D'Vaughn holds it; build against the API docs with a stub key now and mark every live test as blocked on the key. Done when: quote returns a real deposit address (with key) and the job chain runs end-to-end on a stubbed quote without errors.

## Order 3 — Chain Signatures derive script (branch: `antigravity/mpc-derive`)
Script that takes a NEAR account ID as input and derives the deterministic EVM address for path `ethereum-1` (NEAR docs: docs.near.org/chain-abstraction/chain-signatures). Prints the address; success = it matches the relayer address passed to the LicenseRegistry constructor at deploy. Needs D'Vaughn's NEAR mainnet account ID to run — build it now, run it when he supplies the ID. Done when: script runs and prints a deterministic address for a test account ID.

## Order 4 — Checkout pages (branch: `antigravity/checkout`)
Guest-facing Inertia checkout pages: pick a work + tier, show the 1Click deposit address and payment status, license lookup by deposit/tx hash. No account dashboard, no login. Build with 3 placeholder works — the real manuscripts are D'Vaughn's pick and get swapped in later. Done when: the full checkout flow renders and the lookup page resolves a test tx hash.

## Order 5 — Base deploy script (branch: `antigravity/deploy-script`)
Foundry deploy script for LicenseRegistry to Base (chain 8453), constructor arg = MPC derived relayer address. Script takes the address as an argument; it is NOT on file yet, so the script must not hardcode one. Done when: `forge script` dry-runs clean against a Base fork with a test address.

## Order 6 — README for AI judges (branch: `antigravity/readme`)
README per `SCOPE.md`: "do X → see Y" steps, NEAR features named explicitly (1Click + Chain Signatures), contract addresses + links (fill after Friday's deploy), security story stated plainly (no EVM private key, MPC signing, onlyRelayer, replay protection). Draft it now from the scope + contract; addresses get filled in after deploy. Done when: a cold reader can follow it from clone to a settled license.

## Order 7 — Scholar side (branch: `antigravity/scholar-side`)
Read-only scholar page at `/scholar/{address}` — the scholar's wallet address in the URL, no login, same guest-facing rule as the rest of the app. It lists every license for their works: title, tier, buyer, price, deposit chain, status, when it settled, and the Base settlement transaction with a BaseScan link. Linked from the lookup page and checkout confirmation. STANZA stays recognition only. Full test suite green (`php artisan test`, `forge test`). Lands the section onto `main`.

## What Antigravity can NOT do (D'Vaughn only)
- NEAR mainnet account ID + 1Click API key — his gates, still unconfirmed. Nothing live-tests without them.
- Friday's Base deploy itself (needs the derived relayer address + his go).
- The 3 real manuscripts for checkout — his pick.
- Final submission Nov 14 (one-shot, uneditable — his explicit yes on the printed payload only).

## Schedule these land against
- Fri Nov 6, 10 AM–12 PM ET: Base deploy block. Orders 3 + 5 feed it.
- Nov 6–9: end-to-end on small amounts (one license bought cross-chain, recorded via MPC, repeatable twice). Nov 9 evening gate: MPC working twice = drop the hot-wallet fallback entirely.
- Nov 10–11: README + polish only. Feature freeze Nov 11 night.
- Nov 12–13: demo video + X post draft + submission payload printed.
- Nov 14, 6:59 PM EST: submission deadline.
