<?php

use Illuminate\Support\Facades\Validator;

beforeEach(function () {
    app()->setLocale('id');
});

describe('Indonesian Localization Completeness & Accuracy', function () {
    test('all required dictionary files exist in lang/id', function () {
        $requiredFiles = ['auth.php', 'passwords.php', 'pagination.php', 'validation.php'];

        foreach ($requiredFiles as $file) {
            $path = lang_path("id/{$file}");
            expect(file_exists($path))->toBeTrue("Missing dictionary file: {$path}");
        }
    });

    test('auth.php contains authentic Indonesian translations and preserves placeholders', function () {
        expect(__('auth.failed'))->toBe('Kredensial yang diberikan tidak cocok dengan data kami.');
        expect(__('auth.password'))->toBe('Kata sandi yang dimasukkan salah.');

        // Placeholder edge cases
        expect(__('auth.throttle', ['seconds' => 60]))
            ->toBe('Terlalu banyak upaya masuk. Silakan coba lagi dalam 60 detik.');
        expect(__('auth.throttle', ['seconds' => 1]))
            ->toBe('Terlalu banyak upaya masuk. Silakan coba lagi dalam 1 detik.');
        expect(__('auth.throttle', ['seconds' => 0]))
            ->toBe('Terlalu banyak upaya masuk. Silakan coba lagi dalam 0 detik.');

        // Missing placeholder should preserve token
        expect(__('auth.throttle'))
            ->toBe('Terlalu banyak upaya masuk. Silakan coba lagi dalam :seconds detik.');
    });

    test('passwords.php contains authentic Indonesian translations for all broker states', function () {
        expect(__('passwords.reset'))
            ->toBe('Kata sandi Anda telah berhasil diatur ulang.');
        expect(__('passwords.sent'))
            ->toBe('Kami telah mengirimkan tautan atur ulang kata sandi ke email Anda.');
        expect(__('passwords.throttled'))
            ->toBe('Harap tunggu sebelum mencoba kembali.');
        expect(__('passwords.token'))
            ->toBe('Token pengaturan ulang kata sandi ini tidak valid atau sudah kedaluwarsa.');
        expect(__('passwords.user'))
            ->toBe('Kami tidak dapat menemukan pengguna dengan alamat email tersebut.');
    });

    test('pagination.php contains authentic Indonesian navigation labels', function () {
        expect(__('pagination.previous'))
            ->toBe('&laquo; Sebelumnya');
        expect(__('pagination.next'))
            ->toBe('Berikutnya &raquo;');
    });

    test('validation.php attributes are mapped to genuine Indonesian terms', function () {
        $expectedAttributes = [
            'name' => 'nama lengkap',
            'email' => 'alamat email',
            'password' => 'kata sandi',
            'password_confirmation' => 'konfirmasi kata sandi',
            'current_password' => 'kata sandi saat ini',
            'provider_name' => 'nama provider',
            'provider_type' => 'tipe provider',
            'model' => 'nama model',
            'api_key' => 'kunci API',
            'base_url' => 'URL dasar',
            'message' => 'pesan',
            'prompt' => 'teks analisis',
        ];

        foreach ($expectedAttributes as $key => $expectedValue) {
            expect(__("validation.attributes.{$key}"))
                ->toBe($expectedValue, "Attribute [{$key}] does not match expected Indonesian translation");
        }
    });

    test('validation rules resolve correctly with runtime Laravel Validator instance', function () {
        // Test required rule on empty data
        $validator = Validator::make([], [
            'email' => 'required',
            'password' => 'required',
            'name' => 'required',
            'api_key' => 'required',
        ]);

        expect($validator->fails())->toBeTrue();
        $errors = $validator->errors();

        expect($errors->first('email'))->toBe('Kolom alamat email wajib diisi.');
        expect($errors->first('password'))->toBe('Kolom kata sandi wajib diisi.');
        expect($errors->first('name'))->toBe('Kolom nama lengkap wajib diisi.');
        expect($errors->first('api_key'))->toBe('Kolom kunci API wajib diisi.');
    });

    test('validation rule edge cases: min, max, email format, and confirmation', function () {
        $validator = Validator::make([
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
            'name' => str_repeat('a', 256),
        ], [
            'email' => 'email',
            'password' => 'min:8|confirmed',
            'name' => 'max:255',
        ]);

        expect($validator->fails())->toBeTrue();
        $errors = $validator->errors();

        expect($errors->first('email'))->toBe('Kolom alamat email harus berupa alamat email yang valid.');
        expect($errors->first('password'))->toBe('Kolom kata sandi harus berisi minimal 8 karakter.');
        expect($errors->first('name'))->toBe('Kolom nama lengkap tidak boleh lebih dari 255 karakter.');

        // Test confirmation mismatch specifically
        $validator2 = Validator::make([
            'password' => 'ValidPassword123!',
            'password_confirmation' => 'DifferentPassword123!',
        ], [
            'password' => 'confirmed',
        ]);

        expect($validator2->fails())->toBeTrue();
        expect($validator2->errors()->first('password'))->toBe('Konfirmasi kata sandi tidak cocok.');
    });

    test('numeric and between validation rules with multi-parameter placeholders', function () {
        $validator = Validator::make([
            'age' => 'not-a-number',
            'score' => 150,
        ], [
            'age' => 'numeric',
            'score' => 'numeric|between:1,100',
        ]);

        expect($validator->fails())->toBeTrue();
        $errors = $validator->errors();

        expect($errors->first('age'))->toBe('Kolom age harus berupa angka.');
        expect($errors->first('score'))->toBe('Kolom score harus bernilai antara 1 dan 100.');
    });

    test('adversarial placeholder parameter edge cases do not crash or corrupt translation', function () {
        // Special characters & HTML entities in parameters
        $xss = '<script>alert("xss")</script>';
        $res = __('validation.required', ['attribute' => $xss]);
        expect($res)->toBe("Kolom {$xss} wajib diisi.");

        // Unicode and emoji in parameters
        $unicode = 'Kata Sandi 🔒';
        $resUnicode = __('validation.required', ['attribute' => $unicode]);
        expect($resUnicode)->toBe("Kolom {$unicode} wajib diisi.");

        // Numeric zero as parameter
        $resZero = __('validation.min.numeric', ['attribute' => 'skor', 'min' => 0]);
        expect($resZero)->toBe('Kolom skor harus bernilai minimal 0.');

        // Negative numbers as parameters
        $resNegative = __('validation.between.numeric', ['attribute' => 'suhu', 'min' => -10, 'max' => 40]);
        expect($resNegative)->toBe('Kolom suhu harus bernilai antara -10 dan 40.');
    });
});
