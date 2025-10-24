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
    exclude: ['@base-org/account', '@safe-global/safe-apps-sdk', '@safe-globalThis/safe-apps-sdk'] 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': '{}',
    'global': 'globalThis',
    // Inject proper polyfills that will be available at module evaluation time
    'globalThis.Request': `class Request {
      constructor() {
        throw new Error('Request constructor not available in browser environment')
      }
    }`,
    'globalThis.Response': `class Response {
      constructor() {
        throw new Error('Response constructor not available in browser environment')
      }
    }`,
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['@safe-global/safe-apps-sdk', '@safe-globalThis/safe-apps-sdk'],
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return
        }
        warn(warning)
      }
    },
  },
  base: '/',
})