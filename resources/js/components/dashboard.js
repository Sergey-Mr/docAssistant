export default class DashboardNotifications {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Wait for Alpine and DOM to be ready
        await this.waitForAlpine();
        this.notification = document.querySelector('[x-data]');
        this.initializeNotifications();
    }

    async waitForAlpine() {
        return new Promise(resolve => {
            if (window.Alpine) {
                resolve();
            } else {
                document.addEventListener('alpine:init', () => resolve());
            }
        });
    }

    initializeNotifications() {
        if (!this.notification) {
            console.error('Notification element not found');
            return;
        }

        window.showNotification = this.showNotification.bind(this);
    }

    showNotification(message, type) {
        // Wait for Alpine data to be available
        if (!this.notification || !this.notification.__x) {
            console.warn('Retrying notification in 100ms...');
            setTimeout(() => this.showNotification(message, type), 100);
            return;
        }

        this.notification.__x.$data.message = message;
        this.notification.__x.$data.type = type;
        this.notification.__x.$data.show = true;

        setTimeout(() => {
            this.notification.__x.$data.show = false;
        }, 4000);
    }
}