<?php

use Illuminate\Support\Facades\File;

describe('Typography & Inter Font Bundling', function () {
    test('vite.config.ts configures Inter font family with weights 400, 500, 600, and 700', function () {
        $viteConfig = File::get(base_path('vite.config.ts'));

        expect($viteConfig)->toContain("bunny('Inter'");
        expect($viteConfig)->toContain('[400, 500, 600, 700]');
    });

    test('resources/css/app.css configures Inter as primary sans font', function () {
        $appCss = File::get(resource_path('css/app.css'));

        expect($appCss)->toContain('--font-sans:');
        expect($appCss)->toMatch("/--font-sans:\s*'Inter'/");
    });

    test('resources/views/app.blade.php includes fonts directive and font-sans class', function () {
        $blade = File::get(resource_path('views/app.blade.php'));

        expect($blade)->toContain('@fonts');
        expect($blade)->toContain('font-sans');
    });

    test('public/build/fonts-manifest.json registers weight 700 woff and woff2 preloads', function () {
        $manifestPath = public_path('build/fonts-manifest.json');
        expect(File::exists($manifestPath))->toBeTrue('fonts-manifest.json does not exist. Run npm run build.');

        $manifest = json_decode(File::get($manifestPath), true);
        expect($manifest)->toBeArray();

        // Verify preloads contain weight 700
        $preloads = collect($manifest['preloads'] ?? []);
        $weight700Preload = $preloads->first(fn ($p) => ($p['family'] ?? '') === 'Inter' && ($p['weight'] ?? 0) === 700);
        expect($weight700Preload)->not->toBeNull('Missing preload entry for Inter 700');
        expect($weight700Preload['file'])->toEndWith('.woff2');

        // Verify families contain weight 700
        $variants = $manifest['families']['inter']['variants'] ?? [];
        expect(array_key_exists('700:normal', $variants))->toBeTrue('Missing 700:normal variant in fonts-manifest');
    });

    test('physical font files for Inter weight 700 exist and have authentic woff/woff2 headers', function () {
        $assets = File::glob(public_path('build/assets/inter-700-normal-*'));
        expect(count($assets))->toBeGreaterThanOrEqual(2, 'Expected at least woff and woff2 files for Inter 700');

        $foundWoff = false;
        $foundWoff2 = false;

        foreach ($assets as $file) {
            $handle = fopen($file, 'rb');
            $magic = fread($handle, 4);
            fclose($handle);

            if (str_ends_with($file, '.woff2')) {
                expect($magic)->toBe('wOF2', "File {$file} does not have valid WOFF2 magic bytes");
                $foundWoff2 = true;
            } elseif (str_ends_with($file, '.woff')) {
                expect($magic)->toBe('wOFF', "File {$file} does not have valid WOFF magic bytes");
                $foundWoff = true;
            }
        }

        expect($foundWoff)->toBeTrue('inter-700-normal woff file not verified');
        expect($foundWoff2)->toBeTrue('inter-700-normal woff2 file not verified');
    });
});
