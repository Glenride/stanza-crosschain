<?php

namespace App\Http\Controllers;

use App\Models\License;
use App\Models\Work;
use Inertia\Inertia;
use Inertia\Response;

class ScholarController extends Controller
{
    /**
     * Display the read-only, guest-facing scholar license list and portfolio.
     *
     * @param string $address
     * @return Response
     */
    public function show(string $address): Response
    {
        $normalizedAddress = strtolower(trim($address));

        // Find all works registered by this scholar (case-insensitive)
        $works = Work::whereRaw('LOWER(scholar_address) = ?', [$normalizedAddress])->get();

        // Get all licenses across all works authored by this scholar
        $licenses = License::whereIn('work_id', $works->pluck('id'))
            ->with('work')
            ->orderByDesc('created_at')
            ->get();

        $settledLicenses = $licenses->where('status', 'settled');
        $totalRevenueUsd = (float) $settledLicenses->sum('price_usd');

        // Scholar name from registered works, or fallback to abbreviated address
        $scholarName = $works->first()?->scholar_name;

        return Inertia::render('scholar', [
            'scholarAddress' => $address,
            'scholarName' => $scholarName,
            'works' => $works,
            'licenses' => $licenses,
            'stats' => [
                'totalWorks' => $works->count(),
                'totalLicenses' => $licenses->count(),
                'settledLicenses' => $settledLicenses->count(),
                'totalRevenueUsd' => number_format($totalRevenueUsd, 2, '.', ''),
            ],
        ]);
    }
}
