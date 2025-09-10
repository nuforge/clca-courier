// Use vi.hoisted to ensure mocks are created before any imports
const mockFirebaseStorageModule = vi.hoisted(() => {
  // Mock Firebase Storage functions with proper return types
  const mockStorageRef = {
    fullPath: 'newsletters/test-file.pdf',
    name: 'test-file.pdf',
    bucket: 'test-bucket',
    toString: vi.fn(() => 'gs://test-bucket/newsletters/test-file.pdf'),
  };

  const mockUploadTaskSnapshot = {
    bytesTransferred: 1024,
    totalBytes: 2048,
    state: 'running',
    ref: mockStorageRef,
    metadata: {
      name: 'test-file.pdf',
      fullPath: 'newsletters/test-file.pdf',
      size: 2048,
      contentType: 'application/pdf',
      customMetadata: {
        uploadedBy: 'test-user-id',
        title: 'Test Newsletter',
      },
      timeCreated: '2025-01-10T12:00:00.000Z',
      updated: '2025-01-10T12:00:00.000Z',
    },
  };

  const mockUploadTask = {
    on: vi.fn((event: string, onProgress?: any, onError?: any, onComplete?: any) => {
      // Simulate progress updates
      if (onProgress) {
        setTimeout(() => onProgress(mockUploadTaskSnapshot), 10);
      }

      // Simulate completion
      if (onComplete) {
        setTimeout(() => onComplete(), 20);
      }
    }),
    snapshot: mockUploadTaskSnapshot,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };

  return {
    ref: vi.fn(() => mockStorageRef),
    uploadBytes: vi.fn().mockResolvedValue({ ref: mockStorageRef }),
    uploadBytesResumable: vi.fn(() => mockUploadTask),
    getDownloadURL: vi.fn().mockResolvedValue('https://storage.googleapis.com/test-bucket/newsletters/test-file.pdf'),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    getMetadata: vi.fn().mockResolvedValue({
      name: 'test-file.pdf',
      fullPath: 'newsletters/test-file.pdf',
      size: 2048,
      contentType: 'application/pdf',
      customMetadata: {
        uploadedBy: 'test-user-id',
        title: 'Test Newsletter',
      },
      timeCreated: '2025-01-10T12:00:00.000Z',
      updated: '2025-01-10T12:00:00.000Z',
      cacheControl: undefined,
      contentDisposition: undefined,
      contentEncoding: undefined,
      contentLanguage: undefined,
      md5Hash: 'abcd1234hash',
    }),
    updateMetadata: vi.fn().mockResolvedValue(undefined),
    listAll: vi.fn().mockResolvedValue({
      items: [mockStorageRef],
      prefixes: [],
    }),
  };
});

// Mock Firebase Storage module using hoisted mocks
vi.mock('firebase/storage', () => mockFirebaseStorageModule);

// Mock Firebase config
vi.mock('../../../src/config/firebase.config', () => ({
  firebaseStorage: {
    app: {
      options: {
        storageBucket: 'test-project.appspot.com'
      }
    }
  }
}));

// Mock Firebase Auth Service
vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {
    getCurrentUser: vi.fn(() => ({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    })),
  }
}));

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }
}));

// Import types and service after mocks are set up
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import type {
  StorageReference,
  UploadTaskSnapshot,
  SettableMetadata
} from 'firebase/storage';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  listAll
} from 'firebase/storage';
import { firebaseStorageService } from '../../../src/services/firebase-storage.service';
import { firebaseAuthService } from '../../../src/services/firebase-auth.service';
import { logger } from '../../../src/utils/logger';

// Get typed mock functions
const mockRef = vi.mocked(ref);
const mockUploadBytes = vi.mocked(uploadBytes);
const mockUploadBytesResumable = vi.mocked(uploadBytesResumable);
const mockGetDownloadURL = vi.mocked(getDownloadURL);
const mockDeleteObject = vi.mocked(deleteObject);
const mockGetMetadata = vi.mocked(getMetadata);
const mockUpdateMetadata = vi.mocked(updateMetadata);
const mockListAll = vi.mocked(listAll);
const mockFirebaseAuthService = vi.mocked(firebaseAuthService);
const mockLogger = vi.mocked(logger);

