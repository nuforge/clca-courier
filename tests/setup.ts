/**
 * Vitest Setup File
 * Global test configuration and mocks
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { config } from '@vue/test-utils';

// Mock Quasar composables
vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: vi.fn(),
    dialog: vi.fn(),
    loading: {
      show: vi.fn(),
      hide: vi.fn()
    },
    dark: {
      isActive: false,
      set: vi.fn(),
      toggle: vi.fn()
    },
    screen: {
      lt: {
        sm: false,
        md: false
      },
      gt: {
        sm: true,
        md: true
      }
    }
  }),
  Notify: {
    create: vi.fn()
  },
  Dialog: {
    create: vi.fn()
  },
  Loading: {
    show: vi.fn(),
    hide: vi.fn()
  }
}));

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    path: '/',
    name: 'index',
    params: {},
    query: {},
    meta: {}
  })
}));

// Mock Vue i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en-US' },
    availableLocales: ['en-US', 'es-ES']
  })
}));

// Mock Firebase (will be replaced with Firebase emulator for integration tests)
vi.mock('../src/config/firebase.config', () => ({
  firebaseApp: {},
  firebaseAuth: {
    currentUser: null,
    onAuthStateChanged: vi.fn()
  },
  firestore: {},
  storage: {}
}));

// Mock logger utility to prevent console spam in tests
vi.mock('../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock IndexedDB for localStorage service tests
vi.mock('../src/services/storage-service', () => ({
  StorageService: class MockStorageService {
    getUserSettings = vi.fn().mockResolvedValue({});
    saveUserSettings = vi.fn().mockResolvedValue(undefined);
    clearUserSettings = vi.fn().mockResolvedValue(undefined);
  }
}));

// Mock PDF.js to avoid loading issues in tests
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockResolvedValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 100, height: 100 }),
        render: vi.fn().mockResolvedValue(undefined)
      })
    })
  }),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

// Global test configuration
config.global.mocks = {
  $t: (key: string) => key,
  $q: {
    notify: vi.fn(),
    dialog: vi.fn(),
    loading: {
      show: vi.fn(),
      hide: vi.fn()
    }
  }
};

// Global test setup
beforeAll(() => {
  // Set up test environment
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  });

  // Mock matchMedia for responsive design tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: vi.fn().mockReturnValue([])
  }));

  // Suppress console warnings in tests
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Only show warnings that are not from testing framework
    if (!args.some(arg => typeof arg === 'string' && arg.includes('[Vue warn]'))) {
      originalWarn(...args);
    }
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  vi.resetAllMocks();
});
