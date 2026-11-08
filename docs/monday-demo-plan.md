# Monday Demo Plan (moved up from Nov 12–13)

Target: record Monday Nov 9. Submission due Sat Nov 14, 6:59 PM EST, one-shot.

## Status going into Monday

- LIVE: catalog (3/3 manuscripts), LicenseRegistry on Base mainnet
  `0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00`, live 1Click quotes (14/14 tests
  green, real deposit addresses), funding done (~$1.84 buffer left).
- PENDING (Order 9, Antigravity): the live MPC settlement code. Without it the
  demo cannot show a real settlement. If it is not ready Monday, record beats
  1–2 + the live quote only, and say plainly the settlement lands next — do
  not fake a settlement.
- The demo purchase is REAL money: a $10 read-tier license, paid by the buyer
  from an EVM chain (ETH on Base). D'Vaughn's call when to run it.

## Demo video script (~2.5 min, screen recording)

- **Beat 1 (0:00–0:20) — What it is.** "License It From Anywhere. Buy a
  license for a scholarly work from any chain. The payment settles as USDC on
  Base, and the license is recorded on-chain by NEAR Chain Signatures — no EVM
  private key anywhere in the loop."
- **Beat 2 (0:20–0:50) — The catalog.** Show the three manuscripts. Open the
  Quadratic Funding replication. Pick the $10 read tier.
- **Beat 3 (0:50–1:30) — Checkout.** Request the quote. Show the live 1Click
  deposit address. Pay from Base. Watch the status flip to SUCCESS.
- **Beat 4 (1:30–2:10) — Settlement.** Show the MPC signature being requested
  and the `recordLicense` transaction relayed to Base. Open the Basescan
  transaction. Point at the `LicenseRecorded` event.
- **Beat 5 (2:10–2:30) — Verify.** Look the license up by transaction hash.
  Closing line: "The scholar gets paid in USDC. The license is on-chain.
  The signature came from MPC, not a hot wallet."

## X post (draft — do not post until the demo is recorded)

> License It From Anywhere is live on Base.
>
> Buy a license for a scholarly work from any chain. 1Click settles USDC on
> Base. NEAR Chain Signatures MPC records the license — no EVM private key.
>
> Contract: basescan.org/address/0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00
>
> Demo video coming Monday.

## Submission payload (draft)

- **Project:** License It From Anywhere (stanza-crosschain)
- **One-liner:** Buy a license for a scholarly work from any chain; 1Click
  settles USDC on Base and NEAR Chain Signatures MPC records the license.
- **Repo:** https://github.com/deevee3/stanza-crosschain
- **Contract (Base mainnet):**
  `0x3407bBf34488AC73B85B7f32463b1913Fcf9eA00`
- **Relayer (MPC, NEAR `stanza_glenride.near` path `ethereum-1`):**
  `0x4D538abf011e0885a6f87667Db466837B10b49f9`
- **Demo video:** [link goes here after Monday's recording]
- **Team:** D'Vaughn House (Glenride)
- **NEAR features used:** 1Click (cross-chain swap + deposit address +
  status) and Chain Signatures MPC (`v1.signer`, `sign`, path `ethereum-1`).
