<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('community_categories', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('label', 100);
            $table->string('variant', 30)->default('brand');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seed default categories so existing and fresh installs have the base categories in DB
        DB::table('community_categories')->insert([
            [
                'key' => 'apk_malware',
                'label' => 'Malware APK',
                'variant' => 'danger',
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'phishing_banking',
                'label' => 'Phishing Bank',
                'variant' => 'warn',
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fake_job',
                'label' => 'Lowongan Palsu',
                'variant' => 'warn',
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'social_engineering',
                'label' => 'Rekayasa Sosial',
                'variant' => 'brand',
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fake_giveaway',
                'label' => 'Undian Palsu',
                'variant' => 'neutral',
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_categories');
    }
};
