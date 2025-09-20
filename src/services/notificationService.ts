/**
 * Enhanced Notification Service - Volunteer Workflow System
 *
 * Extends the existing notification system to support task-specific notifications,
 * email alerts, in-app notifications, and notification history management.
 *
 * Features:
 * - Task-specific notification types (assignment, completion, deadline)
 * - Multiple notification channels (in-app, email)
 * - User preference respect (from UserProfile)
 * - Deep links to relevant tasks/content
 * - Notification history with read/unread status
 * - Real-time updates via Firestore listeners
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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
import { httpsCallable } from 'firebase/functions';

import { firestore as db, firebaseFunctions } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { firestoreService } from './firebase-firestore.service';
import { logger } from '../utils/logger';
import { getCurrentTimestamp, toISOString } from '../utils/date-formatter';
import type { UserProfile } from './firebase-firestore.service';

/**
 * Notification types for the volunteer workflow system
 */
export type NotificationType =
  | 'task_assigned'        // Task assigned to volunteer
  | 'task_reassigned'      // Task reassigned from one volunteer to another
  | 'task_completed'       // Task marked as completed
  | 'task_claimed'         // Someone claimed an available task
  | 'task_unclaimed'       // Task was unclaimed and is available again
  | 'deadline_approaching' // Task deadline is approaching (24h warning)
  | 'task_overdue'         // Task is past its deadline
  | 'task_escalated'       // Task escalated to administrators
  | 'tasks_reassigned'     // Multiple tasks reassigned due to availability change
  | 'content_published'    // Content was published after task completion
  | 'system_announcement'  // General system announcements
  | 'welcome'              // Welcome message for new volunteers
  | 'skill_request';       // Request for volunteers with specific skills

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Notification channels
 */
export type NotificationChannel = 'in-app' | 'email' | 'push';

/**
 * Base notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  channels: NotificationChannel[];
  deepLink?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
  expiresAt?: Timestamp;
  metadata: {
    source: 'system' | 'user' | 'automation';
    version: string;
    relatedContentId?: string;
    relatedTaskId?: string;
  };
}

/**
 * Notification template for consistent messaging
 */
interface NotificationTemplate {
  title: (data: Record<string, any>) => string;
  message: (data: Record<string, any>) => string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  deepLink?: (data: Record<string, any>) => string;
  emailTemplate?: string;
}

