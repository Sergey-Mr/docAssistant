export default class TabManager {
    constructor() {
        this.csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        this.initializeEventListeners();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.createNewTab = this.createNewTab.bind(this);
        window.deleteTab = this.deleteTab.bind(this);
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-tab-btn');
            if (deleteBtn) {
                e.preventDefault();
                const tabId = deleteBtn.dataset.tabId;
                console.log('Delete button clicked for tab:', tabId);
                this.deleteTab(tabId);
            }
        });
    }

    async createNewTab() {
        try {
            const response = await fetch('/tabs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    name: 'New Tab'
                })
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = `/dashboard?tab=${data.tab.id}`;
            } else {
                window.showNotification('Failed to create tab', 'error');
            }
        } catch (error) {
            console.error('Error creating tab:', error);
            window.showNotification('Failed to create tab', 'error');
        }
    }

    async deleteTab(tabId) {
        console.log('Deleting tab:', tabId);
        try {
            const response = await fetch(`/tabs/${tabId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': this.csrfToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            });

            if (response.ok) {
                const data = await response.json();
                
                const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`)
                    .closest('.flex.items-center');
                
                if (tabElement) {
                    const wasActive = tabElement.querySelector('.bg-gray-200, .dark\\:bg-gray-700');
                    
                    tabElement.remove();
                    if (wasActive) {
                        const firstTab = document.querySelector('a[href*="/dashboard?tab="]');
                        if (firstTab) {
                            window.location.href = firstTab.getAttribute('href');
                        }
                    }
                }
                
                window.showNotification('Tab deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete tab');
            }
        } catch (error) {
            console.error('Delete error:', error);
            window.showNotification('Failed to delete tab', 'error');
        }
    }
}