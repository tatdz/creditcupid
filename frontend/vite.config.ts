import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  optimizeDeps: {
    exclude: ['@base-org/account'] 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist', // Ensure this matches vercel.json
  },
  // Add this for Vercel
  base: './',
})