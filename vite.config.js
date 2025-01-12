import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 
                    'resources/js/app.js',
                    'resources/js/components/dashboard.js',
                    'resources/js/components/text-editor.js',
                    'resources/js/components/tab-manager.js'
                ],
            refresh: true,
        }),
    ],
});
