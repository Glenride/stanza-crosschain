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
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_id')->constrained('works')->cascadeOnDelete();
            $table->string('buyer_address', 42); // EVM address of buyer
            $table->string('tier'); // e.g. 'read', 'citation', 'commercial'
            $table->decimal('price_usd', 10, 2)->default(0);
            $table->string('deposit_asset')->nullable(); // e.g. 'NEAR', 'SOL', 'USDC'
            $table->string('deposit_chain')->nullable(); // e.g. 'near', 'solana', 'base'
            $table->string('deposit_address')->nullable(); // 1Click deposit address
            $table->string('quote_id')->nullable()->index(); // 1Click quote ID
            $table->json('quote_payload')->nullable(); // stored 1Click quote payload
            $table->string('deposit_tx_hash')->nullable()->index(); // inbound deposit/payment transaction hash
            $table->string('proof_hash', 66)->nullable()->unique(); // bytes32 hex for on-chain replay protection
            $table->string('settlement_tx_hash', 66)->nullable()->index(); // Base recordLicense tx hash
            $table->string('status')->default('pending')->index(); // pending, quoted, deposited, signing, settled, failed
            $table->text('error_message')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
