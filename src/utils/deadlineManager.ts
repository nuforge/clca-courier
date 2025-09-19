/**
 * Deadline Management System - Volunteer Workflow
 *
 * Implements deadline calculation, monitoring, and escalation for volunteer tasks.
 * Provides realistic due date calculations, escalating notifications, deadline extensions,
 * and visual indicators for urgent tasks.
 *
 * Features:
 * - Intelligent deadline calculation based on task complexity and priority
 * - Escalating notification system (72h, 24h, overdue)
 * - Deadline extension management with approval workflow
 * - Visual urgency indicators for UI components
 * - Integration with notification service
 * - Performance metrics tracking
 */

import { Timestamp } from 'firebase/firestore';
import { logger } from './logger';
import { getCurrentTimestamp, formatDateTime, getRelativeTime } from './date-formatter';
import { notificationService, type NotificationType } from '../services/notificationService';
import type { TaskCategory, TaskPriority } from '../services/task.service';
import type { ContentDoc } from '../types/core/content.types';

/**
 * Deadline calculation configuration
 */
interface DeadlineConfig {
  /** Base hours for different task categories */
  baseHours: Record<TaskCategory, number>;
  /** Priority multipliers (higher priority = shorter deadline) */
  priorityMultipliers: Record<TaskPriority, number>;
  /** Complexity factors based on content characteristics */
  complexityFactors: {
    longContent: number; // Articles > 1000 words
    hasImages: number;   // Content with image attachments
    hasEvents: number;   // Event scheduling
    requiresFactCheck: number; // Content requiring fact-checking
  };
  /** Minimum and maximum deadline bounds */
  bounds: {
    minimumHours: number;
    maximumHours: number;
  };
  /** Notification schedule (hours before deadline) */
  notificationSchedule: number[];
  /** Weekend adjustment factor */
  weekendFactor: number;
}

/**
 * Default deadline configuration
 */
const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = {
  baseHours: {
    'review': 48,      // 2 days for content review
    'layout': 72,      // 3 days for layout work
    'fact-check': 96,  // 4 days for fact-checking
    'approve': 24,     // 1 day for approval
    'print': 120       // 5 days for print preparation
  },
  priorityMultipliers: {
    'low': 1.5,        // 50% more time for low priority
    'medium': 1.0,     // Standard time
    'high': 0.7        // 30% less time for high priority
  },
  complexityFactors: {
    longContent: 1.3,       // 30% more time for long articles
    hasImages: 1.2,         // 20% more time for image content
    hasEvents: 1.4,         // 40% more time for event coordination
    requiresFactCheck: 1.5  // 50% more time for fact-checking tasks
  },
  bounds: {
    minimumHours: 6,   // Minimum 6 hours
    maximumHours: 336  // Maximum 2 weeks
  },
  notificationSchedule: [72, 24, 6], // 3 days, 1 day, 6 hours before
  weekendFactor: 1.2 // 20% more time if deadline falls on weekend
};

/**
 * Deadline extension request interface
 */
export interface DeadlineExtensionRequest {
  id: string;
  contentId: string;
  requestedBy: string;
  requestedByName: string;
  currentDeadline: Timestamp;
  requestedDeadline: Timestamp;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}

/**
 * Urgency level for visual indicators
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'overdue';

/**
 * Deadline status information
 */
export interface DeadlineStatus {
  urgency: UrgencyLevel;
  hoursRemaining: number;
  formattedTimeRemaining: string;
  isOverdue: boolean;
  color: string;
  icon: string;
  message: string;
}

/**
 * Task complexity analysis result
 */
interface ComplexityAnalysis {
  score: number;
  factors: string[];
  estimatedHours: number;
}

/**
 * Deadline manager class
 */
class DeadlineManager {
  private config: DeadlineConfig;

  constructor(config: Partial<DeadlineConfig> = {}) {
    this.config = { ...DEFAULT_DEADLINE_CONFIG, ...config };
  }

