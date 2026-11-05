<?php

namespace App\Services\Security;

class UrlPhishingScanner
{
    /**
     * Official legitimate domains that must not be flagged as phishing.
     *
     * @var array<int, string>
     */
    protected array $whitelistedDomains = [
        'bca.co.id',
        'klikbca.com',
        'bri.co.id',
        'bankmandiri.co.id',
        'mandiri.co.id',
        'bni.co.id',
        'cimbniaga.co.id',
        'dana.id',
        'ovo.id',
        'gopay.co.id',
        'shopee.co.id',
        'pajak.go.id',
        'kominfo.go.id',
        'whatsapp.com',
        'wa.me',
        'cekara.id',
        'google.com',
        'play.google.com',
        'apple.com',
    ];

    /**
     * Known URL shortener domains commonly used to obfuscate destinations.
     *
     * @var array<int, string>
     */
    protected array $shortenerDomains = [
        'bit.ly',
        'tinyurl.com',
        's.id',
        'is.gd',
        't.co',
        'cutt.ly',
        'rb.gy',
        'shorturl.at',
        'bl.ink',
        'rebrand.ly',
        'intip.in',
        'tiny.cc',
        'gg.gg',
        'linktr.ee',
    ];

    /**
     * Risky and frequently abused top-level domains (TLDs).
     *
     * @var array<int, string>
     */
    protected array $riskyTlds = [
        'xyz',
        'top',
        'tk',
        'ml',
        'ga',
        'cf',
        'gq',
        'work',
        'click',
        'buzz',
        'icu',
        'cam',
        'monster',
        'rest',
        'fit',
        'surf',
        'kim',
        'party',
        'gdn',
        'cc',
        'live',
        'online',
        'site',
        'vip',
        'shop',
        'space',
        'fun',
        'cfd',
        'sbs',
    ];

    /**
     * Indonesian institutions, banks, fintechs, and services frequently targeted for impersonation.
     *
     * @var array<int, string>
     */
    protected array $brandKeywords = [
        'bca',
        'bri',
        'mandiri',
        'bni',
        'cimb',
        'dana',
        'ovo',
        'gopay',
        'shopeepay',
        'shopee',
        'pajak',
        'kominfo',
        'bpjs',
        'whatsapp',
    ];

    /**
     * Action triggers typically paired with brand typosquatting in phishing attacks.
     *
     * @var array<int, string>
     */
    protected array $actionTriggers = [
        'login',
        'verifikasi',
        'klaim',
        'hadiah',
        'undian',
        'bantuan',
        'bansos',
        'saldo',
        'otp',
        'rekening',
        'blokir',
        'update',
        'kur',
        'pencairan',
        'darurat',
        'keamanan',
        'akun',
        'portal',
    ];

    /**
     * Extract all HTTP and HTTPS URLs from text.
     *
     * @return array<int, string>
     */
    public function extractUrls(string $text): array
    {
        if (empty(trim($text))) {
            return [];
        }

        // Regex captures http/https URLs, omitting trailing punctuation (dots, commas, quotes, brackets)
        $pattern = '/https?:\/\/[^\s<>"\'{}|\\^`]+[^\s<>"\'{}|\\^`.,;:!?()]/i';
        preg_match_all($pattern, $text, $matches);

        $urls = array_unique($matches[0] ?? []);

        return array_values($urls);
    }

