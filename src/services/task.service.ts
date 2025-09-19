/**
 * Task Management Service - Volunteer Workflow System
 *
 * Manages editorial workflow tasks with skill-based assignment and time tracking.
 * Integrates with the existing ContentDoc model and UserProfile system.
 */

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';

import { firestore as db } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { firebaseContentService } from './firebase-content.service';
import { firestoreService } from './firebase-firestore.service';
import { logger } from '../utils/logger';
import { getCurrentTimestamp, toISOString } from '../utils/date-formatter';
import { userUtils } from '../utils/userUtils';
import type { ContentDoc, ContentFeatures } from '../types/core/content.types';
import type { UserProfile } from './firebase-firestore.service';

/**
 * Task category definitions for the volunteer workflow system
 */
export type TaskCategory = 'review' | 'layout' | 'fact-check' | 'approve' | 'print';

/**
 * Task status definitions for workflow tracking
 */
export type TaskStatus = 'unclaimed' | 'claimed' | 'in-progress' | 'completed';

/**
 * Task priority levels for scheduling
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task assignment method tracking
 */
export type TaskAssignmentMethod = 'automatic' | 'manual' | 'self-claimed';

/**
 * Extended task information with assignment details
 */
export interface TaskDetails {
  taskId: string;
  contentId: string;
  contentTitle: string;
  contentAuthor: string;
  task: NonNullable<ContentFeatures['feat:task']>;
  assignedUserName?: string;
  assignedUserEmail?: string;
  timeRemaining?: number; // minutes until due date
  isOverdue?: boolean;
}

/**
 * Task assignment criteria for automatic assignment
 */
export interface TaskAssignmentCriteria {
  requiredSkills: string[];
  preferredAvailability: ('regular' | 'occasional' | 'on-call')[];
  maxWorkload?: number; // maximum concurrent tasks
  priority: TaskPriority;
  dueDate?: Timestamp;
}

/**
 * Task statistics for admin dashboard
 */
export interface TaskStatistics {
  totalTasks: number;
  unclaimedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // minutes
  tasksByCategory: Record<TaskCategory, number>;
  tasksByPriority: Record<TaskPriority, number>;
}

/**
 * Volunteer workload information
 */
export interface VolunteerWorkload {
  userId: string;
  userName: string;
  userEmail: string;
  currentTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  skills: string[];
  availability: string;
  lastActivity?: Timestamp;
}

class TaskService {
  private readonly contentCollectionName = 'content';

