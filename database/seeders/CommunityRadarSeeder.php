<?php

namespace Database\Seeders;

use App\Models\ScamPatternContribution;
use Illuminate\Database\Seeder;

class CommunityRadarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Data laporan komunitas akan dimasukkan langsung secara nyata oleh pengguna dan komunitas.
        $patterns = [];

        foreach ($patterns as $pattern) {
            ScamPatternContribution::updateOrCreate(
                ['title' => $pattern['title']],
                $pattern
            );
        }
    }
}
