import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds one self-contained dist/cadet.js (+ cadet.css) that the static portfolio can load with a <script> tag.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    lib: { entry: 'main.jsx', name: 'Cadet', formats: ['iife'], fileName: () => 'cadet.js' },
    cssFileName: 'cadet'
  }
});