  /**
   * Create a new editorial task for content
   */
  async createTask(
    contentId: string,
    category: TaskCategory,
    estimatedTime: number,
    priority: TaskPriority = 'medium',
    instructions?: string,
    dueDate?: Timestamp,
    assignTo?: string
  ): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to create tasks');
      }

      logger.debug('Creating task for content', {
        contentId,
        category,
        estimatedTime,
        priority,
        hasInstructions: !!instructions,
        hasDueDate: !!dueDate,
        assignTo
      });

      // Get content document
      const contentRef = doc(db, this.contentCollectionName, contentId);
      const contentDoc = await getDoc(contentRef);

      if (!contentDoc.exists()) {
        throw new Error(`Content document ${contentId} not found`);
      }

      const content = contentDoc.data() as ContentDoc;

      // Check if task already exists
      if (content.features['feat:task']) {
        throw new Error(`Task already exists for content ${contentId}`);
      }

      const now = serverTimestamp() as Timestamp;

      // Create task feature
      const taskFeature: NonNullable<ContentFeatures['feat:task']> = {
        category,
        estimatedTime,
        status: assignTo ? 'claimed' : 'unclaimed',
        priority,
        createdAt: now,
        updatedAt: now
      };

      if (instructions) {
        taskFeature.instructions = instructions;
      }

      if (dueDate) {
        taskFeature.dueDate = dueDate;
      }

      if (assignTo) {
        taskFeature.assignedTo = assignTo;
      }

      // Update content with task feature
      await updateDoc(contentRef, {
        'features.feat:task': taskFeature,
        'timestamps.updated': now
      });

      logger.info('Task created successfully', {
        contentId,
        category,
        priority,
        assignedTo: assignTo || 'unassigned'
      });

    } catch (error) {
      logger.error('Failed to create task', {
        contentId,
        category,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Assign task to a volunteer
   */
  async assignTask(
    contentId: string,
    userId: string,
    method: TaskAssignmentMethod = 'manual'
  ): Promise<void> {
    try {
      logger.debug('Assigning task to volunteer', {
        contentId,
        userId,
        method
      });

      // Verify user exists and is available
      const userProfile = await firestoreService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error(`User profile not found for ${userId}`);
      }

      if (!userProfile.preferences.taskAssignments) {
        throw new Error(`User ${userId} has not opted in for task assignments`);
      }

      // Get content and verify task exists
      const contentRef = doc(db, this.contentCollectionName, contentId);
      const contentDoc = await getDoc(contentRef);

      if (!contentDoc.exists()) {
        throw new Error(`Content document ${contentId} not found`);
      }

      const content = contentDoc.data() as ContentDoc;
      const task = content.features['feat:task'];

      if (!task) {
        throw new Error(`No task found for content ${contentId}`);
      }

      if (task.status === 'completed') {
        throw new Error(`Task for content ${contentId} is already completed`);
      }

      if (task.assignedTo && task.assignedTo !== userId) {
        throw new Error(`Task for content ${contentId} is already assigned to another user`);
      }

      // Update task assignment
      await updateDoc(contentRef, {
        'features.feat:task.assignedTo': userId,
        'features.feat:task.status': 'claimed',
        'features.feat:task.updatedAt': serverTimestamp(),
        'timestamps.updated': serverTimestamp()
      });

      logger.info('Task assigned successfully', {
        contentId,
        userId,
        userName: userProfile.displayName,
        method
      });

    } catch (error) {
      logger.error('Failed to assign task', {
        contentId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    contentId: string,
    status: TaskStatus,
    userId?: string
  ): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update task status');
      }

      logger.debug('Updating task status', {
        contentId,
        status,
        userId: userId || currentUser.uid
      });

      const contentRef = doc(db, this.contentCollectionName, contentId);
      const contentDoc = await getDoc(contentRef);

      if (!contentDoc.exists()) {
        throw new Error(`Content document ${contentId} not found`);
      }

      const content = contentDoc.data() as ContentDoc;
      const task = content.features['feat:task'];

      if (!task) {
        throw new Error(`No task found for content ${contentId}`);
      }

      // Validate status transition
      this.validateStatusTransition(task.status, status);

      // Validate user permissions
      const updateUserId = userId || currentUser.uid;
      if (task.assignedTo && task.assignedTo !== updateUserId) {
        // Check if user has admin permissions
        const userProfile = await firestoreService.getUserProfile(currentUser.uid);
        if (!userProfile || !['moderator', 'administrator'].includes(userProfile.role)) {
          throw new Error('Only assigned user or administrators can update task status');
        }
      }

      // Update task status
      const updateData: Record<string, unknown> = {
        'features.feat:task.status': status,
        'features.feat:task.updatedAt': serverTimestamp(),
        'timestamps.updated': serverTimestamp()
      };

      // If claiming task, assign to current user
      if (status === 'claimed' && !task.assignedTo) {
        updateData['features.feat:task.assignedTo'] = updateUserId;
      }

      await updateDoc(contentRef, updateData);

      logger.info('Task status updated successfully', {
        contentId,
        status,
        userId: updateUserId
      });

    } catch (error) {
      logger.error('Failed to update task status', {
        contentId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getUserTasks(userId: string, status?: TaskStatus): Promise<TaskDetails[]> {
    try {
      logger.debug('Getting user tasks', { userId, status });

      let q = query(
        collection(db, this.contentCollectionName),
        where('features.feat:task.assignedTo', '==', userId),
        orderBy('features.feat:task.createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, this.contentCollectionName),
          where('features.feat:task.assignedTo', '==', userId),
          where('features.feat:task.status', '==', status),
          orderBy('features.feat:task.createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const tasks: TaskDetails[] = [];

      querySnapshot.forEach((doc) => {
        const content = doc.data() as ContentDoc;
        const task = content.features['feat:task'];

        if (task) {
          tasks.push(this.createTaskDetails(doc.id, content, task));
        }
      });

      logger.debug('Retrieved user tasks', {
        userId,
        status,
        count: tasks.length
      });

      return tasks;

    } catch (error) {
      logger.error('Failed to get user tasks', {
        userId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get all tasks by status for admin view
   */
  async getTasksByStatus(status?: TaskStatus, limit_count?: number): Promise<TaskDetails[]> {
    try {
      logger.debug('Getting tasks by status', { status, limit: limit_count });

      let q = query(
        collection(db, this.contentCollectionName),
        where('features.feat:task', '!=', null),
        orderBy('features.feat:task.priority', 'desc'),
        orderBy('features.feat:task.createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, this.contentCollectionName),
          where('features.feat:task.status', '==', status),
          orderBy('features.feat:task.createdAt', 'desc')
        );
      }

      if (limit_count) {
        q = query(q, limit(limit_count));
      }

      const querySnapshot = await getDocs(q);
      const tasks: TaskDetails[] = [];

      // Get user profiles for assigned users
      const userProfiles = new Map<string, UserProfile>();

      for (const doc of querySnapshot.docs) {
        const content = doc.data() as ContentDoc;
        const task = content.features['feat:task'];

        if (task) {
          // Get assigned user info if needed
          if (task.assignedTo && !userProfiles.has(task.assignedTo)) {
            try {
              const userProfile = await firestoreService.getUserProfile(task.assignedTo);
              if (userProfile) {
                userProfiles.set(task.assignedTo, userProfile);
              }
            } catch (error) {
              logger.warn('Failed to get user profile for task', {
                userId: task.assignedTo,
                contentId: doc.id
              });
            }
          }

          const taskDetails = this.createTaskDetails(doc.id, content, task);

          if (task.assignedTo && userProfiles.has(task.assignedTo)) {
            const user = userProfiles.get(task.assignedTo)!;
            taskDetails.assignedUserName = user.displayName;
            taskDetails.assignedUserEmail = user.email;
          }

          tasks.push(taskDetails);
        }
      }

      logger.debug('Retrieved tasks by status', {
        status,
        count: tasks.length
      });

      return tasks;

    } catch (error) {
      logger.error('Failed to get tasks by status', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get task statistics for admin dashboard
   */
  async getTaskStatistics(): Promise<TaskStatistics> {
    try {
      logger.debug('Calculating task statistics');

      const q = query(
        collection(db, this.contentCollectionName),
        where('features.feat:task', '!=', null)
      );

      const querySnapshot = await getDocs(q);

      const stats: TaskStatistics = {
        totalTasks: 0,
        unclaimedTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        averageCompletionTime: 0,
        tasksByCategory: {
          review: 0,
          layout: 0,
          'fact-check': 0,
          approve: 0,
          print: 0
        },
        tasksByPriority: {
          low: 0,
          medium: 0,
          high: 0
        }
      };

      const completionTimes: number[] = [];
      const now = getCurrentTimestamp();

      querySnapshot.forEach((doc) => {
        const content = doc.data() as ContentDoc;
        const task = content.features['feat:task'];

        if (task) {
          stats.totalTasks++;
          stats.tasksByCategory[task.category]++;
          stats.tasksByPriority[task.priority]++;

          switch (task.status) {
            case 'unclaimed':
              stats.unclaimedTasks++;
              break;
            case 'claimed':
            case 'in-progress':
              stats.inProgressTasks++;
              break;
            case 'completed':
              stats.completedTasks++;
              // Calculate completion time
              if (task.createdAt && task.updatedAt) {
                const createdTime = task.createdAt.toMillis();
                const completedTime = task.updatedAt.toMillis();
                completionTimes.push((completedTime - createdTime) / (1000 * 60)); // minutes
              }
              break;
          }

          // Check if overdue
          if (task.dueDate && task.status !== 'completed') {
            if (task.dueDate.toMillis() < now) {
              stats.overdueTasks++;
            }
          }
        }
      });

      // Calculate average completion time
      if (completionTimes.length > 0) {
        stats.averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      }

      logger.debug('Task statistics calculated', stats);

      return stats;

    } catch (error) {
      logger.error('Failed to calculate task statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get volunteer workloads for admin dashboard
   */
  async getVolunteerWorkloads(): Promise<VolunteerWorkload[]> {
    try {
      logger.debug('Getting volunteer workloads');

      // Get all user profiles with task assignments enabled
      const userProfiles = await firestoreService.getUserProfiles();
      const volunteers = userProfiles.filter(user =>
        user.preferences?.taskAssignments &&
        user.tags && user.tags.length > 0
      );

      const workloads: VolunteerWorkload[] = [];

      for (const volunteer of volunteers) {
        const currentTasks = await this.getUserTasks(volunteer.uid, 'claimed');
        const inProgressTasks = await this.getUserTasks(volunteer.uid, 'in-progress');
        const completedTasks = await this.getUserTasks(volunteer.uid, 'completed');

        const workload: VolunteerWorkload = {
          userId: volunteer.uid,
          userName: volunteer.displayName,
          userEmail: volunteer.email,
          currentTasks: currentTasks.length + inProgressTasks.length,
          completedTasks: completedTasks.length,
          averageCompletionTime: 0, // Would need historical data to calculate
          skills: userUtils.getTagsByNamespace(volunteer, 'skill'),
          availability: volunteer.availability
        };

        workloads.push(workload);
      }

      logger.debug('Retrieved volunteer workloads', {
        count: workloads.length
      });

      return workloads;

    } catch (error) {
      logger.error('Failed to get volunteer workloads', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to real-time task updates
   */
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: TaskDetails[]) => void,
    status?: TaskStatus
  ): Unsubscribe {
    try {
      logger.debug('Subscribing to user tasks', { userId, status });

      let q = query(
        collection(db, this.contentCollectionName),
        where('features.feat:task.assignedTo', '==', userId),
        orderBy('features.feat:task.createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, this.contentCollectionName),
          where('features.feat:task.assignedTo', '==', userId),
          where('features.feat:task.status', '==', status),
          orderBy('features.feat:task.createdAt', 'desc')
        );
      }

      return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const tasks: TaskDetails[] = [];

        querySnapshot.forEach((doc) => {
          const content = doc.data() as ContentDoc;
          const task = content.features['feat:task'];

          if (task) {
            tasks.push(this.createTaskDetails(doc.id, content, task));
          }
        });

        callback(tasks);
      });

    } catch (error) {
      logger.error('Failed to subscribe to user tasks', {
        userId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: TaskStatus, newStatus: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      'unclaimed': ['claimed'],
      'claimed': ['in-progress', 'unclaimed', 'completed'],
      'in-progress': ['completed', 'claimed'],
      'completed': [] // Completed tasks cannot be changed
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Create TaskDetails object from content and task data
   */
  private createTaskDetails(
    contentId: string,
    content: ContentDoc,
    task: NonNullable<ContentFeatures['feat:task']>
  ): TaskDetails {
    const details: TaskDetails = {
      taskId: contentId, // Using content ID as task ID since task is a feature
      contentId,
      contentTitle: content.title,
      contentAuthor: content.authorName,
      task
    };

    // Calculate time remaining if due date exists
    if (task.dueDate) {
      const now = getCurrentTimestamp();
      const dueTime = task.dueDate.toMillis();
      details.timeRemaining = Math.max(0, Math.round((dueTime - now) / (1000 * 60))); // minutes
      details.isOverdue = dueTime < now;
    }

    return details;
  }
}

// Export singleton instance
export const taskService = new TaskService();

