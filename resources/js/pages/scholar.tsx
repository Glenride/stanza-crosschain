import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Work {
    id: number;
    work_id: string;
    title: string;
    slug?: string;
    scholar_name: string;
    scholar_address: string;
    description?: string;
    metadata_uri?: string;
    tiers?: Record<string, number>;
}

interface License {
    id: number;
    work_id: number;
    buyer_address: string;
    tier: string;
    price_usd: number;
    deposit_asset: string;
    deposit_chain: string;
    deposit_address: string | null;
    deposit_tx_hash: string | null;
    proof_hash: string | null;
    settlement_tx_hash: string | null;
    status: string;
    settled_at: string | null;
    created_at?: string;
    work?: Work;
}

interface Stats {
    totalWorks: number;
    totalLicenses: number;
    settledLicenses: number;
    totalRevenueUsd: string;
}

interface Props {
    scholarAddress: string;
    scholarName?: string | null;
    works: Work[];
    licenses: License[];
    stats: Stats;
}

export default function Scholar({ scholarAddress, scholarName, works, licenses, stats }: Props) {
    const [copied, setCopied] = useState<boolean>(false);

    const copyAddress = () => {
        navigator.clipboard.writeText(scholarAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Head title={`Scholar Portfolio — ${scholarName || scholarAddress.slice(0, 10)} — Stanza`} />
            <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-8 md:py-12 flex flex-col justify-between">
                <div className="max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                                    Scholar Portfolio & Attribution Ledger
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                                {scholarName ? scholarName : 'Scholar Registry'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs font-mono text-neutral-400">Recipient Address:</span>
                                <code className="text-xs font-mono text-neutral-200 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded break-all">
                                    {scholarAddress}
                                </code>
                                <button
                                    type="button"
                                    onClick={copyAddress}
                                    className="p-1 text-neutral-400 hover:text-white rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono transition"
                                    title="Copy address"
                                >
                                    {copied ? '✓ Copied' : 'Copy'}
                                </button>
                                <a
                                    href={`https://basescan.org/address/${scholarAddress}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                                >
                                    BaseScan ↗
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href="/checkout"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition"
                            >
                                ← Checkout
                            </Link>
                            <Link
                                href="/lookup"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition"
                            >
                                License Lookup
                            </Link>
                        </div>
                    </header>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Registered Works
                            </div>
                            <div className="text-2xl font-bold font-mono text-white mt-1">
                                {stats.totalWorks}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                                Works on Base registry
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Total Licenses
                            </div>
                            <div className="text-2xl font-bold font-mono text-white mt-1">
                                {stats.totalLicenses}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                                {stats.settledLicenses} settled on Base
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Total Revenue
                            </div>
                            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                                ${stats.totalRevenueUsd}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                                USDC directly to scholar
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                STANZA Credit
                            </div>
                            <div className="text-sm font-semibold font-mono text-emerald-300 mt-2 truncate">
                                On-Chain Record
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1">
                                Recognition event per license
                            </div>
                        </div>
                    </div>

                    {/* Registered Manuscripts */}
                    {works.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                                Registered Manuscripts ({works.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {works.map((work) => (
                                    <div
                                        key={work.id}
                                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-semibold text-white">
                                                    {work.title}
                                                </h3>
                                                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850 shrink-0">
                                                    {work.work_id}
                                                </span>
                                            </div>
                                            {work.description && (
                                                <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                                                    {work.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                                            <span className="text-neutral-500 text-[11px]">
                                                {work.metadata_uri ? (
                                                    <span className="truncate max-w-[200px] block">
                                                        URI: {work.metadata_uri}
                                                    </span>
                                                ) : (
                                                    <span>Verified on Base</span>
                                                )}
                                            </span>
                                            <Link
                                                href={`/checkout`}
                                                className="text-emerald-400 hover:underline text-[11px]"
                                            >
                                                License Work →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Licenses Ledger */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                                    License Ledger & Settlements
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Every license issued across all chains, settled to this scholar via NEAR Chain Signatures MPC.
                                </p>
                            </div>
                            <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
                                {licenses.length} record{licenses.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        {licenses.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-neutral-500 text-sm font-mono mb-2">
                                    No licenses recorded for this scholar address yet.
                                </div>
                                <p className="text-xs text-neutral-600 max-w-md mx-auto">
                                    When readers license works with payment from NEAR, Solana, or EVM chains,
                                    1Click routes USDC to this address and MPC relayers record the license on Base.
                                </p>
                                <div className="mt-5">
                                    <Link
                                        href="/checkout"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition"
                                    >
                                        Go to Checkout
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-500 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Work / Title</th>
                                            <th className="py-3 px-4">Tier</th>
                                            <th className="py-3 px-4">Buyer Address</th>
                                            <th className="py-3 px-4">Price (USD)</th>
                                            <th className="py-3 px-4">Deposit Chain</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Settled At</th>
                                            <th className="py-3 px-4 text-right">BaseScan Tx</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/60">
                                        {licenses.map((lic) => (
                                            <tr key={lic.id} className="hover:bg-neutral-850/50 transition">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-sans font-medium text-white max-w-[180px] sm:max-w-[220px] truncate" title={lic.work?.title || 'Unknown'}>
                                                        {lic.work?.title || 'Unknown Work'}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500">
                                                        ID: {lic.work?.work_id || lic.work_id}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                                        lic.tier === 'commercial'
                                                            ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                                                            : lic.tier === 'citation'
                                                            ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                                                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                                    }`}>
                                                        {lic.tier}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-neutral-300">
                                                    <span className="font-mono text-[11px]" title={lic.buyer_address}>
                                                        {lic.buyer_address.slice(0, 6)}...{lic.buyer_address.slice(-4)}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-emerald-400">
                                                    ${Number(lic.price_usd).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-neutral-300 capitalize">
                                                    <div>{lic.deposit_chain}</div>
                                                    <div className="text-[10px] text-neutral-500 truncate max-w-[100px]" title={lic.deposit_asset}>
                                                        {lic.deposit_asset.split(':').pop()}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                                        lic.status === 'settled'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : lic.status === 'failed'
                                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    }`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                                            lic.status === 'settled' ? 'bg-emerald-400' : 'bg-amber-400'
                                                        }`} />
                                                        {lic.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                                                    {lic.settled_at ? lic.settled_at : (lic.created_at || 'Pending')}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {lic.settlement_tx_hash ? (
                                                        <a
                                                            href={`https://basescan.org/tx/${lic.settlement_tx_hash}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-emerald-400 hover:underline text-[11px] inline-flex items-center gap-1"
                                                            title={lic.settlement_tx_hash}
                                                        >
                                                            <span>{lic.settlement_tx_hash.slice(0, 6)}...{lic.settlement_tx_hash.slice(-4)}</span>
                                                            <span>↗</span>
                                                        </a>
                                                    ) : lic.proof_hash ? (
                                                        <Link
                                                            href={`/lookup?hash=${encodeURIComponent(lic.proof_hash)}`}
                                                            className="text-neutral-400 hover:text-white underline text-[11px]"
                                                        >
                                                            Proof
                                                        </Link>
                                                    ) : (
                                                        <span className="text-neutral-600 text-[11px]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <span className="font-semibold text-neutral-300">Attestation Standard: </span>
                                Each settlement emits <code className="text-emerald-400">ScholarCredited(workId, scholar, tier)</code> on Base (8453).
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                                STANZA recognition only · No token transfer
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-xs font-mono text-neutral-600 border-t border-neutral-900 pt-6">
                    Stanza Cross-Chain Licensing · Multi-Chain Attribution Engine · Base Mainnet (8453)
                </footer>
            </div>
        </>
    );
}