/**
 * Pre-defined notification templates
 */
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  task_assigned: {
    title: (data) => `New Task Assigned: ${data.taskCategory}`,
    message: (data) => `You've been assigned a ${data.taskCategory} task for "${data.contentTitle}". Due: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No deadline'}`,
    priority: 'medium',
    channels: ['in-app', 'email'],
    deepLink: (data) => `/volunteer/tasks?highlight=${data.contentId}`,
    emailTemplate: 'task_assignment'
  },

  task_reassigned: {
    title: (data) => `Task Reassigned: ${data.taskCategory}`,
    message: (data) => `You've been assigned a ${data.taskCategory} task for "${data.contentTitle}" (reassigned from another volunteer). Reason: ${data.reason || 'Volunteer unavailable'}`,
    priority: 'medium',
    channels: ['in-app', 'email'],
    deepLink: (data) => `/volunteer/tasks?highlight=${data.contentId}`,
    emailTemplate: 'task_reassignment'
  },

  task_completed: {
    title: () => 'Task Completed Successfully',
    message: (data) => `Your ${data.taskCategory} task for "${data.contentTitle}" has been marked as completed. Thank you for your contribution!`,
    priority: 'low',
    channels: ['in-app'],
    deepLink: (data) => `/content/${data.contentId}`
  },

  task_claimed: {
    title: () => 'Task Claimed',
    message: (data) => `The ${data.taskCategory} task for "${data.contentTitle}" has been claimed by ${data.volunteerName || 'another volunteer'}.`,
    priority: 'low',
    channels: ['in-app'],
    deepLink: (data) => `/admin/tasks?filter=claimed`
  },

  task_unclaimed: {
    title: () => 'Task Available',
    message: (data) => `A ${data.taskCategory} task for "${data.contentTitle}" is now available for assignment. Required skills: ${data.requiredSkills?.join(', ') || 'Any'}`,
    priority: 'medium',
    channels: ['in-app'],
    deepLink: (data) => `/volunteer/available-tasks?highlight=${data.contentId}`
  },

  deadline_approaching: {
    title: () => 'Task Deadline Approaching',
    message: (data) => `Your ${data.taskCategory} task for "${data.contentTitle}" is due in ${data.hoursRemaining || 24} hours. Please complete or request an extension.`,
    priority: 'high',
    channels: ['in-app', 'email'],
    deepLink: (data) => `/volunteer/tasks?highlight=${data.contentId}`,
    emailTemplate: 'deadline_reminder'
  },

  task_overdue: {
    title: () => 'Task Overdue',
    message: (data) => `Your ${data.taskCategory} task for "${data.contentTitle}" is ${data.hoursOverdue || 0} hours overdue. Please complete immediately or contact an administrator.`,
    priority: 'urgent',
    channels: ['in-app', 'email'],
    deepLink: (data) => `/volunteer/tasks?highlight=${data.contentId}`,
    emailTemplate: 'task_overdue'
  },

  task_escalated: {
    title: () => 'Task Escalation Required',
    message: (data) => `Task ${data.taskCategory} for "${data.contentTitle}" assigned to ${data.assignedToName || 'volunteer'} is ${data.hoursOverdue || 0} hours overdue and requires administrator attention.`,
    priority: 'urgent',
    channels: ['in-app', 'email'],
    deepLink: (data) => `/admin/tasks?filter=overdue&highlight=${data.contentId}`,
    emailTemplate: 'task_escalation'
  },

  tasks_reassigned: {
    title: () => 'Tasks Reassigned',
    message: (data) => `${data.taskCount || 0} of your tasks have been reassigned due to availability changes. Reason: ${data.reason || 'Availability changed'}`,
    priority: 'medium',
    channels: ['in-app', 'email'],
    deepLink: () => `/volunteer/tasks?filter=history`,
    emailTemplate: 'bulk_reassignment'
  },

  content_published: {
    title: () => 'Your Content Published',
    message: (data) => `"${data.contentTitle}" has been published! Thanks to volunteer ${data.reviewerName || 'reviewers'} for completing the editorial tasks.`,
    priority: 'low',
    channels: ['in-app'],
    deepLink: (data) => `/content/${data.contentId}`
  },

  system_announcement: {
    title: (data) => data.title || 'System Announcement',
    message: (data) => data.message || 'Please check the volunteer dashboard for updates.',
    priority: 'medium',
    channels: ['in-app'],
    deepLink: (data) => data.deepLink || '/volunteer/dashboard'
  },

  welcome: {
    title: () => 'Welcome to the Volunteer Program!',
    message: (data) => `Welcome ${data.displayName || 'volunteer'}! Thanks for joining our editorial team. Check your dashboard to see available tasks matching your skills.`,
    priority: 'low',
    channels: ['in-app', 'email'],
    deepLink: () => '/volunteer/dashboard',
    emailTemplate: 'volunteer_welcome'
  },

  skill_request: {
    title: () => 'Your Skills Needed',
    message: (data) => `We have content waiting for volunteers with your skills (${data.requiredSkills?.join(', ') || 'your expertise'}). Multiple tasks available!`,
    priority: 'medium',
    channels: ['in-app'],
    deepLink: () => '/volunteer/available-tasks?filter=matching-skills'
  }
};

/**
 * Notification service class
 */
class NotificationService {
  private readonly collectionName = 'notifications';
  private unsubscribers: Map<string, Unsubscribe> = new Map();

