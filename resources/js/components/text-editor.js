class AnnotationProcessingError extends Error {
    constructor(message, status = null) {
        super(message);
        this.name = 'AnnotationProcessingError';
        this.status = status;
    }
}

class TextEditor {
    // Common CSS classes
    static CSS = {
        editor: 'w-full min-h-[300px] p-4 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto',
        modal: 'hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4',
        annotation: 'p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border-l-4 border-blue-500 dark:border-blue-500 flex justify-between items-start',
        highlight: 'bg-blue-100 dark:bg-blue-700/50 px-1 rounded cursor-pointer transition-colors border-b-2 border-blue-400 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-600/50',
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
        this.loadChangeHistory();
    }

    // ---------------- Initialization & Event Binding ----------------
    initializeElements() {
        this.editor = document.getElementById('text-editor');
        if (!this.editor) throw new Error('Editor element not found');

        // Ensure tabId is available
        if (!this.editor.dataset.tabId) {
            console.error('Missing tab_id in editor dataset');
            this.editor.dataset.tabId = this.generateTempTabId();
        }

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

    generateTempTabId() {
        return `temp_${Date.now()}`;
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
        this.input.addEventListener('focus', () => (this.isEditingModal = true));
        this.input.addEventListener('blur', () => (this.isEditingModal = false));
    }

    // ---------------- Annotation Handling ----------------
    handleKeyboardSelection(e) {
        if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            const selection = window.getSelection();
            if (selection && selection.toString().length) {
                this.handleSelection();
            }
        }
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

    isTextAlreadyAnnotated(range) {
        const selectedNode = range.commonAncestorContainer;
        const highlightedSpans = this.editor.querySelectorAll('[data-annotation-id]');
        return Array.from(highlightedSpans).some(span =>
            span.contains(selectedNode) ||
            selectedNode.contains(span) ||
            range.intersectsNode(span)
        );
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

    clearAllAnnotations() {
        const highlights = this.editor.querySelectorAll('[data-annotation-id]');
        highlights.forEach(hl => {
            const parent = hl.parentNode;
            while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
            hl.remove();
        });
        this.annotationsList.innerHTML = '';
        this.annotations.clear();
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

    setAnnotationBorderColor(annotationId, source) {
        const annotationElement = this.annotationsList.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (annotationElement) {
            const color = source === 'user' ? '#3B82F6' : '#3B82F6';
            annotationElement.style.borderLeftColor = color;
            annotationElement.style.borderLeftWidth = '4px';
        }
    }

    highlightRange(range, annotationId) {
        const span = document.createElement('span');
        span.className = TextEditor.CSS.highlight;
        span.dataset.annotationId = annotationId;
        try {
            range.surroundContents(span);
            span.addEventListener('mouseenter', () => {
                const ann = this.annotationsList.querySelector(`[data-annotation-id="${annotationId}"]`);
                if (ann) ann.classList.add('ring-2', 'ring-blue-400');
            });
            span.addEventListener('mouseleave', () => {
                const ann = this.annotationsList.querySelector(`[data-annotation-id="${annotationId}"]`);
                if (ann) ann.classList.remove('ring-2', 'ring-blue-400');
            });
            span.addEventListener('click', () => {
                const ann = this.annotationsList.querySelector(`[data-annotation-id="${annotationId}"]`);
                if (ann) ann.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        } catch (error) {
            console.error('Failed to highlight range:', error);
        }
    }

    // ---------------- Local Data Storage ----------------
    loadAnnotationsForCurrentTab() {
        if (this.isLoadingAnnotations) return;
        try {
            this.isLoadingAnnotations = true;
            const tabId = this.editor?.dataset.tabId;
            if (!tabId) return;
            this.clearAllAnnotations();
            const savedAnnotations = localStorage.getItem(`annotations_${tabId}`);
            if (savedAnnotations) {
                JSON.parse(savedAnnotations).forEach(ann => this.restoreAnnotation(ann));
            }
        } finally {
            this.isLoadingAnnotations = false;
        }
    }

    restoreAnnotation(ann) {
        const range = this.findRangeForAnnotation(ann.text);
        if (range) {
            const annotation = { ...ann, range };
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
        const annArray = Array.from(this.annotations.values()).map(a => ({
            id: a.id,
            text: a.text,
            comment: a.comment
        }));
        localStorage.setItem(`annotations_${tabId}`, JSON.stringify(annArray));
    }

    // ---------------- Modal Management ----------------
    showModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.selectedRange = null;
        this.input.value = '';
    }

    handleOutsideClick(e) {
        if (!this.modal.contains(e.target) && !this.editor.contains(e.target)) {
            this.closeModal();
        }
    }

    updateModalPosition() {
        const rect = this.selectedRange.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        this.modal.style.position = 'absolute';
        this.modal.style.top = `${rect.bottom + scrollTop + 10}px`;
        this.modal.style.left = `${rect.left + scrollLeft}px`;
    }

    // ---------------- Processing & API Calls ----------------
    renderProcessButton() {
        const existingButton = this.annotationsList.querySelector('.process-button');
        if (existingButton) existingButton.remove();
        const processButton = document.createElement('button');
        processButton.className = `process-button ${TextEditor.CSS.processButton}`;
        processButton.innerHTML = this.getProcessButtonContent();
        processButton.onclick = () => this.processAnnotations();
        this.annotationsList.appendChild(processButton);
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
                const response = await this.makeRequest(options);
                console.log(response);

                // Attempt parsing if revised_text is stringified JSON
                let revisedTextData;
                try {
                    revisedTextData = JSON.parse(response.revised_text);
                } catch {
                    revisedTextData = response.revised_text;
                }

                const revised_text = revisedTextData.revised_text || revisedTextData;
                let revisions = response.revisions;
                if (typeof revisions === 'string') {
                    revisions = JSON.parse(revisions);
                }
                if (!revised_text || !Array.isArray(revisions)) {
                    throw new AnnotationProcessingError('Invalid response format');
                }
                return { revised_text, revisions };
            } catch (error) {
                if (attempt === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    async makeRequest(options) {
        const response = await fetch('/api/annotations/process', options);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', {
                status: response.status,
                statusText: response.statusText,
                response: errorText
            });
            if (response.status === 500) {
                throw new AnnotationProcessingError('Server error occurred. Please try again later.', 500);
            }
            throw new AnnotationProcessingError(`API request failed (${response.status}): ${response.statusText}`, response.status);
        }
        const data = await response.json();
        console.log('API Response:', data);

        if (!data.success) {
            throw new AnnotationProcessingError(data.message || 'Processing failed');
        }
        const revisedText = data.revisions.revised_text;
        const revisionsList = data.revisions.revisions;
        if (!revisedText || !Array.isArray(revisionsList)) {
            console.error('Invalid response structure:', data);
            throw new AnnotationProcessingError('Invalid response format');
        }
        return { revised_text: revisedText, revisions: revisionsList };
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

    getTextOffset(node, offset) {
        // Traverse text nodes to find cumulative text length
        let totalOffset = 0;
        const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT, null, false);
    
        while (walker.nextNode()) {
            if (walker.currentNode === node) {
                totalOffset += offset;
                break;
            }
            totalOffset += walker.currentNode.nodeValue.length;
        }
    
        return totalOffset;
    }

    prepareRequestOptions(payload) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) throw new AnnotationProcessingError('CSRF token not found');
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify(payload)
        };
    }

    // ---------------- Processing Feedback ----------------
    displayProcessingResults({ revised_text, revisions }) {
        const existingResults = this.annotationsList.querySelector('.results-container');
        if (existingResults) existingResults.remove();

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container mt-6 space-y-4';

        revisions.forEach(revision => {
            const resultElement = document.createElement('div');
            resultElement.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-[#10B981] mb-4';
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
            `;
            resultsContainer.appendChild(resultElement);
        });

        const applyButton = document.createElement('button');
        applyButton.style.cssText = `
            width: 100%; 
            margin-top: 1.5rem; 
            padding: 0.75rem 1rem; 
            background-color: #22c55e; 
            color: white; 
            border-radius: 0.5rem; 
            font-weight: 500; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 0.5rem; 
            transition: background-color 0.3s ease;
        `;
        applyButton.onmouseover = () => (applyButton.style.backgroundColor = '#16a34a');
        applyButton.onmouseout = () => (applyButton.style.backgroundColor = '#22c55e');
        applyButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Apply All Changes
        `;
        applyButton.onclick = () => this.applyRevision(null, revised_text);

        resultsContainer.appendChild(applyButton);
        this.annotationsList.appendChild(resultsContainer);
    }

    async applyRevision(index, revisedText) {
        try {
            if (!revisedText || typeof revisedText !== 'string') {
                throw new Error('Invalid revised text received');
            }
            this.editor.innerHTML = revisedText;
            const results = this.annotationsList.querySelector('.results-container');
            if (!results) throw new Error('No revisions found');

            const explanationElements = Array.from(
                results.querySelectorAll('.text-gray-600.dark\\:text-gray-400')
            ).filter(el => el.previousElementSibling?.textContent.includes('Explanation:'));

            const explanations = explanationElements.map(el => el.textContent).filter(Boolean);
            const cleanedContent = this.cleanTextContent(revisedText);
            if (!cleanedContent.trim()) throw new Error('No valid content to save');

            await this.saveTextToDatabase(
                cleanedContent,
                explanations.length ? explanations.join('; ') : 'No explanation provided'
            );

            this.clearUIAfterRevision();
            this.showWarning('Changes applied successfully');
            const applyButton = results.querySelector('button');
            if (applyButton) this.disableAppliedButton(results);
            await this.loadChangeHistory();
        } catch (error) {
            console.error('Error applying revision:', error);
            this.showWarning(`Failed to apply changes: ${error.message}`);
        }
    }

    clearUIAfterRevision() {
        const resultsContainer = this.annotationsList.querySelector('.results-container');
        if (resultsContainer) resultsContainer.remove();
        this.annotationsList.innerHTML = '';
        this.clearAnnotations();
        const processButton = this.annotationsList.querySelector('.process-button');
        if (processButton) processButton.remove();
        this.annotations.clear();
        this.saveAnnotations();
    }

    cleanTextContent(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const spans = temp.querySelectorAll('[data-annotation-id]');
        spans.forEach(span => {
            const text = span.textContent;
            span.replaceWith(text);
        });
        return temp.textContent;
    }

    async saveTextToDatabase(content, explanation = '') {
        try {
            const tabId = parseInt(this.editor?.dataset?.tabId);
            console.log('Current tab ID:', tabId);
            if (!tabId || isNaN(tabId)) throw new Error('Invalid tab ID');

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) throw new Error('CSRF token not found');

            const requestBody = {
                tabId,
                content: content?.trim() || '',
                explanation: explanation?.trim() || ''
            };
            console.log('Request body:', requestBody);

            const response = await fetch('/text/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('Server error:', data);
                throw new Error(data.message || 'Failed to save text');
            }
            return data;
        } catch (error) {
            console.error('Error saving text to database:', error);
            throw error;
        }
    }

    disableAppliedButton(revision) {
        const button = revision.querySelector('button');
        button.disabled = true;
        button.classList.remove('hover:bg-green-600');
        button.classList.add('bg-gray-400');
        button.textContent = 'Applied';
    }

    // ---------------- History Management ----------------
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
                    Accept: 'application/json',
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
        this.historyContainer.innerHTML = '';
        const title = document.createElement('h3');
        title.className = TextEditor.CSS.historyTitle;
        title.textContent = 'Change History';
        this.historyContainer.appendChild(title);

        changes.forEach(change => {
            const changeItem = document.createElement('div');
            changeItem.className = TextEditor.CSS.historyItem;

            const timestamp = new Date(change.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

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
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                    <span>${timestamp}</span>
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            `;
            this.historyContainer.appendChild(changeItem);
        });
    }

    // ---------------- Annotation Cleanup ----------------
    clearAnnotations() {
        const highlights = this.editor.querySelectorAll('[data-annotation-id]');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            highlight.remove();
        });
        const annotationsContainer = this.annotationsList.querySelector('.annotations-container');
        if (annotationsContainer) annotationsContainer.innerHTML = '';
        const processButton = this.annotationsList.querySelector('.process-button');
        if (processButton) processButton.remove();
        this.annotations.clear();
        this.saveAnnotations();
    }

    // ---------------- UI Helpers & Teardown ----------------
    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        this.updateProcessButton();
    }

    updateProcessButton() {
        const button = this.annotationsList.querySelector('.process-button');
        if (!button) return;
        button.disabled = this.isProcessing;
        button.innerHTML = this.isProcessing ? this.getLoadingButtonContent() : this.getProcessButtonContent();
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
                <circle class="opacity-25" cx="12" cy="12" r="10" 
                    stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 
                    7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
            </svg>
            Processing...
        `;
    }

    showWarning(message) {
        const existingWarning = document.querySelector('.warning-message');
        if (existingWarning) existingWarning.remove();

        const warning = document.createElement('div');
        warning.className = 'warning-message fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 rounded-lg shadow-md z-[9999] opacity-0 transition-opacity duration-300';
        warning.textContent = message;
        document.body.appendChild(warning);
        warning.offsetHeight; // force reflow
        warning.style.opacity = '1';

        setTimeout(() => {
            warning.style.opacity = '0';
            warning.addEventListener('transitionend', () => warning.remove());
        }, 3000);
    }

    handleProcessingError(error) {
        console.error('Processing failed:', error);
        this.showWarning(
            error instanceof AnnotationProcessingError
                ? error.message
                : 'Failed to process annotations'
        );
    }

    destroy() {
        this.editor.removeEventListener('mouseup', this.handleSelection);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }
}

export default TextEditor;