    /**
     * Scan and evaluate a URL against security heuristics and threat databases.
     *
     * @return array{
     *     url: string,
     *     is_suspicious: bool,
     *     risk_level: string,
     *     score: int,
     *     indicators: array<int, string>
     * }
     */
    public function scan(string $url): array
    {
        $rawUrl = trim($url);
        if (! preg_match('/^https?:\/\//i', $rawUrl)) {
            $parsedUrl = 'http://'.$rawUrl;
        } else {
            $parsedUrl = $rawUrl;
        }

        $host = strtolower(parse_url($parsedUrl, PHP_URL_HOST) ?? '');
        $path = parse_url($parsedUrl, PHP_URL_PATH) ?? '';
        $query = parse_url($parsedUrl, PHP_URL_QUERY) ?? '';
        $port = parse_url($parsedUrl, PHP_URL_PORT);

        // Strip any trailing port if still in host
        $cleanHost = preg_replace('/:\d+$/', '', $host);

        // 1. Whitelist Verification
        if ($this->isWhitelisted($cleanHost)) {
            // Check if there is an explicit malicious file path even on a known domain
            if (! $this->isDirectMalwarePath($path, $query)) {
                return [
                    'url' => $rawUrl,
                    'is_suspicious' => false,
                    'risk_level' => 'LOW',
                    'score' => 10,
                    'indicators' => [],
                ];
            }
        }

        $score = 0;
        $indicators = [];

        // 2. Direct IP Address Hostname
        if (filter_var($cleanHost, FILTER_VALIDATE_IP)) {
            $score = max($score, 85);
            $indicators[] = "Menggunakan alamat IP langsung ({$cleanHost}) tanpa nama domain resmi, indikasi kuat server sementara penyebar phishing atau malware.";
        }

        // 2b. Credential Spoofing / HTTP Userinfo Deception (e.g. https://bca.co.id@evil.com)
        $user = parse_url($parsedUrl, PHP_URL_USER);
        if (! empty($user)) {
            $score = max($score, 85);
            $indicators[] = "Tautan menggunakan format kredensial (@{$user}) sebelum nama host sebenarnya untuk mengelabui pengguna.";
        }

        // 2c. Non-standard Web Port Detection
        if ($port !== null && ! in_array($port, [80, 443], true)) {
            $score = max($score, 65);
            $indicators[] = "Menggunakan port non-standar (:{$port}) yang tidak lazim untuk portal publik institusi resmi.";
        }

        // 3. Punycode / IDN Homoglyph Spoofing
        if (str_starts_with($cleanHost, 'xn--') || str_contains($cleanHost, '.xn--') || preg_match('/[^\x20-\x7E]/', $cleanHost)) {
            $score = max($score, 90);
            $indicators[] = "Domain menggunakan karakter punycode atau homoglyph ({$cleanHost}) untuk mengelabui mata pengguna agar mengira situs resmi.";
        }

        // 4. Direct APK or Executable Download Link
        if ($this->isDirectMalwarePath($path, $query)) {
            $score = max($score, 95);
            $indicators[] = 'Tautan mengarah langsung ke pengunduhan file instalasi berbahaya (.apk / malware Android).';
        }

        // 5. URL Shortener Concealment
        if ($this->isShortener($cleanHost)) {
            $score = max($score, 70);
            $indicators[] = 'Menggunakan layanan pemendek tautan (URL shortener) untuk menyembunyikan alamat domain tujuan akhir.';
        }

        // 6. Suspicious / Abused TLD Detection
        $tld = $this->extractTld($cleanHost);
        if ($tld && in_array($tld, $this->riskyTlds, true)) {
            $score = max($score, 75);
            $indicators[] = "Menggunakan domain berekstensi (TLD) berisiko tinggi (.{$tld}) yang kerap disalahgunakan untuk kampanye phishing.";
        }

        // 7. Indonesian Banking & Brand Impersonation / Typosquatting
        foreach ($this->brandKeywords as $brand) {
            if ($this->matchesBrandImpersonation($cleanHost, $brand)) {
                $score = max($score, 95);
                $indicators[] = "Domain mencatut nama institusi atau merek resmi Indonesia ({$brand}) pada alamat web tidak sah untuk memancing kredensial nasabah.";
                break;
            }
        }

        $isSuspicious = $score >= 50 || count($indicators) > 0;
        $riskLevel = match (true) {
            $score >= 80 => 'HIGH',
            $score >= 50 => 'MEDIUM',
            default => 'LOW',
        };

        return [
            'url' => $rawUrl,
            'is_suspicious' => $isSuspicious,
            'risk_level' => $riskLevel,
            'score' => $score,
            'indicators' => array_values(array_unique($indicators)),
        ];
    }

    /**
     * Check if host is on official whitelist.
     */
    protected function isWhitelisted(string $host): bool
    {
        if (empty($host)) {
            return false;
        }

        // Official government domains
        if (str_ends_with($host, '.go.id')) {
            return true;
        }

        foreach ($this->whitelistedDomains as $whitelisted) {
            if ($host === $whitelisted || str_ends_with($host, '.'.$whitelisted)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if path points to dangerous direct download.
     */
    protected function isDirectMalwarePath(string $path, string $query): bool
    {
        $target = strtolower($path.'?'.$query);

        return (bool) preg_match('/\.(apk|exe|bat|scr|zip|msi)($|\?)/i', $target);
    }

    /**
     * Check if host is a known URL shortener.
     */
    protected function isShortener(string $host): bool
    {
        foreach ($this->shortenerDomains as $shortener) {
            if ($host === $shortener || str_ends_with($host, '.'.$shortener)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract TLD from hostname.
     */
    protected function extractTld(string $host): ?string
    {
        $parts = explode('.', $host);
        if (count($parts) < 2) {
            return null;
        }

        return end($parts);
    }

    /**
     * Determine if host impersonates an Indonesian brand on an unauthorized host.
     */
    protected function matchesBrandImpersonation(string $host, string $brand): bool
    {
        if (! str_contains($host, $brand)) {
            return false;
        }

        // Host is not official (already verified via isWhitelisted, but safety check)
        if ($this->isWhitelisted($host)) {
            return false;
        }

        // Check if brand is accompanied by scam triggers, hyphens, or subdomain spoofing
        if (str_contains($host, '-'.$brand) || str_contains($host, $brand.'-')) {
            return true;
        }

        // Subdomain spoofing: e.g. bca.co.id.portal-user.top
        if (str_contains($host, $brand.'.') || str_contains($host, '.'.$brand)) {
            return true;
        }

        // Host contains brand and any action triggers
        foreach ($this->actionTriggers as $trigger) {
            if (str_contains($host, $trigger)) {
                return true;
            }
        }

        // Brand as exact domain label on non-whitelisted host
        $hostLabels = explode('.', $host);
        if (in_array($brand, $hostLabels, true)) {
            return true;
        }

        return false;
    }
}
