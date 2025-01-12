export default class TextEditor {
    static CSS = {
        editor: 'w-full min-h-[300px] p-4 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto',
        modal: 'hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4',
        annotation: 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-start',
        highlight: 'bg-blue-200 dark:bg-blue-700 px-1 rounded',
        annotationText: 'font-bold text-gray-700 dark:text-gray-300',
        warning: 'fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-md z-50 transition-opacity duration-300',
        annotationContent: 'text-gray-600 dark:text-gray-400',
        processButton: 'w-full mt-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 font-medium'
    };

    constructor() {
        this.annotations = new Map();
        this.initializeElements();
        this.bindMethods();
        this.attachEventListeners();
        this.loadAnnotationsForCurrentTab();
    }

    initializeElements() {
        this.editor = document.getElementById('text-editor');
        this.modal = document.getElementById('edit-modal');
        this.input = document.getElementById('edit-text-input');
        this.selectedTextDisplay = document.getElementById('selected-text');
        this.annotationsList = document.getElementById('annotations-list');
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
            annotations.forEach(ann => {
                const range = document.createRange();
                const walker = document.createTreeWalker(
                    this.editor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let start = null;
                let end = null;

                while (walker.nextNode()) {
                    const node = walker.currentNode;
                    const content = node.textContent;
                    const idx = content.indexOf(ann.text, 0);
                    
                    if (idx !== -1) {
                        start = {node, offset: idx};
                        end = {node, offset: idx + ann.text.length};
                        break;
                    }
                }

                if (start && end) {
                    range.setStart(start.node, start.offset);
                    range.setEnd(end.node, end.offset);

                    const annotation = {
                        id: ann.id,
                        text: ann.text,
                        comment: ann.comment,
                        range: range
                    };

                    this.annotations.set(ann.id, annotation);
                    this.highlightRange(range, ann.id);
                    this.addAnnotationToList(annotation);
                }
            });
        }
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
            range: this.selectedRange.cloneRange()
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
        if (existingButton) {
            existingButton.remove();
        }
    
        const processButton = document.createElement('button');
        processButton.className = `process-button ${TextEditor.CSS.processButton}`;
        processButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Start Processing
        `;
        processButton.onclick = () => this.processAnnotations();
        this.annotationsList.appendChild(processButton);
    }

    addAnnotationToList(annotation) {
        const annotationElement = document.createElement('div');
        annotationElement.className = TextEditor.CSS.annotation;
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
        this.renderProcessButton();
    }

    removeAnnotation(annotationId) {
        const highlightSpan = this.editor.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (highlightSpan) {
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            highlightSpan.remove();
        }

        const annotationElement = Array.from(this.annotationsList.children)
            .find(el => el.querySelector(`button[onclick*="${annotationId}"]`));
        if (annotationElement) {
            annotationElement.remove();
        }

        this.annotations.delete(annotationId);
        this.saveAnnotations();
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
        
        for (const span of highlightedSpans) {
            if (span.contains(selectedNode) || 
                selectedNode.contains(span) ||
                range.intersectsNode(span)) {
                return true;
            }
        }
        return false;
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
        try {
            const data = {
                fullContext: this.editor.textContent,
                annotations: Array.from(this.annotations.values()).map(ann => ({
                    text: ann.text,
                    comment: ann.comment,
                    position: ann.range ? this.getTextOffset(ann.range.startContainer, ann.range.startOffset) : 0
                }))
            };
    
            const response = await fetch('/api/annotations/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(data)
            });
    
            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            if (responseData.success && responseData.revisions) {
                this.displayProcessingResults(responseData.revisions);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showWarning(error.message || 'Failed to process annotations');
        }
    }

    displayProcessingResults(revisions) {
        const existingResults = this.annotationsList.querySelector('.results-container');
        if (existingResults) {
            existingResults.remove();
        }
    
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container mt-6 space-y-4';
    
        revisions.forEach((revision, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500';
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

    showWarning(message) {
        const existingWarning = document.querySelector('.warning-message');
        if (existingWarning) {
            existingWarning.remove();
        }

        const warning = document.createElement('div');
        warning.className = 'warning-message fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 rounded-lg shadow-md z-[9999] opacity-0 transition-opacity duration-300';
        warning.textContent = message;
        document.body.appendChild(warning);

        // Force reflow
        warning.offsetHeight;
        warning.style.opacity = '1';

        setTimeout(() => {
            warning.style.opacity = '0';
            warning.addEventListener('transitionend', () => warning.remove());
        }, 3000);
    }

    displayProcessingResults(revisions) {
        const existingResults = this.annotationsList.querySelector('.results-container');
        if (existingResults) {
            existingResults.remove();
        }
    
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container mt-6 space-y-4';
    
        revisions.forEach((revision, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500';
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

    applyRevision(index) {
        try {
            const results = this.annotationsList.querySelector('.results-container');
            const revisions = results.querySelectorAll('.border-l-4');
            const revision = revisions[index];
            
            if (!revision) {
                throw new Error('Revision not found');
            }
    
            const originalText = revision.querySelector('.text-gray-600').textContent.replace(/['"]/g, '');
            const revisedText = revision.querySelector('.text-green-600').textContent.replace(/['"]/g, '');
    
            const content = this.editor.innerHTML;
            const updatedContent = content.replace(originalText, revisedText);
            this.editor.innerHTML = updatedContent;
    
            const annotation = Array.from(this.annotations.values())
                .find(ann => ann.text === originalText);
    
            if (annotation) {
                annotation.text = revisedText;
                this.saveAnnotations();
            }
    
            this.showWarning('Revision applied successfully');
    
            const button = revision.querySelector('button');
            button.disabled = true;
            button.classList.remove('hover:bg-green-600');
            button.classList.add('bg-gray-400');
            button.textContent = 'Applied';
    
        } catch (error) {
            console.error('Error applying revision:', error);
            this.showWarning('Failed to apply revision');
        }
    }

    destroy() {
        this.editor.removeEventListener('mouseup', this.handleSelection);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }
}