// tab-manager.js
export default class TabManager {
    constructor() {
        this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        this.initializeEventListeners();
        this.setupEventListeners();
    }

    // Event Handlers
    setupEventListeners() {
        window.createNewTab = this.createNewTab.bind(this);
        window.deleteTab = this.deleteTab.bind(this);
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => this.handleTabClick(e));
    }

    handleTabClick(e) {
        const deleteBtn = e.target.closest('.delete-tab-btn');
        if (deleteBtn) {
            e.preventDefault();
            const tabId = deleteBtn.dataset.tabId;
            this.deleteTab(tabId);
        }
    }

    // HTTP Methods
    async makeRequest(url, method, body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken,
                    'Accept': 'application/json'
                }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Tab Operations
    async createNewTab() {
        try {
            const data = await this.makeRequest('/tabs', 'POST', { name: 'New Tab' });
            await this.handleTabCreation(data.tab);
        } catch (error) {
            this.handleError(error, 'Failed to create tab');
        }
    }

    async deleteTab(tabId) {
        try {
            const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`).closest('.tab-item');
            const isActiveTab = tabElement.querySelector('.bg-gray-200, .dark\\:bg-gray-700');
            
            await this.makeRequest(`/tabs/${tabId}`, 'DELETE');
            
            if (isActiveTab) {
                const nextTab = tabElement.nextElementSibling?.querySelector('a') || 
                               tabElement.previousElementSibling?.querySelector('a');
                
                if (nextTab) {
                    const nextTabId = new URL(nextTab.href).searchParams.get('tab');
                    await this.switchTab(nextTabId, nextTab);
                    window.location.reload();
                }
            }
            
            this.removeTabElement(tabId);
            window.showNotification('Tab deleted successfully', 'success');
            
        } catch (error) {
            this.handleError(error, 'Failed to delete tab');
        }
    }

    async switchTab(tabId, tabLink) {
        try {
            const data = await this.makeRequest(`/tabs/${tabId}/content`, 'GET');
            this.updateTabContent(tabId, data.content, tabLink);
            window.textEditor.loadAnnotationsForCurrentTab();
        } catch (error) {
            this.handleError(error, 'Failed to switch tab');
        }
    }

    // UI Updates
    async handleTabCreation(tab) {
        const tabsContainer = document.querySelector('.flex.space-x-2');
        const newTabHtml = this.renderTabTemplate(tab);
        tabsContainer.insertAdjacentHTML('beforeend', newTabHtml);
        
        window.showNotification('Tab created successfully', 'success');
    }

    renderTabTemplate(tab) {
        return `
            <div class="flex items-center tab-item">
                <a href="/dashboard?tab=${tab.id}"
                   class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                   text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    ${tab.name}
                    <button data-tab-id="${tab.id}" 
                        class="delete-tab-btn ml-2 text-gray-400 hover:text-red-500 focus:outline-none">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </a>
            </div>
        `;
    }

    updateTabContent(tabId, content, tabLink) {
        const editor = document.querySelector('#text-editor');
        if (editor) {
            editor.innerHTML = content || '';
            editor.dataset.tabId = tabId;
            this.updateURL(tabId);
            this.activateTab(tabLink);
        }
    }

    removeTabElement(tabId) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`).closest('.tab-item');
        if (tabElement) {
            tabElement.remove();
        }
    }

    // Utilities
    async handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    handleError(error, message = 'An error occurred') {
        console.error(error);
        window.showNotification(message, 'error');
    }

    updateURL(tabId) {
        window.history.pushState({}, '', `/dashboard?tab=${tabId}`);
    }

    activateTab(newTabLink) {
        document.querySelectorAll('a[href*="/dashboard?tab="]').forEach(link => {
            this.updateTabStyles(link, link === newTabLink);
        });
    }

    updateTabStyles(link, isActive) {
        const activeClasses = ['bg-gray-200', 'text-gray-900', 'dark:bg-gray-700', 'dark:text-white'];
        const inactiveClasses = ['text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300'];
        
        link.classList.remove(...(isActive ? inactiveClasses : activeClasses));
        link.classList.add(...(isActive ? activeClasses : inactiveClasses));
    }
}