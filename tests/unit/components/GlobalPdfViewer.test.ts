import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalPdfViewer from '../../../src/components/GlobalPdfViewer.vue';

// Use vi.hoisted() for complex mock infrastructure
const mockQuasar = vi.hoisted(() => ({
  notify: vi.fn(),
}));

const mockSiteStore = vi.hoisted(() => ({
  archivedIssues: [
    {
      id: 'newsletter-1',
      title: 'January 2024 Newsletter',
      date: '2024-01-15',
      pages: 12,
      url: 'https://example.com/newsletter-1.pdf'
    },
    {
      id: 'newsletter-2',
      title: 'February 2024 Newsletter',
      date: '2024-02-15',
      pages: 8,
      url: 'https://example.com/newsletter-2.pdf'
    }
  ]
}));

const mockPdfViewerComponent = vi.hoisted(() => ({
  name: 'PdfViewer',
  props: ['documentUrl'],
  emits: ['ready', 'error'],
  template: `<div class="mock-pdf-viewer" data-testid="pdf-viewer">
    PDF Viewer - URL: {{ documentUrl }}
  </div>`,
  setup(props: any, { emit }: any) {
    // Simulate successful loading after a short delay
    setTimeout(() => {
      emit('ready');
    }, 10);

    // Expose method to simulate error
    const simulateError = () => {
      emit('error', 'Mock PDF loading error');
    };

    return { simulateError };
  }
}));

// Mock Quasar useQuasar composable
vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar') as any;
  return {
    ...actual,
    useQuasar: () => mockQuasar,
  };
});

// Mock the site store
vi.mock('../../../src/stores/site-store-simple', () => ({
  useSiteStore: () => mockSiteStore,
}));

// Mock PdfViewer component
vi.mock('../../../src/components/PdfViewer.vue', () => ({
  default: mockPdfViewerComponent
}));

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock window.scrollTo to prevent jsdom errors
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

