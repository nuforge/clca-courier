/**
 * Content Query Service Test Suite
 *
 * Tests for enhanced content querying with task filtering, volunteer-specific views,
 * and statistical aggregates for dashboard reporting.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { contentQueryService, type TaskContentFilters, type VolunteerTaskView } from '../../../src/services/contentQueryService';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { userUtils } from '../../../src/utils/userUtils';
import { logger } from '../../../src/utils/logger';
import type { ContentDoc } from '../../../src/types/core/content.types';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';

// Mock dependencies
vi.mock('../../../src/config/firebase.config', () => ({
  firestore: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() } as Timestamp)),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date } as Timestamp))
  }
}));

vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/utils/userUtils');
vi.mock('../../../src/utils/logger');

describe('ContentQueryService', () => {
  const mockCurrentUser: UserProfile = {
    uid: 'test-volunteer-123',
    email: 'volunteer@example.com',
    displayName: 'Test Volunteer',
    photoURL: undefined,
    role: 'contributor',
    permissions: [],
    isApproved: true,
    tags: ['skill:writing', 'skill:editing', 'language:english'],
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

  const mockContentWithTask: ContentDoc = {
    id: 'content-123',
    title: 'Test Article',
    description: 'A test article for unit testing',
    authorId: 'author-123',
    authorName: 'Test Author',
    tags: ['content-type:news', 'category:local'],
    features: {
      'feat:task': {
        category: 'review',
        estimatedTime: 30,
        status: 'unclaimed',
        priority: 'medium',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)) // 1 day from now
      }
    },
    status: 'draft',
    timestamps: {
      created: Timestamp.now(),
      updated: Timestamp.now()
    }
  };

  const mockAssignedContent: ContentDoc = {
    ...mockContentWithTask,
    id: 'content-456',
    title: 'Assigned Article',
    features: {
      'feat:task': {
        ...mockContentWithTask.features['feat:task']!,
        status: 'claimed',
        assignedTo: 'test-volunteer-123'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock firestoreService.getUserProfile
    (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(mockCurrentUser);

    // Mock userUtils functions
    (userUtils.getTagsByNamespace as MockedFunction<any>).mockReturnValue(['writing', 'editing']);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('queryTaskContent', () => {
    it('should query content with task filters successfully', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'content-123',
            data: () => mockContentWithTask
          },
          {
            id: 'content-456',
            data: () => mockAssignedContent
          }
        ]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        taskStatus: 'unclaimed',
        taskCategory: 'review'
      };

      const result = await contentQueryService.queryTaskContent(filters);

      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual(expect.objectContaining({
        id: 'content-123',
        title: 'Test Article'
      }));
      expect(result.hasMore).toBe(false);
    });

    it('should apply multiple filters correctly', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        taskStatus: ['unclaimed', 'claimed'],
        taskCategory: 'review',
        taskPriority: 'high',
        assignedTo: 'test-volunteer-123',
        contentStatus: 'draft'
      };

      await contentQueryService.queryTaskContent(filters);

      // Verify that query was called with appropriate constraints
      expect(require('firebase/firestore').query).toHaveBeenCalled();
      expect(require('firebase/firestore').where).toHaveBeenCalledWith('features.feat:task', '!=', null);
    });

    it('should handle date range filters', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const yesterday = Timestamp.fromDate(new Date(Date.now() - 86400000));
      const tomorrow = Timestamp.fromDate(new Date(Date.now() + 86400000));

      const filters: TaskContentFilters = {
        dueDateRange: {
          start: yesterday,
          end: tomorrow
        },
        createdDateRange: {
          start: yesterday
        }
      };

      await contentQueryService.queryTaskContent(filters);

      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'features.feat:task.dueDate',
        '>=',
        yesterday
      );
      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'features.feat:task.dueDate',
        '<=',
        tomorrow
      );
    });

    it('should apply post-processing filters correctly', async () => {
      const contentWithSkills = {
        ...mockContentWithTask,
        tags: ['content-type:news', 'skill:writing', 'skill:editing']
      };

      const mockSnapshot = {
        docs: [{
          id: 'content-123',
          data: () => contentWithSkills
        }]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        requiredSkills: ['skill:writing'],
        contentType: 'news'
      };

      const result = await contentQueryService.queryTaskContent(filters);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].tags).toContain('skill:writing');
    });

    it('should filter by approaching deadlines', async () => {
      const soonDueContent = {
        ...mockContentWithTask,
        features: {
          'feat:task': {
            ...mockContentWithTask.features['feat:task']!,
            dueDate: Timestamp.fromDate(new Date(Date.now() + 3600000)) // 1 hour from now
          }
        }
      };

      const mockSnapshot = {
        docs: [{
          id: 'content-123',
          data: () => soonDueContent
        }]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        approachingDeadlines: true
      };

      const result = await contentQueryService.queryTaskContent(filters);

      expect(result.content).toHaveLength(1);
    });

    it('should filter by overdue tasks', async () => {
      const overdueContent = {
        ...mockContentWithTask,
        features: {
          'feat:task': {
            ...mockContentWithTask.features['feat:task']!,
            dueDate: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
            status: 'claimed' as const
          }
        }
      };

      const mockSnapshot = {
        docs: [{
          id: 'content-123',
          data: () => overdueContent
        }]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        overdueTasks: true
      };

      const result = await contentQueryService.queryTaskContent(filters);

      expect(result.content).toHaveLength(1);
    });

    it('should handle pagination correctly', async () => {
      const mockDocs = Array(6).fill(null).map((_, i) => ({
        id: `content-${i}`,
        data: () => ({ ...mockContentWithTask, id: `content-${i}` })
      }));

      const mockSnapshot = { docs: mockDocs };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await contentQueryService.queryTaskContent(
        {},
        { field: 'createdAt', direction: 'desc' },
        { limit: 5 }
      );

      expect(result.content).toHaveLength(5);
      expect(result.hasMore).toBe(true);
      expect(result.lastDoc).toBeDefined();
    });
  });

  describe('getAvailableTasksForVolunteer', () => {
    it('should return tasks matching volunteer skills', async () => {
      const newsContent = {
        ...mockContentWithTask,
        tags: ['content-type:news']
      };

      const mockSnapshot = {
        docs: [{
          id: 'content-123',
          data: () => newsContent
        }]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await contentQueryService.getAvailableTasksForVolunteer('test-volunteer-123');

      expect(result).toHaveLength(1);
      expect(firestoreService.getUserProfile).toHaveBeenCalledWith('test-volunteer-123');
      expect(userUtils.getTagsByNamespace).toHaveBeenCalledWith(mockCurrentUser, 'skill');
    });

    it('should return empty array for volunteer with task assignments disabled', async () => {
      const userWithTasksDisabled = {
        ...mockCurrentUser,
        preferences: {
          ...mockCurrentUser.preferences,
          taskAssignments: false
        }
      };

      (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(userWithTasksDisabled);

      const result = await contentQueryService.getAvailableTasksForVolunteer('test-volunteer-123');

      expect(result).toHaveLength(0);
    });

    it('should filter by preferred categories', async () => {
      const eventContent = {
        ...mockContentWithTask,
        tags: ['content-type:event']
      };

      const newsContent = {
        ...mockContentWithTask,
        id: 'content-456',
        tags: ['content-type:news']
      };

      const mockSnapshot = {
        docs: [
          { id: 'content-123', data: () => eventContent },
          { id: 'content-456', data: () => newsContent }
        ]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await contentQueryService.getAvailableTasksForVolunteer('test-volunteer-123');

      // Should include both since user prefers 'news' and 'events'
      expect(result).toHaveLength(2);
    });

    it('should handle user profile not found', async () => {
      (firestoreService.getUserProfile as MockedFunction<any>).mockResolvedValue(null);

      await expect(
        contentQueryService.getAvailableTasksForVolunteer('nonexistent-user')
      ).rejects.toThrow('Volunteer profile not found for nonexistent-user');
    });
  });

  describe('getVolunteerTaskView', () => {
    it('should return comprehensive volunteer task view', async () => {
      // Mock different query results
      (require('firebase/firestore').getDocs)
        .mockResolvedValueOnce({ // Active tasks query
          content: [mockAssignedContent]
        })
        .mockResolvedValueOnce({ // Completed tasks query
          content: []
        })
        .mockResolvedValueOnce({ // Available tasks query
          docs: [{
            id: 'content-789',
            data: () => mockContentWithTask
          }]
        });

      const result = await contentQueryService.getVolunteerTaskView('test-volunteer-123');

      expect(result).toEqual(expect.objectContaining({
        myActiveTasks: expect.any(Array),
        myCompletedTasks: expect.any(Array),
        availableTasks: expect.any(Array),
        recommendedTasks: expect.any(Array),
        workloadSummary: expect.objectContaining({
          activeTasks: expect.any(Number),
          completedThisMonth: expect.any(Number),
          averageCompletionTime: expect.any(Number)
        })
      }));
    });

    it('should calculate workload summary correctly', async () => {
      const completedTask = {
        ...mockContentWithTask,
        features: {
          'feat:task': {
            ...mockContentWithTask.features['feat:task']!,
            status: 'completed' as const,
            assignedTo: 'test-volunteer-123',
            createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
          }
        },
        timestamps: {
          ...mockContentWithTask.timestamps,
          updated: Timestamp.fromDate(new Date(Date.now() - 3600000)) // 1 hour ago
        }
      };

      (require('firebase/firestore').getDocs)
        .mockResolvedValueOnce({ content: [mockAssignedContent] }) // Active tasks
        .mockResolvedValueOnce({ content: [completedTask] }) // Completed tasks
        .mockResolvedValueOnce({ docs: [] }); // Available tasks

      const result = await contentQueryService.getVolunteerTaskView('test-volunteer-123');

      expect(result.workloadSummary.activeTasks).toBe(1);
      expect(result.workloadSummary.completedThisMonth).toBe(1);
      expect(result.workloadSummary.averageCompletionTime).toBeGreaterThan(0);
    });

    it('should identify next deadline correctly', async () => {
      const urgentTask = {
        ...mockAssignedContent,
        features: {
          'feat:task': {
            ...mockAssignedContent.features['feat:task']!,
            dueDate: Timestamp.fromDate(new Date(Date.now() + 3600000)) // 1 hour from now
          }
        }
      };

      (require('firebase/firestore').getDocs)
        .mockResolvedValueOnce({ content: [urgentTask] }) // Active tasks
        .mockResolvedValueOnce({ content: [] }) // Completed tasks
        .mockResolvedValueOnce({ docs: [] }); // Available tasks

      const result = await contentQueryService.getVolunteerTaskView('test-volunteer-123');

      expect(result.workloadSummary.nextDeadline).toEqual(
        expect.objectContaining({
          contentId: urgentTask.id,
          title: urgentTask.title,
          dueDate: expect.any(Object)
        })
      );
    });
  });

  describe('getTaskStatistics', () => {
    it('should calculate comprehensive task statistics', async () => {
      const mockTasks = [
        mockContentWithTask,
        mockAssignedContent,
        {
          ...mockContentWithTask,
          id: 'content-789',
          features: {
            'feat:task': {
              ...mockContentWithTask.features['feat:task']!,
              status: 'completed' as const,
              assignedTo: 'volunteer-456',
              category: 'layout' as const
            }
          }
        }
      ];

      const mockSnapshot = {
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => task
        }))
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await contentQueryService.getTaskStatistics();

      expect(result.totalTasks).toBe(3);
      expect(result.tasksByStatus['unclaimed']).toBe(1);
      expect(result.tasksByStatus['claimed']).toBe(1);
      expect(result.tasksByStatus['completed']).toBe(1);
      expect(result.tasksByCategory['review']).toBe(2);
      expect(result.tasksByCategory['layout']).toBe(1);
      expect(result.volunteerWorkload['test-volunteer-123']).toEqual(
        expect.objectContaining({
          activeTasks: 1,
          completedTasks: 0
        })
      );
    });

    it('should count overdue and approaching deadline tasks', async () => {
      const overdueTask = {
        ...mockContentWithTask,
        features: {
          'feat:task': {
            ...mockContentWithTask.features['feat:task']!,
            dueDate: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
            status: 'claimed' as const
          }
        }
      };

      const approachingTask = {
        ...mockContentWithTask,
        id: 'content-456',
        features: {
          'feat:task': {
            ...mockContentWithTask.features['feat:task']!,
            dueDate: Timestamp.fromDate(new Date(Date.now() + 3600000)), // 1 hour from now
            status: 'in-progress' as const
          }
        }
      };

      const mockSnapshot = {
        docs: [
          { id: 'content-123', data: () => overdueTask },
          { id: 'content-456', data: () => approachingTask }
        ]
      };

      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const result = await contentQueryService.getTaskStatistics();

      expect(result.overdueTasks).toBe(1);
      expect(result.approachingDeadlines).toBe(1);
    });

    it('should handle date range filters in statistics', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const dateRange = {
        start: Timestamp.fromDate(new Date('2024-01-01')),
        end: Timestamp.fromDate(new Date('2024-12-31'))
      };

      await contentQueryService.getTaskStatistics(dateRange);

      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'timestamps.created',
        '>=',
        dateRange.start
      );
      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'timestamps.created',
        '<=',
        dateRange.end
      );
    });
  });

  describe('subscribeToTaskContent', () => {
    it('should set up real-time subscription for task content', () => {
      const mockUnsubscribe = vi.fn();
      const mockCallback = vi.fn();

      (require('firebase/firestore').onSnapshot).mockImplementation((query, callback) => {
        const mockSnapshot = {
          docs: [{
            id: 'content-123',
            data: () => mockContentWithTask
          }]
        };

        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = contentQueryService.subscribeToTaskContent(
        { taskStatus: 'unclaimed' },
        mockCallback,
        { limit: 10 }
      );

      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'content-123',
          title: 'Test Article'
        })
      ]);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription errors gracefully', () => {
      (require('firebase/firestore').onSnapshot).mockImplementation(() => {
        throw new Error('Subscription error');
      });

      const unsubscribe = contentQueryService.subscribeToTaskContent(
        {},
        vi.fn()
      );

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle Firestore query errors', async () => {
      (require('firebase/firestore').getDocs).mockRejectedValue(new Error('Firestore error'));

      await expect(
        contentQueryService.queryTaskContent({})
      ).rejects.toThrow('Firestore error');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to query task content',
        expect.objectContaining({
          error: 'Firestore error'
        })
      );
    });

    it('should handle user profile fetch errors gracefully', async () => {
      (firestoreService.getUserProfile as MockedFunction<any>).mockRejectedValue(
        new Error('Profile fetch error')
      );

      await expect(
        contentQueryService.getAvailableTasksForVolunteer('test-user')
      ).rejects.toThrow('Profile fetch error');
    });

    it('should return empty workload summary on calculation errors', async () => {
      (require('firebase/firestore').getDocs)
        .mockResolvedValueOnce({ content: [mockAssignedContent] }) // Active tasks
        .mockRejectedValue(new Error('Database error')); // Completed tasks fails

      const result = await contentQueryService.getVolunteerTaskView('test-volunteer-123');

      expect(result.workloadSummary).toEqual(
        expect.objectContaining({
          activeTasks: 1,
          completedThisMonth: 0,
          averageCompletionTime: 0
        })
      );
    });
  });

  describe('performance optimization', () => {
    it('should limit results appropriately for performance', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      await contentQueryService.queryTaskContent(
        {},
        { field: 'createdAt', direction: 'desc' },
        { limit: 100 }
      );

      expect(require('firebase/firestore').limit).toHaveBeenCalledWith(101); // +1 for hasMore check
    });

    it('should use appropriate indexes for complex queries', async () => {
      const mockSnapshot = { docs: [] };
      (require('firebase/firestore').getDocs).mockResolvedValue(mockSnapshot);

      const filters: TaskContentFilters = {
        taskStatus: 'claimed',
        assignedTo: 'test-user',
        taskCategory: 'review'
      };

      await contentQueryService.queryTaskContent(filters);

      // Verify appropriate where clauses for indexed queries
      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'features.feat:task.status',
        '==',
        'claimed'
      );
      expect(require('firebase/firestore').where).toHaveBeenCalledWith(
        'features.feat:task.assignedTo',
        '==',
        'test-user'
      );
    });
  });
});
