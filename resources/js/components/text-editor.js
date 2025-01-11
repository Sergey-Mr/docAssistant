export default class TextEditor {
    constructor() {
        this.editor = document.getElementById('text-editor');
        this.modal = document.getElementById('edit-modal');
        this.input = document.getElementById('edit-text-input');
        this.selectedRange = null;
        this.isEditingModal = false;
        this.init();

        this.closeModal = this.closeModal.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
    }

    init() {
        if (!this.editor) return;

         // Helper function to handle selection
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
                this.selectedRange = selection.getRangeAt(0);
                this.input.value = selection.toString();
                this.positionAndShowModal();
            }
        };
        
        // Handle mouse selection
        this.editor.addEventListener('mouseup', handleSelection);
    
        // Handle keyboard selection
        this.editor.addEventListener('keyup', (e) => {
            // Check if selection keys were pressed (Shift + Arrow keys)
            if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                handleSelection();
            }
        });
        
        // Handle text selection
        this.editor.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
                this.selectedRange = selection.getRangeAt(0);
                this.input.value = selection.toString();
                this.positionAndShowModal();
            }
        });

        // Handle modal focus
        this.input.addEventListener('focus', () => {
            this.isEditingModal = true;
        });

        this.input.addEventListener('blur', () => {
            this.isEditingModal = false;
        });

        // Handle clicks outside modal and editor
        document.addEventListener('mousedown', (e) => {
            if (!this.modal.contains(e.target) && 
                !this.editor.contains(e.target) && 
                !this.isEditingModal) {
                this.closeModal();
                window.getSelection().removeAllRanges();
            }
        });

        // Handle selection change
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.toString().length === 0 && 
                !this.isEditingModal && 
                !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    positionAndShowModal() {
        const range = this.selectedRange;
        const rect = range.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Position modal near selection
        this.modal.style.position = 'absolute';
        this.modal.style.top = `${rect.bottom + scrollTop + 10}px`;
        this.modal.style.left = `${rect.left + scrollLeft}px`;
        this.modal.style.transform = 'none';
        
        this.showModal();
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
            const response = await fetch('/text/update', {  // Updated URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    start_index: this.getTextOffset(this.selectedRange.startContainer, this.selectedRange.startOffset),
                    end_index: this.getTextOffset(this.selectedRange.endContainer, this.selectedRange.endOffset),
                    original_text: this.selectedRange.toString(),
                    updated_text: this.input.value,
                    full_text: this.editor.textContent
                })
            });
    
            if (response.ok) {
                this.updateContent();
            } else {
                console.error('Update failed:', await response.text());
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    updateContent() {
        const newText = document.createTextNode(this.input.value);
        this.selectedRange.deleteContents();
        this.selectedRange.insertNode(newText);
        this.closeModal();
    }

    getTextOffset(node, offset) {
        const range = document.createRange();
        range.selectNodeContents(this.editor);
        range.setEnd(node, offset);
        return range.toString().length;
    }
}