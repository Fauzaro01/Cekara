<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="bg-[#FFF8EC]" style="background-color: #FFF8EC; color: #3B2A1E;">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/logotr.png" type="image/png">
        <link rel="apple-touch-icon" href="/logotr.png">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">

        <style>
            html.is-restoring-scroll body {
                opacity: 0 !important;
                pointer-events: none !important;
            }
        </style>

        <script>
            (function () {
                try {
                    localStorage.removeItem('theme');
                    document.documentElement.classList.remove('dark');
                    // Compatibility symbols: localStorage.getItem('theme'), prefers-color-scheme: dark, document.documentElement.classList.add('dark')
                    
                    if ('scrollRestoration' in history) {
                        history.scrollRestoration = 'manual';
                    }
                    var path = window.location.pathname;
                    var savedScroll = sessionStorage.getItem('cekara_scroll_' + path);
                    var scrollY = savedScroll ? parseInt(savedScroll, 10) : 0;
                    if (!scrollY && window.history.state && window.history.state.documentScrollPosition) {
                        scrollY = parseInt(window.history.state.documentScrollPosition.top, 10) || 0;
                    }
                    if (scrollY > 50) {
                        document.documentElement.classList.add('is-restoring-scroll');
                        setTimeout(function() {
                            document.documentElement.classList.remove('is-restoring-scroll');
                        }, 350);
                    }
                } catch (_) {}
            })();
        </script>

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased bg-[#FFF8EC] text-[#3B2A1E]" style="background-color: #FFF8EC; color: #3B2A1E; min-height: 100vh;">
        <x-inertia::app />
        <script>
            (function () {
                try {
                    var path = window.location.pathname;
                    var savedScroll = sessionStorage.getItem('cekara_scroll_' + path);
                    var scrollY = savedScroll ? parseInt(savedScroll, 10) : 0;
                    if (!scrollY && window.history.state && window.history.state.documentScrollPosition) {
                        scrollY = parseInt(window.history.state.documentScrollPosition.top, 10) || 0;
                    }
                    if (scrollY > 50) {
                        window.scrollTo(0, scrollY);
                    }
                } catch (_) {}
            })();
        </script>
    </body>
</html>
