@props(['initialText' => 'Start typing or paste your text here...', 'tab_id'])
@inject('tabController', 'App\Http\Controllers\TabController')

<div class="text-editor-container">
    <div 
        id="text-editor" 
        class="w-full min-h-[300px] p-4 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto" 
        contenteditable="true"
        data-tab-id="{{ $tab_id }}"
    >
        {{ $tabController->getLatestText($tab_id) ?? $initialText }}
    </div>

    <!-- Annotations List -->
    <div id="annotations-list" class="mt-6 space-y-3"></div>

    <!-- Edit Modal -->
    <div id="edit-modal" class="hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-gray-900 dark:text-gray-100" style="min-width: 300px;">
        <h3 class="text-lg font-medium mb-4">Add Annotation</h3>
        <div class="mb-4">
            <p class="text-sm text-gray-500 mb-2">Selected text:</p>
            <div id="selected-text" class="p-2 rounded italic"></div>
        </div>
        <textarea 
            id="edit-text-input" 
            placeholder="Write your annotation here..."
            class="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
            rows="4"
            style="min-width: 200px; min-height: 100px; resize: both;"
        ></textarea>
        <div class="flex justify-end space-x-2">
            <button 
                type="button" 
                onclick="window.textEditor.closeModal()" 
                class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >Cancel</button>
            <button 
                type="button" 
                onclick="window.textEditor.addAnnotation()" 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >Add Annotation</button>
        </div>
    </div>
</div>
