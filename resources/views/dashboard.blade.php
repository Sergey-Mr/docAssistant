<x-app-layout>
    <x-slot name="header">
        <x-tab-navigation 
            :current-tab="$currentTab" 
            :tabs="Auth::user()->tabs" 
        />
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <x-text-editor :tab_id="$currentTab?->id" />
                </div>
            </div>
        </div>
    </div>

    @vite(['resources/js/components/dashboard.js', 
           'resources/js/components/text-editor.js',
           'resources/js/components/tab-manager.js'])
</x-app-layout>
