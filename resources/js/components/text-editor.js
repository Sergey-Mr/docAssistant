export default class TextEditor {
    static CSS = {
        editor: 'w-full min-h-[300px] p-4 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize overflow-auto',
        modal: 'hidden absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4',
        annotation: 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-start',
        highlight: 'bg-blue-200 dark:bg-blue-700 px-1 rounded',
        annotationText: 'font-bold text-gray-700 dark:text-gray-300',
        annotationContent: 'text-gray-600 dark:text-gray-400'
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
    }

    attachEventListeners() {
        if (!this.editor) return;
        
        this.editor.addEventListener('mouseup', this.handleSelection);
        document.addEventListener('mousedown', this.handleOutsideClick);
        this.modal.addEventListener('mousedown', e => e.stopPropagation());
        this.input.addEventListener('focus', () => this.isEditingModal = true);
        this.input.addEventListener('blur', () => this.isEditingModal = false);
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
        if (selection?.toString().length > 0) {
            this.selectedRange = selection.getRangeAt(0);
            this.selectedTextDisplay.textContent = `"${selection.toString()}"`;
            this.showModal();
            this.updateModalPosition();
        }
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

    destroy() {
        this.editor.removeEventListener('mouseup', this.handleSelection);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }
}