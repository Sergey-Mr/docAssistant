class AnnotationProcessingError extends Error {
    constructor(message, status = null) {
        super(message);
        this.name = 'AnnotationProcessingError';
        this.status = status;
    }
}

class TextEditor {
    static CSS = {
        editor: 'w-full min-h-[300px] p-4 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto',
        modal: 'hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4',
        annotation: 'p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border-l-4 border-blue-500 dark:border-blue-500 flex justify-between items-start',
        highlight: 'bg-blue-200 dark:bg-blue-700 px-1 rounded',
        annotationText: 'font-bold text-gray-700 dark:text-gray-300',
        warning: 'fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-md z-50 transition-opacity duration-300',
        annotationContent: 'text-gray-600 dark:text-gray-400',
        processButton: 'w-full mt-4 py-3 bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 font-medium',
        history: 'mt-8 border-t border-gray-200 dark:border-gray-700 pt-6',
        historyItem: 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 border-l-4 border-blue-500',
        historyTitle: 'text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4',
        historyContent: 'text-gray-600 dark:text-gray-400',
        historyTimestamp: 'text-sm text-gray-500 dark:text-gray-400 mt-2',
        historyContainer: 'mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'
    };

    constructor() {
        this.annotations = new Map();
        this.isProcessing = false;
        this.initializeElements();
        this.bindMethods();
        this.attachEventListeners();
        this.loadAnnotationsForCurrentTab();
        this.loadChangeHistory(); // Add this line
    }

    initializeElements() {
        this.editor = document.getElementById('text-editor');
        this.modal = document.getElementById('edit-modal');
        this.input = document.getElementById('edit-text-input');
        this.selectedTextDisplay = document.getElementById('selected-text');
        this.annotationsList = document.getElementById('annotations-list');
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = TextEditor.CSS.historyContainer;
        this.annotationsList.parentNode.insertBefore(this.historyContainer, this.annotationsList.nextSibling);
        this.selectedRange = null;
        this.isEditingModal = false;
    }

    bindMethods() {
        this.handleSelection = this.handleSelection.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.addAnnotation = this.addAnnotation.bind(this);
        this.removeAnnotation = this.removeAnnotation.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleKeyboardSelection = this.handleKeyboardSelection.bind(this);
    }

    attachEventListeners() {
        if (!this.editor) return;
        this.editor.addEventListener('mouseup', this.handleSelection);
        this.editor.addEventListener('keyup', this.handleKeyboardSelection);
        document.addEventListener('mousedown', this.handleOutsideClick);
        this.modal.addEventListener('mousedown', e => e.stopPropagation());
        this.input.addEventListener('focus', () => this.isEditingModal = true);
        this.input.addEventListener('blur', () => this.isEditingModal = false);
    }

