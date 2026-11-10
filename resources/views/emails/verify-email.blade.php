<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Alamat Email Akun Cekara</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF8EC; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3B2A1E; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF8EC; padding: 36px 16px;">
        <tr>
            <td align="center">
                <!-- Container Utama -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; margin: 0 auto;">
                    
                    <!-- Top Brand Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color: #FF9A3C; border-top: 2px solid #3B2A1E; border-left: 2px solid #3B2A1E; border-right: 4px solid #3B2A1E; border-bottom: 4px solid #3B2A1E; border-radius: 14px; padding: 8px 16px;">
                                        <span style="font-size: 20px; font-weight: 800; color: #3B2A1E; letter-spacing: -0.5px;">
                                            🛡️ CEKARA
                                        </span>
                                    </td>
                                    <td style="padding-left: 10px;">
                                        <span style="display: inline-block; background-color: #FFF3DC; border: 2px solid #3B2A1E; border-radius: 999px; padding: 5px 12px; font-size: 11px; font-weight: 800; color: #E06812; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Guardian Digital
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Neo-Brutalist Card -->
                    <tr>
                        <td style="background-color: #FFFFFF; border-top: 2.5px solid #3B2A1E; border-left: 2.5px solid #3B2A1E; border-right: 6px solid #3B2A1E; border-bottom: 6px solid #3B2A1E; border-radius: 24px; padding: 32px 28px;">
                            
                            <!-- Badge Kategori -->
                            <div style="margin-bottom: 16px;">
                                <span style="display: inline-block; background-color: #FFF3DC; border: 2px solid #3B2A1E; border-radius: 10px; padding: 4px 12px; font-size: 12px; font-weight: 800; color: #3B2A1E;">
                                    ✉️ Aktivasi &amp; Verifikasi Email
                                </span>
                            </div>

                            <!-- Judul Utama -->
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; line-height: 1.3; font-weight: 800; color: #3B2A1E;">
                                Halo, {{ $userName }}! 👋
                            </h1>

                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.65; color: #6B5646; font-weight: 500;">
                                Terima kasih telah bergabung sebagai <strong style="color: #3B2A1E;">Guardian di Cekara</strong> — Perisai Digital Keluarga &amp; Komunitas Indonesia. Satu langkah lagi untuk mengaktifkan akun Anda agar dapat digunakan untuk masuk (<em>login</em>).
                            </p>

                            <!-- Detail Akun Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF8EC; border-top: 2px solid #3B2A1E; border-left: 2px solid #3B2A1E; border-right: 4px solid #3B2A1E; border-bottom: 4px solid #3B2A1E; border-radius: 16px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px 18px;">
                                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #6B5646; margin-bottom: 4px;">
                                            Detail Pendaftaran Akun
                                        </div>
                                        <div style="font-size: 16px; font-weight: 800; color: #3B2A1E; margin-bottom: 2px;">
                                            {{ $userName }}
                                        </div>
                                        <div style="font-size: 14px; font-weight: 700; color: #E06812;">
                                            {{ $userEmail }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #3B2A1E; font-weight: 600;">
                                Silakan tekan tombol di bawah ini untuk membuka halaman verifikasi, lalu tekan tombol konfirmasi untuk mengaktifkan akun Anda:
                            </p>

                            <!-- CTA Button Neo-Brutalist -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $verificationUrl }}" target="_blank" style="display: inline-block; background-color: #FF9A3C; color: #3B2A1E; font-size: 16px; font-weight: 800; text-decoration: none; padding: 15px 32px; border-radius: 14px; border-top: 2px solid #3B2A1E; border-left: 2px solid #3B2A1E; border-right: 5px solid #3B2A1E; border-bottom: 5px solid #3B2A1E;">
                                            ✅ Buka Halaman Verifikasi Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tips Keamanan Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF3DC; border: 2px dashed #E06812; border-radius: 14px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 14px 16px; font-size: 13px; line-height: 1.55; color: #3B2A1E; font-weight: 600;">
                                        🔒 <strong>Catatan Keamanan Cekara:</strong> Tautan verifikasi ini dilindungi tanda tangan kriptografis dan berlaku selama <strong>60 menit</strong>. Jika Anda tidak merasa mendaftarkan akun di Cekara, abaikan email ini dengan aman.
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback URL -->
                            <div style="border-top: 2px solid #EFE3D0; padding-top: 18px; font-size: 12px; line-height: 1.6; color: #6B5646;">
                                Jika tombol di atas tidak berfungsi di aplikasi email Anda, salin dan tempel tautan berikut ke peramban (<em>browser</em>) Anda:<br>
                                <a href="{{ $verificationUrl }}" style="color: #E06812; font-weight: 700; word-break: break-all; text-decoration: underline;">{{ $verificationUrl }}</a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 24px 16px 8px 16px; font-size: 12px; line-height: 1.6; color: #6B5646; font-weight: 600;">
                            <strong style="color: #3B2A1E;">Cekara — Cek Dulu, Baru Percaya.</strong><br>
                            Perisai Digital Pelindung Masyarakat Indonesia dari Penipuan &amp; Kejahatan Siber.<br>
                            <span style="font-size: 11px; color: #8C7665;">&copy; {{ date('Y') }} Cekara Guardian. Seluruh hak cipta dilindungi.</span>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>

