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
    exclude: ['@base-org/account', '@safe-global/safe-apps-sdk', '@safe-globalThis/safe-apps-sdk'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': '{}',
    'global': 'globalThis',
    // Fix for Request/Response undefined
    'globalThis.Request': 'undefined',
    'globalThis.Response': 'undefined',
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