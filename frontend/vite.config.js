import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    (await import('@vitejs/plugin-react')).default(),
  ],
});
