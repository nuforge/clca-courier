/**
 * Deadline Manager Test Suite
 *
 * Tests for deadline calculation, monitoring, escalation, and performance metrics
 * in the volunteer workflow system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { deadlineManager, type UrgencyLevel, type DeadlineStatus } from '../../../src/utils/deadlineManager';
import { logger } from '../../../src/utils/logger';
import type { ContentDoc } from '../../../src/types/core/content.types';
import type { TaskCategory, TaskPriority } from '../../../src/services/task.service';

// Mock dependencies
vi.mock('../../../src/utils/logger');
vi.mock('../../../src/services/notificationService', () => ({
  notificationService: {
    sendNotification: vi.fn()
  }
}));

describe('DeadlineManager', () => {
  const mockContent: ContentDoc = {
    id: 'content-123',
    title: 'Test Article for Deadline Calculation',
    description: 'This is a test article with moderate complexity for testing deadline calculations.',
    authorId: 'author-123',
    authorName: 'Test Author',
    tags: ['content-type:news', 'category:local'],
    features: {},
    status: 'draft',
    timestamps: {
      created: Timestamp.now(),
      updated: Timestamp.now()
    }
  };

  const mockLongContent: ContentDoc = {
    ...mockContent,
    id: 'content-456',
    title: 'Long Investigative Article',
    description: 'This is a very long investigative article that exceeds 1000 words. '.repeat(50), // >1000 words
    tags: ['content-type:news', 'category:investigative', 'requires-fact-check']
  };

  const mockEventContent: ContentDoc = {
    ...mockContent,
    id: 'content-789',
    title: 'Community Event',
    tags: ['content-type:event', 'category:community'],
    features: {
      'feat:date': {
        start: Timestamp.fromDate(new Date(Date.now() + 604800000)), // 1 week from now
        isAllDay: false
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('calculateDeadline', () => {
    it('should calculate basic deadline for review task with medium priority', () => {
      const result = deadlineManager.calculateDeadline(
        mockContent,
        'review',
        'medium'
      );

      expect(result.estimatedHours).toBe(48); // Base 48 hours for review
      expect(result.deadline.toDate().getTime()).toBeGreaterThan(Date.now());
      expect(result.analysis.score).toBe(1.0); // No complexity factors
      expect(result.analysis.factors).toEqual([]);
    });

    it('should apply priority multipliers correctly', () => {
      const highPriorityResult = deadlineManager.calculateDeadline(
        mockContent,
        'review',
        'high'
      );

      const lowPriorityResult = deadlineManager.calculateDeadline(
        mockContent,
        'review',
        'low'
      );

      expect(highPriorityResult.estimatedHours).toBeLessThan(lowPriorityResult.estimatedHours);
      expect(highPriorityResult.estimatedHours).toBe(34); // 48 * 0.7 = 33.6, rounded to 34
      expect(lowPriorityResult.estimatedHours).toBe(72); // 48 * 1.5 = 72
    });

    it('should apply complexity factors for long content', () => {
      const result = deadlineManager.calculateDeadline(
        mockLongContent,
        'review',
        'medium'
      );

      expect(result.estimatedHours).toBeGreaterThan(48);
      expect(result.analysis.factors).toContain('long-content');
      expect(result.analysis.score).toBeGreaterThan(1.0);
    });

    it('should apply multiple complexity factors', () => {
      const complexContent = {
        ...mockLongContent,
        features: {
          'feat:date': {
            start: Timestamp.now(),
            isAllDay: false
          }
        }
      };

      const result = deadlineManager.calculateDeadline(
        complexContent,
        'fact-check',
        'medium'
      );

      expect(result.analysis.factors).toContain('long-content');
      expect(result.analysis.factors).toContain('has-events');
      expect(result.analysis.factors).toContain('requires-fact-check');
      expect(result.estimatedHours).toBeGreaterThan(96); // Base fact-check time with multipliers
    });

    it('should respect minimum and maximum bounds', () => {
      // Test minimum bound
      const shortTaskResult = deadlineManager.calculateDeadline(
        mockContent,
        'approve', // 24 hours base
        'high', // 0.7 multiplier = 16.8 hours
        {},
        { minimumHours: 20 } // Custom minimum higher than calculated
      );

      expect(shortTaskResult.estimatedHours).toBeGreaterThanOrEqual(6); // Default minimum

      // Test maximum bound with very complex content
      const veryComplexContent = {
        ...mockLongContent,
        description: 'Very long content. '.repeat(500), // Very long
        features: {
          'feat:date': { start: Timestamp.now(), isAllDay: false }
        }
      };

      const longTaskResult = deadlineManager.calculateDeadline(
        veryComplexContent,
        'print', // 120 hours base
        'low', // 1.5 multiplier
        { extraComplexity: 2.0 } // Custom multiplier
      );

      expect(longTaskResult.estimatedHours).toBeLessThanOrEqual(336); // Default maximum (2 weeks)
    });

    it('should apply weekend factor when deadline falls on weekend', () => {
      // Set current time to Friday
      vi.setSystemTime(new Date('2024-01-19T15:00:00Z')); // Friday

      const result = deadlineManager.calculateDeadline(
        mockContent,
        'layout', // 72 hours base, will end on Monday
        'medium'
      );

      // Should apply weekend factor (1.2x)
      expect(result.estimatedHours).toBeGreaterThan(72);
      expect(logger.debug).toHaveBeenCalledWith(
        'Applied weekend factor',
        expect.objectContaining({
          weekendFactor: 1.2
        })
      );
    });

    it('should apply custom factors', () => {
      const customFactors = {
        urgentPublication: 0.5, // Half the time for urgent
        complexLayout: 1.8      // 80% more time for complex layout
      };

      const result = deadlineManager.calculateDeadline(
        mockContent,
        'layout',
        'medium',
        customFactors
      );

      // 72 * 0.5 * 1.8 = 64.8, rounded to 65
      expect(result.estimatedHours).toBe(65);
    });

    it('should handle calculation errors gracefully', () => {
      // Mock a content object that might cause issues
      const problematicContent = {
        ...mockContent,
        description: null as any // Invalid description
      };

      const result = deadlineManager.calculateDeadline(
        problematicContent,
        'review',
        'medium'
      );

      // Should fall back to safe defaults
      expect(result.estimatedHours).toBe(48); // Default review time
      expect(result.analysis.factors).toContain('fallback');
    });
  });

  describe('getDeadlineStatus', () => {
    it('should return correct status for completed tasks', () => {
      const futureDeadline = Timestamp.fromDate(new Date(Date.now() + 86400000));

      const status = deadlineManager.getDeadlineStatus(futureDeadline, true);

      expect(status.urgency).toBe('low');
      expect(status.formattedTimeRemaining).toBe('Completed');
      expect(status.isOverdue).toBe(false);
      expect(status.color).toBe('positive');
      expect(status.icon).toBe('check_circle');
    });

    it('should return overdue status for past deadlines', () => {
      const pastDeadline = Timestamp.fromDate(new Date(Date.now() - 3600000)); // 1 hour ago

      const status = deadlineManager.getDeadlineStatus(pastDeadline);

      expect(status.urgency).toBe('overdue');
      expect(status.isOverdue).toBe(true);
      expect(status.color).toBe('negative');
      expect(status.icon).toBe('error');
      expect(status.formattedTimeRemaining).toContain('Overdue');
    });

    it('should return critical status for very soon deadlines', () => {
      const soonDeadline = Timestamp.fromDate(new Date(Date.now() + 3600000)); // 1 hour from now

      const status = deadlineManager.getDeadlineStatus(soonDeadline);

      expect(status.urgency).toBe('critical');
      expect(status.color).toBe('red');
      expect(status.icon).toBe('warning');
      expect(status.formattedTimeRemaining).toBe('1h remaining');
    });

    it('should return high status for deadlines within 24 hours', () => {
      const dayDeadline = Timestamp.fromDate(new Date(Date.now() + 18 * 3600000)); // 18 hours from now

      const status = deadlineManager.getDeadlineStatus(dayDeadline);

      expect(status.urgency).toBe('high');
      expect(status.color).toBe('orange');
      expect(status.formattedTimeRemaining).toBe('18h remaining');
    });

    it('should return medium status for deadlines within 3 days', () => {
      const threeDayDeadline = Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)); // 2 days from now

      const status = deadlineManager.getDeadlineStatus(threeDayDeadline);

      expect(status.urgency).toBe('medium');
      expect(status.color).toBe('amber');
      expect(status.formattedTimeRemaining).toBe('2d remaining');
    });

    it('should return low status for distant deadlines', () => {
      const distantDeadline = Timestamp.fromDate(new Date(Date.now() + 7 * 86400000)); // 1 week from now

      const status = deadlineManager.getDeadlineStatus(distantDeadline);

      expect(status.urgency).toBe('low');
      expect(status.color).toBe('primary');
      expect(status.icon).toBe('schedule');
      expect(status.message).toBe('On track');
    });
  });

  describe('shouldSendDeadlineNotification', () => {
    it('should trigger overdue notification for past deadlines', () => {
      const pastDeadline = Timestamp.fromDate(new Date(Date.now() - 7200000)); // 2 hours ago

      const result = deadlineManager.shouldSendDeadlineNotification(pastDeadline);

      expect(result.shouldSend).toBe(true);
      expect(result.notificationType).toBe('task_overdue');
      expect(result.hoursRemaining).toBeLessThan(0);
    });

    it('should trigger approaching deadline notifications at correct intervals', () => {
      // Test 72-hour notification window
      const deadline72h = Timestamp.fromDate(new Date(Date.now() + 71 * 3600000)); // 71 hours from now

      const result72h = deadlineManager.shouldSendDeadlineNotification(deadline72h);

      expect(result72h.shouldSend).toBe(true);
      expect(result72h.notificationType).toBe('deadline_approaching');

      // Test 24-hour notification window
      const deadline24h = Timestamp.fromDate(new Date(Date.now() + 23 * 3600000)); // 23 hours from now

      const result24h = deadlineManager.shouldSendDeadlineNotification(deadline24h);

      expect(result24h.shouldSend).toBe(true);
      expect(result24h.notificationType).toBe('deadline_approaching');
    });

    it('should not send duplicate notifications too soon', () => {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 23 * 3600000)); // 23 hours from now
      const recentNotification = Timestamp.fromDate(new Date(Date.now() - 3600000)); // 1 hour ago

      const result = deadlineManager.shouldSendDeadlineNotification(deadline, recentNotification);

      expect(result.shouldSend).toBe(false);
      expect(result.notificationType).toBe(null);
    });

    it('should allow notifications after sufficient time gap', () => {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 5 * 3600000)); // 5 hours from now
      const oldNotification = Timestamp.fromDate(new Date(Date.now() - 7 * 3600000)); // 7 hours ago

      const result = deadlineManager.shouldSendDeadlineNotification(deadline, oldNotification);

      expect(result.shouldSend).toBe(true);
      expect(result.notificationType).toBe('deadline_approaching');
    });

    it('should not send notifications for safe deadlines', () => {
      const safeDeadline = Timestamp.fromDate(new Date(Date.now() + 7 * 86400000)); // 1 week from now

      const result = deadlineManager.shouldSendDeadlineNotification(safeDeadline);

      expect(result.shouldSend).toBe(false);
      expect(result.notificationType).toBe(null);
    });
  });

  describe('requestDeadlineExtension', () => {
    it('should create valid extension request', async () => {
      const currentDeadline = Timestamp.fromDate(new Date(Date.now() + 86400000)); // 1 day from now
      const requestedDeadline = Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)); // 2 days from now

      const requestId = await deadlineManager.requestDeadlineExtension(
        'content-123',
        currentDeadline,
        requestedDeadline,
        'Need more time for thorough fact-checking',
        'volunteer-123',
        'Test Volunteer'
      );

      expect(requestId).toMatch(/^ext_\d+_[a-z0-9]+$/);
      expect(logger.info).toHaveBeenCalledWith(
        'Deadline extension requested',
        expect.objectContaining({
          requestId,
          contentId: 'content-123',
          requestedBy: 'volunteer-123'
        })
      );
    });

    it('should reject extension to past date', async () => {
      const currentDeadline = Timestamp.fromDate(new Date(Date.now() + 86400000));
      const pastDate = Timestamp.fromDate(new Date(Date.now() - 86400000)); // Yesterday

      await expect(
        deadlineManager.requestDeadlineExtension(
          'content-123',
          currentDeadline,
          pastDate,
          'Invalid request',
          'volunteer-123',
          'Test Volunteer'
        )
      ).rejects.toThrow('Requested deadline must be in the future');
    });

    it('should reject extension to earlier than current deadline', async () => {
      const currentDeadline = Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)); // 2 days
      const earlierDeadline = Timestamp.fromDate(new Date(Date.now() + 86400000)); // 1 day

      await expect(
        deadlineManager.requestDeadlineExtension(
          'content-123',
          currentDeadline,
          earlierDeadline,
          'Invalid request',
          'volunteer-123',
          'Test Volunteer'
        )
      ).rejects.toThrow('Requested deadline must be after current deadline');
    });

    it('should require non-empty reason', async () => {
      const currentDeadline = Timestamp.fromDate(new Date(Date.now() + 86400000));
      const requestedDeadline = Timestamp.fromDate(new Date(Date.now() + 2 * 86400000));

      await expect(
        deadlineManager.requestDeadlineExtension(
          'content-123',
          currentDeadline,
          requestedDeadline,
          '', // Empty reason
          'volunteer-123',
          'Test Volunteer'
        )
      ).rejects.toThrow('Extension reason is required');
    });
  });

  describe('getUrgencyIndicator', () => {
    it('should return correct indicators for each urgency level', () => {
      const urgencyLevels: UrgencyLevel[] = ['low', 'medium', 'high', 'critical', 'overdue'];

      urgencyLevels.forEach(urgency => {
        const indicator = deadlineManager.getUrgencyIndicator(urgency);

        expect(indicator).toEqual(expect.objectContaining({
          color: expect.any(String),
          textColor: expect.any(String),
          icon: expect.any(String),
          pulseAnimation: expect.any(Boolean),
          className: expect.stringContaining(`urgency-${urgency}`)
        }));
      });
    });

    it('should enable pulse animation for urgent levels', () => {
      const highIndicator = deadlineManager.getUrgencyIndicator('high');
      const criticalIndicator = deadlineManager.getUrgencyIndicator('critical');
      const overdueIndicator = deadlineManager.getUrgencyIndicator('overdue');

      expect(highIndicator.pulseAnimation).toBe(true);
      expect(criticalIndicator.pulseAnimation).toBe(true);
      expect(overdueIndicator.pulseAnimation).toBe(true);
    });

    it('should disable pulse animation for normal levels', () => {
      const lowIndicator = deadlineManager.getUrgencyIndicator('low');
      const mediumIndicator = deadlineManager.getUrgencyIndicator('medium');

      expect(lowIndicator.pulseAnimation).toBe(false);
      expect(mediumIndicator.pulseAnimation).toBe(false);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate on-time completion rate correctly', () => {
      const tasks = [
        {
          deadline: Timestamp.fromDate(new Date('2024-01-10T10:00:00Z')),
          completedAt: Timestamp.fromDate(new Date('2024-01-09T15:00:00Z')), // On time
          status: 'completed'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-12T10:00:00Z')),
          completedAt: Timestamp.fromDate(new Date('2024-01-13T10:00:00Z')), // Late
          status: 'completed'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
          completedAt: Timestamp.fromDate(new Date('2024-01-14T10:00:00Z')), // On time
          status: 'completed'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-20T10:00:00Z')),
          status: 'in-progress' // Not completed, should be ignored
        }
      ];

      const metrics = deadlineManager.calculatePerformanceMetrics(tasks);

      expect(metrics.onTimeCompletionRate).toBe(66.67); // 2 out of 3 completed tasks
      expect(metrics.overdueTasksCount).toBe(0); // Only in-progress task, not overdue yet
      expect(metrics.averageCompletionTime).toBeLessThan(0); // Average includes one on-time completion
    });

    it('should count overdue tasks correctly', () => {
      vi.setSystemTime(new Date('2024-01-16T10:00:00Z')); // After some deadlines

      const tasks = [
        {
          deadline: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')), // Yesterday, overdue
          status: 'in-progress'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-17T10:00:00Z')), // Tomorrow, not overdue
          status: 'claimed'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-14T10:00:00Z')), // Day before yesterday, overdue
          status: 'claimed'
        }
      ];

      const metrics = deadlineManager.calculatePerformanceMetrics(tasks);

      expect(metrics.overdueTasksCount).toBe(2);
    });

    it('should calculate average extension time', () => {
      const tasks = [
        {
          deadline: Timestamp.fromDate(new Date('2024-01-10T10:00:00Z')),
          completedAt: Timestamp.fromDate(new Date('2024-01-11T10:00:00Z')), // 1 day late
          status: 'completed'
        },
        {
          deadline: Timestamp.fromDate(new Date('2024-01-12T10:00:00Z')),
          completedAt: Timestamp.fromDate(new Date('2024-01-14T10:00:00Z')), // 2 days late
          status: 'completed'
        }
      ];

      const metrics = deadlineManager.calculatePerformanceMetrics(tasks);

      expect(metrics.averageExtensionTime).toBe(36); // (24 + 48) / 2 = 36 hours
    });

    it('should handle empty task list', () => {
      const metrics = deadlineManager.calculatePerformanceMetrics([]);

      expect(metrics.onTimeCompletionRate).toBe(0);
      expect(metrics.averageCompletionTime).toBe(0);
      expect(metrics.overdueTasksCount).toBe(0);
      expect(metrics.averageExtensionTime).toBe(0);
    });

    it('should handle calculation errors gracefully', () => {
      const invalidTasks = [
        {
          deadline: null as any,
          completedAt: Timestamp.now(),
          status: 'completed'
        }
      ];

      const metrics = deadlineManager.calculatePerformanceMetrics(invalidTasks);

      expect(metrics).toEqual({
        onTimeCompletionRate: 0,
        averageCompletionTime: 0,
        overdueTasksCount: 0,
        averageExtensionTime: 0
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to calculate performance metrics',
        expect.any(Object)
      );
    });
  });

  describe('content type specific adjustments', () => {
    it('should apply news-specific adjustments for review tasks', () => {
      const newsContent = {
        ...mockContent,
        tags: ['content-type:news']
      };

      const result = deadlineManager.calculateDeadline(
        newsContent,
        'review',
        'medium'
      );

      expect(result.analysis.factors).toContain('news-review');
    });

    it('should apply event coordination adjustments', () => {
      const result = deadlineManager.calculateDeadline(
        mockEventContent,
        'review',
        'medium'
      );

      expect(result.analysis.factors).toContain('event-coordination');
      expect(result.estimatedHours).toBeGreaterThan(48);
    });

    it('should apply editorial review adjustments', () => {
      const editorialContent = {
        ...mockContent,
        tags: ['content-type:editorial']
      };

      const result = deadlineManager.calculateDeadline(
        editorialContent,
        'review',
        'medium'
      );

      expect(result.analysis.factors).toContain('editorial-review');
    });
  });
});