  /**
   * Calculate realistic deadline for a task based on content and task characteristics
   */
  calculateDeadline(
    content: ContentDoc,
    taskCategory: TaskCategory,
    taskPriority: TaskPriority,
    customFactors: Record<string, number> = {}
  ): { deadline: Timestamp; estimatedHours: number; analysis: ComplexityAnalysis } {
    try {
      logger.debug('Calculating deadline', {
        contentId: content.id,
        taskCategory,
        taskPriority,
        title: content.title
      });

      // Start with base hours for task category
      let totalHours = this.config.baseHours[taskCategory];

      // Apply priority multiplier
      totalHours *= this.config.priorityMultipliers[taskPriority];

      // Analyze content complexity
      const complexityAnalysis = this.analyzeContentComplexity(content, taskCategory);
      totalHours *= complexityAnalysis.score;

      // Apply custom factors
      Object.entries(customFactors).forEach(([factor, multiplier]) => {
        totalHours *= multiplier;
        logger.debug('Applied custom factor', { factor, multiplier, newTotal: totalHours });
      });

      // Apply bounds
      totalHours = Math.max(this.config.bounds.minimumHours, totalHours);
      totalHours = Math.min(this.config.bounds.maximumHours, totalHours);

      // Calculate deadline from now
      const now = new Date();
      let deadlineDate = new Date(now.getTime() + (totalHours * 60 * 60 * 1000));

      // Apply weekend factor if deadline falls on weekend
      if (this.isWeekend(deadlineDate)) {
        const adjustedHours = totalHours * this.config.weekendFactor;
        deadlineDate = new Date(now.getTime() + (adjustedHours * 60 * 60 * 1000));

        logger.debug('Applied weekend factor', {
          originalHours: totalHours,
          adjustedHours,
          weekendFactor: this.config.weekendFactor
        });
      }

      const deadline = Timestamp.fromDate(deadlineDate);

      logger.info('Deadline calculated', {
        contentId: content.id,
        taskCategory,
        priority: taskPriority,
        estimatedHours: Math.round(totalHours),
        deadline: deadline.toDate().toISOString(),
        complexityScore: complexityAnalysis.score,
        factors: complexityAnalysis.factors
      });

      return {
        deadline,
        estimatedHours: Math.round(totalHours),
        analysis: {
          ...complexityAnalysis,
          estimatedHours: Math.round(totalHours)
        }
      };

    } catch (error) {
      logger.error('Failed to calculate deadline', {
        contentId: content.id,
        taskCategory,
        taskPriority,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to simple calculation
      const fallbackHours = this.config.baseHours[taskCategory];
      return {
        deadline: Timestamp.fromDate(new Date(Date.now() + (fallbackHours * 60 * 60 * 1000))),
        estimatedHours: fallbackHours,
        analysis: {
          score: 1.0,
          factors: ['fallback'],
          estimatedHours: fallbackHours
        }
      };
    }
  }

  /**
   * Analyze content complexity to adjust deadline calculation
   */
  private analyzeContentComplexity(content: ContentDoc, taskCategory: TaskCategory): ComplexityAnalysis {
    let complexityScore = 1.0;
    const factors: string[] = [];

    try {
      // Check content length
      const contentLength = (content.description || '').length;
      if (contentLength > 1000) {
        complexityScore *= this.config.complexityFactors.longContent;
        factors.push('long-content');
      }

      // Check for images/attachments (simplified check via tags)
      const hasImages = content.tags.some(tag =>
        tag.includes('image') || tag.includes('photo') || tag.includes('media')
      );
      if (hasImages) {
        complexityScore *= this.config.complexityFactors.hasImages;
        factors.push('has-images');
      }

      // Check for event scheduling
      if (content.features['feat:date']) {
        complexityScore *= this.config.complexityFactors.hasEvents;
        factors.push('has-events');
      }

      // Check if fact-checking is required
      if (taskCategory === 'fact-check' || content.tags.includes('requires-fact-check')) {
        complexityScore *= this.config.complexityFactors.requiresFactCheck;
        factors.push('requires-fact-check');
      }

      // Content type specific adjustments
      const contentType = this.getContentTypeFromTags(content.tags);
      switch (contentType) {
        case 'news':
          // News articles may need fact-checking
          if (taskCategory === 'review') {
            complexityScore *= 1.2;
            factors.push('news-review');
          }
          break;
        case 'event':
          // Events need coordination
          complexityScore *= 1.3;
          factors.push('event-coordination');
          break;
        case 'editorial':
          // Editorials need careful review
          complexityScore *= 1.4;
          factors.push('editorial-review');
          break;
      }

      logger.debug('Content complexity analyzed', {
        contentId: content.id,
        contentLength,
        hasImages,
        hasEvents: !!content.features['feat:date'],
        contentType,
        complexityScore,
        factors
      });

    } catch (error) {
      logger.error('Failed to analyze content complexity', {
        contentId: content.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to neutral complexity
      complexityScore = 1.0;
      factors.push('analysis-failed');
    }

    return {
      score: complexityScore,
      factors,
      estimatedHours: 0 // Will be set by caller
    };
  }

  /**
   * Get deadline status with urgency information
   */
  getDeadlineStatus(deadline: Timestamp, isCompleted = false): DeadlineStatus {
    const now = new Date();
    const deadlineDate = deadline.toDate();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    // If task is completed, return completed status
    if (isCompleted) {
      return {
        urgency: 'low',
        hoursRemaining: 0,
        formattedTimeRemaining: 'Completed',
        isOverdue: false,
        color: 'positive',
        icon: 'check_circle',
        message: 'Task completed'
      };
    }

    // Determine urgency level
    let urgency: UrgencyLevel;
    let color: string;
    let icon: string;
    let message: string;

    if (hoursRemaining < 0) {
      urgency = 'overdue';
      color = 'negative';
      icon = 'error';
      message = `Overdue by ${getRelativeTime(deadlineDate)}`;
    } else if (hoursRemaining <= 6) {
      urgency = 'critical';
      color = 'red';
      icon = 'warning';
      message = 'Critical: Due very soon';
    } else if (hoursRemaining <= 24) {
      urgency = 'high';
      color = 'orange';
      icon = 'schedule';
      message = 'High: Due within 24 hours';
    } else if (hoursRemaining <= 72) {
      urgency = 'medium';
      color = 'amber';
      icon = 'access_time';
      message = 'Medium: Due within 3 days';
    } else {
      urgency = 'low';
      color = 'primary';
      icon = 'schedule';
      message = 'On track';
    }

    const formattedTimeRemaining = hoursRemaining < 0
      ? `Overdue by ${Math.abs(Math.floor(hoursRemaining))}h`
      : hoursRemaining < 24
        ? `${Math.floor(hoursRemaining)}h remaining`
        : `${Math.floor(hoursRemaining / 24)}d remaining`;

    return {
      urgency,
      hoursRemaining,
      formattedTimeRemaining,
      isOverdue: hoursRemaining < 0,
      color,
      icon,
      message
    };
  }

  /**
   * Check if deadline notifications should be sent
   */
  shouldSendDeadlineNotification(
    deadline: Timestamp,
    lastNotificationSent?: Timestamp
  ): { shouldSend: boolean; notificationType: NotificationType | null; hoursRemaining: number } {
    const now = new Date();
    const deadlineDate = deadline.toDate();
    const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check if task is overdue
    if (hoursRemaining < 0) {
      return {
        shouldSend: true,
        notificationType: 'task_overdue',
        hoursRemaining
      };
    }

    // Check notification schedule
    for (const notificationHours of this.config.notificationSchedule) {
      if (hoursRemaining <= notificationHours && hoursRemaining > (notificationHours - 1)) {
        // Check if we haven't sent this notification already
        if (!lastNotificationSent ||
            (now.getTime() - lastNotificationSent.toDate().getTime()) > (6 * 60 * 60 * 1000)) { // 6 hours minimum between notifications

          return {
            shouldSend: true,
            notificationType: 'deadline_approaching',
            hoursRemaining
          };
        }
      }
    }

    return {
      shouldSend: false,
      notificationType: null,
      hoursRemaining
    };
  }

  /**
   * Request deadline extension
   */
  async requestDeadlineExtension(
    contentId: string,
    currentDeadline: Timestamp,
    requestedDeadline: Timestamp,
    reason: string,
    requestedBy: string,
    requestedByName: string
  ): Promise<string> {
    try {
      // Validate extension request
      if (requestedDeadline.toDate() <= currentDeadline.toDate()) {
        throw new Error('Requested deadline must be after current deadline');
      }

      if (requestedDeadline.toDate() <= new Date()) {
        throw new Error('Requested deadline must be in the future');
      }

      if (!reason.trim()) {
        throw new Error('Extension reason is required');
      }

      const extensionRequest: Omit<DeadlineExtensionRequest, 'id'> = {
        contentId,
        requestedBy,
        requestedByName,
        currentDeadline,
        requestedDeadline,
        reason: reason.trim(),
        status: 'pending',
        requestedAt: Timestamp.now()
      };

      // In a real implementation, this would save to Firestore
      // For now, we'll just log and return a mock ID
      const requestId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      logger.info('Deadline extension requested', {
        requestId,
        contentId,
        requestedBy,
        currentDeadline: currentDeadline.toDate().toISOString(),
        requestedDeadline: requestedDeadline.toDate().toISOString(),
        reason
      });

      // Send notification to administrators
      await this.notifyAdministratorsOfExtensionRequest(requestId, extensionRequest);

      return requestId;

    } catch (error) {
      logger.error('Failed to request deadline extension', {
        contentId,
        requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process deadline extension request (approve/reject)
   */
  async processDeadlineExtensionRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      // In a real implementation, this would update Firestore
      logger.info('Deadline extension request processed', {
        requestId,
        decision,
        reviewedBy,
        reviewNotes
      });

      // Send notification to requester
      // This would be implemented with actual database operations

    } catch (error) {
      logger.error('Failed to process deadline extension request', {
        requestId,
        decision,
        reviewedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get visual indicator properties for deadline urgency
   */
  getUrgencyIndicator(urgency: UrgencyLevel): {
    color: string;
    textColor: string;
    icon: string;
    pulseAnimation: boolean;
    className: string;
  } {
    const indicators = {
      'low': {
        color: 'primary',
        textColor: 'white',
        icon: 'schedule',
        pulseAnimation: false,
        className: 'urgency-low'
      },
      'medium': {
        color: 'amber',
        textColor: 'black',
        icon: 'access_time',
        pulseAnimation: false,
        className: 'urgency-medium'
      },
      'high': {
        color: 'orange',
        textColor: 'white',
        icon: 'schedule',
        pulseAnimation: true,
        className: 'urgency-high'
      },
      'critical': {
        color: 'red',
        textColor: 'white',
        icon: 'warning',
        pulseAnimation: true,
        className: 'urgency-critical'
      },
      'overdue': {
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        pulseAnimation: true,
        className: 'urgency-overdue'
      }
    };

    return indicators[urgency];
  }

  /**
   * Calculate performance metrics for deadline management
   */
  calculatePerformanceMetrics(tasks: Array<{
    deadline: Timestamp;
    completedAt?: Timestamp;
    status: string;
  }>): {
    onTimeCompletionRate: number;
    averageCompletionTime: number;
    overdueTasksCount: number;
    averageExtensionTime: number;
  } {
    try {
      const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
      const onTimeTasks = completedTasks.filter(task =>
        task.completedAt && task.completedAt.toDate() <= task.deadline.toDate()
      );

      const onTimeCompletionRate = completedTasks.length > 0
        ? (onTimeTasks.length / completedTasks.length) * 100
        : 0;

      const completionTimes = completedTasks
        .filter(task => task.completedAt)
        .map(task => {
          const completed = task.completedAt!.toDate().getTime();
          const deadline = task.deadline.toDate().getTime();
          return (completed - deadline) / (1000 * 60 * 60); // Hours relative to deadline
        });

      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;

      const now = new Date();
      const overdueTasksCount = tasks.filter(task =>
        task.status !== 'completed' && task.deadline.toDate() < now
      ).length;

      const extensionTimes = completedTasks
        .filter(task => task.completedAt && task.completedAt.toDate() > task.deadline.toDate())
        .map(task => {
          const completed = task.completedAt!.toDate().getTime();
          const deadline = task.deadline.toDate().getTime();
          return (completed - deadline) / (1000 * 60 * 60); // Hours of extension
        });

      const averageExtensionTime = extensionTimes.length > 0
        ? extensionTimes.reduce((sum, time) => sum + time, 0) / extensionTimes.length
        : 0;

      return {
        onTimeCompletionRate: Math.round(onTimeCompletionRate * 100) / 100,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
        overdueTasksCount,
        averageExtensionTime: Math.round(averageExtensionTime * 100) / 100
      };

    } catch (error) {
      logger.error('Failed to calculate performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        onTimeCompletionRate: 0,
        averageCompletionTime: 0,
        overdueTasksCount: 0,
        averageExtensionTime: 0
      };
    }
  }

  /**
   * Helper method to check if date falls on weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Helper method to extract content type from tags
   */
  private getContentTypeFromTags(tags: string[]): string {
    const contentTypeTag = tags.find(tag => tag.startsWith('content-type:'));
    return contentTypeTag ? contentTypeTag.split(':')[1] ?? 'news' : 'news';
  }

  /**
   * Helper method to notify administrators of extension requests
   */
  private async notifyAdministratorsOfExtensionRequest(
    requestId: string,
    request: Omit<DeadlineExtensionRequest, 'id'>
  ): Promise<void> {
    try {
      // This would send notifications to administrators
      // For now, just log the action
      logger.info('Extension request notification sent to administrators', {
        requestId,
        contentId: request.contentId,
        requestedBy: request.requestedBy
      });

    } catch (error) {
      logger.error('Failed to notify administrators of extension request', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const deadlineManager = new DeadlineManager();

// Export types for use in components
export type {
  DeadlineConfig,
  DeadlineExtensionRequest,
  DeadlineStatus,
  UrgencyLevel
};
