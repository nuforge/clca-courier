import { defineConfig } from 'vitest/config';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss'
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.quasar/**',
      '**/cypress/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.vitepress/cache/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '.quasar/**',
        '**/node_modules/**',
        '**/tests/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/**',
        '**/constants/**'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // More strict requirements for critical services
        'src/services/': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/utils/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    // Timeout for tests
    testTimeout: 10000,
    hookTimeout: 10000,
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    // Mock configuration
    deps: {
      inline: ['@vue', '@vueuse', 'vue-demi', 'quasar']
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      src: fileURLToPath(new URL('./src', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      services: fileURLToPath(new URL('./src/services', import.meta.url)),
      types: fileURLToPath(new URL('./src/types', import.meta.url)),
      utils: fileURLToPath(new URL('./src/utils', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url))
    }
  },
  define: {
    // Mock environment variables for tests
    'process.env': {
      NODE_ENV: 'test',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: 'test-app-id'
    }
  }
});
