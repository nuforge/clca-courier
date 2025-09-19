/**
 * Task Service Test Suite
 * Comprehensive tests for volunteer workflow task management
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { taskService } from '../../../src/services/task.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { firebaseAuthService } from '../../../src/services/firebase-auth.service';
import { firebaseContentService } from '../../../src/services/firebase-content.service';
import { logger } from '../../../src/utils/logger';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';
import type { ContentDoc } from '../../../src/types/core/content.types';
import type { TaskDetails, TaskStatus, TaskCategory, TaskPriority } from '../../../src/services/task.service';

// Mock dependencies
vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/services/firebase-auth.service');
vi.mock('../../../src/services/firebase-content.service');
vi.mock('../../../src/utils/logger');
vi.mock('firebase/firestore', () => ({
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: vi.fn((date: Date) => ({ toMillis: () => date.getTime() }))
  },
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn()
}));

const mockFirestoreService = firestoreService as any;
const mockFirebaseAuthService = firebaseAuthService as any;
const mockFirebaseContentService = firebaseContentService as any;

describe('TaskService', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockUserProfile: UserProfile = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'contributor',
    permissions: [],
    isApproved: true,
    tags: ['skill:writing', 'skill:editing'],
    availability: 'regular',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      preferredCategories: [],
      taskAssignments: true
    },
    createdAt: '2025-01-01T00:00:00Z',
    lastLoginAt: '2025-01-01T00:00:00Z'
  };

  const mockContentDoc: ContentDoc = {
    id: 'test-content-id',
    title: 'Test Article',
    description: 'Test article description',
    authorId: 'author-id',
    authorName: 'Author Name',
    tags: ['content-type:article'],
    features: {},
    status: 'published',
    timestamps: {
      created: Timestamp.now(),
      updated: Timestamp.now()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockFirebaseAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockFirestoreService.getUserProfile.mockResolvedValue(mockUserProfile);

    // Mock Firestore operations
    const mockDoc = { exists: () => true, data: () => mockContentDoc };
    vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);
    vi.mocked(require('firebase/firestore').updateDoc).mockResolvedValue(undefined);
  });

  describe('createTask', () => {
    it('should create a task for content successfully', async () => {
      const category: TaskCategory = 'review';
      const estimatedTime = 30;
      const priority: TaskPriority = 'medium';
      const instructions = 'Please review for accuracy';
      const dueDate = Timestamp.fromDate(new Date('2025-12-31'));

      await taskService.createTask(
        'test-content-id',
        category,
        estimatedTime,
        priority,
        instructions,
        dueDate
      );

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'features.feat:task': expect.objectContaining({
            category,
            estimatedTime,
            priority,
            instructions,
            dueDate,
            status: 'unclaimed'
          }),
          'timestamps.updated': expect.anything()
        })
      );
    });

    it('should create a task with assignment when assignTo is provided', async () => {
      await taskService.createTask(
        'test-content-id',
        'layout',
        45,
        'high',
        'Design layout for newsletter',
        undefined,
        'assigned-user-id'
      );

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'features.feat:task': expect.objectContaining({
            category: 'layout',
            estimatedTime: 45,
            priority: 'high',
            status: 'claimed',
            assignedTo: 'assigned-user-id'
          })
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(null);

      await expect(
        taskService.createTask('test-content-id', 'review', 30, 'medium')
      ).rejects.toThrow('User must be authenticated to create tasks');
    });

    it('should throw error when content does not exist', async () => {
      const mockDoc = { exists: () => false };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await expect(
        taskService.createTask('non-existent-content', 'review', 30, 'medium')
      ).rejects.toThrow('Content document non-existent-content not found');
    });

    it('should throw error when task already exists', async () => {
      const contentWithTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'unclaimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await expect(
        taskService.createTask('test-content-id', 'review', 30, 'medium')
      ).rejects.toThrow('Task already exists for content test-content-id');
    });
  });

  describe('assignTask', () => {
    beforeEach(() => {
      const contentWithTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'unclaimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);
    });

    it('should assign task to user successfully', async () => {
      await taskService.assignTask('test-content-id', 'test-user-id', 'manual');

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'features.feat:task.assignedTo': 'test-user-id',
          'features.feat:task.status': 'claimed',
          'features.feat:task.updatedAt': expect.anything(),
          'timestamps.updated': expect.anything()
        })
      );
    });

    it('should throw error when user profile not found', async () => {
      mockFirestoreService.getUserProfile.mockResolvedValue(null);

      await expect(
        taskService.assignTask('test-content-id', 'non-existent-user', 'manual')
      ).rejects.toThrow('User profile not found for non-existent-user');
    });

    it('should throw error when user has not opted in for task assignments', async () => {
      const userWithoutTaskAssignments = {
        ...mockUserProfile,
        preferences: { ...mockUserProfile.preferences, taskAssignments: false }
      };
      mockFirestoreService.getUserProfile.mockResolvedValue(userWithoutTaskAssignments);

      await expect(
        taskService.assignTask('test-content-id', 'test-user-id', 'manual')
      ).rejects.toThrow('User test-user-id has not opted in for task assignments');
    });

    it('should throw error when task is already completed', async () => {
      const contentWithCompletedTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'completed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            assignedTo: 'other-user'
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithCompletedTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await expect(
        taskService.assignTask('test-content-id', 'test-user-id', 'manual')
      ).rejects.toThrow('Task for content test-content-id is already completed');
    });

    it('should throw error when task is already assigned to another user', async () => {
      const contentWithAssignedTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'claimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            assignedTo: 'other-user'
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithAssignedTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await expect(
        taskService.assignTask('test-content-id', 'test-user-id', 'manual')
      ).rejects.toThrow('Task for content test-content-id is already assigned to another user');
    });
  });

  describe('updateTaskStatus', () => {
    beforeEach(() => {
      const contentWithTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'claimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            assignedTo: 'test-user-id'
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);
    });

    it('should update task status successfully', async () => {
      await taskService.updateTaskStatus('test-content-id', 'in-progress');

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'features.feat:task.status': 'in-progress',
          'features.feat:task.updatedAt': expect.anything(),
          'timestamps.updated': expect.anything()
        })
      );
    });

    it('should assign task to current user when claiming unclaimed task', async () => {
      const contentWithUnclaimedTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'unclaimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithUnclaimedTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await taskService.updateTaskStatus('test-content-id', 'claimed');

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'features.feat:task.status': 'claimed',
          'features.feat:task.assignedTo': 'test-user-id'
        })
      );
    });

    it('should throw error for invalid status transition', async () => {
      // Mock validateStatusTransition to throw for invalid transition
      await expect(
        taskService.updateTaskStatus('test-content-id', 'unclaimed') // claimed -> unclaimed should be invalid in the service
      ).rejects.toThrow('Invalid status transition from claimed to unclaimed');
    });

    it('should allow admin to update any task', async () => {
      const adminProfile = { ...mockUserProfile, role: 'administrator' };
      mockFirestoreService.getUserProfile.mockResolvedValue(adminProfile);

      const contentWithOtherUserTask = {
        ...mockContentDoc,
        features: {
          'feat:task': {
            category: 'review',
            estimatedTime: 30,
            status: 'claimed',
            priority: 'medium',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            assignedTo: 'other-user'
          }
        }
      };

      const mockDoc = { exists: () => true, data: () => contentWithOtherUserTask };
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue(mockDoc);

      await taskService.updateTaskStatus('test-content-id', 'completed', 'other-user');

      expect(require('firebase/firestore').updateDoc).toHaveBeenCalled();
    });
  });

  describe('getUserTasks', () => {
    const mockQuerySnapshot = {
      forEach: vi.fn((callback) => {
        const mockDoc = {
          id: 'test-content-id',
          data: () => ({
            ...mockContentDoc,
            features: {
              'feat:task': {
                category: 'review',
                estimatedTime: 30,
                status: 'claimed',
                priority: 'medium',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                assignedTo: 'test-user-id'
              }
            }
          })
        };
        callback(mockDoc);
      })
    };

    beforeEach(() => {
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue(mockQuerySnapshot);
    });

    it('should get tasks assigned to user', async () => {
      const tasks = await taskService.getUserTasks('test-user-id');

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        taskId: 'test-content-id',
        contentId: 'test-content-id',
        contentTitle: 'Test Article',
        contentAuthor: 'Author Name',
        task: expect.objectContaining({
          category: 'review',
          status: 'claimed',
          assignedTo: 'test-user-id'
        })
      });
    });

    it('should filter tasks by status', async () => {
      await taskService.getUserTasks('test-user-id', 'claimed');

      expect(require('firebase/firestore').query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(), // where assignedTo
        expect.anything(), // where status
        expect.anything()  // orderBy
      );
    });
  });

  describe('getTaskStatistics', () => {
    const mockQuerySnapshot = {
      forEach: vi.fn((callback) => {
        // Create multiple mock tasks with different statuses
        const tasks = [
          {
            id: 'task1',
            data: () => ({
              ...mockContentDoc,
              features: {
                'feat:task': {
                  category: 'review',
                  status: 'unclaimed',
                  priority: 'high',
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
                }
              }
            })
          },
          {
            id: 'task2',
            data: () => ({
              ...mockContentDoc,
              features: {
                'feat:task': {
                  category: 'layout',
                  status: 'in-progress',
                  priority: 'medium',
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
                }
              }
            })
          },
          {
            id: 'task3',
            data: () => ({
              ...mockContentDoc,
              features: {
                'feat:task': {
                  category: 'review',
                  status: 'completed',
                  priority: 'low',
                  createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
                  updatedAt: Timestamp.now()
                }
              }
            })
          }
        ];

        tasks.forEach(callback);
      })
    };

    beforeEach(() => {
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue(mockQuerySnapshot);
    });

    it('should calculate task statistics correctly', async () => {
      const stats = await taskService.getTaskStatistics();

      expect(stats).toMatchObject({
        totalTasks: 3,
        unclaimedTasks: 1,
        inProgressTasks: 1,
        completedTasks: 1,
        overdueTasks: 0,
        tasksByCategory: expect.objectContaining({
          review: 2,
          layout: 1
        }),
        tasksByPriority: expect.objectContaining({
          high: 1,
          medium: 1,
          low: 1
        })
      });

      expect(stats.averageCompletionTime).toBeGreaterThan(0);
    });
  });

  describe('subscribeToUserTasks', () => {
    it('should set up real-time subscription for user tasks', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(require('firebase/firestore').onSnapshot).mockReturnValue(mockUnsubscribe);

      const unsubscribe = taskService.subscribeToUserTasks('test-user-id', mockCallback);

      expect(require('firebase/firestore').onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should filter subscription by status when provided', () => {
      const mockCallback = vi.fn();
      vi.mocked(require('firebase/firestore').onSnapshot).mockReturnValue(vi.fn());

      taskService.subscribeToUserTasks('test-user-id', mockCallback, 'claimed');

      expect(require('firebase/firestore').query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(), // where assignedTo
        expect.anything(), // where status
        expect.anything()  // orderBy
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(require('firebase/firestore').getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(
        taskService.createTask('test-content-id', 'review', 30, 'medium')
      ).rejects.toThrow('Firestore error');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create task',
        expect.objectContaining({
          contentId: 'test-content-id',
          category: 'review',
          error: 'Firestore error'
        })
      );
    });

    it('should handle missing user profile gracefully', async () => {
      mockFirestoreService.getUserProfile.mockRejectedValue(new Error('User not found'));

      await expect(
        taskService.getUserTasks('non-existent-user')
      ).resolves.toEqual([]);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get user tasks',
        expect.objectContaining({
          userId: 'non-existent-user',
          error: 'User not found'
        })
      );
    });
  });
});

