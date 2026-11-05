# NEAR Nov 1–14 Build — Scoped Plan
**Scoped 2026-10-23. Concept is the one already approved 2026-10-19/20 — not a new idea.**
**SWITCHED 2026-10-26 at his direction: framework is now the Laravel starter kit, because auth and payment are baked in.**
**CORRECTED 2026-10-26 07:18 ET, his words: do NOT use Laravel components just because they are in the kit. Laravel is the shell he vibe-codes in — use only what the build needs. WorkOS and Cashier are NOT wired in this build. And settlement is upgraded to the more substantive, secure path below — NEAR Chain Signatures (MPC) as primary, with a hardened hot-wallet fallback only if MPC is not working by Nov 9.**
Source brief: stanza-cross-chain-brief.md | Repo plan: repo-skeleton-plan.md | Setup: near-account-setup.md

## Framework — Laravel, lean
**Official laravel/react-starter-kit: Laravel 12 + Inertia 2 + React 19** — the same base as D'Quizz / InspireWrite, the stack he can explain. The kit also ships WorkOS + Cashier, but this build does NOT use them:

- **Used:** Routing, Inertia React pages, Eloquent models + migrations, Queue jobs, validation. That is the whole Laravel surface.
- **NOT used:** WorkOS auth — checkout is guest-facing, licenses are looked up by deposit / tx hash, there is no account dashboard in the demo. No login system is built.
- **NOT used:** Cashier / Stripe — there is no Stripe payment in this build. The payment is 1Click crypto settlement, not Stripe. Do not configure Stripe keys, do not add billing pages, do not claim Cashier settles anything here.
- If a later version needs accounts or Stripe, the kit already has them — that is a later decision, not this hackathon.

## Settlement — Chain Signatures (MPC), primary
This replaces the earlier plan of a Node settler script holding an EVM private key in the Laravel server. That plan worked, but it put a Base private key on a server. The secure way is to never hold one.

**How it works (NEAR Docs, docs.near.org/chain-abstraction/chain-signatures, updated 2026-10-20):**
1. Derive the foreign address: his NEAR account + derivation path `ethereum-1` deterministically gives an EVM address on Base. No key is created or stored for that address.
2. Build the unsigned transaction: Laravel builds `recordLicense(buyer, work, tier, 1Click proof)` for LicenseRegistry on Base (chain 8453), with nonce, gas, and the exact data verified against the stored 1Click quote.
3. Request the signature: call `sign` on the NEAR MPC contract with the tx hash payload, path `ethereum-1`, keyType `Ecdsa`. The MPC network (17 mainnet operators, threshold cryptography — no single node holds the key) signs it.
4. Format the signature and relay the signed tx to Base via RPC. Wait for receipt, verify the LicenseRecorded event, mark settled.

**Key rule: no EVM private key exists anywhere in this build — not in the repo, not in .env, not on the server, not in chat.**
The only NEAR-side key the server ever holds, if any, is a function-call-only access key for a dedicated settlement subaccount, restricted to calling the MPC contract only, with a small NEAR allowance, revocable at any time. It cannot transfer funds and cannot call any other contract. The MPC request itself is the signing step — the EVM key never exists to leak.

**LicenseRegistry hardening (part of the contract, not an afterthought):**
- `onlyRelayer` — only the Chain Signatures derived address can call `recordLicense`. Not owner, not treasury, not anyone else.
- Idempotency — `settled[1ClickSwapHash / depositTxHash]` mapping, revert on replay. A payment can only ever record one license.
- Verification before signing — Laravel checks, before requesting any signature: 1Click status is SUCCESS, amountOut / asset / destination match the stored quote exactly, work / tier / buyer match, and `isSettled` on-chain is false.
- Proceeds separation — 1Click USDC on Base goes to the scholar / treasury address set per work. The settler address holds only gas ETH (a few dollars, topped up manually). It never holds USDC proceeds.
- Events for every license, so the demo is verifiable on BaseScan.

**Fallback, gated Nov 9 evening:** if Chain Signatures E2E has not worked twice by Nov 9, use a hardened viem relayer instead for the demo — dedicated EVM wallet, only gas ETH, only `recordLicense` role, same idempotency + verification checks, key in the server secret store only (never in repo), rotated after the hackathon, and disclosed as the fallback in the README. The fallback is not the story; MPC is. Do not silently ship the fallback as if it were MPC.

## The build (frozen)
**"License It From Anywhere" — stanza-crosschain**
Reader pays in a major asset from NEAR / Solana / any EVM chain → NEAR Intents 1Click (quote → deposit → poll) settles USDC on Base → LicenseRegistry (Base, Solidity/Foundry) records the license and credits the scholar in STANZA recognition, with the recordLicense tx signed by NEAR Chain Signatures MPC.
STANZA is NOT the payment asset (no market, not a 1Click asset) — recognition only, per frozen spec. No fake swaps.

