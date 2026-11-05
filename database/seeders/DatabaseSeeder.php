<?php

namespace Database\Seeders;

use App\Models\Work;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with 3 placeholder scholarly works.
     * Real manuscripts are D'Vaughn's pick and can be updated prior to final submission.
     */
    public function run(): void
    {
        $works = [
            [
                'work_id' => '0x' . hash('sha256', 'manuscript-stanza-computational-philology'),
                'title' => 'Computational Philology in the Post-Digital Age: Multi-Chain Attestation of Scholarly Texts',
                'slug' => 'computational-philology-post-digital',
                'scholar_name' => 'Dr. Miriam K. Vance',
                'scholar_address' => '0x5C10a12345678901234567890123456789012345',
                'metadata_uri' => 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
                'description' => 'An investigation into verifiable academic attribution, cryptographic license registration, and scholar recognition across distributed networks.',
                'tiers' => [
                    'read' => 5.00,
                    'citation' => 25.00,
                    'commercial' => 150.00,
                ],
                'is_active' => true,
            ],
            [
                'work_id' => '0x' . hash('sha256', 'manuscript-byzantine-astronomy-translations'),
                'title' => 'Astronomical Treatises of Late Byzantium: A Critical Translation and Commentary',
                'slug' => 'byzantine-astronomy-translations',
                'scholar_name' => 'Prof. Gregory P. Thorne',
                'scholar_address' => '0x7A89012345678901234567890123456789012345',
                'metadata_uri' => 'ipfs://bafybeic73q6kux4c36z24j4j3o2i3y4o2b5w3q2j4j3o2i3y4o2b5w3q2a',
                'description' => 'First critical edition and multi-source English translation of 14th-century Palaiologan planetary tables with mathematical commentary.',
                'tiers' => [
                    'read' => 8.00,
                    'citation' => 35.00,
                    'commercial' => 200.00,
                ],
                'is_active' => true,
            ],
            [
                'work_id' => '0x' . hash('sha256', 'manuscript-epigraphic-monographs-ephesus'),
                'title' => 'Epigraphic Landscapes of Classical Ionia: Public Inscriptions from the Agora of Ephesus',
                'slug' => 'epigraphic-landscapes-classical-ionia',
                'scholar_name' => 'Dr. Elena Rostova',
                'scholar_address' => '0x9B12345678901234567890123456789012345678',
                'metadata_uri' => 'ipfs://bafybeia23456789012345678901234567890123456789012345678901b',
                'description' => 'Comprehensive epigraphic survey and high-resolution photometric analysis of civic decrees and honorific monuments.',
                'tiers' => [
                    'read' => 10.00,
                    'citation' => 50.00,
                    'commercial' => 300.00,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($works as $data) {
            Work::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
