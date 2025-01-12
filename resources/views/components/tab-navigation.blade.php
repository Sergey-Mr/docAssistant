@props(['currentTab', 'tabs'])

<div class="relative flex items-center">
    <div class="overflow-x-auto flex-grow scrollbar-hide">
        <div class="flex space-x-2 min-w-full">
            @foreach($tabs as $tab)
                <a href="{{ route('dashboard', ['tab' => $tab->id]) }}"
                   class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        {{ $currentTab?->id === $tab->id 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300' }}">
                    {{ $tab->name }}
                </a>
            @endforeach
        </div>
    </div>

    <button onclick="createNewTab()"
            class="flex-shrink-0 ml-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 
                   dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
    </button>
</div>