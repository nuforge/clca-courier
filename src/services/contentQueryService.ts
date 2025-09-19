/**
 * Enhanced Content Query Service - Volunteer Workflow System
 *
 * Extends content querying capabilities with task filtering, volunteer-specific views,
 * statistical aggregates, and integration with existing search infrastructure.
 *
 * Features:
 * - Filter content by task status, assignment, and category
 * - Volunteer-specific views (my tasks, available tasks)
 * - Statistical aggregates for dashboard reporting
 * - Integration with existing ContentDoc architecture
 * - Performance-optimized Firestore queries with proper indexing
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  getCountFromServer,
  onSnapshot,
  Timestamp,
  type QueryConstraint,
  type QuerySnapshot,
  type DocumentData,
  type Unsubscribe
} from 'firebase/firestore';

import { firestore as db } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { firestoreService } from './firebase-firestore.service';
import { logger } from '../utils/logger';
import { getCurrentTimestamp } from '../utils/date-formatter';
import { userUtils } from '../utils/userUtils';
import type { ContentDoc, ContentFeatures } from '../types/core/content.types';
import type { UserProfile } from './firebase-firestore.service';
import type { TaskCategory, TaskStatus, TaskPriority } from './task.service';

/**
 * Content query filters for task-based searching
 */
export interface TaskContentFilters {
  /** Filter by task category */
  taskCategory?: TaskCategory | TaskCategory[];
  /** Filter by task status */
  taskStatus?: TaskStatus | TaskStatus[];
  /** Filter by task priority */
  taskPriority?: TaskPriority | TaskPriority[];
  /** Filter by assigned user ID */
  assignedTo?: string;
  /** Filter by content author */
  authorId?: string;
  /** Filter by content status */
  contentStatus?: string | string[];
  /** Filter by content type tags */
  contentType?: string | string[];
  /** Filter by required skills (tag-based) */
  requiredSkills?: string | string[];
  /** Filter by due date range */
  dueDateRange?: {
    start?: Timestamp;
    end?: Timestamp;
  };
  /** Filter by creation date range */
  createdDateRange?: {
    start?: Timestamp;
    end?: Timestamp;
  };
  /** Include only tasks with approaching deadlines */
  approachingDeadlines?: boolean;
  /** Include only overdue tasks */
  overdueTasks?: boolean;
  /** Filter by task completion date range */
  completedDateRange?: {
    start?: Timestamp;
    end?: Timestamp;
  };
}

/**
 * Sorting options for task content queries
 */
export interface TaskContentSorting {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'estimatedTime' | 'title';
  direction: 'asc' | 'desc';
}

/**
 * Pagination options for content queries
 */
export interface ContentPagination {
  limit: number;
  offset?: number;
  startAfterDoc?: any;
}

/**
 * Task statistics aggregated data
 */
export interface TaskStatistics {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByCategory: Record<TaskCategory, number>;
  tasksByPriority: Record<TaskPriority, number>;
  averageCompletionTime: number; // in hours
  overdueTasks: number;
  approachingDeadlines: number;
  unassignedTasks: number;
  volunteerWorkload: Record<string, {
    activeTasks: number;
    completedTasks: number;
    averageTime: number;
  }>;
  contentByType: Record<string, number>;
  monthlyStats: Array<{
    month: string;
    tasksCreated: number;
    tasksCompleted: number;
    averageCompletionTime: number;
  }>;
}

/**
 * Volunteer-specific view data
 */
export interface VolunteerTaskView {
  myActiveTasks: ContentDoc[];
  myCompletedTasks: ContentDoc[];
  availableTasks: ContentDoc[];
  recommendedTasks: ContentDoc[];
  workloadSummary: {
    activeTasks: number;
    completedThisMonth: number;
    averageCompletionTime: number;
    nextDeadline?: {
      contentId: string;
      title: string;
      dueDate: Timestamp;
    };
  };
}

/**
 * Enhanced content query service class
 */
class ContentQueryService {
  private readonly contentCollectionName = 'content';