  /**
   * Send a notification to a user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any> = {},
    options: {
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      expiresInDays?: number;
      skipIfExists?: boolean;
    } = {}
  ): Promise<string> {
    try {
      logger.debug('Sending notification', {
        userId,
        type,
        data,
        options
      });

      // Get user profile to check notification preferences
      const userProfile = await firestoreService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error(`User profile not found for ${userId}`);
      }

      // Get notification template
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Check if user wants this type of notification
      const allowedChannels = this.filterChannelsByPreferences(
        options.channels || template.channels,
        userProfile.preferences
      );

      if (allowedChannels.length === 0) {
        logger.info('User has disabled all notification channels for this type', {
          userId,
          type,
          userPreferences: userProfile.preferences
        });
        return 'skipped';
      }

      // Check if we should skip duplicate notifications
      if (options.skipIfExists) {
        const existingNotification = await this.findExistingNotification(userId, type, data);
        if (existingNotification) {
          logger.info('Skipping duplicate notification', {
            userId,
            type,
            existingId: existingNotification.id
          });
          return existingNotification.id;
        }
      }

      // Generate notification content
      const title = template.title(data);
      const message = template.message(data);
      const deepLink = template.deepLink ? template.deepLink(data) : undefined;

      // Calculate expiration date
      const expiresAt = options.expiresInDays
        ? Timestamp.fromDate(new Date(Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)))
        : Timestamp.fromDate(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))); // Default 30 days

      // Create notification document
      const notification: Omit<Notification, 'id'> = {
        userId,
        type,
        priority: options.priority || template.priority,
        title,
        message,
        data,
        read: false,
        channels: allowedChannels,
        ...(deepLink && { deepLink }),
        createdAt: serverTimestamp() as Timestamp,
        expiresAt,
        metadata: {
          source: 'automation',
          version: '1.0',
          relatedContentId: data.contentId,
          relatedTaskId: data.taskId
        }
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), notification);

      logger.info('Notification sent successfully', {
        id: docRef.id,
        userId,
        type,
        title,
        channels: allowedChannels
      });

      // Send via additional channels if configured
      await this.sendViaChannels(docRef.id, notification, userProfile);

      return docRef.id;

    } catch (error) {
      logger.error('Failed to send notification', {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limitCount?: number;
      afterTimestamp?: Timestamp;
    } = {}
  ): Promise<Notification[]> {
    try {
      let notificationQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (options.unreadOnly) {
        notificationQuery = query(notificationQuery, where('read', '==', false));
      }

      if (options.limitCount) {
        notificationQuery = query(notificationQuery, limit(options.limitCount));
      }

      const snapshot = await getDocs(notificationQuery);
      const notifications: Notification[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data
        } as Notification);
      });

      logger.debug('Retrieved user notifications', {
        userId,
        count: notifications.length,
        unreadOnly: options.unreadOnly
      });

      return notifications;

    } catch (error) {
      logger.error('Failed to get user notifications', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);

      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });

      logger.debug('Marked notification as read', {
        notificationId,
        userId
      });

    } catch (error) {
      logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);

      logger.info('Marked all notifications as read', {
        userId,
        count: snapshot.size
      });

      return snapshot.size;

    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await deleteDoc(notificationRef);

      logger.debug('Deleted notification', {
        notificationId,
        userId
      });

    } catch (error) {
      logger.error('Failed to delete notification', {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      return snapshot.size;

    } catch (error) {
      logger.error('Failed to get unread count', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Subscribe to real-time notification updates for a user
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    options: {
      unreadOnly?: boolean;
      limitCount?: number;
    } = {}
  ): Unsubscribe {
    try {
      let notificationQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (options.unreadOnly) {
        notificationQuery = query(notificationQuery, where('read', '==', false));
      }

      if (options.limitCount) {
        notificationQuery = query(notificationQuery, limit(options.limitCount));
      }

      const unsubscribe = onSnapshot(
        notificationQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const notifications: Notification[] = [];

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              ...data
            } as Notification);
          });

          callback(notifications);
        },
        (error) => {
          logger.error('Error in notification subscription', {
            userId,
            error: error.message
          });
        }
      );

      // Store unsubscriber for cleanup
      const subscriptionKey = `${userId}_${options.unreadOnly ? 'unread' : 'all'}`;
      this.unsubscribers.set(subscriptionKey, unsubscribe);

      logger.debug('Subscribed to user notifications', {
        userId,
        options
      });

      return unsubscribe;

    } catch (error) {
      logger.error('Failed to subscribe to notifications', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const now = Timestamp.now();
      const expiredQuery = query(
        collection(db, this.collectionName),
        where('expiresAt', '<=', now)
      );

      const snapshot = await getDocs(expiredQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all(deletePromises);

      logger.info('Cleaned up expired notifications', {
        count: snapshot.size
      });

      return snapshot.size;

    } catch (error) {
      logger.error('Failed to cleanup expired notifications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Send system-wide announcement to all volunteers
   */
  async sendSystemAnnouncement(
    announcement: {
      title: string;
      message: string;
      priority?: NotificationPriority;
      targetRoles?: string[];
      deepLink?: string;
    }
  ): Promise<number> {
    try {
      // Get target users
      let userQuery = query(collection(db, 'userProfiles'));

      if (announcement.targetRoles && announcement.targetRoles.length > 0) {
        userQuery = query(userQuery, where('role', 'in', announcement.targetRoles));
      }

      const userSnapshot = await getDocs(userQuery);

      // Send notification to each user
      const notificationPromises = userSnapshot.docs.map(userDoc =>
        this.sendNotification(
          userDoc.id,
          'system_announcement',
          {
            title: announcement.title,
            message: announcement.message,
            deepLink: announcement.deepLink
          },
          {
            priority: announcement.priority || 'medium'
          }
        )
      );

      await Promise.all(notificationPromises);

      logger.info('System announcement sent', {
        targetUsers: userSnapshot.size,
        title: announcement.title,
        targetRoles: announcement.targetRoles
      });

      return userSnapshot.size;

    } catch (error) {
      logger.error('Failed to send system announcement', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Filter notification channels based on user preferences
   */
  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    preferences: UserProfile['preferences']
  ): NotificationChannel[] {
    return channels.filter(channel => {
      switch (channel) {
        case 'email':
          return preferences.emailNotifications !== false;
        case 'push':
          return preferences.pushNotifications !== false;
        case 'in-app':
          return true; // Always allow in-app notifications
        default:
          return true;
      }
    });
  }

  /**
   * Find existing notification to prevent duplicates
   */
  private async findExistingNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<Notification | null> {
    try {
      // Look for recent notifications of the same type with same content ID
      const recentTime = Timestamp.fromDate(new Date(Date.now() - (60 * 60 * 1000))); // 1 hour ago

      const existingQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('type', '==', type),
        where('createdAt', '>=', recentTime)
      );

      const snapshot = await getDocs(existingQuery);

      for (const doc of snapshot.docs) {
        const notification = { id: doc.id, ...doc.data() } as Notification;

        // Check if this is for the same content
        if (data.contentId && notification.data.contentId === data.contentId) {
          return notification;
        }
      }

      return null;

    } catch (error) {
      logger.error('Failed to check for existing notifications', {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Send notification via additional channels (email, push)
   */
  private async sendViaChannels(
    notificationId: string,
    notification: Omit<Notification, 'id'>,
    userProfile: UserProfile
  ): Promise<void> {
    try {
      // Send email if email channel is enabled and user allows it
      if (notification.channels.includes('email') &&
          userProfile.preferences.emailNotifications !== false) {

        await this.sendEmailNotification(notificationId, notification, userProfile);
      }

      // Push notifications would be implemented here
      if (notification.channels.includes('push') &&
          userProfile.preferences.pushNotifications !== false) {

        // TODO: Implement push notification sending
        logger.debug('Push notification would be sent here', {
          notificationId,
          userId: userProfile.uid
        });
      }

    } catch (error) {
      logger.error('Failed to send via additional channels', {
        notificationId,
        userId: userProfile.uid,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Don't throw - we don't want to fail the entire notification
    }
  }

  /**
   * Send email notification using Cloud Functions
   */
  private async sendEmailNotification(
    notificationId: string,
    notification: Omit<Notification, 'id'>,
    userProfile: UserProfile
  ): Promise<void> {
    try {
      // Get email template for this notification type
      const template = NOTIFICATION_TEMPLATES[notification.type];
      const emailTemplate = template.emailTemplate;

      if (!emailTemplate) {
        logger.debug('No email template defined for notification type', {
          type: notification.type
        });
        return;
      }

      // Call Cloud Function to send email
      const sendEmail = httpsCallable(firebaseFunctions, 'sendNotificationEmail');

      await sendEmail({
        notificationId,
        userId: userProfile.uid,
        email: userProfile.email,
        template: emailTemplate,
        data: {
          displayName: userProfile.displayName,
          title: notification.title,
          message: notification.message,
          deepLink: notification.deepLink,
          ...notification.data
        }
      });

      logger.debug('Email notification sent', {
        notificationId,
        email: userProfile.email,
        template: emailTemplate
      });

    } catch (error) {
      logger.error('Failed to send email notification', {
        notificationId,
        userId: userProfile.uid,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Types are already exported above with their interface/type declarations
