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
        Schema::create('scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('scan_type')->default('text'); // 'text', 'url', 'image'
            $table->text('content');
            $table->string('risk_level');
            $table->integer('score')->default(0);
            $table->text('summary');
            $table->json('red_flags')->nullable();
            $table->json('recommendations')->nullable();
            $table->string('provider_used')->nullable();
            $table->string('model_used')->nullable();
            $table->boolean('is_mock')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};
