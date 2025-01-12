export {};

declare global {
    interface Window {
        showNotification(message: string, type: 'success' | 'error'): void;
    }
}
