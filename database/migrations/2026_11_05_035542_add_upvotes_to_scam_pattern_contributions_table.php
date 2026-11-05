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
        Schema::table('scam_pattern_contributions', function (Blueprint $table) {
            $table->unsignedInteger('upvotes_count')->default(1)->after('is_verified');
            $table->string('location')->nullable()->after('platform');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scam_pattern_contributions', function (Blueprint $table) {
            $table->dropColumn(['upvotes_count', 'location']);
        });
    }
};
