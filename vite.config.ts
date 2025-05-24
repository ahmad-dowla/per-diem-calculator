import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss()],
    build: {
        lib: {
            entry: ['src/index.ts'],
            name: '@per-diem-calculator/vanilla',
        },
        rollupOptions: {
            external: ['TomSelect', 'JSZip', 'DOMPurify'],
            output: {
                globals: {
                    TomSelect: 'TomSelect',
                    JSZip: 'JSZip',
                    DOMPurify: 'DOMPurify',
                },
            },
        },
    },
});
