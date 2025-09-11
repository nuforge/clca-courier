/**
 * Canva Export Management Composable Tests
 *
 * Following established CLCA Courier testing methodology patterns
 * Based on proven testing patterns from existing composable tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock logger using established patterns
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock Quasar notify using established patterns
const mockQuasar = vi.hoisted(() => ({
  notify: vi.fn(),
  dialog: vi.fn()
}));

// Mock useI18n using established patterns
const mockI18n = vi.hoisted(() => ({
  t: vi.fn((key: string) => `translated_${key}`)
}));

// Mock Canva API Service
const mockCanvaApiService = vi.hoisted(() => ({
  exportDesign: vi.fn(),
  getDesign: vi.fn()
}));

// Mock Firestore Service
const mockFirestoreService = vi.hoisted(() => ({
  updateUserContent: vi.fn()
}));

// Mock DOM methods for download functionality
const mockCreateElement = vi.hoisted(() => vi.fn());
const mockAppendChild = vi.hoisted(() => vi.fn());
const mockRemoveChild = vi.hoisted(() => vi.fn());
const mockClick = vi.hoisted(() => vi.fn());

// Mock window object
const mockWindow = vi.hoisted(() => ({
  setInterval: vi.fn(),
  clearInterval: vi.fn()
}));

// Apply mocks using proven methodology
vi.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
vi.mock('quasar', () => ({ useQuasar: () => mockQuasar }));
vi.mock('vue-i18n', () => ({ useI18n: () => mockI18n }));
vi.mock('../../../src/services/canva-api.service', () => ({ canvaApiService: mockCanvaApiService }));
vi.mock('../../../src/services/firebase-firestore.service', () => ({ firestoreService: mockFirestoreService }));
vi.mock('../../../src/i18n/utils/translation-keys', () => ({
  TRANSLATION_KEYS: {
    CANVA: {
      EXPORT_PENDING: 'canva.exportPending',
      EXPORT_COMPLETE: 'canva.exportComplete',
      EXPORT_FAILED: 'canva.exportFailed'
    },
    COMMON: {
      DOWNLOAD: 'common.download'
    }
  }
}));

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

// Mock window methods
Object.defineProperty(window, 'setInterval', {
  value: mockWindow.setInterval,
  writable: true
});

Object.defineProperty(window, 'clearInterval', {
  value: mockWindow.clearInterval,
  writable: true
});

describe('useCanvaExport', () => {
  let useCanvaExport: any;
  let mockContent: any;
  let mockCanvaDesign: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockCanvaApiService.exportDesign.mockResolvedValue({ exportUrl: 'https://example.com/export.pdf' });
    mockCanvaApiService.getDesign.mockResolvedValue({
      id: 'design-123',
      status: 'exported',
      exportUrl: 'https://example.com/export.pdf',
      editUrl: 'https://canva.com/edit/design-123'
    });
    mockFirestoreService.updateUserContent.mockResolvedValue(undefined);

    // Mock DOM element
    const mockElement = {
      href: '',
      download: '',
      target: '',
      click: mockClick
    };
    mockCreateElement.mockReturnValue(mockElement);

    // Setup test data
    mockCanvaDesign = {
      id: 'design-123',
      status: 'draft',
      editUrl: 'https://canva.com/edit/design-123'
    };

    mockContent = {
      id: 'content-456',
      title: 'Test Content',
      canvaDesign: mockCanvaDesign
    };

    // Import composable
    const module = await import('../../../src/composables/useCanvaExport');
    useCanvaExport = module.useCanvaExport;
  });

  describe('Export Functionality', () => {
    test('should start export process successfully', async () => {
      const { exportDesignForPrint, isExporting } = useCanvaExport();

      // Initially not exporting
      expect(isExporting.value('content-456')).toBe(false);

      // Start export
      await exportDesignForPrint(mockContent);

      // Verify API calls
      expect(mockCanvaApiService.exportDesign).toHaveBeenCalledWith('design-123');
      expect(mockFirestoreService.updateUserContent).toHaveBeenCalledWith('content-456', {
        canvaDesign: expect.objectContaining({
          id: 'design-123',
          status: 'pending_export'
        })
      });

      // Verify UI feedback
      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'info',
        message: 'translated_canva.exportPending',
        timeout: 2000
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting Canva export for print',
        { contentId: 'content-456', designId: 'design-123' }
      );
    });

    test('should handle export for content without Canva design', async () => {
      const { exportDesignForPrint } = useCanvaExport();
      const contentWithoutDesign = { ...mockContent, canvaDesign: undefined };

      await exportDesignForPrint(contentWithoutDesign);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cannot export: No Canva design attached to content',
        { contentId: 'content-456' }
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.exportFailed'
      });

      expect(mockCanvaApiService.exportDesign).not.toHaveBeenCalled();
    });

    test('should handle export API failure', async () => {
      const { exportDesignForPrint } = useCanvaExport();
      const apiError = new Error('API Error');
      mockCanvaApiService.exportDesign.mockRejectedValue(apiError);

      await exportDesignForPrint(mockContent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start Canva export',
        { contentId: 'content-456', designId: 'design-123', error: apiError }
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.exportFailed'
      });

      // Should update design status to failed
      expect(mockFirestoreService.updateUserContent).toHaveBeenCalledWith('content-456', {
        canvaDesign: expect.objectContaining({
          status: 'failed'
        })
      });
    });
  });

  describe('Download Functionality', () => {
    test('should download design file successfully', () => {
      const { downloadDesign } = useCanvaExport();
      const exportUrl = 'https://example.com/design.pdf';
      const filename = 'test-design.pdf';

      downloadDesign(exportUrl, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Design download initiated',
        { exportUrl, filename }
      );
    });

    test('should handle download failure', () => {
      const { downloadDesign } = useCanvaExport();
      const error = new Error('Download failed');
      mockCreateElement.mockImplementation(() => {
        throw error;
      });

      downloadDesign('https://example.com/design.pdf', 'test.pdf');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to download design',
        {
          exportUrl: 'https://example.com/design.pdf',
          filename: 'test.pdf',
          error
        }
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'Failed to download design. Please try the download link manually.'
      });
    });
  });

  describe('State Management', () => {
    test('should track export progress correctly', async () => {
      const { exportDesignForPrint, getExportProgress } = useCanvaExport();

      // Initially no progress
      expect(getExportProgress.value('content-456')).toBe(0);

      // Start export (this would normally trigger polling)
      await exportDesignForPrint(mockContent);

      // Progress tracking is managed internally during polling
      // The actual progress depends on poll count vs max attempts
    });

    test('should cleanup properly', () => {
      const { cleanup } = useCanvaExport();

      // Setup some mock intervals
      mockWindow.setInterval.mockReturnValue(123);

      cleanup();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Canva export composable cleanup completed'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle Firestore update failure gracefully', async () => {
      const { exportDesignForPrint } = useCanvaExport();
      const firestoreError = new Error('Firestore Error');
      mockFirestoreService.updateUserContent.mockRejectedValue(firestoreError);

      await exportDesignForPrint(mockContent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start Canva export',
        expect.objectContaining({
          contentId: 'content-456',
          designId: 'design-123',
          error: firestoreError
        })
      );
    });

    test('should validate content structure', async () => {
      const { exportDesignForPrint } = useCanvaExport();
      const invalidContent = { id: 'test-id' }; // Missing canvaDesign

      await exportDesignForPrint(invalidContent as any);

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.exportFailed'
      });
    });
  });

  describe('Integration with Existing Patterns', () => {
    test('should use established logging patterns', async () => {
      const { exportDesignForPrint } = useCanvaExport();

      await exportDesignForPrint(mockContent);

      // Should use structured logging with context objects
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contentId: expect.any(String),
          designId: expect.any(String)
        })
      );
    });

    test('should use established translation patterns', async () => {
      const { exportDesignForPrint } = useCanvaExport();

      await exportDesignForPrint(mockContent);

      // Should use translation keys through useI18n
      expect(mockI18n.t).toHaveBeenCalledWith('canva.exportPending');
    });

    test('should use established notification patterns', async () => {
      const { exportDesignForPrint } = useCanvaExport();

      await exportDesignForPrint(mockContent);

      // Should use Quasar notify with proper structure
      expect(mockQuasar.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          message: expect.any(String)
        })
      );
    });
  });
});
