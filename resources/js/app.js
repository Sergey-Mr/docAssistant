import './bootstrap';

import Alpine from 'alpinejs';
import TextEditor from './components/text-editor';

document.addEventListener('DOMContentLoaded', () => {
    window.textEditor = new TextEditor();
});

window.Alpine = Alpine;

Alpine.start();
