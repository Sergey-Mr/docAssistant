<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI Text Revision</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Styles -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased">
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <!-- Navigation -->
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex justify-end space-x-4">
                @auth
                    <a href="{{ url('/dashboard') }}" 
                       class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        Dashboard
                    </a>
                @else
                    <a href="{{ route('login') }}" 
                       class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        Log in
                    </a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" 
                           class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                            Register
                        </a>
                    @endif
                @endauth
            </div>
        </nav>

        <!-- Hero Section -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl tracking-tight">
                    <span class="block">AI-Powered Text Revision</span>
                    <span class="block text-blue-600 dark:text-blue-400">Made Simple</span>
                </h1>
                <p class="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Highlight any text, request an intelligent revision, and keep track of every change. 
                    Perfect for writers, translators, and content creators.
                </p>
                <div class="mt-10 flex justify-center gap-4">
                    <a href="{{ route('login') }}" 
                       class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Login
                    </a>
                    <a href="{{ route('register') }}" 
                       class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Register
                    </a>
                </div>
            </div>
        </main>
    </div>
</body>
</html>