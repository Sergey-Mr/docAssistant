import './bootstrap';
import Alpine from 'alpinejs';
import TextEditor from './components/text-editor';
import DashboardNotifications from './components/dashboard';
import TabManager from './components/tab-manager';

window.Alpine = Alpine;
Alpine.start();

document.addEventListener('DOMContentLoaded', () => {
    new DashboardNotifications();
    new TabManager();
    window.textEditor = new TextEditor();
});

