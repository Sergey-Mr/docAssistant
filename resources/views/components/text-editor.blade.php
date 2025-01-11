@props(['initialText' => 'Start typing or paste your text here...'])

<div class="text-editor-container">
    <div 
        id="text-editor" 
        class="w-full min-h-[300px] p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto" 
        contenteditable="true"
    >
        {{ $initialText }}
    </div>

    <!-- Edit Modal -->
    <div id="edit-modal" class="hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-gray-900 dark:text-gray-100" style="min-width: 300px;">
        <h3 class="text-lg font-medium mb-4">Edit Selected Text</h3>
        <textarea 
            id="edit-text-input" 
            class="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
            rows="4"
            style="min-width: 200px; min-height: 200px; resize: both;"
        ></textarea>
        <div class="flex justify-end space-x-2">
            <button 
                type="button" 
                onclick="window.textEditor.closeModal()" 
                class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >Cancel</button>
            <button 
                type="button" 
                onclick="window.textEditor.saveChanges()" 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >Update</button>
        </div>
    </div>
</div>
