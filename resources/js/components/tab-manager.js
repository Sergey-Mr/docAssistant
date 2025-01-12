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
                
                const tabsContainer = document.querySelector('.flex.space-x-2');
                const newTabHtml = `
                    <div class="flex items-center tab-item">
                        <a href="/dashboard?tab=${data.tab.id}"
                           class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                           text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            ${data.tab.name}
                            <button data-tab-id="${data.tab.id}" 
                                class="delete-tab-btn ml-2 text-gray-400 hover:text-red-500 focus:outline-none">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </a>
                    </div>
                `;
                tabsContainer.insertAdjacentHTML('beforeend', newTabHtml);
    
                const newTabLink = document.querySelector(`a[href="/dashboard?tab=${data.tab.id}"]`);
                this.switchTab(data.tab.id, newTabLink);
                
                window.showNotification('Tab created successfully', 'success');
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