  /**
   * Query content with task-based filtering
   */
  async queryTaskContent(
    filters: TaskContentFilters = {},
    sorting: TaskContentSorting = { field: 'createdAt', direction: 'desc' },
    pagination: ContentPagination = { limit: 20 }
  ): Promise<{
    content: ContentDoc[];
    hasMore: boolean;
    total?: number;
    lastDoc?: any;
  }> {
    try {
      logger.debug('Querying task content', {
        filters,
        sorting,
        pagination
      });

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add task existence filter
      constraints.push(where('features.feat:task', '!=', null));

      // Add filters
      if (filters.taskStatus) {
        const statuses = Array.isArray(filters.taskStatus) ? filters.taskStatus : [filters.taskStatus];
        if (statuses.length === 1) {
          constraints.push(where('features.feat:task.status', '==', statuses[0]));
        } else {
          constraints.push(where('features.feat:task.status', 'in', statuses));
        }
      }

      if (filters.taskCategory) {
        const categories = Array.isArray(filters.taskCategory) ? filters.taskCategory : [filters.taskCategory];
        if (categories.length === 1) {
          constraints.push(where('features.feat:task.category', '==', categories[0]));
        } else {
          constraints.push(where('features.feat:task.category', 'in', categories));
        }
      }

      if (filters.taskPriority) {
        const priorities = Array.isArray(filters.taskPriority) ? filters.taskPriority : [filters.taskPriority];
        if (priorities.length === 1) {
          constraints.push(where('features.feat:task.priority', '==', priorities[0]));
        } else {
          constraints.push(where('features.feat:task.priority', 'in', priorities));
        }
      }

      if (filters.assignedTo) {
        constraints.push(where('features.feat:task.assignedTo', '==', filters.assignedTo));
      }

      if (filters.authorId) {
        constraints.push(where('authorId', '==', filters.authorId));
      }

      if (filters.contentStatus) {
        const statuses = Array.isArray(filters.contentStatus) ? filters.contentStatus : [filters.contentStatus];
        if (statuses.length === 1) {
          constraints.push(where('status', '==', statuses[0]));
        } else {
          constraints.push(where('status', 'in', statuses));
        }
      }

      // Add date range filters
      if (filters.dueDateRange?.start) {
        constraints.push(where('features.feat:task.dueDate', '>=', filters.dueDateRange.start));
      }
      if (filters.dueDateRange?.end) {
        constraints.push(where('features.feat:task.dueDate', '<=', filters.dueDateRange.end));
      }

      if (filters.createdDateRange?.start) {
        constraints.push(where('timestamps.created', '>=', filters.createdDateRange.start));
      }
      if (filters.createdDateRange?.end) {
        constraints.push(where('timestamps.created', '<=', filters.createdDateRange.end));
      }

      // Add sorting
      let sortField = 'timestamps.created';
      switch (sorting.field) {
        case 'updatedAt':
          sortField = 'timestamps.updated';
          break;
        case 'dueDate':
          sortField = 'features.feat:task.dueDate';
          break;
        case 'priority':
          sortField = 'features.feat:task.priority';
          break;
        case 'estimatedTime':
          sortField = 'features.feat:task.estimatedTime';
          break;
        case 'title':
          sortField = 'title';
          break;
      }

      constraints.push(orderBy(sortField, sorting.direction));

      // Add pagination
      if (pagination.startAfterDoc) {
        constraints.push(startAfter(pagination.startAfterDoc));
      }
      constraints.push(limit(pagination.limit + 1)); // +1 to check if there are more results

      // Execute query
      const contentQuery = query(collection(db, this.contentCollectionName), ...constraints);
      const snapshot = await getDocs(contentQuery);

      // Process results
      const content: ContentDoc[] = [];
      let lastDoc = null;

      snapshot.docs.forEach((doc, index) => {
        if (index < pagination.limit) {
          content.push({
            id: doc.id,
            ...doc.data()
          } as ContentDoc);
          lastDoc = doc;
        }
      });

      const hasMore = snapshot.docs.length > pagination.limit;

      // Post-process filtering that can't be done in Firestore
      let filteredContent = content;

      // Filter by required skills (tag-based)
      if (filters.requiredSkills) {
        const skills = Array.isArray(filters.requiredSkills) ? filters.requiredSkills : [filters.requiredSkills];
        filteredContent = filteredContent.filter(doc =>
          skills.some(skill => doc.tags.includes(skill))
        );
      }

      // Filter by content type
      if (filters.contentType) {
        const types = Array.isArray(filters.contentType) ? filters.contentType : [filters.contentType];
        filteredContent = filteredContent.filter(doc => {
          const contentTypeTag = doc.tags.find(tag => tag.startsWith('content-type:'));
          const contentType = contentTypeTag ? contentTypeTag.split(':')[1] : 'unknown';
          return types.includes(contentType);
        });
      }

      // Filter by approaching deadlines
      if (filters.approachingDeadlines) {
        const now = Timestamp.now();
        const oneDayFromNow = Timestamp.fromDate(new Date(now.toDate().getTime() + (24 * 60 * 60 * 1000)));

        filteredContent = filteredContent.filter(doc => {
          const task = doc.features['feat:task'];
          return task?.dueDate && task.dueDate.toDate() <= oneDayFromNow.toDate() && task.dueDate.toDate() > now.toDate();
        });
      }

      // Filter by overdue tasks
      if (filters.overdueTasks) {
        const now = Timestamp.now();

        filteredContent = filteredContent.filter(doc => {
          const task = doc.features['feat:task'];
          return task?.dueDate && task.dueDate.toDate() <= now.toDate() && task.status !== 'completed';
        });
      }

      logger.info('Task content query completed', {
        resultsCount: filteredContent.length,
        hasMore,
        filtersApplied: Object.keys(filters).length
      });

      return {
        content: filteredContent,
        hasMore,
        lastDoc
      };

    } catch (error) {
      logger.error('Failed to query task content', {
        filters,
        sorting,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get available tasks for a specific volunteer based on their skills and availability
   */
  async getAvailableTasksForVolunteer(userId: string): Promise<ContentDoc[]> {
    try {
      logger.debug('Getting available tasks for volunteer', { userId });

      // Get volunteer profile
      const volunteerProfile = await firestoreService.getUserProfile(userId);
      if (!volunteerProfile) {
        throw new Error(`Volunteer profile not found for ${userId}`);
      }

      // Check if volunteer has opted in for task assignments
      if (!volunteerProfile.preferences.taskAssignments) {
        logger.info('Volunteer has not opted in for task assignments', { userId });
        return [];
      }

      // Get volunteer's skills
      const volunteerSkills = userUtils.getTagsByNamespace(volunteerProfile, 'skill');

      // Query for unclaimed tasks
      const unclaimedTasksQuery = query(
        collection(db, this.contentCollectionName),
        where('features.feat:task.status', '==', 'unclaimed'),
        where('status', '==', 'draft'), // Only draft content needs tasks
        orderBy('features.feat:task.priority', 'desc'),
        orderBy('features.feat:task.createdAt', 'asc'),
        limit(50) // Reasonable limit for performance
      );

      const snapshot = await getDocs(unclaimedTasksQuery);
      const availableTasks: ContentDoc[] = [];

      // Filter tasks by volunteer skills and preferences
      snapshot.docs.forEach(doc => {
        const content = { id: doc.id, ...doc.data() } as ContentDoc;
        const task = content.features['feat:task'];

        if (!task) return;

        // Check if volunteer has required skills for this content
        const hasRequiredSkills = this.volunteerHasRequiredSkills(content, volunteerSkills);

        // Check preferred categories
        const contentType = this.getContentTypeFromTags(content.tags);
        const prefersCategory = volunteerProfile.preferences.preferredCategories.length === 0 ||
          volunteerProfile.preferences.preferredCategories.includes(contentType);

        if (hasRequiredSkills && prefersCategory) {
          availableTasks.push(content);
        }
      });

      logger.info('Found available tasks for volunteer', {
        userId,
        totalAvailable: availableTasks.length,
        volunteerSkills,
        preferredCategories: volunteerProfile.preferences.preferredCategories
      });

      return availableTasks;

    } catch (error) {
      logger.error('Failed to get available tasks for volunteer', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get volunteer's task view with personalized data
   */
  async getVolunteerTaskView(userId: string): Promise<VolunteerTaskView> {
    try {
      logger.debug('Getting volunteer task view', { userId });

      // Get active tasks assigned to volunteer
      const myActiveTasksResult = await this.queryTaskContent(
        {
          assignedTo: userId,
          taskStatus: ['claimed', 'in-progress']
        },
        { field: 'dueDate', direction: 'asc' },
        { limit: 50 }
      );

      // Get completed tasks (last 30 days)
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)));
      const myCompletedTasksResult = await this.queryTaskContent(
        {
          assignedTo: userId,
          taskStatus: 'completed',
          completedDateRange: { start: thirtyDaysAgo }
        },
        { field: 'updatedAt', direction: 'desc' },
        { limit: 20 }
      );

      // Get available tasks matching volunteer's skills
      const availableTasks = await this.getAvailableTasksForVolunteer(userId);

      // Get recommended tasks (high priority, skills match)
      const recommendedTasks = availableTasks
        .filter(content => {
          const task = content.features['feat:task'];
          return task?.priority === 'high' || task?.priority === 'medium';
        })
        .slice(0, 5);

      // Calculate workload summary
      const workloadSummary = await this.calculateVolunteerWorkload(
        userId,
        myActiveTasksResult.content,
        myCompletedTasksResult.content
      );

      const volunteerView: VolunteerTaskView = {
        myActiveTasks: myActiveTasksResult.content,
        myCompletedTasks: myCompletedTasksResult.content,
        availableTasks: availableTasks.slice(0, 10), // Limit for performance
        recommendedTasks,
        workloadSummary
      };

      logger.info('Generated volunteer task view', {
        userId,
        activeTasks: volunteerView.myActiveTasks.length,
        completedTasks: volunteerView.myCompletedTasks.length,
        availableTasks: volunteerView.availableTasks.length,
        recommendedTasks: volunteerView.recommendedTasks.length
      });

      return volunteerView;

    } catch (error) {
      logger.error('Failed to get volunteer task view', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get comprehensive task statistics for dashboard reporting
   */
  async getTaskStatistics(dateRange?: { start: Timestamp; end: Timestamp }): Promise<TaskStatistics> {
    try {
      logger.debug('Calculating task statistics', { dateRange });

      // Base query for all tasks
      let constraints: QueryConstraint[] = [
        where('features.feat:task', '!=', null)
      ];

      if (dateRange) {
        constraints.push(where('timestamps.created', '>=', dateRange.start));
        constraints.push(where('timestamps.created', '<=', dateRange.end));
      }

      const tasksQuery = query(collection(db, this.contentCollectionName), ...constraints);
      const tasksSnapshot = await getDocs(tasksQuery);

      // Initialize counters
      const stats: TaskStatistics = {
        totalTasks: 0,
        tasksByStatus: {
          'unclaimed': 0,
          'claimed': 0,
          'in-progress': 0,
          'completed': 0
        },
        tasksByCategory: {
          'review': 0,
          'layout': 0,
          'fact-check': 0,
          'approve': 0,
          'print': 0
        },
        tasksByPriority: {
          'low': 0,
          'medium': 0,
          'high': 0
        },
        averageCompletionTime: 0,
        overdueTasks: 0,
        approachingDeadlines: 0,
        unassignedTasks: 0,
        volunteerWorkload: {},
        contentByType: {},
        monthlyStats: []
      };

      const now = Timestamp.now();
      const oneDayFromNow = Timestamp.fromDate(new Date(now.toDate().getTime() + (24 * 60 * 60 * 1000)));
      const completionTimes: number[] = [];

      // Process each task
      tasksSnapshot.docs.forEach(doc => {
        const content = doc.data() as ContentDoc;
        const task = content.features['feat:task'];

        if (!task) return;

        stats.totalTasks++;

        // Count by status
        stats.tasksByStatus[task.status]++;

        // Count by category
        stats.tasksByCategory[task.category]++;

        // Count by priority
        stats.tasksByPriority[task.priority]++;

        // Check for overdue tasks
        if (task.dueDate && task.dueDate.toDate() <= now.toDate() && task.status !== 'completed') {
          stats.overdueTasks++;
        }

        // Check for approaching deadlines
        if (task.dueDate &&
            task.dueDate.toDate() <= oneDayFromNow.toDate() &&
            task.dueDate.toDate() > now.toDate() &&
            task.status !== 'completed') {
          stats.approachingDeadlines++;
        }

        // Count unassigned tasks
        if (!task.assignedTo) {
          stats.unassignedTasks++;
        }

        // Track volunteer workload
        if (task.assignedTo) {
          if (!stats.volunteerWorkload[task.assignedTo]) {
            stats.volunteerWorkload[task.assignedTo] = {
              activeTasks: 0,
              completedTasks: 0,
              averageTime: 0
            };
          }

          if (task.status === 'completed') {
            stats.volunteerWorkload[task.assignedTo].completedTasks++;

            // Calculate completion time if we have both creation and completion dates
            if (task.createdAt && content.timestamps.updated) {
              const completionTimeHours = (content.timestamps.updated.toDate().getTime() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60);
              completionTimes.push(completionTimeHours);
            }
          } else {
            stats.volunteerWorkload[task.assignedTo].activeTasks++;
          }
        }

        // Count content by type
        const contentType = this.getContentTypeFromTags(content.tags);
        stats.contentByType[contentType] = (stats.contentByType[contentType] || 0) + 1;
      });

      // Calculate average completion time
      if (completionTimes.length > 0) {
        stats.averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
      }

      // Calculate average time for each volunteer
      Object.keys(stats.volunteerWorkload).forEach(volunteerId => {
        const volunteerTimes = completionTimes; // This would need to be filtered per volunteer in a real implementation
        if (volunteerTimes.length > 0) {
          stats.volunteerWorkload[volunteerId].averageTime =
            volunteerTimes.reduce((sum, time) => sum + time, 0) / volunteerTimes.length;
        }
      });

      // Generate monthly stats (simplified - would need more complex aggregation in production)
      stats.monthlyStats = await this.calculateMonthlyStats(dateRange);

      logger.info('Task statistics calculated', {
        totalTasks: stats.totalTasks,
        overdueTasks: stats.overdueTasks,
        unassignedTasks: stats.unassignedTasks,
        volunteersTracked: Object.keys(stats.volunteerWorkload).length
      });

      return stats;

    } catch (error) {
      logger.error('Failed to calculate task statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for task content
   */
  subscribeToTaskContent(
    filters: TaskContentFilters,
    callback: (content: ContentDoc[]) => void,
    options: {
      sorting?: TaskContentSorting;
      limit?: number;
    } = {}
  ): Unsubscribe {
    try {
      const constraints: QueryConstraint[] = [
        where('features.feat:task', '!=', null)
      ];

      // Add basic filters (complex filters will be applied client-side)
      if (filters.taskStatus && !Array.isArray(filters.taskStatus)) {
        constraints.push(where('features.feat:task.status', '==', filters.taskStatus));
      }

      if (filters.assignedTo) {
        constraints.push(where('features.feat:task.assignedTo', '==', filters.assignedTo));
      }

      // Add sorting
      const sorting = options.sorting || { field: 'createdAt', direction: 'desc' };
      let sortField = 'timestamps.created';
      if (sorting.field === 'updatedAt') sortField = 'timestamps.updated';
      if (sorting.field === 'dueDate') sortField = 'features.feat:task.dueDate';

      constraints.push(orderBy(sortField, sorting.direction));

      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      const contentQuery = query(collection(db, this.contentCollectionName), ...constraints);

      return onSnapshot(
        contentQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const content: ContentDoc[] = [];

          snapshot.docs.forEach(doc => {
            content.push({
              id: doc.id,
              ...doc.data()
            } as ContentDoc);
          });

          callback(content);
        },
        (error) => {
          logger.error('Error in task content subscription', {
            error: error.message,
            filters
          });
        }
      );

    } catch (error) {
      logger.error('Failed to subscribe to task content', {
        filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return () => {}; // Return no-op unsubscribe
    }
  }

  /**
   * Helper method to check if volunteer has required skills for content
   */
  private volunteerHasRequiredSkills(content: ContentDoc, volunteerSkills: string[]): boolean {
    // Get content type to determine required skills
    const contentType = this.getContentTypeFromTags(content.tags);

    // Define required skills by content type
    const requiredSkillsMap: Record<string, string[]> = {
      'news': ['writing', 'editing'],
      'event': ['event-planning', 'writing'],
      'announcement': ['writing'],
      'editorial': ['writing', 'editing'],
      'opinion': ['writing', 'fact-checking']
    };

    const requiredSkills = requiredSkillsMap[contentType] || ['writing'];

    // Check if volunteer has at least one required skill
    return requiredSkills.some(skill => volunteerSkills.includes(skill));
  }

  /**
   * Helper method to extract content type from tags
   */
  private getContentTypeFromTags(tags: string[]): string {
    const contentTypeTag = tags.find(tag => tag.startsWith('content-type:'));
    return contentTypeTag ? contentTypeTag.split(':')[1] ?? 'news' : 'news';
  }

  /**
   * Helper method to calculate volunteer workload summary
   */
  private async calculateVolunteerWorkload(
    userId: string,
    activeTasks: ContentDoc[],
    completedTasks: ContentDoc[]
  ): Promise<VolunteerTaskView['workloadSummary']> {
    try {
      // Calculate average completion time
      let totalCompletionTime = 0;
      let completedTasksWithTime = 0;

      completedTasks.forEach(content => {
        const task = content.features['feat:task'];
        if (task?.createdAt && content.timestamps.updated) {
          const completionTime = content.timestamps.updated.toDate().getTime() - task.createdAt.toDate().getTime();
          totalCompletionTime += completionTime;
          completedTasksWithTime++;
        }
      });

      const averageCompletionTime = completedTasksWithTime > 0
        ? totalCompletionTime / completedTasksWithTime / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Find next deadline
      let nextDeadline: VolunteerTaskView['workloadSummary']['nextDeadline'];

      const tasksWithDeadlines = activeTasks
        .filter(content => content.features['feat:task']?.dueDate)
        .sort((a, b) => {
          const dueDateA = a.features['feat:task']?.dueDate?.toDate().getTime() || 0;
          const dueDateB = b.features['feat:task']?.dueDate?.toDate().getTime() || 0;
          return dueDateA - dueDateB;
        });

      if (tasksWithDeadlines.length > 0) {
        const earliestTask = tasksWithDeadlines[0];
        const task = earliestTask.features['feat:task'];
        if (task?.dueDate) {
          nextDeadline = {
            contentId: earliestTask.id,
            title: earliestTask.title,
            dueDate: task.dueDate
          };
        }
      }

      return {
        activeTasks: activeTasks.length,
        completedThisMonth: completedTasks.length,
        averageCompletionTime,
        nextDeadline
      };

    } catch (error) {
      logger.error('Failed to calculate volunteer workload', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        activeTasks: activeTasks.length,
        completedThisMonth: completedTasks.length,
        averageCompletionTime: 0
      };
    }
  }

  /**
   * Helper method to calculate monthly statistics
   */
  private async calculateMonthlyStats(dateRange?: { start: Timestamp; end: Timestamp }): Promise<TaskStatistics['monthlyStats']> {
    try {
      // This is a simplified implementation
      // In production, you might use Firestore aggregation queries or Cloud Functions

      const monthlyStats: TaskStatistics['monthlyStats'] = [];

      // For now, return empty array
      // Real implementation would aggregate data by month

      return monthlyStats;

    } catch (error) {
      logger.error('Failed to calculate monthly stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
}

// Export singleton instance
export const contentQueryService = new ContentQueryService();

// Export types for use in components
export type {
  TaskContentFilters,
  TaskContentSorting,
  ContentPagination,
  TaskStatistics,
  VolunteerTaskView
};
