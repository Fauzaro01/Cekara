<?php

namespace Database\Seeders;

use App\Models\LlmProvider;
use Illuminate\Database\Seeder;

class LlmProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LlmProvider::updateOrCreate(
            ['key' => 'gemini'],
            [
                'name' => 'Google Gemini',
                'model' => 'gemini-3.5-flash-lite',
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
                'custom_headers' => null,
                'is_active' => true,
            ]
        );

        LlmProvider::updateOrCreate(
            ['key' => 'openai'],
            [
                'name' => 'OpenAI',
                'model' => 'gpt-4o-mini',
                'base_url' => 'https://api.openai.com/v1',
                'custom_headers' => null,
                'is_active' => false,
            ]
        );

        LlmProvider::updateOrCreate(
            ['key' => 'custom'],
            [
                'name' => 'Custom Router API',
                'model' => 'meta-llama/llama-3.1-8b-instruct',
                'base_url' => 'https://openrouter.ai/api/v1',
                'custom_headers' => [
                    'HTTP-Referer' => 'https://cekara.id',
                    'X-Title' => 'Cekara',
                ],
                'is_active' => false,
            ]
        );
    }
}
