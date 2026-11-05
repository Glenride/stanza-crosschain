<?php

namespace App\Http\Controllers;

use App\Jobs\RequestLicenseQuote;
use App\Models\License;
use App\Models\Work;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Render the guest-facing checkout page with active scholarly works.
     */
    public function index(): Response
    {
        $works = Work::where('is_active', true)->get();

        return Inertia::render('checkout', [
            'works' => $works,
        ]);
    }

    /**
     * Create a license request and dispatch the 1Click quote job.
     */
    public function createQuote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'work_id' => 'required|exists:works,id',
            'tier' => 'required|string|in:read,citation,commercial',
            'buyer_address' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{40}$/'],
            'deposit_asset' => 'required|string',
            'deposit_chain' => 'required|string',
        ]);

        $work = Work::findOrFail($validated['work_id']);
        $tier = $validated['tier'];
        $price = $work->tiers[$tier] ?? 5.00;

        $license = License::create([
            'work_id' => $work->id,
            'buyer_address' => $validated['buyer_address'],
            'tier' => $tier,
            'price_usd' => $price,
            'deposit_asset' => $validated['deposit_asset'],
            'deposit_chain' => $validated['deposit_chain'],
            'status' => 'pending',
        ]);

        // Dispatch quote job
        RequestLicenseQuote::dispatch($license);

        $license->refresh();

        return response()->json([
            'success' => true,
            'license' => $license->load('work'),
        ]);
    }

    /**
     * Check the current live status of a license.
     */
    public function getStatus(License $license): JsonResponse
    {
        return response()->json([
            'license' => $license->load('work'),
        ]);
    }

    /**
     * Render the license lookup page.
     */
    public function lookupPage(Request $request): Response
    {
        $query = $request->input('q');
        $license = null;

        if ($query) {
            $license = License::with('work')
                ->where('deposit_tx_hash', $query)
                ->orWhere('proof_hash', $query)
                ->orWhere('settlement_tx_hash', $query)
                ->orWhere('deposit_address', $query)
                ->first();
        }

        return Inertia::render('lookup', [
            'initialQuery' => $query,
            'license' => $license,
        ]);
    }

    /**
     * JSON API lookup for deposit / tx hash resolution.
     */
    public function resolveHash(Request $request): JsonResponse
    {
        $hash = $request->input('hash');
        if (empty($hash)) {
            return response()->json(['error' => 'Query hash is required.'], 400);
        }

        $license = License::with('work')
            ->where('deposit_tx_hash', $hash)
            ->orWhere('proof_hash', $hash)
            ->orWhere('settlement_tx_hash', $hash)
            ->orWhere('deposit_address', $hash)
            ->first();

        if (!$license) {
            return response()->json([
                'found' => false,
                'message' => 'No license found matching the provided transaction or proof hash.',
            ], 404);
        }

        return response()->json([
            'found' => true,
            'license' => $license,
        ]);
    }
}