Tracks (one submission, multi-track allowed): realworld, agents, business, open
Framing: watcher = autonomous licensing agent. Humans set prices / tiers / splits; agent quotes, accepts, issues, pays out.

Deadline: **Nov 14, 23:59 UTC = 6:59 PM EST.** One-shot, uneditable submission.
Judging: Nov 16–18, results by Nov 18. Judges include Claude Code + Codex (AI) — README is a judged artifact.

## IN scope — must ship
1. LicenseRegistry.sol on Base mainnet: registerWork, recordLicense(buyer, work, tier, 1Click proof), credit scholar STANZA recognition, onlyRelayer + replay protection. Foundry tests passing. BaseScan-verifiable.
2. Laravel app, lean: checkout Inertia pages, License / Work models + migrations, Queue jobs. No WorkOS, no Cashier in this build.
3. Laravel agent: OneClickService + RequestLicenseQuote / WatchSettlement / SettleLicense jobs — 1Click quote → deposit address → poll /v0/status → on SUCCESS, verify, then request a Chain Signatures MPC signature and relay to Base.
4. End-to-end proof on dust/mainnet-small amounts: NEAR USDC → Base USDC, at least one real license recorded via MPC, repeatable twice.
5. README per repo-skeleton outline, written for AI judges: "do X → see Y" steps, NEAR features named explicitly (1Click + Chain Signatures), contract addresses + links, and the security story stated plainly (no EVM private key, MPC signing, onlyRelayer, replay protection).
6. Demo: ~2-min video (pay from another chain → license lands on Base → scholar credited) + D'Vaughn's own X post saying "built at NEAR HACKATHON".

## OUT of scope — explicitly cut
- STANZA as payment / swap asset, any marketplace, Solana-native settlement (Solana is a *deposit* origin via 1Click only).
- New manuscript content, No Excuses Fund application work inside this build (this build *feeds* that story, it isn't it).
- Any procurement / generic agent pivot — the research report floated that; the approved licensing build overrides it.
- WorkOS login system, Cashier / Stripe billing — not built, not configured, not claimed.
- A server-held EVM private key for settlement — explicitly banned in this build.

## Day plan (8 focused build days in 14)
- **Pre-Nov 1 (D'Vaughn, ~15 min, gates everything):** [ ] NEAR mainnet account created, seed phrase on paper offline, account ID sent to Janine. [ ] 1Click API key from partners.near-intents.org, stored in password manager (ONECLICK_JWT, never in repo/chat). [ ] Dedicated settlement subaccount considered for the MPC function-call key (small NEAR allowance only).
- **Nov 1–2:** Laravel scaffold (lean) + two spikes: 1Click quote via OneClickService (success = real deposit address), AND Chain Signatures derive address for path `ethereum-1` (success = deterministic EVM address printed, matches the relayer address set in the contract).
- **Nov 4–5:** LicenseRegistry + tests (onlyRelayer + replay protection) → deploy Base. Success = test suite green + BaseScan tx. (Nov 3 is Meta submit day — no Registry work that day.)
- **Nov 6–9:** Checkout (Inertia) + agent jobs + MPC settlement end-to-end on small amounts. Success = one license bought cross-chain, recorded via MPC, scholar credited — repeatable twice. **Nov 9 evening gate:** MPC working twice = drop the hot-wallet fallback entirely. MPC not working = fall back to the hardened viem relayer for the demo, disclosed in the README.
- **Nov 10–11:** README + polish ONLY. Freeze features Nov 11 night.
- **Nov 12–13:** Demo video recorded, X post drafted, submission payload printed in full.
- **Nov 14:** Repo public → D'Vaughn explicit yes on exact payload → submit well before 6:59 PM EST.

## Verification (falsifiable, per milestone)
OneClickService quote returns deposit address with key / Chain Signatures derive address matches contract relayer / LicenseRegistry tests pass (incl. replay revert + non-relayer revert) + deployed tx / E2E license #1 and #2 on BaseScan, both via MPC signatures, no EVM key in repo or .env (grep check) / README steps followed cold produce SETTLED / Payload printed and confirmed before submit (no edit after).

## Risks
Bandwidth (plan is 8 days, leaves buffer) · 1Click key gating quotes (403 without key — known, pre-empted) · Chain Signatures is the new risk — it is a real MPC integration, not a config change; mitigated by the Nov 1–2 derive spike, the Nov 9 fallback gate, and keeping the contract + 1Click work independent of MPC so a fallback still ships a working demo · Scope creep into a full auth/billing build (cut above — lean Laravel only) · One-shot submission error (payload gate on Nov 12–13, not Nov 14).
