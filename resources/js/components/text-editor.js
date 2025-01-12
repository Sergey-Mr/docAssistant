export default class TextEditor {
    constructor() {
        this.initializeElements();
        this.bindMethods();
        this.attachEventListeners();
    }

    initializeElements() {
        this.editor = document.getElementById('text-editor');
        this.modal = document.getElementById('edit-modal');
        this.input = document.getElementById('edit-text-input');
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
        this.input.value = selection.toString();
        this.updateModalPosition();
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
        return {
            start_index: this.getTextOffset(this.selectedRange.startContainer, this.selectedRange.startOffset),
            end_index: this.getTextOffset(this.selectedRange.endContainer, this.selectedRange.endOffset),
            original_text: this.selectedRange.toString(),
            updated_text: this.input.value,
            full_text: this.editor.textContent
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