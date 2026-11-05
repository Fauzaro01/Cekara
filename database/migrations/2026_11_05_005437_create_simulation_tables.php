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
        Schema::create('simulation_scenarios', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category'); // apk_malware, fake_job, phishing_banking, social_engineering, loan_scam, fake_giveaway
            $table->string('difficulty')->default('sedang'); // mudah, sedang, sulit
            $table->text('context_description');
            $table->string('sender_name');
            $table->string('sender_avatar')->nullable();
            $table->json('chat_messages');
            $table->json('options');
            $table->json('psychological_tricks');
            $table->json('red_flags');
            $table->text('prevention_advice');
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('simulation_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('simulation_scenario_id')->constrained()->cascadeOnDelete();
            $table->string('selected_option');
            $table->boolean('is_safe');
            $table->integer('score');
            $table->text('feedback_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('scam_pattern_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('category');
            $table->string('platform');
            $table->text('description');
            $table->text('evidence_text')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scam_pattern_contributions');
        Schema::dropIfExists('simulation_attempts');
        Schema::dropIfExists('simulation_scenarios');
    }
};
