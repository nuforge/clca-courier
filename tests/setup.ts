/**
 * Vitest Setup File
 * Global test configuration and mocks
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { config } from '@vue/test-utils';
import quasarMock from './mocks/quasar';

// Mock Quasar composables and components using comprehensive mock
vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar') as any;
  return {
    ...actual,
    useQuasar: () => quasarMock,
    Notify: {
      create: vi.fn()
    },
    Dialog: {
      create: vi.fn()
    },
    Loading: {
      show: vi.fn(),
      hide: vi.fn()
    },
    // Mock Quasar components that are used in tests
    QCardActions: 'div',
    QCard: 'div',
    QDialog: 'div',
    QBtn: 'button',
    QSpinner: 'div',
    QIframe: 'iframe',
    QTable: 'table',
    QTr: 'tr',
    QTd: 'td',
    QTh: 'th',
    QThead: 'thead',
    QTbody: 'tbody',
    QInput: 'input',
    QSelect: 'select',
    QOption: 'option',
    QDate: 'input',
    QTime: 'input',
    QCheckbox: 'input',
    QToggle: 'input',
    QRadio: 'input',
    QTextarea: 'textarea',
    QFile: 'input',
    QUploader: 'div',
    QIcon: 'i',
    QAvatar: 'div',
    QBadge: 'span',
    QChip: 'span',
    QSeparator: 'hr',
    QSpace: 'div',
    QExpansionItem: 'div',
    QList: 'ul',
    QItem: 'li',
    QItemSection: 'div',
    QItemLabel: 'div',
    QMenu: 'div',
    QTooltip: 'div',
    QPopupProxy: 'div',
    QScrollArea: 'div',
    QCarousel: 'div',
    QCarouselSlide: 'div',
    QStepper: 'div',
    QStep: 'div',
    QStepperNavigation: 'div',
    QTabPanels: 'div',
    QTabPanel: 'div',
    QTabs: 'div',
    QTab: 'div',
    QRouteTab: 'div',
    QBar: 'div',
    QToolbar: 'div',
    QToolbarTitle: 'div',
    QDrawer: 'div',
    QHeader: 'header',
    QFooter: 'footer',
    QPage: 'div',
    QPageContainer: 'div',
    QLayout: 'div',
    QSplitter: 'div',
    QSplitterPanel: 'div',
    QScrollObserver: 'div',
    QIntersection: 'div',
    QInfiniteScroll: 'div',
    QVirtualScroll: 'div',
    QSkeleton: 'div',
    QLinearProgress: 'div',
    QCircularProgress: 'div',
    QInnerLoading: 'div',
    QSpinnerDots: 'div',
    QSpinnerHourglass: 'div',
    QSpinnerTail: 'div',
    QSpinnerGears: 'div',
    QSpinnerGrid: 'div',
    QSpinnerPuff: 'div',
    QSpinnerRings: 'div',
    QSpinnerAudio: 'div',
    QSpinnerBall: 'div',
    QSpinnerBars: 'div',
    QSpinnerBox: 'div',
    QSpinnerClock: 'div',
    QSpinnerComment: 'div',
    QSpinnerCube: 'div',
    QSpinnerFacebook: 'div',
    QSpinnerHearts: 'div',
    QSpinnerInfinity: 'div',
    QSpinnerIos: 'div',
    QSpinnerOval: 'div',
    QSpinnerPie: 'div',
    QSpinnerRadio: 'div',
    QSpinnerThreeDots: 'div',
    QSpinnerWatch: 'div',
    QSpinnerWave: 'div'
  };
});

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

// Mock Firebase/Firestore exports - Comprehensive global mock
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({
    id: 'test-doc-id',
    path: 'test/path'
  }),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
  connectFirestoreEmulator: vi.fn(),
  initializeFirestore: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date
    })),
    now: vi.fn(() => ({
      toMillis: () => Date.now(),
      toDate: () => new Date()
    }))
  }
}));

// Mock Firebase/Functions exports
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn()
}));

// Mock Firebase/Auth exports
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockUser,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn()
  })),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  User: class MockUser {
    uid = 'test-uid';
    email = 'test@example.com';
    displayName = 'Test User';
    emailVerified = true;
  }
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
  $q: quasarMock
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

// Mock content sanitization utility
vi.mock('../src/utils/content-sanitization', () => ({
  sanitizeAndValidate: vi.fn((input: string, options: any) => {
    // Mock implementation that removes script tags and returns sanitized content
    if (typeof input !== 'string') {
      return {
        isValid: true,
        sanitizedValue: '',
        errors: []
      };
    }

    let sanitized = input;

    // Remove script tags and other dangerous content
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // For non-HTML fields, strip all HTML tags
    if (!options?.allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    return {
      isValid: true,
      sanitizedValue: sanitized,
      errors: []
    };
  }),
  SANITIZATION_CONFIGS: {
    TITLE: { allowHtml: false, maxLength: 200 },
    CONTENT: { allowHtml: true, maxLength: 50000 },
    METADATA: { allowHtml: false, maxLength: 1000 },
    LOCATION: { allowHtml: false, maxLength: 500 }
  }
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  vi.resetAllMocks();
});