    handleKeyboardSelection(e) {
        if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                this.handleSelection();
            }
        }
    }

    loadAnnotationsForCurrentTab() {
        const tabId = this.editor?.dataset.tabId;
        if (!tabId) return;

        this.clearAllAnnotations();
        const savedAnnotations = localStorage.getItem(`annotations_${tabId}`);
        if (savedAnnotations) {
            const annotations = JSON.parse(savedAnnotations);
            annotations.forEach(ann => this.restoreAnnotation(ann));
        }
    }

    restoreAnnotation(ann) {
        const range = this.findRangeForAnnotation(ann.text);
        if (range) {
            const annotation = { id: ann.id, text: ann.text, comment: ann.comment, range };
            this.annotations.set(ann.id, annotation);
            this.highlightRange(range, ann.id);
            this.addAnnotationToList(annotation);
        }
    }

    findRangeForAnnotation(text) {
        const range = document.createRange();
        const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const idx = node.textContent.indexOf(text);
            if (idx !== -1) {
                range.setStart(node, idx);
                range.setEnd(node, idx + text.length);
                return range;
            }
        }
        return null;
    }

    saveAnnotations() {
        const tabId = this.editor?.dataset.tabId;
        if (!tabId) return;
        const annotationsArray = Array.from(this.annotations.values()).map(ann => ({
            id: ann.id,
            text: ann.text,
            comment: ann.comment
        }));
        localStorage.setItem(`annotations_${tabId}`, JSON.stringify(annotationsArray));
    }

    handleSelection() {
        const selection = window.getSelection();
        if (!selection?.toString().length) return;
        const range = selection.getRangeAt(0);
        if (this.isTextAlreadyAnnotated(range)) {
            selection.removeAllRanges();
            return;
        }
        this.selectedRange = range;
        this.selectedTextDisplay.textContent = `"${selection.toString()}"`;
        this.showModal();
        this.updateModalPosition();
    }

    async addAnnotation() {
        if (!this.selectedRange || !this.input.value.trim()) return;
        const annotationId = Date.now();
        const annotation = {
            id: annotationId,
            text: this.selectedRange.toString(),
            comment: this.input.value.trim(),
            range: this.selectedRange.cloneRange(),
            source: 'user'
        };
        this.annotations.set(annotationId, annotation);
        this.highlightRange(this.selectedRange, annotationId);
        this.addAnnotationToList(annotation);
        this.closeModal();
        this.saveAnnotations();
    }

    highlightRange(range, annotationId) {
        const span = document.createElement('span');
        span.className = TextEditor.CSS.highlight;
        span.dataset.annotationId = annotationId;
        range.surroundContents(span);
    }

    renderProcessButton() {
        const existingButton = this.annotationsList.querySelector('.process-button');
        if (existingButton) existingButton.remove();
        const processButton = document.createElement('button');
        processButton.className = `process-button ${TextEditor.CSS.processButton}`;
        processButton.innerHTML = this.getProcessButtonContent();
        processButton.onclick = () => this.processAnnotations();
        this.annotationsList.appendChild(processButton);
    }

    setAnnotationBorderColor(annotationId, source) {
        const annotationElement = this.annotationsList.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (annotationElement) {
            console.log('Source:', source); 
            const color = source === 'user' ? '#3B82F6' : '#3B82F6'; // green-500 : blue-500
            annotationElement.style.borderLeftColor = color; 
            annotationElement.style.borderLeftWidth = '4px'; 
        }
    }

    addAnnotationToList(annotation) {
        const annotationElement = document.createElement('div');
        annotationElement.className = TextEditor.CSS.annotation;
        annotationElement.dataset.annotationId = annotation.id;
        annotationElement.innerHTML = `
            <div class="flex-grow">
                <div class="mb-3">
                    <span class="${TextEditor.CSS.annotationText}">Selected text: </span>
                    <span class="${TextEditor.CSS.annotationContent} italic">"${annotation.text}"</span>
                </div>
                <div>
                    <span class="${TextEditor.CSS.annotationText}">Comment: </span>
                    <span class="${TextEditor.CSS.annotationContent}">${annotation.comment}</span>
                </div>
            </div>
            <button 
                onclick="window.textEditor.removeAnnotation(${annotation.id})"
                class="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        this.annotationsList.appendChild(annotationElement);
        this.setAnnotationBorderColor(annotation.id, annotation.source);
        this.renderProcessButton();
    }

    removeAnnotation(annotationId) {
        this.removeHighlight(annotationId);
        this.removeAnnotationElement(annotationId);
        this.annotations.delete(annotationId);
        this.saveAnnotations();
    }

    removeHighlight(annotationId) {
        const highlightSpan = this.editor.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (highlightSpan) {
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            highlightSpan.remove();
        }
    }

    removeAnnotationElement(annotationId) {
        const annotationElement = Array.from(this.annotationsList.children)
            .find(el => el.querySelector(`button[onclick*="${annotationId}"]`));
        if (annotationElement) annotationElement.remove();
    }

    clearAllAnnotations() {
        const highlights = this.editor.querySelectorAll('[data-annotation-id]');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            highlight.remove();
        });
        this.annotationsList.innerHTML = '';
        this.annotations.clear();
    }

    updateModalPosition() {
        const rect = this.selectedRange.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        this.modal.style.position = 'absolute';
        this.modal.style.top = `${rect.bottom + scrollTop + 10}px`;
        this.modal.style.left = `${rect.left + scrollLeft}px`;
    }

    isTextAlreadyAnnotated(range) {
        const selectedNode = range.commonAncestorContainer;
        const highlightedSpans = this.editor.querySelectorAll('[data-annotation-id]');
        return Array.from(highlightedSpans).some(span => 
            span.contains(selectedNode) || selectedNode.contains(span) || range.intersectsNode(span)
        );
    }

    handleOutsideClick(e) {
        if (!this.modal.contains(e.target) && !this.editor.contains(e.target)) {
            this.closeModal();
        }
    }

    showModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.selectedRange = null;
        this.input.value = '';
    }

    getTextOffset(node, offset) {
        const range = document.createRange();
        range.selectNodeContents(this.editor);
        range.setEnd(node, offset);
        return range.toString().length;
    }

    async processAnnotations() {
        if (this.isProcessing) return;
        try {
            this.setProcessingState(true);
            const revisions = await this.callProcessingAPI();
            this.displayProcessingResults(revisions);
        } catch (error) {
            this.handleProcessingError(error);
        } finally {
            this.setProcessingState(false);
        }
    }

    async callProcessingAPI(retries = 3) {
        const payload = this.prepareAnnotationsPayload();
        const options = this.prepareRequestOptions(payload);
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const { success, revisions } = await this.makeRequest(options);
                return this.validateResponse({ success, revisions });
            } catch (error) {
                if (attempt === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        this.updateProcessButton();
    }

    validateResponse({ success, revisions }) {
        if (!success || !Array.isArray(revisions)) {
            throw new AnnotationProcessingError('Invalid API response format');
        }
        return revisions;
    }

    handleProcessingError(error) {
        console.error('Processing failed:', error);
        this.showWarning(
            error instanceof AnnotationProcessingError
                ? error.message
                : 'Failed to process annotations'
        );
    }

    updateProcessButton() {
        const button = this.annotationsList.querySelector('.process-button');
        if (!button) return;
        button.disabled = this.isProcessing;
        button.innerHTML = this.isProcessing ? this.getLoadingButtonContent() : this.getProcessButtonContent();
    }

    async makeRequest(options) {
        const response = await fetch('/api/annotations/process', options);
        const data = await response.json();
        if (!response.ok) {
            throw new AnnotationProcessingError(
                `API request failed: ${data.message || response.statusText}`,
                response.status
            );
        }
        return data;
    }

    prepareAnnotationsPayload() {
        return {
            fullContext: this.editor.textContent,
            annotations: Array.from(this.annotations.values()).map(({ text, comment, range }) => ({
                text,
                comment,
                position: range ? this.getTextOffset(range.startContainer, range.startOffset) : 0
            }))
        };
    }

    prepareRequestOptions(payload) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) throw new AnnotationProcessingError('CSRF token not found');
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify(payload)
        };
    }

    displayProcessingResults(revisions) {
        const existingResults = this.annotationsList.querySelector('.results-container');
        if (existingResults) existingResults.remove();
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container mt-6 space-y-4';
        revisions.forEach((revision, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-[#10B981]';
            resultElement.innerHTML = `
                <div class="mb-2">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Original: </span>
                    <span class="text-gray-600 dark:text-gray-400">"${revision.original}"</span>
                </div>
                <div class="mb-2">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Revised: </span>
                    <span class="text-green-600 dark:text-green-400">"${revision.revised}"</span>
                </div>
                <div>
                    <span class="font-bold text-gray-700 dark:text-gray-300">Explanation: </span>
                    <span class="text-gray-600 dark:text-gray-400">${revision.explanation}</span>
                </div>
                <button 
                    onclick="window.textEditor.applyRevision(${index})"
                    class="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                >
                    Apply Change
                </button>
            `;
            resultsContainer.appendChild(resultElement);
        });
        this.annotationsList.appendChild(resultsContainer);
    }

    async applyRevision(index) {
        try {
            const results = this.annotationsList.querySelector('.results-container');
            const revisions = results.querySelectorAll('.border-l-4');
            const revision = revisions[index];
            if (!revision) throw new Error('Revision not found');
    
            // Extract texts with proper error handling
            const originalElement = revision.querySelector('.text-gray-600');
            const revisedElement = revision.querySelector('.text-green-600');
            const explanationElement = revision.querySelector('[class*="text-gray-400"]:last-child');
    
            if (!originalElement || !revisedElement) {
                throw new Error('Could not find original or revised text elements');
            }
    
            const originalText = originalElement.textContent.replace(/['"]/g, '').trim();
            const revisedText = revisedElement.textContent.replace(/['"]/g, '').trim();
            const explanation = explanationElement ? explanationElement.textContent.trim() : '';
    
            // Update editor content
            const editorContent = this.editor.innerText;
            let found = false;
    
            if (editorContent.includes(originalText)) {
                const newContent = editorContent.replace(originalText, revisedText);
                this.editor.innerText = newContent;
                found = true;
            }
    
            if (!found) {
                const walker = document.createTreeWalker(
                    this.editor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
    
                let node;
                while ((node = walker.nextNode()) && !found) {
                    const nodeText = node.textContent.replace(/\s+/g, ' ').trim();
                    if (nodeText.includes(originalText)) {
                        node.textContent = node.textContent.replace(originalText, revisedText);
                        found = true;
                        break;
                    }
                }
            }
    
            if (!found) {
                throw new Error(`Original text not found: "${originalText}"`);
            }
    
            // Save to database with explanation
            const cleanedContent = this.cleanTextContent(this.editor.innerHTML);
            await this.saveTextToDatabase(cleanedContent, explanation);

            this.clearUIAfterRevision();
            this.showWarning('Revision applied successfully');
            this.disableAppliedButton(revision);
            this.loadChangeHistory();
    
        } catch (error) {
            console.error('Error applying revision:', error);
            this.showWarning('Failed to apply revision: ' + error.message);
        }
    }

    clearUIAfterRevision() {
        // Clear revision results
        const resultsContainer = this.annotationsList.querySelector('.results-container');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    
        // Clear annotations list content
        this.annotationsList.innerHTML = '';
    
        // Clear annotations
        this.clearAnnotations();
    
        // Clear process button
        const processButton = this.annotationsList.querySelector('.process-button');
        if (processButton) {
            processButton.remove();
        }
    
        // Reset annotations state
        this.annotations.clear();
        this.saveAnnotations();
    }

    cleanTextContent(html) {
        // Create a temporary div to handle HTML content
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove all annotation spans but keep their text content
        const spans = temp.querySelectorAll('[data-annotation-id]');
        spans.forEach(span => {
            const text = span.textContent;
            span.replaceWith(text);
        });
        
        return temp.textContent;
    }
    
    async saveTextToDatabase(content, explanation = '') {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) throw new Error('CSRF token not found');

        const tabId = this.editor?.dataset.tabId;
        if (!tabId) throw new Error('Tab ID not found');

        const response = await fetch('/text/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                tabId,
                content: content,
                explanation: explanation
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to save text');
        }

        return response.json();
    }

    disableAppliedButton(revision) {
        const button = revision.querySelector('button');
        button.disabled = true;
        button.classList.remove('hover:bg-green-600');
        button.classList.add('bg-gray-400');
        button.textContent = 'Applied';
    }

    showWarning(message) {
        const existingWarning = document.querySelector('.warning-message');
        if (existingWarning) existingWarning.remove();
        const warning = document.createElement('div');
        warning.className = 'warning-message fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 rounded-lg shadow-md z-[9999] opacity-0 transition-opacity duration-300';
        warning.textContent = message;
        document.body.appendChild(warning);
        warning.offsetHeight; // Force reflow
        warning.style.opacity = '1';
        setTimeout(() => {
            warning.style.opacity = '0';
            warning.addEventListener('transitionend', () => warning.remove());
        }, 3000);
    }

    destroy() {
        this.editor.removeEventListener('mouseup', this.handleSelection);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }

    getProcessButtonContent() {
        return `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Start Processing
        `;
    }

    getLoadingButtonContent() {
        return `
            <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
    }

    displayHistory() {
        const historySection = document.createElement('div');
        historySection.className = TextEditor.CSS.history;
        
        const title = document.createElement('h3');
        title.className = TextEditor.CSS.historyTitle;
        title.textContent = 'Change History';
        historySection.appendChild(title);
    
        this.annotationsList.appendChild(historySection);
        
        this.loadChangeHistory();
    }

    async loadChangeHistory() {
        try {
            const tabId = this.editor?.dataset.tabId;
            if (!tabId) return;
    
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/api/text/history/${tabId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
    
            if (!response.ok) throw new Error('Failed to fetch history');
            const changes = await response.json();
            this.renderHistory(changes);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    renderHistory(changes) {
        // Clear existing history
        this.historyContainer.innerHTML = '';
        
        const title = document.createElement('h3');
        title.className = TextEditor.CSS.historyTitle;
        title.textContent = 'Change History';
        this.historyContainer.appendChild(title);

        if (changes.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = TextEditor.CSS.historyContent;
            emptyState.textContent = 'No changes recorded yet';
            this.historyContainer.appendChild(emptyState);
            return;
        }

        changes.forEach(change => {
            const changeItem = document.createElement('div');
            changeItem.className = TextEditor.CSS.historyItem;
            changeItem.innerHTML = `
                <div class="flex items-center mb-4">
                    <span class="${TextEditor.CSS.historyContent}">"${change.original_text}"</span>
                    <svg class="mx-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                    <span class="${TextEditor.CSS.historyContent}">"${change.updated_text}"</span>
                </div>
                <div class="mb-2">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Explanation: </span>
                    <span class="${TextEditor.CSS.historyContent}">${change.explanation || 'No explanation provided'}</span>
                </div>
                <div class="${TextEditor.CSS.historyTimestamp}">
                    ${new Date(change.created_at).toLocaleString()}
                </div>
            `;
            this.historyContainer.appendChild(changeItem);
        });
    }

    clearAnnotations() {
        // Clear annotation highlights from editor
        const highlights = this.editor.querySelectorAll('[data-annotation-id]');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            highlight.remove();
        });
    
        // Clear annotation list
        const annotationsContainer = this.annotationsList.querySelector('.annotations-container');
        if (annotationsContainer) {
            annotationsContainer.innerHTML = '';
        }
    
        // Clear process button
        const processButton = this.annotationsList.querySelector('.process-button');
        if (processButton) {
            processButton.remove();
        }
    
        // Clear annotations map
        this.annotations.clear();
        this.saveAnnotations();
    }
    
    
}

export default TextEditor;