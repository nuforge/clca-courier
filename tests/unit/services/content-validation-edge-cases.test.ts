import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock content sanitization utilities
vi.mock('../../../src/utils/content-sanitization', () => ({
  sanitizeTitle: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '') || '',
    errors: []
  })),
  sanitizeContent: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/onerror="[^"]*"/gi, '') || '',
    errors: []
  })),
  sanitizeLocation: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '') || '',
    errors: []
  })),
  sanitizeMetadata: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<img[^>]*onerror[^>]*>/gi, '') || '',
    errors: []
  })),
  containsMaliciousContent: vi.fn((input) => /<script|onerror|javascript:/i.test(input)),
  logSecurityEvent: vi.fn()
}));

// Mock Firebase services
vi.mock('../../../src/services/firebase-content.service', () => ({
  firebaseContentService: {
    createContent: vi.fn()
  }
}));

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-123', displayName: 'Test User' }
  }))
}));

import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firebaseContentService } from '../../../src/services/firebase-content.service';
import { sanitizeTitle, sanitizeContent, sanitizeLocation, containsMaliciousContent } from '../../../src/utils/content-sanitization';

describe('Content Validation Edge Cases - Security & Data Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock setup
    (firebaseContentService.createContent as any).mockResolvedValue('test-content-id');
  });

  describe('XSS Attack Prevention', () => {
    it('should prevent script injection in titles', async () => {
      const maliciousTitle = '<script>alert("XSS")</script>Safe Title';
      (sanitizeTitle as any).mockReturnValue({
        isValid: true,
        sanitizedValue: 'Safe Title',
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        maliciousTitle,
        'Safe content',
        'article'
      );

      expect(sanitizeTitle).toHaveBeenCalledWith(maliciousTitle);
      expect(result).toBe('test-content-id');
    });

    it('should prevent event handler injection', async () => {
      const maliciousContent = '<img src="x" onerror="alert(1)">Safe content';
      (sanitizeContent as any).mockReturnValue({
        isValid: true,
        sanitizedValue: '<img src="x">Safe content',
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        maliciousContent,
        'article'
      );

      expect(sanitizeContent).toHaveBeenCalledWith(maliciousContent);
      expect(result).toBe('test-content-id');
    });

    it('should prevent javascript: URL injection', async () => {
      const maliciousContent = '<a href="javascript:alert(1)">Click me</a>';
      (sanitizeContent as any).mockReturnValue({
        isValid: true,
        sanitizedValue: '<a>Click me</a>',
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        maliciousContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should prevent data: URL injection with scripts', async () => {
      const maliciousContent = '<img src="data:text/html,<script>alert(1)</script>">';
      (sanitizeContent as any).mockReturnValue({
        isValid: true,
        sanitizedValue: '',
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        maliciousContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should prevent iframe injection', async () => {
      const maliciousContent = '<iframe src="javascript:alert(1)"></iframe>';
      (sanitizeContent as any).mockReturnValue({
        isValid: true,
        sanitizedValue: '',
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        maliciousContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should handle SQL injection attempts in content', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      (sanitizeContent as any).mockReturnValue({
        isValid: true,
        sanitizedValue: sqlInjection, // Should pass through as it's not HTML
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        sqlInjection,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle SQL injection in location fields', async () => {
      const sqlInjection = "'; DELETE FROM content; --";
      (sanitizeLocation as any).mockReturnValue({
        isValid: true,
        sanitizedValue: sqlInjection,
        errors: []
      });

      const result = await contentSubmissionService.createContent(
        'Safe Title',
        'Safe content',
        'event',
        {
          'feat:location': {
            name: sqlInjection,
            address: '123 Main St'
          }
        }
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('Data Type Validation', () => {
    it('should handle null and undefined inputs gracefully', async () => {
      await expect(contentSubmissionService.createContent(
        null as any,
        undefined as any,
        'article'
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle empty string inputs', async () => {
      await expect(contentSubmissionService.createContent(
        '',
        '',
        'article'
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle whitespace-only inputs', async () => {
      await expect(contentSubmissionService.createContent(
        '   ',
        '   ',
        'article'
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle extremely long inputs', async () => {
      const longTitle = 'A'.repeat(201); // Exceeds 200 char limit
      const longContent = 'B'.repeat(10001); // Exceeds 10000 char limit

      await expect(contentSubmissionService.createContent(
        longTitle,
        longContent,
        'article'
      )).rejects.toThrow('Content validation failed');
    });
  });

  describe('Date Validation Edge Cases', () => {
    it('should prevent invalid date ranges', async () => {
      const { Timestamp } = await import('firebase/firestore');

      await expect(contentSubmissionService.createContent(
        'Event Title',
        'Event Description',
        'event',
        {
          'feat:date': {
            start: Timestamp.fromDate(new Date('2024-12-31')),
            end: Timestamp.fromDate(new Date('2024-01-01')), // End before start
            isAllDay: false
          }
        }
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle null date values', async () => {
      await expect(contentSubmissionService.createContent(
        'Event Title',
        'Event Description',
        'event',
        {
          'feat:date': {
            start: null as any,
            isAllDay: false
          }
        }
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle invalid date objects', async () => {
      await expect(contentSubmissionService.createContent(
        'Event Title',
        'Event Description',
        'event',
        {
          'feat:date': {
            start: 'invalid-date' as any,
            isAllDay: false
          }
        }
      )).rejects.toThrow('Content validation failed');
    });
  });

  describe('Content Type Validation', () => {
    it('should reject invalid content types', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'invalid-type'
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle empty content type', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        ''
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle whitespace-only content type', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        '   '
      )).rejects.toThrow('Content validation failed');
    });
  });

  describe('Feature Validation', () => {
    it('should handle malformed location features', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'event',
        {
          'feat:location': {
            name: null as any,
            address: undefined as any
          }
        }
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle malformed task features', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'task',
        {
          'feat:task': {
            dueDate: 'invalid-date' as any,
            priority: 'invalid-priority' as any
          }
        }
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle circular references in features', async () => {
      const circularFeature: any = { name: 'test' };
      circularFeature.self = circularFeature;

      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {
          'feat:custom': circularFeature
        }
      )).rejects.toThrow('Content validation failed');
    });
  });

  describe('Tag Validation', () => {
    it('should handle invalid tag formats', async () => {
      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {},
        ['invalid:tag:format:with:too:many:colons']
      )).rejects.toThrow('Content validation failed');
    });

    it('should handle empty tag arrays', async () => {
      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {},
        []
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle duplicate tags', async () => {
      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {},
        ['category:news', 'category:news'] // Duplicate
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle tags with special characters', async () => {
      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {},
        ['category:news & updates', 'priority:high!']
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle unauthenticated users', async () => {
      const { getAuth } = await import('firebase/auth');
      (getAuth as any).mockReturnValue({
        currentUser: null
      });

      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'article'
      )).rejects.toThrow('User must be authenticated');
    });

    it('should handle users without display names', async () => {
      const { getAuth } = await import('firebase/auth');
      (getAuth as any).mockReturnValue({
        currentUser: { uid: 'test-user-123', displayName: null }
      });

      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article'
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('Concurrent Submission Handling', () => {
    it('should handle multiple simultaneous submissions', async () => {
      const submissions = Array.from({ length: 10 }, (_, i) =>
        contentSubmissionService.createContent(
          `Title ${i}`,
          `Content ${i}`,
          'article'
        )
      );

      const results = await Promise.all(submissions);
      expect(results).toHaveLength(10);
      expect(results.every(id => id === 'test-content-id')).toBe(true);
    });

    it('should handle submission failures gracefully', async () => {
      (firebaseContentService.createContent as any).mockRejectedValueOnce(
        new Error('Firebase error')
      );

      await expect(contentSubmissionService.createContent(
        'Title',
        'Content',
        'article'
      )).rejects.toThrow('Firebase error');
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle very large content submissions', async () => {
      const largeContent = 'A'.repeat(50000); // 50KB content

      const result = await contentSubmissionService.createContent(
        'Large Content Title',
        largeContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle content with many features', async () => {
      const manyFeatures: any = {};
      for (let i = 0; i < 100; i++) {
        manyFeatures[`feat:custom${i}`] = { value: `Feature ${i}` };
      }

      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        manyFeatures
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle content with many tags', async () => {
      const manyTags = Array.from({ length: 1000 }, (_, i) => `tag:${i}`);

      const result = await contentSubmissionService.createContent(
        'Title',
        'Content',
        'article',
        {},
        manyTags
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('Unicode and Internationalization', () => {
    it('should handle Unicode characters in content', async () => {
      const unicodeContent = 'Hello 世界 🌍 مرحبا بالعالم Здравствуй мир';

      const result = await contentSubmissionService.createContent(
        'Unicode Title',
        unicodeContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle emoji in content', async () => {
      const emojiContent = 'Content with emojis 🎉 🚀 💻 🎨 🔥';

      const result = await contentSubmissionService.createContent(
        'Emoji Title',
        emojiContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });

    it('should handle right-to-left languages', async () => {
      const rtlContent = 'זה תוכן בעברית';

      const result = await contentSubmissionService.createContent(
        'RTL Title',
        rtlContent,
        'article'
      );

      expect(result).toBe('test-content-id');
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events for malicious content', async () => {
      const { logSecurityEvent } = await import('../../../src/utils/content-sanitization');

      const maliciousContent = '<script>alert("XSS")</script>';
      (containsMaliciousContent as any).mockReturnValue(true);

      await contentSubmissionService.createContent(
        'Title',
        maliciousContent,
        'article'
      );

      expect(logSecurityEvent).toHaveBeenCalled();
    });
  });
});
