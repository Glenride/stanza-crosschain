import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Work {
    id: number;
    work_id: string;
    title: string;
    scholar_name: string;
    scholar_address: string;
    metadata_uri: string;
}

interface License {
    id: number;
    work_id: number;
    buyer_address: string;
    tier: string;
    price_usd: number;
    deposit_asset: string;
    deposit_chain: string;
    deposit_address: string;
    deposit_tx_hash: string | null;
    proof_hash: string | null;
    settlement_tx_hash: string | null;
    status: string;
    settled_at: string | null;
    work?: Work;
}

interface Props {
    initialQuery?: string;
    license?: License | null;
}

export default function Lookup({ initialQuery = '', license: initialLicense = null }: Props) {
    const [query, setQuery] = useState<string>(initialQuery);
    const [license, setLicense] = useState<License | null>(initialLicense);
    const [loading, setLoading] = useState<boolean>(false);
    const [searched, setSearched] = useState<boolean>(Boolean(initialQuery));
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const res = await fetch(`/api/lookup?hash=${encodeURIComponent(query.trim())}`);
            const data = await res.json();

            if (!res.ok || !data.found) {
                setLicense(null);
                setError(data.message || 'No license found matching that transaction or proof hash.');
            } else {
                setLicense(data.license);
            }
        } catch (err: any) {
            setLicense(null);
            setError(err.message || 'Failed to query license registry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="License Verification & Lookup — Stanza" />
            <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-8 md:py-12 flex flex-col justify-between">
                <div className="max-w-3xl mx-auto w-full">
                    {/* Header */}
                    <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5 gap-4">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                                BaseScan Verifiable Proofs
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                                License Verification
                            </h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Look up cryptographic license attestation by deposit transaction or proof hash.
                            </p>
                        </div>
                        <div>
                            <Link
                                href="/checkout"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition"
                            >
                                ← Back to Checkout
                            </Link>
                        </div>
                    </header>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Paste deposit tx hash, proof hash, or Base settlement hash..."
                                className="grow bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-lg transition disabled:opacity-50 shrink-0 font-mono"
                            >
                                {loading ? 'Searching...' : 'Lookup License'}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-6 text-center text-neutral-400 text-sm">
                            <p className="text-rose-400 font-medium mb-1">{error}</p>
                            <p className="text-xs text-neutral-500">
                                Ensure you copied the exact deposit transaction hash, proof hash, or 1Click deposit address.
                            </p>
                        </div>
                    )}

                    {license && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                                <div>
                                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                        Verified On-Chain
                                    </span>
                                    <h2 className="text-lg font-bold text-white mt-2">
                                        {license.work?.title || 'Scholarly Work'}
                                    </h2>
                                    <p className="text-xs text-neutral-400">
                                        Scholar: <span className="text-neutral-200">{license.work?.scholar_name}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase font-mono text-neutral-500">Tier</div>
                                    <div className="text-lg font-mono font-bold text-emerald-400 uppercase">
                                        {license.tier}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                                <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-850">
                                    <div className="text-neutral-500 uppercase text-[10px]">Licensee (Buyer)</div>
                                    <div className="text-neutral-200 break-all mt-1">{license.buyer_address}</div>
                                </div>
                                <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-850">
                                    <div className="text-neutral-500 uppercase text-[10px]">Scholar Address (Base)</div>
                                    <div className="text-neutral-200 break-all mt-1">{license.work?.scholar_address}</div>
                                </div>
                                <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-850">
                                    <div className="text-neutral-500 uppercase text-[10px]">Origin Payment Asset</div>
                                    <div className="text-neutral-200 mt-1">{license.deposit_asset} ({license.deposit_chain})</div>
                                </div>
                                <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-850">
                                    <div className="text-neutral-500 uppercase text-[10px]">Settled Timestamp</div>
                                    <div className="text-neutral-200 mt-1">{license.settled_at || 'Confirmed'}</div>
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-neutral-800 pt-4 text-xs font-mono">
                                <div>
                                    <div className="text-neutral-500 text-[10px] uppercase">Replay Protection Proof Hash (bytes32)</div>
                                    <div className="text-neutral-300 break-all mt-0.5 bg-neutral-950 p-2 rounded border border-neutral-800">
                                        {license.proof_hash}
                                    </div>
                                </div>

                                {license.settlement_tx_hash && (
                                    <div>
                                        <div className="text-neutral-500 text-[10px] uppercase">BaseScan Settlement Transaction</div>
                                        <div className="mt-0.5 bg-neutral-950 p-2 rounded border border-emerald-500/30 flex items-center justify-between">
                                            <a
                                                href={`https://basescan.org/tx/${license.settlement_tx_hash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-400 hover:underline break-all"
                                            >
                                                {license.settlement_tx_hash}
                                            </a>
                                            <span className="text-[10px] text-neutral-500 shrink-0 ml-2">Base (8453)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-4 text-xs text-neutral-300">
                                <span className="font-semibold text-emerald-400">STANZA Recognition Event: </span>
                                Scholar credited on-chain via <code className="text-emerald-300">ScholarCredited</code> event in <code className="text-emerald-300">LicenseRegistry.sol</code> signed by NEAR Chain Signatures MPC.
                            </div>
                        </div>
                    )}
                </div>

                <footer className="mt-12 text-center text-xs font-mono text-neutral-600 border-t border-neutral-900 pt-6">
                    Stanza Cross-Chain Licensing · Multi-Chain Attribution Engine
                </footer>
            </div>
        </>
    );
}
