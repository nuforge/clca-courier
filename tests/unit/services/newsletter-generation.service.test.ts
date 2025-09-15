/**
 * Newsletter Generation Service Tests
 * Test-first approach: These tests are designed to fail initially and catch edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewsletterGenerationService } from '../../../src/services/newsletter-generation.service';
import type { NewsletterIssue } from '../../../src/services/newsletter-generation.service';

// Mock Firebase services - hoisted to avoid circular dependencies
const mockCollection = vi.hoisted(() => vi.fn());
const mockDoc = vi.hoisted(() => vi.fn());
const mockGetDocs = vi.hoisted(() => vi.fn());
const mockGetDoc = vi.hoisted(() => vi.fn());
const mockAddDoc = vi.hoisted(() => vi.fn());
const mockUpdateDoc = vi.hoisted(() => vi.fn());
const mockDeleteDoc = vi.hoisted(() => vi.fn());
const mockQuery = vi.hoisted(() => vi.fn());
const mockWhere = vi.hoisted(() => vi.fn());
const mockOrderBy = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockOnSnapshot = vi.hoisted(() => vi.fn());

const mockFirestore = vi.hoisted(() => ({
  collection: mockCollection(),
  doc: mockDoc(),
  getDocs: mockGetDocs(),
  getDoc: mockGetDoc(),
  addDoc: mockAddDoc(),
  updateDoc: mockUpdateDoc(),
  deleteDoc: mockDeleteDoc(),
  query: mockQuery(),
  where: mockWhere(),
  orderBy: mockOrderBy(),
  limit: mockLimit(),
  onSnapshot: mockOnSnapshot()
}));

const mockHttpsCallable = vi.hoisted(() => vi.fn());

vi.mock('../../../src/config/firebase.config', () => ({
  firestore: mockFirestore()
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: mockHttpsCallable()(),
  getFunctions: vi.fn(() => ({ httpsCallable: mockHttpsCallable()() }))
}));

vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-id' }))
  }
}));

describe('NewsletterGenerationService', () => {
  let service: NewsletterGenerationService;
  let mockCallable: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NewsletterGenerationService();

    // Setup default mocks
    mockCallable = vi.fn();
    mockHttpsCallable().mockReturnValue(mockCallable);

    // Setup Firestore mocks
    mockCollection().mockReturnValue({
      withConverter: vi.fn().mockReturnThis(),
      doc: mockDoc(),
      add: mockAddDoc(),
      get: mockGetDoc()s(),
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit()
    });

    mockDoc().mockReturnValue({
      get: mockGetDoc(),
      update: mockUpdateDoc(),
      delete: mockDeleteDoc()
    });

    mockWhere().mockReturnValue({
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
      get: mockGetDoc()s()
    });

    mockOrderBy().mockReturnValue({
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
      get: mockGetDoc()s()
    });

    mockLimit().mockReturnValue({
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
      get: mockGetDoc()s()
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createIssue', () => {
    it('should create a new newsletter issue successfully', async () => {
      const issueData = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1', 'submission2']
      };

      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const result = await service.createIssue(issueData);

      expect(mockCollection()).toHaveBeenCalledWith('newsletters');
      expect(mockAddDoc()).toHaveBeenCalledWith(
        expect.objectContaining({
          title: issueData.title,
          issueNumber: issueData.issueNumber,
          publicationDate: issueData.publicationDate,
          submissions: issueData.submissions,
          status: 'draft',
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id'
        })
      );
      expect(result).toBe('new-issue-id');
    });

    it('should handle missing required fields', async () => {
      const incompleteIssueData = {
        title: 'Test Newsletter'
        // Missing issueNumber, publicationDate, submissions
      };

      await expect(service.createIssue(incompleteIssueData as any)).rejects.toThrow();
    });

    it('should handle Firestore errors during creation', async () => {
      const issueData = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };

      mockAddDoc().mockRejectedValue(new Error('Firestore error'));

      await expect(service.createIssue(issueData)).rejects.toThrow('Firestore error');
    });

    it('should handle empty submissions array', async () => {
      const issueData = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: []
      };

      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const result = await service.createIssue(issueData);

      expect(result).toBe('new-issue-id');
      expect(mockAddDoc()).toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: []
        })
      );
    });

    it('should handle very large submissions array', async () => {
      const largeSubmissionsArray = Array.from({ length: 1000 }, (_, i) => `submission-${i}`);
      const issueData = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: largeSubmissionsArray
      };

      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const result = await service.createIssue(issueData);

      expect(result).toBe('new-issue-id');
      expect(mockAddDoc()).toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: largeSubmissionsArray
        })
      );
    });
  });

  describe('getIssues', () => {
    it('should retrieve all newsletter issues', async () => {
      const mockIssues = [
        {
          id: 'issue1',
          data: () => ({
            title: 'Issue 1',
            issueNumber: '1',
            status: 'published',
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') }
          })
        },
        {
          id: 'issue2',
          data: () => ({
            title: 'Issue 2',
            issueNumber: '2',
            status: 'draft',
            createdAt: { toDate: () => new Date('2024-01-02') },
            updatedAt: { toDate: () => new Date('2024-01-02') }
          })
        }
      ];

      mockGetDoc()s().mockResolvedValue({
        docs: mockIssues
      });

      const result = await service.getIssues();

      expect(mockCollection()).toHaveBeenCalledWith('newsletters');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('issue1');
      expect(result[1].id).toBe('issue2');
    });

    it('should handle empty issues collection', async () => {
      mockGetDoc()s().mockResolvedValue({
        docs: []
      });

      const result = await service.getIssues();

      expect(result).toHaveLength(0);
    });

    it('should handle Firestore query errors', async () => {
      mockGetDoc()s().mockRejectedValue(new Error('Firestore query error'));

      await expect(service.getIssues()).rejects.toThrow('Firestore query error');
    });

    it('should handle malformed issue data', async () => {
      const malformedIssues = [
        {
          id: 'issue1',
          data: () => ({
            title: 'Issue 1',
            // Missing required fields
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') }
          })
        }
      ];

      mockGetDoc()s().mockResolvedValue({
        docs: malformedIssues
      });

      const result = await service.getIssues();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('issue1');
      // Should handle missing fields gracefully
    });

    it('should handle very large issues collection', async () => {
      const largeIssuesArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `issue-${i}`,
        data: () => ({
          title: `Issue ${i}`,
          issueNumber: `${i}`,
          status: 'draft',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }));

      mockGetDoc()s().mockResolvedValue({
        docs: largeIssuesArray
      });

      const result = await service.getIssues();

      expect(result).toHaveLength(1000);
    });
  });

  describe('getIssue', () => {
    it('should retrieve a specific newsletter issue', async () => {
      const mockIssue = {
        id: 'issue1',
        data: () => ({
          title: 'Test Issue',
          issueNumber: '1',
          status: 'draft',
          submissions: ['submission1', 'submission2'],
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      };

      mockGetDoc().mockResolvedValue(mockIssue);

      const result = await service.getIssue('issue1');

      expect(mockDoc()).toHaveBeenCalledWith('newsletters', 'issue1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('issue1');
    });

    it('should return null for non-existent issue', async () => {
      mockGetDoc().mockResolvedValue({
        exists: () => false
      });

      const result = await service.getIssue('non-existent');

      expect(result).toBeNull();
    });

    it('should handle Firestore errors', async () => {
      mockGetDoc().mockRejectedValue(new Error('Firestore error'));

      await expect(service.getIssue('issue1')).rejects.toThrow('Firestore error');
    });

    it('should handle malformed issue document', async () => {
      const malformedIssue = {
        id: 'issue1',
        data: () => null // Malformed data
      };

      mockGetDoc().mockResolvedValue(malformedIssue);

      await expect(service.getIssue('issue1')).rejects.toThrow();
    });
  });

  describe('updateIssue', () => {
    it('should update an existing newsletter issue', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'ready' as const
      };

      mockUpdateDoc().mockResolvedValue(undefined);

      await service.updateIssue('issue1', updateData);

      expect(mockDoc()).toHaveBeenCalledWith('newsletters', 'issue1');
      expect(mockUpdateDoc()).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Object),
          updatedBy: 'test-user-id'
        })
      );
    });

    it('should handle non-existent issue updates', async () => {
      mockUpdateDoc().mockRejectedValue(new Error('Document not found'));

      await expect(service.updateIssue('non-existent', { title: 'New Title' })).rejects.toThrow('Document not found');
    });

    it('should handle empty update data', async () => {
      mockUpdateDoc().mockResolvedValue(undefined);

      await service.updateIssue('issue1', {});

      expect(mockUpdateDoc()).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          updatedAt: expect.any(Object),
          updatedBy: 'test-user-id'
        })
      );
    });

    it('should handle invalid status updates', async () => {
      const invalidUpdateData = {
        status: 'invalid-status' as any
      };

      await expect(service.updateIssue('issue1', invalidUpdateData)).rejects.toThrow();
    });
  });

  describe('deleteIssue', () => {
    it('should delete a newsletter issue', async () => {
      mockDeleteDoc().mockResolvedValue(undefined);

      await service.deleteIssue('issue1');

      expect(mockDoc()).toHaveBeenCalledWith('newsletters', 'issue1');
      expect(mockDeleteDoc()).toHaveBeenCalled();
    });

    it('should handle deletion of non-existent issue', async () => {
      mockDeleteDoc().mockRejectedValue(new Error('Document not found'));

      await expect(service.deleteIssue('non-existent')).rejects.toThrow('Document not found');
    });

    it('should handle Firestore errors during deletion', async () => {
      mockDeleteDoc().mockRejectedValue(new Error('Permission denied'));

      await expect(service.deleteIssue('issue1')).rejects.toThrow('Permission denied');
    });
  });

  describe('generateNewsletter', () => {
    it('should trigger newsletter generation successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Newsletter generation started',
        generationId: 'gen-123'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.generateNewsletter('issue1');

      expect(mockHttpsCallable()).toHaveBeenCalledWith(expect.any(Object), 'generateNewsletter');
      expect(mockCallable).toHaveBeenCalledWith({ issueId: 'issue1' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle generation failures', async () => {
      const mockResponse = {
        success: false,
        message: 'Generation failed: Invalid issue data',
        error: 'Invalid issue data'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.generateNewsletter('issue1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid issue data');
    });

    it('should handle non-existent issue generation', async () => {
      const mockResponse = {
        success: false,
        message: 'Issue not found',
        error: 'Issue not found'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.generateNewsletter('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Issue not found');
    });

    it('should handle empty issue ID', async () => {
      await expect(service.generateNewsletter('')).rejects.toThrow();
    });

    it('should handle network errors during generation', async () => {
      mockCallable.mockRejectedValue(new Error('Network error'));

      await expect(service.generateNewsletter('issue1')).rejects.toThrow('Network error');
    });

    it('should handle timeout during generation', async () => {
      mockCallable.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(service.generateNewsletter('issue1')).rejects.toThrow('Request timeout');
    });
  });

  describe('getGenerationProgress', () => {
    it('should retrieve generation progress', async () => {
      const mockProgress = {
        id: 'gen-123',
        data: () => ({
          issueId: 'issue1',
          status: 'generating',
          progress: 50,
          currentStep: 'Generating PDFs',
          totalSteps: 4,
          completedSteps: 2,
          error: null,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      };

      mockGetDoc().mockResolvedValue(mockProgress);

      const result = await service.getGenerationProgress('gen-123');

      expect(mockDoc()).toHaveBeenCalledWith('generation_progress', 'gen-123');
      expect(result).toBeDefined();
      expect(result?.id).toBe('gen-123');
    });

    it('should return null for non-existent progress', async () => {
      mockGetDoc().mockResolvedValue({
        exists: () => false
      });

      const result = await service.getGenerationProgress('non-existent');

      expect(result).toBeNull();
    });

    it('should handle malformed progress data', async () => {
      const malformedProgress = {
        id: 'gen-123',
        data: () => ({
          issueId: 'issue1',
          status: 'generating',
          // Missing required fields
          createdAt: { toDate: () => new Date('2024-01-01') }
        })
      };

      mockGetDoc().mockResolvedValue(malformedProgress);

      const result = await service.getGenerationProgress('gen-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('gen-123');
      // Should handle missing fields gracefully
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent operations', async () => {
      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const issueData = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };

      const promises = [
        service.createIssue(issueData),
        service.createIssue({ ...issueData, issueNumber: '2' }),
        service.createIssue({ ...issueData, issueNumber: '3' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAddDoc()).toHaveBeenCalledTimes(3);
    });

    it('should handle very long issue titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const issueData = {
        title: longTitle,
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };

      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const result = await service.createIssue(issueData);

      expect(result).toBe('new-issue-id');
      expect(mockAddDoc()).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longTitle
        })
      );
    });

    it('should handle special characters in issue data', async () => {
      const specialCharData = {
        title: 'Test <script>alert("xss")</script>',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };

      const mockDoc()Ref = { id: 'new-issue-id' };
      mockAddDoc().mockResolvedValue(mockDoc()Ref);

      const result = await service.createIssue(specialCharData);

      expect(result).toBe('new-issue-id');
    });

    it('should handle null and undefined values', async () => {
      const nullData = {
        title: null,
        issueNumber: undefined,
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };

      await expect(service.createIssue(nullData as any)).rejects.toThrow();
    });

    it('should handle circular references in issue data', async () => {
      const circularData: any = {
        title: 'Test Newsletter',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01'),
        submissions: ['submission1']
      };
      circularData.self = circularData; // Create circular reference

      await expect(service.createIssue(circularData)).rejects.toThrow();
    });
  });
});
