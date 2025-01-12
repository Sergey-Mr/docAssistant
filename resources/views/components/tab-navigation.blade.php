@props(['currentTab', 'tabs'])

<div class="relative flex items-center">
    <div class="overflow-x-auto flex-grow scrollbar-hide">
        <div class="flex space-x-2 min-w-full">
        @foreach($tabs as $tab)
            <div class="flex items-center tab-item"> 
                <a href="{{ route('dashboard', ['tab' => $tab->id]) }}"
                   class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        {{ $currentTab?->id === $tab->id 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300' }}">
                    {{ $tab->name }}
                        
                    @if(count($tabs) > 1)
                    <button data-tab-id="{{ $tab->id }}" 
                        class="delete-tab-btn ml-2 text-gray-400 hover:text-red-500 focus:outline-none">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                    @endif
                </a>
            </div>
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