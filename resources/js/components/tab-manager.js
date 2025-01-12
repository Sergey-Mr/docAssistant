// resources/js/components/tab-manager.js
export default class TabManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.createNewTab = this.createNewTab.bind(this);
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
}