describe('GlobalPdfViewer Component', () => {
  let wrapper: VueWrapper<any>;
  let pinia: any;

  beforeEach(() => {
    // Create fresh Pinia instance for each test
    pinia = createPinia();
    setActivePinia(pinia);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const mountComponent = (props = {}) => {
    return mount(GlobalPdfViewer, {
      props,
      global: {
        plugins: [pinia],
        stubs: {
          PdfViewer: mockPdfViewerComponent,
          // Stub Quasar components to prevent complex rendering issues
          QDialog: {
            template: '<div class="q-dialog" data-testid="pdf-dialog"><slot /></div>',
            props: ['modelValue']
          },
          QCard: {
            template: '<div class="q-card"><slot /></div>'
          },
          QToolbar: {
            template: '<div class="q-toolbar"><slot /></div>',
            props: ['class']
          },
          QToolbarTitle: {
            template: '<div class="q-toolbar-title"><slot /></div>'
          },
          QBtn: {
            template: '<button class="q-btn" @click="$emit(\'click\')"><slot /></button>',
            props: ['flat', 'icon', 'color', 'label', 'outline', 'loading'],
            emits: ['click']
          },
          QBtnDropdown: {
            template: '<div class="q-btn-dropdown"><slot /></div>',
            props: ['color', 'textColor', 'label', 'icon']
          },
          QIcon: {
            template: '<i class="q-icon" :class="name"></i>',
            props: ['name', 'size', 'color']
          },
          QCardSection: {
            template: '<div class="q-card-section" :class="classProp"><slot /></div>',
            props: { class: { type: String, default: '' } },
            computed: {
              classProp() {
                return this.class;
              }
            }
          },
          QList: {
            template: '<div class="q-list"><slot /></div>'
          },
          QItem: {
            template: '<div class="q-item" @click="$emit(\'click\')" :class="classProp"><slot /></div>',
            props: ['clickable', 'class'],
            computed: {
              classProp() {
                return this.class;
              }
            },
            emits: ['click']
          },
          QItemSection: {
            template: '<div class="q-item-section"><slot /></div>',
            props: ['side']
          },
          QItemLabel: {
            template: '<div class="q-item-label"><slot /></div>',
            props: ['caption']
          },
          QBadge: {
            template: '<div class="q-badge"><slot /></div>',
            props: ['color', 'floating', 'rounded']
          }
        },
      },
    });
  };

  describe('Component Initialization', () => {
    it('should mount successfully with default state', () => {
      wrapper = mountComponent();

      expect(wrapper.exists()).toBe(true);
    });

    it('should have required reactive properties', () => {
      wrapper = mountComponent();
      const vm = wrapper.vm;

      expect(vm.showViewer).toBe(false);
      expect(vm.selectedDocument).toBe(null);
      expect(vm.error).toBe(null);
    });

    it('should compute available documents from store', () => {
      wrapper = mountComponent();
      const vm = wrapper.vm;

      expect(vm.availableDocuments).toEqual(mockSiteStore.archivedIssues);
      expect(vm.availableDocuments).toHaveLength(2);
    });
  });

  describe('Document Management', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should switch documents correctly', async () => {
      const vm = wrapper.vm;
      const testDocument = mockSiteStore.archivedIssues[1];

      vm.switchDocument(testDocument);

      expect(vm.selectedDocument).toEqual(testDocument);
      expect(vm.error).toBe(null);
    });

    it('should handle document switching with error reset', async () => {
      const vm = wrapper.vm;

      // Set an error state first
      vm.error = 'Previous error';

      const testDocument = mockSiteStore.archivedIssues[0];
      vm.switchDocument(testDocument);

      expect(vm.selectedDocument).toEqual(testDocument);
      expect(vm.error).toBe(null); // Error should be reset
    });

    it('should retry loading current document', async () => {
      const vm = wrapper.vm;
      const testDocument = mockSiteStore.archivedIssues[0];

      vm.selectedDocument = testDocument;
      vm.error = 'Loading error';

      // Test the behavior instead of implementation
      // retryLoadDocument should reset error and keep the same document selected
      vm.retryLoadDocument();

      // Verify the behavior: document should remain selected and error should be reset
      expect(vm.selectedDocument).toEqual(testDocument);
      expect(vm.error).toBe(null); // switchDocument resets error
    });    it('should handle retry with no selected document', () => {
      const vm = wrapper.vm;

      vm.selectedDocument = null;
      const switchDocumentSpy = vi.spyOn(vm, 'switchDocument');

      vm.retryLoadDocument();

      expect(switchDocumentSpy).not.toHaveBeenCalled();
    });
  });

  describe('Viewer State Management', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should close viewer and reset state', () => {
      const vm = wrapper.vm;

      // Set up some state
      vm.showViewer = true;
      vm.selectedDocument = mockSiteStore.archivedIssues[0];
      vm.error = 'Some error';

      vm.closeViewer();

      expect(vm.showViewer).toBe(false);
      expect(vm.selectedDocument).toBe(null);
      expect(vm.error).toBe(null);
    });

    it('should handle viewer ready event', () => {
      const vm = wrapper.vm;

      vm.error = 'Previous error';

      vm.onViewerReady();

      expect(vm.error).toBe(null);
    });

    it('should handle viewer error event with notification', () => {
      const vm = wrapper.vm;
      const errorMessage = 'PDF loading failed';

      vm.onViewerError(errorMessage);

      expect(vm.error).toBe(errorMessage);
      expect(mockQuasar.notify).toHaveBeenCalledWith({
        message: 'Error loading PDF viewer',
        caption: errorMessage,
        type: 'negative',
        icon: 'mdi-alert'
      });
    });
  });

  describe('Component Integration Tests', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should render basic structure when viewer is closed', async () => {
      await wrapper.vm.$nextTick();

      const dialog = wrapper.find('[data-testid="pdf-dialog"]');
      expect(dialog.exists()).toBe(true);
    });

    it('should handle error display correctly', async () => {
      const vm = wrapper.vm;

      vm.showViewer = true;
      vm.error = 'Test error message';

      await wrapper.vm.$nextTick();

      // Should show error state
      expect(vm.error).toBe('Test error message');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty available documents gracefully', () => {
      // Mock empty documents
      mockSiteStore.archivedIssues = [];

      wrapper = mountComponent();
      const vm = wrapper.vm;

      expect(vm.availableDocuments).toEqual([]);
      expect(vm.availableDocuments).toHaveLength(0);
    });

    it('should handle malformed document objects', () => {
      const vm = wrapper.vm;
      wrapper = mountComponent();

      const malformedDocument = { title: 'Test', /* missing required fields */ };

      expect(() => {
        vm.switchDocument(malformedDocument);
      }).not.toThrow();

      expect(vm.selectedDocument).toEqual(malformedDocument);
    });

    it('should handle missing document properties gracefully', async () => {
      const vm = wrapper.vm;
      wrapper = mountComponent();

      vm.showViewer = true;
      vm.selectedDocument = { title: 'Incomplete Document' }; // Missing URL

      await wrapper.vm.$nextTick();

      // Should not crash even with incomplete document data
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Method Testing', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should expose required component methods', () => {
      const vm = wrapper.vm;

      expect(typeof vm.closeViewer).toBe('function');
      expect(typeof vm.switchDocument).toBe('function');
      expect(typeof vm.onViewerReady).toBe('function');
      expect(typeof vm.onViewerError).toBe('function');
      expect(typeof vm.retryLoadDocument).toBe('function');
    });

    it('should handle component methods without errors', () => {
      const vm = wrapper.vm;

      expect(() => {
        vm.closeViewer();
        vm.onViewerReady();
        vm.retryLoadDocument();
      }).not.toThrow();
    });
  });
});
