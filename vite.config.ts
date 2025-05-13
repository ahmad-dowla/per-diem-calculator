import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import tailwindcss from '@tailwindcss/vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
    plugins: [
        legacy({
            targets: ['defaults', 'not IE 11'],
        }),
        tailwindcss(),
        compression(),
    ],
});
