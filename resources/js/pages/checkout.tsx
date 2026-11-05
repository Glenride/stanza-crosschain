import { Head } from '@inertiajs/react';

export default function Checkout() {
    return (
        <>
            <Head title="Checkout — Stanza Cross-Chain Licensing" />
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
                    <div className="mb-6 border-b border-neutral-800 pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                                Stanza Cross-Chain
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                                Base Mainnet (8453)
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                            License Checkout
                        </h1>
                        <p className="mt-1 text-sm text-neutral-400">
                            License scholarly works from any chain via NEAR Intents 1Click settlement.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/50 p-6 text-center">
                            <p className="text-sm text-neutral-400">
                                Blank Inertia checkout scaffold active. Order 4 will wire manuscript selection, deposit quote, and MPC settlement status.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
