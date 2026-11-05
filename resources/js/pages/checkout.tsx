import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Work {
    id: number;
    work_id: string;
    title: string;
    slug: string;
    scholar_name: string;
    scholar_address: string;
    description: string;
    tiers: Record<string, number>;
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
    quote_id: string | null;
    deposit_tx_hash: string | null;
    proof_hash: string | null;
    settlement_tx_hash: string | null;
    status: string;
    settled_at: string | null;
    work?: Work;
}

interface Props {
    works: Work[];
}

const DEPOSIT_CHAINS = [
    { id: 'near', name: 'NEAR Protocol', asset: 'nep141:wrap.near', symbol: 'NEAR' },
    { id: 'solana', name: 'Solana', asset: 'solana:native', symbol: 'SOL' },
    { id: 'base', name: 'Base', asset: 'erc20:base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC' },
    { id: 'arbitrum', name: 'Arbitrum', asset: 'arbitrum:native', symbol: 'ETH' },
];

export default function Checkout({ works }: Props) {
    const [selectedWorkId, setSelectedWorkId] = useState<number>(works[0]?.id || 1);
    const [selectedTier, setSelectedTier] = useState<string>('read');
    const [selectedChain, setSelectedChain] = useState(DEPOSIT_CHAINS[0]);
    const [buyerAddress, setBuyerAddress] = useState<string>('0xB001234567890123456789012345678901234567');
    const [loading, setLoading] = useState<boolean>(false);
    const [currentLicense, setCurrentLicense] = useState<License | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const activeWork = works.find((w) => w.id === selectedWorkId) || works[0];
    const currentPrice = activeWork?.tiers[selectedTier] || 5.0;

    const handleCreateQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

            const res = await fetch('/api/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    work_id: activeWork.id,
                    tier: selectedTier,
                    buyer_address: buyerAddress,
                    deposit_asset: selectedChain.asset,
                    deposit_chain: selectedChain.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate quote');
            }

            setCurrentLicense(data.license);
        } catch (err: any) {
            setError(err.message || 'An error occurred generating the 1Click quote.');
        } finally {
            setLoading(false);
        }
    };

    const copyDepositAddress = () => {
        if (currentLicense?.deposit_address) {
            navigator.clipboard.writeText(currentLicense.deposit_address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Head title="License It From Anywhere — Stanza Cross-Chain" />
            <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-8 md:py-12 flex flex-col justify-between">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                                    NEAR Intents 1Click + Chain Signatures MPC
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                                Stanza Cross-Chain Licensing
                            </h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Pay from NEAR, Solana, or any EVM chain. Settles on Base with zero server EVM private keys.
                            </p>
                        </div>
                        <div>
                            <Link
                                href="/lookup"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                License Lookup
                            </Link>
                        </div>
                    </header>

                    {error && (
                        <div className="mb-6 rounded-lg bg-rose-950/60 border border-rose-800/80 p-4 text-sm text-rose-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Form & Work Selection */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Step 1: Work Selection */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                                    1. Select Scholarly Manuscript
                                </label>
                                <div className="space-y-3">
                                    {works.map((work) => {
                                        const isSelected = work.id === activeWork.id;
                                        return (
                                            <div
                                                key={work.id}
                                                onClick={() => setSelectedWorkId(work.id)}
                                                className={`cursor-pointer rounded-lg p-4 border transition ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-neutral-850/80 ring-1 ring-emerald-500/50'
                                                        : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold text-white text-sm leading-snug">
                                                        {work.title}
                                                    </h3>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    Scholar: <span className="text-neutral-300">{work.scholar_name}</span>
                                                </p>
                                                <p className="text-[11px] font-mono text-neutral-500 truncate mt-0.5">
                                                    Base Address: {work.scholar_address}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: License Tier Selection */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                                    2. Select License Tier
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['read', 'citation', 'commercial'].map((tierKey) => {
                                        const price = activeWork?.tiers[tierKey] || 0;
                                        const isSelected = selectedTier === tierKey;
                                        return (
                                            <button
                                                type="button"
                                                key={tierKey}
                                                onClick={() => setSelectedTier(tierKey)}
                                                className={`rounded-lg p-3 text-center border transition ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-950/30 text-white'
                                                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                                                }`}
                                            >
                                                <div className="text-xs uppercase font-mono tracking-wider font-semibold">
                                                    {tierKey}
                                                </div>
                                                <div className="text-lg font-bold text-white mt-1">
                                                    ${price.toFixed(2)}
                                                </div>
                                                <div className="text-[10px] text-neutral-500 mt-0.5">
                                                    USDC on Base
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 3: Payment Origin Chain */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                                    3. Pay From Origin Chain (1Click Deposit)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DEPOSIT_CHAINS.map((chain) => {
                                        const isSelected = selectedChain.id === chain.id;
                                        return (
                                            <button
                                                type="button"
                                                key={chain.id}
                                                onClick={() => setSelectedChain(chain)}
                                                className={`rounded-lg p-2.5 text-center border transition ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-neutral-800 text-white'
                                                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                                                }`}
                                            >
                                                <div className="text-xs font-medium">{chain.name}</div>
                                                <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                                                    {chain.symbol}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs font-mono text-neutral-400 mb-1">
                                        Buyer EVM Address (Licensee)
                                    </label>
                                    <input
                                        type="text"
                                        value={buyerAddress}
                                        onChange={(e) => setBuyerAddress(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500 transition"
                                        placeholder="0x..."
                                        required
                                    />
                                    <p className="text-[11px] text-neutral-500 mt-1">
                                        The address recorded as the verified buyer on Base LicenseRegistry.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCreateQuote}
                                    disabled={loading}
                                    className="mt-5 w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span>Generating 1Click Quote...</span>
                                    ) : (
                                        <span>Get Deposit Address (${currentPrice.toFixed(2)} USD)</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Quote & MPC Settlement Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sticky top-6 shadow-xl">
                                <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-3">
                                    Settlement Summary
                                </h2>

                                {!currentLicense ? (
                                    <div className="py-12 text-center text-neutral-500 text-xs font-mono">
                                        Select manuscript and click "Get Deposit Address" to generate cross-chain quote.
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-5">
                                        <div>
                                            <span className="text-[11px] uppercase font-mono text-neutral-500">Status</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                        currentLicense.status === 'settled'
                                                            ? 'bg-emerald-400'
                                                            : 'bg-amber-400 animate-pulse'
                                                    }`}
                                                />
                                                <span className="text-sm font-bold uppercase font-mono text-white">
                                                    {currentLicense.status}
                                                </span>
                                            </div>
                                        </div>

                                        {currentLicense.deposit_address && (
                                            <div>
                                                <span className="text-[11px] uppercase font-mono text-neutral-500">
                                                    1Click Deposit Address ({selectedChain.name})
                                                </span>
                                                <div className="mt-1 flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5">
                                                    <span className="text-xs font-mono text-emerald-400 break-all select-all">
                                                        {currentLicense.deposit_address}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={copyDepositAddress}
                                                        className="shrink-0 p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-800 hover:bg-neutral-700 transition"
                                                        title="Copy address"
                                                    >
                                                        {copied ? (
                                                            <span className="text-[10px] text-emerald-400 font-mono">✓</span>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 text-xs font-mono border-t border-neutral-800 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Work:</span>
                                                <span className="text-neutral-200 truncate max-w-[180px]">
                                                    {activeWork.title}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Scholar Address:</span>
                                                <span className="text-neutral-200">
                                                    {activeWork.scholar_address.slice(0, 8)}...{activeWork.scholar_address.slice(-6)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Tier:</span>
                                                <span className="text-emerald-400 uppercase font-semibold">
                                                    {currentLicense.tier}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Settlement Chain:</span>
                                                <span className="text-neutral-200">Base Mainnet (8453)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Signing Authority:</span>
                                                <span className="text-neutral-200">NEAR MPC (path ethereum-1)</span>
                                            </div>
                                        </div>

                                        {currentLicense.settlement_tx_hash && (
                                            <div className="rounded-lg bg-neutral-950 border border-emerald-500/40 p-3 text-xs font-mono">
                                                <div className="text-emerald-400 font-semibold mb-1">
                                                    ✓ BaseScan Settlement Receipt
                                                </div>
                                                <a
                                                    href={`https://basescan.org/tx/${currentLicense.settlement_tx_hash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-neutral-400 hover:text-emerald-300 underline break-all"
                                                >
                                                    {currentLicense.settlement_tx_hash}
                                                </a>
                                                <div className="mt-2 text-[11px] text-neutral-400">
                                                    Attestation: Scholar recognized on-chain in STANZA credit event.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-xs font-mono text-neutral-600 border-t border-neutral-900 pt-6">
                    Stanza Cross-Chain Licensing · Built with NEAR Intents 1Click & Chain Signatures MPC · Base Mainnet (8453)
                </footer>
            </div>
        </>
    );
}