describe('Firebase Storage Service', () => {
  // Helper function to create mock File objects
  const createMockFile = (name: string, type: string, size: number = 1024): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set default auth state to authenticated
    mockFirebaseAuthService.getCurrentUser.mockReturnValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    } as any);
  });

  describe('Service Infrastructure', () => {
    it('should have required service methods', () => {
      expect(firebaseStorageService).toBeDefined();
      expect(typeof firebaseStorageService.uploadPdf).toBe('function');
      expect(typeof firebaseStorageService.uploadFile).toBe('function');
      expect(typeof firebaseStorageService.getDownloadUrl).toBe('function');
      expect(typeof firebaseStorageService.deleteFile).toBe('function');
      expect(typeof firebaseStorageService.getFileMetadata).toBe('function');
      expect(typeof firebaseStorageService.listFiles).toBe('function');
      expect(typeof firebaseStorageService.fileExists).toBe('function');
    });
  });

  describe('PDF Upload Operations', () => {
    it('should upload PDF file successfully with authentication', async () => {
      const pdfFile = createMockFile('newsletter.pdf', 'application/pdf', 2048);

      const result = await firebaseStorageService.uploadPdf(pdfFile);

      expect(result).toEqual({
        downloadUrl: 'https://storage.googleapis.com/test-bucket/newsletters/test-file.pdf',
        storagePath: expect.stringContaining('newsletters/'),
      });
      expect(mockUploadBytesResumable).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('Upload completed:', expect.any(String));
    });

    it('should reject PDF upload when user is not authenticated', async () => {
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(null);
      const pdfFile = createMockFile('newsletter.pdf', 'application/pdf');

      await expect(firebaseStorageService.uploadPdf(pdfFile)).rejects.toThrow(
        'User must be authenticated to upload files'
      );
      expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    });

    it('should reject non-PDF files', async () => {
      const textFile = createMockFile('document.txt', 'text/plain');

      await expect(firebaseStorageService.uploadPdf(textFile)).rejects.toThrow(
        'Only PDF files are allowed'
      );
      expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    });

    it('should include user metadata in PDF uploads', async () => {
      const pdfFile = createMockFile('newsletter.pdf', 'application/pdf');

      await firebaseStorageService.uploadPdf(pdfFile, {
        metadata: {
          customMetadata: {
            title: 'Test Newsletter',
            year: '2025',
          }
        }
      });

      expect(mockUploadBytesResumable).toHaveBeenCalled();
      const uploadCall = mockUploadBytesResumable.mock.calls[0];
      expect(uploadCall).toBeDefined();
      const metadata = uploadCall![2] as SettableMetadata;

      // Verify that custom metadata is properly included
      expect(metadata.customMetadata).toEqual(
        expect.objectContaining({
          title: 'Test Newsletter',
          year: '2025',
        })
      );

      // Log actual metadata to understand structure for future reference
      console.log('Actual metadata structure:', JSON.stringify(metadata.customMetadata, null, 2));
    });    it('should handle upload progress callbacks', async () => {
      const pdfFile = createMockFile('newsletter.pdf', 'application/pdf');
      const onProgress = vi.fn();

      await firebaseStorageService.uploadPdf(pdfFile, { onProgress });

      // Verify progress callback was set up
      expect(mockUploadBytesResumable).toHaveBeenCalled();
      const uploadTaskResult = mockUploadBytesResumable.mock.results[0];
      expect(uploadTaskResult).toBeDefined();
      const uploadTask = uploadTaskResult!.value;
      expect(uploadTask.on).toHaveBeenCalledWith(
        'state_changed',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('File Upload Operations', () => {
    it('should upload general files successfully', async () => {
      const imageFile = createMockFile('image.jpg', 'image/jpeg', 1024);

      const result = await firebaseStorageService.uploadFile(imageFile);

      expect(result).toEqual({
        downloadUrl: 'https://storage.googleapis.com/test-bucket/newsletters/test-file.pdf',
        storagePath: expect.stringContaining('user-uploads/'),
      });
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });

    it('should reject file upload when user is not authenticated', async () => {
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(null);
      const imageFile = createMockFile('image.jpg', 'image/jpeg');

      await expect(firebaseStorageService.uploadFile(imageFile)).rejects.toThrow(
        'User must be authenticated to upload files'
      );
    });

    it('should use custom folder and filename when provided', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      await firebaseStorageService.uploadFile(file, {
        folder: 'custom-folder',
        filename: 'custom-name.jpg'
      });

      expect(mockRef).toHaveBeenCalledWith(
        expect.any(Object),
        'custom-folder/custom-name.jpg'
      );
    });
  });

  describe('Download URL Operations', () => {
    it('should get download URL for existing file', async () => {
      const url = await firebaseStorageService.getDownloadUrl('newsletters/test.pdf');

      expect(url).toBe('https://storage.googleapis.com/test-bucket/newsletters/test-file.pdf');
      expect(mockRef).toHaveBeenCalledWith(expect.any(Object), 'newsletters/test.pdf');
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });

    it('should handle errors when getting download URL', async () => {
      mockGetDownloadURL.mockRejectedValueOnce(new Error('File not found'));

      await expect(firebaseStorageService.getDownloadUrl('nonexistent.pdf')).rejects.toThrow('File not found');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting download URL:', expect.any(Error));
    });
  });

  describe('File Deletion Operations', () => {
    it('should delete file successfully when authenticated', async () => {
      await firebaseStorageService.deleteFile('newsletters/test.pdf');

      expect(mockRef).toHaveBeenCalledWith(expect.any(Object), 'newsletters/test.pdf');
      expect(mockDeleteObject).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('File deleted:', 'newsletters/test.pdf');
    });

    it('should reject file deletion when user is not authenticated', async () => {
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(null);

      await expect(firebaseStorageService.deleteFile('newsletters/test.pdf')).rejects.toThrow(
        'User must be authenticated to delete files'
      );
      expect(mockDeleteObject).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      mockDeleteObject.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(firebaseStorageService.deleteFile('newsletters/test.pdf')).rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting file:', expect.any(Error));
    });
  });

  describe('File Metadata Operations', () => {
    it('should get file metadata successfully', async () => {
      const metadata = await firebaseStorageService.getFileMetadata('newsletters/test.pdf');

      expect(metadata).toEqual({
        name: 'test-file.pdf',
        fullPath: 'newsletters/test-file.pdf',
        size: 2048,
        contentType: 'application/pdf',
        downloadUrl: 'https://storage.googleapis.com/test-bucket/newsletters/test-file.pdf',
        metadata: {
          customMetadata: {
            uploadedBy: 'test-user-id',
            title: 'Test Newsletter',
          },
          cacheControl: undefined,
          contentDisposition: undefined,
          contentEncoding: undefined,
          contentLanguage: undefined,
          contentType: 'application/pdf',
          md5Hash: 'abcd1234hash',
          timeCreated: '2025-01-10T12:00:00.000Z',
          updated: '2025-01-10T12:00:00.000Z',
        },
      });
      expect(mockGetMetadata).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });

    it('should update file metadata successfully', async () => {
      const newMetadata = {
        customMetadata: {
          title: 'Updated Newsletter',
          year: '2025',
        }
      };

      await firebaseStorageService.updateFileMetadata('newsletters/test.pdf', newMetadata);

      expect(mockUpdateMetadata).toHaveBeenCalledWith(expect.any(Object), newMetadata);
      expect(mockLogger.success).toHaveBeenCalledWith('File metadata updated:', 'newsletters/test.pdf');
    });

    it('should handle metadata retrieval errors', async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error('Metadata not found'));

      await expect(firebaseStorageService.getFileMetadata('nonexistent.pdf')).rejects.toThrow('Metadata not found');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting file metadata:', expect.any(Error));
    });
  });

  describe('File Listing Operations', () => {
    it('should list files in folder successfully', async () => {
      const files = await firebaseStorageService.listFiles('newsletters');

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual(
        expect.objectContaining({
          name: 'test-file.pdf',
          fullPath: 'newsletters/test-file.pdf',
          size: 2048,
          contentType: 'application/pdf',
        })
      );
      expect(mockListAll).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Listed 1 files in newsletters');
    });

    it('should get newsletter PDFs specifically', async () => {
      const newsletters = await firebaseStorageService.getNewsletterPdfs();

      expect(newsletters).toHaveLength(1);
      expect(mockListAll).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle empty folder listing', async () => {
      mockListAll.mockResolvedValueOnce({ items: [], prefixes: [] });

      const files = await firebaseStorageService.listFiles('empty-folder');

      expect(files).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Listed 0 files in empty-folder');
    });
  });

  describe('Newsletter-Specific Operations', () => {
    it('should upload newsletter PDF with proper metadata', async () => {
      const pdfFile = createMockFile('2025-01-newsletter.pdf', 'application/pdf');
      const metadata = {
        title: 'January 2025 Newsletter',
        issueNumber: '2025-01',
        publicationDate: '2025-01-01',
        year: 2025,
        season: 'winter',
        tags: ['news', 'community'],
      };

      const result = await firebaseStorageService.uploadNewsletterPdf(pdfFile, metadata);

      expect(result.storagePath).toContain('newsletters/2025-01-newsletter.pdf');

      expect(mockUploadBytesResumable).toHaveBeenCalled();
      const uploadCall = mockUploadBytesResumable.mock.calls[0];
      expect(uploadCall).toBeDefined();
      const uploadMetadata = uploadCall![2] as SettableMetadata;

      expect(uploadMetadata.customMetadata).toEqual(
        expect.objectContaining({
          title: 'January 2025 Newsletter',
          issueNumber: '2025-01',
          publicationDate: '2025-01-01',
          year: '2025',
          season: 'winter',
          tags: 'news,community',
        })
      );
    });

    it('should preserve original filename in newsletter uploads', async () => {
      const pdfFile = createMockFile('special-newsletter-name.pdf', 'application/pdf');

      await firebaseStorageService.uploadNewsletterPdf(pdfFile, {
        title: 'Test Newsletter',
        publicationDate: '2025-01-01',
        year: 2025,
      });

      expect(mockRef).toHaveBeenCalledWith(
        expect.any(Object),
        'newsletters/special-newsletter-name.pdf'
      );
    });
  });

  describe('Utility Operations', () => {
    it('should generate thumbnail path correctly', () => {
      const thumbnailPath = firebaseStorageService.generateThumbnailPath('newsletters/test.pdf', 'large');

      expect(thumbnailPath).toBe('thumbnails/test_large.jpg');
    });

    it('should check file existence', async () => {
      const exists = await firebaseStorageService.fileExists('newsletters/test.pdf');

      expect(exists).toBe(true);
      expect(mockGetMetadata).toHaveBeenCalled();
    });

    it('should return false for non-existent files', async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error('File not found'));

      const exists = await firebaseStorageService.fileExists('nonexistent.pdf');

      expect(exists).toBe(false);
    });

    it('should get storage statistics', async () => {
      // Mock multiple file listings for stats
      mockListAll
        .mockResolvedValueOnce({ items: [{ name: 'newsletter1.pdf' }, { name: 'newsletter2.pdf' }] as any, prefixes: [] })
        .mockResolvedValueOnce({ items: [{ name: 'user-file1.jpg' }] as any, prefixes: [] });

      // Mock metadata for each file
      mockGetMetadata
        .mockResolvedValueOnce({ size: 1024 } as any)
        .mockResolvedValueOnce({ size: 2048 } as any)
        .mockResolvedValueOnce({ size: 512 } as any);

      const stats = await firebaseStorageService.getStorageStats();

      expect(stats).toEqual({
        totalFiles: 3,
        totalSize: 3584, // 1024 + 2048 + 512
        newsletterCount: 2,
        userUploadCount: 1,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase Storage errors gracefully', async () => {
      mockUploadBytes.mockRejectedValueOnce(new Error('Storage quota exceeded'));
      const file = createMockFile('test.jpg', 'image/jpeg');

      await expect(firebaseStorageService.uploadFile(file)).rejects.toThrow('Storage quota exceeded');
      expect(mockLogger.error).toHaveBeenCalledWith('File upload error:', expect.any(Error));
    });

    it('should handle network errors during operations', async () => {
      mockGetDownloadURL.mockRejectedValueOnce(new Error('Network error'));

      await expect(firebaseStorageService.getDownloadUrl('test.pdf')).rejects.toThrow('Network error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting download URL:', expect.any(Error));
    });

    it('should handle malformed storage paths', async () => {
      // Mock Firebase to reject invalid paths
      mockGetDownloadURL.mockRejectedValueOnce(new Error('Invalid storage path'));

      const invalidPath = '';

      await expect(firebaseStorageService.getDownloadUrl(invalidPath)).rejects.toThrow('Invalid storage path');
    });
  });
});
