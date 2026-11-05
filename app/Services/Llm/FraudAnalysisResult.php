<?php

namespace App\Services\Llm;

class FraudAnalysisResult
{
    /**
     * @param  string  $riskLevel  'HIGH' | 'MEDIUM' | 'LOW'
     * @param  array<int, string>  $redFlags
     * @param  array<int, string>  $recommendations
     */
    public function __construct(
        public string $riskLevel,
        public bool $isMock,
        public array $redFlags,
        public string $summary,
        public array $recommendations,
        public string $providerName,
        public string $model,
        public int $score = 0,
        public ?string $fallbackReason = null,
    ) {}

    /**
     * Convert the result to array format.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'risk_level' => $this->riskLevel,
            'is_mock' => $this->isMock,
            'is_fallback' => $this->isMock,
            'red_flags' => $this->redFlags,
            'indicators' => $this->redFlags,
            'summary' => $this->summary,
            'recommendations' => $this->recommendations,
            'recommendation' => implode(' ', $this->recommendations),
            'action_steps' => $this->recommendations,
            'provider_name' => $this->providerName,
            'provider_used' => $this->providerName,
            'model' => $this->model,
            'score' => $this->score,
            'fallback_reason' => $this->fallbackReason,
        ];
    }
}
