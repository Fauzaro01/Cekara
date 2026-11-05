<?php

namespace App\Services\Llm;

interface LlmDriverInterface
{
    /**
     * Analyze message text or suspicious content for digital fraud indicators.
     *
     * @param  array<string, mixed>  $context
     */
    public function analyze(string $content, array $context = []): FraudAnalysisResult;
}
