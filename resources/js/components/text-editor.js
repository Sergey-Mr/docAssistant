export default class TextEditor {
    constructor() {
        this.annotations = new Map();
        this.initializeElements();
        this.bindMethods();
        this.attachEventListeners();
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
        this.closeModal = this.closeModal.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleKeyboardSelection = this.handleKeyboardSelection.bind(this);
    }

    attachEventListeners() {
        if (!this.editor) return;
        
        this.editor.addEventListener('mouseup', this.handleSelection);
        this.editor.addEventListener('keyup', this.handleKeyboardSelection);
        this.attachModalListeners();
        this.attachDocumentListeners();
    }

    attachModalListeners() {
        this.input.addEventListener('focus', () => this.isEditingModal = true);
        this.input.addEventListener('blur', () => this.isEditingModal = false);
        this.modal.addEventListener('mousedown', e => e.stopPropagation());
    }

    attachDocumentListeners() {
        document.addEventListener('mousedown', this.handleOutsideClick);
        document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
    }

    handleSelection() {
        const selection = window.getSelection();
        if (this.isValidSelection(selection)) {
            this.updateSelection(selection);
        }
    }

    handleKeyboardSelection(e) {
        if (this.isSelectionKey(e)) {
            this.handleSelection();
        }
    }

    isSelectionKey(e) {
        return e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
    }

    isValidSelection(selection) {
        return selection && selection.toString().length > 0;
    }

    updateSelection(selection) {
        this.selectedRange = selection.getRangeAt(0);
        const selectedText = selection.toString();
        this.selectedTextDisplay.textContent = `"${selectedText}"`;
        this.input.value = '';
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

        // Add to annotations map
        this.annotations.set(annotationId, annotation);
        
        // Highlight the text
        this.highlightRange(this.selectedRange, annotationId);
        
        // Add to annotations list
        this.addAnnotationToList(annotation);
        
        // Close modal
        this.closeModal();
        
        // Keep the selection
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(annotation.range);
    }

    highlightRange(range, annotationId) {
        const span = document.createElement('span');
        span.className = 'bg-yellow-200 dark:bg-yellow-800';
        span.dataset.annotationId = annotationId;
        range.surroundContents(span);
    }

    addAnnotationToList(annotation) {
        const annotationElement = document.createElement('div');
        annotationElement.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-start';
        annotationElement.innerHTML = `
            <div class="flex-grow">
                <div class="mb-3">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Selected text: </span>
                    <span class="italic text-gray-600 dark:text-gray-400">"${annotation.text}"</span>
                </div>
                <div>
                    <span class="font-bold text-gray-700 dark:text-gray-300">Comment: </span>
                    <span class="text-gray-600 dark:text-gray-400">${annotation.comment}</span>
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
        const annotation = this.annotations.get(annotationId);
        if (!annotation) return;

        // Remove highlight
        const highlightSpan = this.editor.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (highlightSpan) {
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            highlightSpan.remove();
        }

        // Remove from list
        const annotationElement = Array.from(this.annotationsList.children)
            .find(el => el.querySelector(`button[onclick*="${annotationId}"]`));
        if (annotationElement) {
            annotationElement.remove();
        }

        // Remove from map
        this.annotations.delete(annotationId);
    }

    updateModalPosition() {
        const rect = this.selectedRange.getBoundingClientRect();
        const position = this.calculatePosition(rect);
        this.setModalPosition(position);
        this.showModal();
    }

    calculatePosition(rect) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const MODAL_OFFSET = 10;
        
        return {
            top: rect.bottom + scrollTop + MODAL_OFFSET,
            left: rect.left + scrollLeft
        };
    }

    setModalPosition({ top, left }) {
        this.modal.style.position = 'absolute';
        this.modal.style.top = `${top}px`;
        this.modal.style.left = `${left}px`;
    }

    handleOutsideClick(e) {
        if (this.shouldCloseModal(e)) {
            this.closeModalAndClearSelection();
        }
    }

    shouldCloseModal(e) {
        return !this.modal.contains(e.target) && 
               !this.editor.contains(e.target) && 
               !this.isEditingModal;
    }

    handleSelectionChange() {
        const selection = window.getSelection();
        if (this.shouldCloseOnSelectionChange(selection)) {
            this.closeModal();
        }
    }

    shouldCloseOnSelectionChange(selection) {
        return selection.toString().length === 0 && 
               !this.isEditingModal && 
               !this.modal.classList.contains('hidden');
    }

    closeModalAndClearSelection() {
        this.closeModal();
        window.getSelection().removeAllRanges();
    }

    showModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.selectedRange = null;
    }

    async saveChanges() {
        if (!this.selectedRange) return;
        
        try {
            const response = await this.sendUpdateRequest();
            const data = await response.json();
            if (response.ok) {
                this.updateContent();
                this.closeModal();
                window.showNotification('Changes saved successfully', 'success');
            } else {
                window.showNotification(data.error || 'Failed to save changes', 'error');
            }
        } catch (error) {
            console.error('Failed to save changes:', error);
            window.showNotification('Failed to save changes', 'error');
        }
    }

    async sendUpdateRequest() {
        try {
            return await fetch('/text/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(this.getUpdatePayload())
            });
        } catch (error) {
            throw new Error('Network error occurred');
        }
    }

    getUpdatePayload() {
        const newText = this.editor.textContent.substring(0, this.getTextOffset(this.selectedRange.startContainer, this.selectedRange.startOffset)) +
                   this.input.value +
                   this.editor.textContent.substring(this.getTextOffset(this.selectedRange.endContainer, this.selectedRange.endOffset));

        return {
            start_index: this.getTextOffset(this.selectedRange.startContainer, this.selectedRange.startOffset),
            end_index: this.getTextOffset(this.selectedRange.endContainer, this.selectedRange.endOffset),
            original_text: this.selectedRange.toString(),
            updated_text: this.input.value,
            full_text: newText,
            tab_id: this.editor.dataset.tabId
        };
    }

    getTextOffset(node, offset) {
        const range = document.createRange();
        range.selectNodeContents(this.editor);
        range.setEnd(node, offset);
        return range.toString().length;
    }

    updateContent() {
        const range = document.createRange();
        range.setStart(this.selectedRange.startContainer, this.selectedRange.startOffset);
        range.setEnd(this.selectedRange.endContainer, this.selectedRange.endOffset);
        range.deleteContents();
        range.insertNode(document.createTextNode(this.input.value));
    }

    destroy() {
        this.editor.removeEventListener('mouseup', this.handleSelection);
        this.editor.removeEventListener('keyup', this.handleKeyboardSelection);
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('selectionchange', this.handleSelectionChange);
    }
}