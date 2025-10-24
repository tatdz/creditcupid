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
      plugins: [
        {
          name: 'fix-node-globals',
          setup(build) {
            build.onResolve({ filter: /_virtual-process-polyfill_\.js/ }, args => ({
              path: args.path,
              namespace: 'process-polyfill',
            }))
            build.onLoad({ filter: /.*/, namespace: 'process-polyfill' }, () => ({
              contents: `
                import process from 'process';
                export default process;
              `,
            }))
          },
        },
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'process': 'process/browser',
      'util': 'util',
      'buffer': 'buffer',
      'stream': 'stream-browserify',
    },
  },
  define: {
    'process.env': '{}',
    'global': 'globalThis',
    'globalThis.process': JSON.stringify({ env: {}, versions: {}, browser: true }),
    'globalThis.Buffer': 'Buffer',
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