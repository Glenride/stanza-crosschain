<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('works', function (Blueprint $table) {
            $table->id();
            $table->string('work_id', 66)->unique(); // bytes32 hex string, e.g. 0x...
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('scholar_name')->nullable();
            $table->string('scholar_address', 42); // EVM address on Base
            $table->string('metadata_uri'); // IPFS or URL
            $table->text('description')->nullable();
            $table->json('tiers')->nullable(); // Available tiers and pricing in USD
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('works');
    }
};
