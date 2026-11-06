# Order 8 — Catalog completion: tests, re-seed, delete the old placeholder rows

**Branch:** work directly on `main` for this order only — no code changes are
expected. If a test failure forces a code change, stop and report it instead
of fixing it on main.

## Context

The 3 demo manuscripts in the checkout catalog were invented placeholders
(Vance, Thorne, Rostova — fake scholars, fake IPFS URIs). D'Vaughn has
replaced all 3 with his own manuscripts, and the seeder + README are already
updated on `main`:

1. QF replication study — `docs/manuscripts/qf-replication.md`,
   slug `qf-replication-flexible-design-funding-public-goods`
2. STANZA license design — `docs/manuscripts/stanza-license-design.md`,
   slug `stanza-license-it-from-anywhere-cross-chain-design`
3. Harness replication study — `docs/manuscripts/harness-replication.md`,
   slug `harness-replication-barbaste-2026`

All 3: scholar `D'Vaughn House`, scholar address (payee)
`0x2c432c901d5844431b027dd652fbfd3cc3dd6094`, tiers read $10.00 / citation
$25.00 / commercial $150.00. Manuscript links are GitHub blob URLs on
`main` under `docs/manuscripts/`.

## Where to work

The app checkout on the iMac is `~/Documents/antigravity/wise-brahmagupta`.
First verify it is this repo: `git remote -v` must show
`deevee3/stanza-crosschain`, then `git pull origin main`.

## Steps

1. **Run the test suite:** `php artisan test`. It must be green. If any
   test fails, STOP and report the failure — do not change application code
   to make it pass.
2. **Re-seed:** `php artisan db:seed`. The seeder uses `updateOrCreate`
   keyed on slug, so this ADDS the 3 new works but does NOT delete the old
   placeholder rows. That is expected — step 3 is the deletion.
3. **List the works table first** (e.g. via tinker) and show the rows. Then
   delete ONLY the 3 placeholder rows — the ones whose scholar is NOT
   `D'Vaughn House` (Vance, Thorne, Rostova). Delete nothing else.
4. **Verify:** the works table holds exactly 3 rows, all scholar
   `D'Vaughn House`, all payee `0x2c432c901d5844431b027dd652fbfd3cc3dd6094`,
   tiers $10 / $25 / $150. Confirm each manuscript blob URL returns 200.
5. **Report back:** test output, seed output, works rows before and after
   the deletion, and the final count (3).

## Locked rules for this order

- No EVM private key anywhere. Nothing in this order needs one.
- Do not change any manuscript file, tier, slug, scholar name, or payee.
- Do not deploy anything. Do not touch `.env` secrets — you may check that
  `ONECLICK_JWT` is set, but never print its value.
- Database: the ONLY writes are the seed and the deletion of the 3
  placeholder rows. If the works table holds anything unexpected, stop and
  report it instead of deleting.

## Done when

`php artisan test` is green, the seed ran, the works table holds exactly the
3 manuscripts above, and all 3 manuscript links return 200.
