/**
 * Notification Service Test Suite
 *
 * Tests for the enhanced notification service including task-specific notifications,
 * user preferences, real-time updates, and email integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { notificationService, type NotificationType, type NotificationPriority } from '../../../src/services/notificationService';
import { contentQueryService } from '../../../src/services/contentQueryService';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { logger } from '../../../src/utils/logger';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';

// Mock dependencies
vi.mock('../../../src/config/firebase.config', () => ({
  firestore: {},
  functions: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() } as Timestamp)),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() } as Timestamp)),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date } as Timestamp))
  }
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn()
}));

vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/utils/logger');

describe('NotificationService', () => {
  const mockUserProfile: UserProfile = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: undefined,
    role: 'contributor',
    permissions: [],
    isApproved: true,
    tags: ['skill:writing', 'skill:editing'],
    availability: 'regular',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      preferredCategories: ['news', 'events'],
      taskAssignments: true
    },
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock firestoreService.getUserProfile
    (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(mockUserProfile);

    // Mock Firebase collection operations
    const mockDocRef = { id: 'mock-notification-id' };
    (vi.mocked(require('firebase/firestore').addDoc)).mockResolvedValue(mockDocRef);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendNotification', () => {
    it('should send a task assignment notification successfully', async () => {
      const notificationData = {
        contentId: 'content-123',
        contentTitle: 'Test Article',
        taskCategory: 'review',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        estimatedTime: 30
      };

      const notificationId = await notificationService.sendNotification(
        'test-user-123',
        'task_assigned',
        notificationData
      );

      expect(notificationId).toBe('mock-notification-id');
      expect(firestoreService.getUserProfile).toHaveBeenCalledWith('test-user-123');
      expect(require('firebase/firestore').addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-user-123',
          type: 'task_assigned',
          priority: 'medium',
          channels: ['in-app', 'email'],
          read: false,
          data: notificationData
        })
      );
    });

    it('should respect user notification preferences', async () => {
      const userWithEmailDisabled = {
        ...mockUserProfile,
        preferences: {
          ...mockUserProfile.preferences,
          emailNotifications: false
        }
      };

      (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(userWithEmailDisabled);

      await notificationService.sendNotification(
        'test-user-123',
        'task_assigned',
        { contentTitle: 'Test' }
      );

      expect(require('firebase/firestore').addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          channels: ['in-app'] // Email should be filtered out
        })
      );
    });

    it('should skip notification if all channels are disabled', async () => {
      const userWithAllDisabled = {
        ...mockUserProfile,
        preferences: {
          ...mockUserProfile.preferences,
          emailNotifications: false,
          pushNotifications: false
        }
      };

      (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(userWithAllDisabled);

      const result = await notificationService.sendNotification(
        'test-user-123',
        'task_assigned',
        { contentTitle: 'Test' },
        { channels: ['email', 'push'] } // Only disabled channels
      );

      expect(result).toBe('skipped');
      expect(require('firebase/firestore').addDoc).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'User has disabled all notification channels for this type',
        expect.any(Object)
      );
    });

    it('should skip duplicate notifications when configured', async () => {
      const mockExistingNotification = { id: 'existing-123' };

      // Mock findExistingNotification to return an existing notification
      vi.spyOn(notificationService as any, 'findExistingNotification')
        .mockResolvedValue(mockExistingNotification);

      const result = await notificationService.sendNotification(
        'test-user-123',
        'task_assigned',
        { contentId: 'content-123' },
        { skipIfExists: true }
      );

      expect(result).toBe('existing-123');
      expect(require('firebase/firestore').addDoc).not.toHaveBeenCalled();
    });

    it('should handle notification template not found', async () => {
      await expect(
        notificationService.sendNotification(
          'test-user-123',
          'invalid_type' as NotificationType,
          {}
        )
      ).rejects.toThrow('Unknown notification type: invalid_type');
    });

    it('should handle user profile not found', async () => {
      (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(null);

      await expect(
        notificationService.sendNotification(
          'nonexistent-user',
          'task_assigned',
          {}
        )
      ).rejects.toThrow('User profile not found for nonexistent-user');
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'test-user-123',
          type: 'task_assigned',
          title: 'Task Assigned',
          message: 'You have a new task',
          read: false,
          createdAt: Timestamp.now()
        },
        {
          id: 'notif-2',
          userId: 'test-user-123',
          type: 'task_completed',
          title: 'Task Completed',
          message: 'Task was completed',
          read: true,
          createdAt: Timestamp.now()
        }
      ];

      const mockSnapshot = {
        docs: mockNotifications.map(notif => ({
          id: notif.id,
          data: () => notif
        }))
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await notificationService.getUserNotifications('test-user-123', {
        limitCount: 10
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'notif-1',
        type: 'task_assigned',
        read: false
      }));
    });

    it('should filter unread notifications only', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      await notificationService.getUserNotifications('test-user-123', {
        unreadOnly: true,
        limitCount: 5
      });

      expect(require('firebase/firestore').query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(), // where userId
        expect.anything(), // where read == false
        expect.anything(), // orderBy
        expect.anything()  // limit
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      await notificationService.markAsRead('notif-123', 'test-user-123');

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          read: true,
          readAt: expect.anything()
        }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const mockSnapshot = {
        size: 3,
        docs: [
          { ref: { update: vi.fn() } },
          { ref: { update: vi.fn() } },
          { ref: { update: vi.fn() } }
        ]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await notificationService.markAllAsRead('test-user-123');

      expect(result).toBe(3);
      expect(mockSnapshot.docs[0].ref.update).toHaveBeenCalled();
      expect(mockSnapshot.docs[1].ref.update).toHaveBeenCalled();
      expect(mockSnapshot.docs[2].ref.update).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread notification count', async () => {
      const mockSnapshot = { size: 5 };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const count = await notificationService.getUnreadCount('test-user-123');

      expect(count).toBe(5);
      expect(require('firebase/firestore').query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(), // where userId
        expect.anything()  // where read == false
      );
    });

    it('should return 0 on error', async () => {
      (require('firebase/firestore').getDocs).mockRejectedValue(new Error('Database error'));

      const count = await notificationService.getUnreadCount('test-user-123');

      expect(count).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get unread count',
        expect.any(Object)
      );
    });
  });

  describe('subscribeToUserNotifications', () => {
    it('should set up real-time subscription', () => {
      const mockUnsubscribe = vi.fn();
      const mockCallback = vi.fn();

      (require('firebase/firestore').onSnapshot).mockImplementation((query, callback) => {
        // Simulate snapshot data
        const mockSnapshot = {
          docs: [{
            id: 'notif-1',
            data: () => ({
              userId: 'test-user-123',
              type: 'task_assigned',
              title: 'Test',
              read: false
            })
          }]
        };

        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = notificationService.subscribeToUserNotifications(
        'test-user-123',
        mockCallback,
        { unreadOnly: true, limitCount: 10 }
      );

      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'notif-1',
          type: 'task_assigned'
        })
      ]);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('sendSystemAnnouncement', () => {
    it('should send announcement to all target users', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' }
      ];

      const mockSnapshot = {
        size: 3,
        docs: mockUsers
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      // Mock sendNotification to resolve successfully
      vi.spyOn(notificationService, 'sendNotification').mockResolvedValue('mock-id');

      const result = await notificationService.sendSystemAnnouncement({
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight',
        priority: 'high',
        targetRoles: ['contributor', 'editor']
      });

      expect(result).toBe(3);
      expect(notificationService.sendNotification).toHaveBeenCalledTimes(3);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'user-1',
        'system_announcement',
        expect.objectContaining({
          title: 'System Maintenance',
          message: 'Scheduled maintenance tonight'
        }),
        { priority: 'high' }
      );
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should remove expired notifications', async () => {
      const mockExpiredNotifications = [
        { ref: { delete: vi.fn() } },
        { ref: { delete: vi.fn() } }
      ];

      const mockSnapshot = {
        size: 2,
        docs: mockExpiredNotifications
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await notificationService.cleanupExpiredNotifications();

      expect(result).toBe(2);
      expect(mockExpiredNotifications[0].ref.delete).toHaveBeenCalled();
      expect(mockExpiredNotifications[1].ref.delete).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      (require('firebase/firestore').addDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(
        notificationService.sendNotification('test-user-123', 'task_assigned', {})
      ).rejects.toThrow('Firestore error');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send notification',
        expect.objectContaining({
          userId: 'test-user-123',
          type: 'task_assigned',
          error: 'Firestore error'
        })
      );
    });

    it('should return no-op unsubscribe on subscription error', () => {
      (require('firebase/firestore').onSnapshot).mockImplementation(() => {
        throw new Error('Subscription error');
      });

      const unsubscribe = notificationService.subscribeToUserNotifications(
        'test-user-123',
        vi.fn()
      );

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).not.toThrow();
    });
  });

  describe('notification templates', () => {
    it('should generate correct task assignment notification', async () => {
      const data = {
        taskCategory: 'review',
        contentTitle: 'Breaking News Article',
        dueDate: '2024-12-25T10:00:00Z',
        estimatedTime: 45
      };

      await notificationService.sendNotification(
        'test-user-123',
        'task_assigned',
        data
      );

      const addDocCall = (require('firebase/firestore').addDoc).mock.calls[0];
      const notificationData = addDocCall[1];

      expect(notificationData.title).toBe('New Task Assigned: review');
      expect(notificationData.message).toContain('Breaking News Article');
      expect(notificationData.message).toContain('Due:');
      expect(notificationData.deepLink).toBe('/volunteer/tasks?highlight=undefined');
    });

    it('should generate correct deadline approaching notification', async () => {
      const data = {
        taskCategory: 'fact-check',
        contentTitle: 'Important Article',
        hoursRemaining: 6
      };

      await notificationService.sendNotification(
        'test-user-123',
        'deadline_approaching',
        data
      );

      const addDocCall = (require('firebase/firestore').addDoc).mock.calls[0];
      const notificationData = addDocCall[1];

      expect(notificationData.title).toBe('Task Deadline Approaching');
      expect(notificationData.message).toContain('6 hours');
      expect(notificationData.priority).toBe('high');
      expect(notificationData.channels).toContain('email');
    });

    it('should generate correct task overdue notification', async () => {
      const data = {
        taskCategory: 'layout',
        contentTitle: 'Overdue Content',
        hoursOverdue: 12
      };

      await notificationService.sendNotification(
        'test-user-123',
        'task_overdue',
        data
      );

      const addDocCall = (require('firebase/firestore').addDoc).mock.calls[0];
      const notificationData = addDocCall[1];

      expect(notificationData.title).toBe('Task Overdue');
      expect(notificationData.message).toContain('12 hours overdue');
      expect(notificationData.priority).toBe('urgent');
    });
  });

  describe('performance and optimization', () => {
    it('should handle large number of notifications efficiently', async () => {
      const mockLargeSnapshot = {
        docs: Array(1000).fill(null).map((_, i) => ({
          id: `notif-${i}`,
          data: () => ({
            userId: 'test-user-123',
            type: 'task_assigned',
            title: `Notification ${i}`,
            read: false
          })
        }))
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockLargeSnapshot);

      const startTime = Date.now();
      const result = await notificationService.getUserNotifications('test-user-123');
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should batch notification operations when possible', async () => {
      const mockSnapshot = {
        size: 5,
        docs: Array(5).fill(null).map(() => ({ ref: { update: vi.fn() } }))
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      await notificationService.markAllAsRead('test-user-123');

      // All updates should be called in parallel (Promise.all)
      expect(mockSnapshot.docs.every(doc => doc.ref.update.mock.calls.length === 1)).toBe(true);
    });
  });
});
