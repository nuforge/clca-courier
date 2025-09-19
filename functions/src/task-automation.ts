/**
 * Task Automation Cloud Functions - Volunteer Workflow System
 *
 * Implements automated task assignment, notification dispatch, and deadline management
 * using Firebase Functions v2 API consistent with existing architecture.
 *
 * Features:
 * - Automatic task creation when content is submitted
 * - Skill-based volunteer assignment with availability checking
 * - Task reassignment when volunteers become unavailable
 * - Notification dispatch for task lifecycle events
 * - Deadline monitoring with escalating notifications
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/logger';
import type { ContentDoc, ContentFeatures } from '../../src/types/core/content.types';

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
} catch (error) {
  // App already initialized
}

const db = getFirestore();

/**
 * Task automation configuration
 */
interface TaskAutomationConfig {
  /** Default task priority for auto-created tasks */
  defaultPriority: 'low' | 'medium' | 'high';
  /** Default estimated time for different task categories (minutes) */
  estimatedTimes: Record<string, number>;
  /** Maximum number of active tasks per volunteer */
  maxTasksPerVolunteer: number;
  /** Deadline offset from content creation (hours) */
  defaultDeadlineOffset: number;
  /** Skills required for different content types */
  contentTypeSkills: Record<string, string[]>;
}

const AUTOMATION_CONFIG: TaskAutomationConfig = {
  defaultPriority: 'medium',
  estimatedTimes: {
    'review': 15,
    'layout': 30,
    'fact-check': 20,
    'approve': 10,
    'print': 45
  },
  maxTasksPerVolunteer: 5,
  defaultDeadlineOffset: 72, // 3 days
  contentTypeSkills: {
    'news': ['skill:writing', 'skill:editing'],
    'event': ['skill:event-planning', 'skill:writing'],
    'announcement': ['skill:writing'],
    'editorial': ['skill:writing', 'skill:editing'],
    'opinion': ['skill:writing', 'skill:fact-checking']
  }
};

/**
 * Helper function to extract content type from tags
 */
function getContentType(content: ContentDoc): string {
  const contentTypeTag = content.tags.find(tag => tag.startsWith('content-type:'));
  return contentTypeTag ? contentTypeTag.split(':')[1] ?? 'news' : 'news';
}

/**
 * Helper function to get required skills for content
 */
function getRequiredSkills(content: ContentDoc): string[] {
  const contentType = getContentType(content);
  return AUTOMATION_CONFIG.contentTypeSkills[contentType] || ['skill:writing'];
}

/**
 * Helper function to find available volunteers for skills
 */
async function findAvailableVolunteers(
  requiredSkills: string[],
  excludeUserId?: string
): Promise<Array<{ uid: string; tags: string[]; availability: string; displayName: string }>> {
  try {
    logger.info('Finding available volunteers', {
      requiredSkills,
      excludeUserId
    });

    const volunteers: Array<{ uid: string; tags: string[]; availability: string; displayName: string }> = [];

    // Query for each required skill (Firebase doesn't support OR queries on arrays)
    for (const skill of requiredSkills) {
      const skillQuery = await db.collection('userProfiles')
        .where('tags', 'array-contains', skill)
        .where('availability', 'in', ['regular', 'occasional'])
        .where('preferences.taskAssignments', '==', true)
        .limit(10)
        .get();

      skillQuery.docs.forEach(doc => {
        const userData = doc.data();
        const uid = doc.id;

        // Skip excluded user
        if (excludeUserId && uid === excludeUserId) {
          return;
        }

        // Check if we already have this volunteer
        if (!volunteers.some(v => v.uid === uid)) {
          volunteers.push({
            uid,
            tags: userData.tags || [],
            availability: userData.availability || 'occasional',
            displayName: userData.displayName || 'Unknown Volunteer'
          });
        }
      });
    }

    logger.info('Found volunteers', {
      count: volunteers.length,
      volunteers: volunteers.map(v => ({ uid: v.uid, displayName: v.displayName, availability: v.availability }))
    });

    return volunteers;
  } catch (error) {
    logger.error('Failed to find available volunteers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requiredSkills
    });
    return [];
  }
}

/**
 * Helper function to get volunteer workload
 */
async function getVolunteerWorkload(userId: string): Promise<number> {
  try {
    const activeTasksQuery = await db.collection('content')
      .where('features.feat:task.assignedTo', '==', userId)
      .where('features.feat:task.status', 'in', ['claimed', 'in-progress'])
      .get();

    return activeTasksQuery.size;
  } catch (error) {
    logger.error('Failed to get volunteer workload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return 0;
  }
}

/**
 * Helper function to calculate task deadline
 */
function calculateTaskDeadline(category: string): Timestamp {
  const now = new Date();
  const offsetHours = AUTOMATION_CONFIG.defaultDeadlineOffset;

  // Adjust deadline based on task category
  let finalOffsetHours = offsetHours;
  switch (category) {
    case 'approve':
      finalOffsetHours = 24; // 1 day for approvals
      break;
    case 'fact-check':
      finalOffsetHours = 48; // 2 days for fact-checking
      break;
    case 'print':
      finalOffsetHours = 96; // 4 days for print jobs
      break;
    default:
      finalOffsetHours = offsetHours;
  }

  const deadline = new Date(now.getTime() + (finalOffsetHours * 60 * 60 * 1000));
  return Timestamp.fromDate(deadline);
}

/**
 * Automatic task creation when content is submitted
 * Triggered on new content document creation
 */
export const onContentCreated = onDocumentCreated('content/{contentId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn('No snapshot data in content creation event');
    return;
  }

  const contentId = event.params.contentId as string;
  const content = snapshot.data() as ContentDoc;

  try {
    logger.info('Processing new content for task automation', {
      contentId,
      title: content.title,
      authorId: content.authorId,
      tags: content.tags,
      status: content.status
    });

    // Only create tasks for draft content that doesn't already have a task
    if (content.status !== 'draft' || content.features['feat:task']) {
      logger.info('Skipping task creation', {
        contentId,
        status: content.status,
        hasTask: !!content.features['feat:task']
      });
      return;
    }

    // Determine if this content needs editorial review
    const contentType = getContentType(content);
    const requiredSkills = getRequiredSkills(content);

    logger.info('Creating editorial task', {
      contentId,
      contentType,
      requiredSkills
    });

    // Create review task first (most common task type)
    const taskCategory = 'review';
    const estimatedTime = AUTOMATION_CONFIG.estimatedTimes[taskCategory] || 15;
    const priority = AUTOMATION_CONFIG.defaultPriority;
    const dueDate = calculateTaskDeadline(taskCategory);

    // Find available volunteers
    const availableVolunteers = await findAvailableVolunteers(requiredSkills, content.authorId);

    let assignedTo: string | undefined;
    if (availableVolunteers.length > 0) {
      // Score volunteers by availability and current workload
      const volunteerScores = await Promise.all(
        availableVolunteers.map(async (volunteer) => {
          const workload = await getVolunteerWorkload(volunteer.uid);
          const availabilityScore = volunteer.availability === 'regular' ? 10 : 5;
          const workloadScore = Math.max(0, AUTOMATION_CONFIG.maxTasksPerVolunteer - workload);
          const skillMatchScore = requiredSkills.filter(skill => volunteer.tags.includes(skill)).length;

          return {
            volunteer,
            score: availabilityScore + workloadScore + (skillMatchScore * 2),
            workload
          };
        })
      );

      // Sort by score and pick the best available volunteer
      volunteerScores.sort((a, b) => b.score - a.score);
      const bestVolunteer = volunteerScores.find(v => v.workload < AUTOMATION_CONFIG.maxTasksPerVolunteer);

      if (bestVolunteer) {
        assignedTo = bestVolunteer.volunteer.uid;
        logger.info('Assigned task to volunteer', {
          contentId,
          assignedTo,
          volunteerName: bestVolunteer.volunteer.displayName,
          score: bestVolunteer.score,
          workload: bestVolunteer.workload
        });
      }
    }

    // Create the task feature
    const now = Timestamp.now();
    const taskFeature: NonNullable<ContentFeatures['feat:task']> = {
      category: taskCategory,
      estimatedTime,
      status: assignedTo ? 'claimed' : 'unclaimed',
      priority,
      dueDate,
      createdAt: now,
      updatedAt: now,
      instructions: `Please review "${content.title}" for editorial approval. Check for accuracy, appropriate content, and community guidelines compliance.`
    };

    if (assignedTo) {
      taskFeature.assignedTo = assignedTo;
    }

    // Update the content document with the task
    await snapshot.ref.update({
      'features.feat:task': taskFeature,
      'timestamps.updated': FieldValue.serverTimestamp()
    });

    logger.info('Task created successfully', {
      contentId,
      category: taskCategory,
      assignedTo: assignedTo || 'unassigned',
      dueDate: dueDate.toDate().toISOString()
    });

    // Send notification if task was assigned
    if (assignedTo) {
      await sendTaskNotification(assignedTo, 'task_assigned', {
        contentId,
        contentTitle: content.title,
        taskCategory,
        dueDate: dueDate.toDate().toISOString(),
        estimatedTime
      });
    }

  } catch (error) {
    logger.error('Failed to create automatic task', {
      contentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Don't throw - we don't want to block content creation
    // The task can be created manually if needed
  }
});

/**
 * Task reassignment when user profile changes
 * Triggered when user availability or task preferences change
 */
export const onUserProfileUpdated = onDocumentUpdated('userProfiles/{userId}', async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  const userId = event.params.userId as string;

  if (!beforeData || !afterData) {
    return;
  }

  try {
    // Check if availability changed to unavailable or task assignments were disabled
    const availabilityChanged = beforeData.availability !== afterData.availability;
    const taskAssignmentsDisabled = beforeData.preferences?.taskAssignments && !afterData.preferences?.taskAssignments;

    if (!availabilityChanged && !taskAssignmentsDisabled) {
      return;
    }

    logger.info('User profile changed, checking for task reassignment', {
      userId,
      oldAvailability: beforeData.availability,
      newAvailability: afterData.availability,
      taskAssignmentsDisabled
    });

    // If user became unavailable or disabled task assignments, reassign their tasks
    if (afterData.availability === 'unavailable' || taskAssignmentsDisabled) {
      await reassignUserTasks(userId, 'User became unavailable or disabled task assignments');
    }

  } catch (error) {
    logger.error('Failed to process user profile update for task reassignment', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to reassign tasks from a user
 */
async function reassignUserTasks(userId: string, reason: string): Promise<void> {
  try {
    // Find all active tasks assigned to this user
    const userTasksQuery = await db.collection('content')
      .where('features.feat:task.assignedTo', '==', userId)
      .where('features.feat:task.status', 'in', ['claimed', 'in-progress'])
      .get();

    logger.info('Found tasks to reassign', {
      userId,
      taskCount: userTasksQuery.size,
      reason
    });

    // Process each task for reassignment
    for (const taskDoc of userTasksQuery.docs) {
      const content = taskDoc.data() as ContentDoc;
      const task = content.features['feat:task'];

      if (!task) continue;

      // Find required skills for this content
      const requiredSkills = getRequiredSkills(content);
      const availableVolunteers = await findAvailableVolunteers(requiredSkills, userId);

      let newAssignee: string | undefined;
      if (availableVolunteers.length > 0) {
        // Simple assignment to first available volunteer
        // In a production system, you might want more sophisticated logic
        const workloads = await Promise.all(
          availableVolunteers.map(async (volunteer) => ({
            volunteer,
            workload: await getVolunteerWorkload(volunteer.uid)
          }))
        );

        const bestVolunteer = workloads
          .filter(v => v.workload < AUTOMATION_CONFIG.maxTasksPerVolunteer)
          .sort((a, b) => a.workload - b.workload)[0];

        if (bestVolunteer) {
          newAssignee = bestVolunteer.volunteer.uid;
        }
      }

      // Update task assignment
      const updateData: Record<string, any> = {
        'features.feat:task.updatedAt': FieldValue.serverTimestamp(),
        'timestamps.updated': FieldValue.serverTimestamp()
      };

      if (newAssignee) {
        updateData['features.feat:task.assignedTo'] = newAssignee;
        updateData['features.feat:task.status'] = 'claimed';

        logger.info('Reassigning task to new volunteer', {
          contentId: taskDoc.id,
          oldAssignee: userId,
          newAssignee,
          reason
        });

        // Send notification to new assignee
        await sendTaskNotification(newAssignee, 'task_reassigned', {
          contentId: taskDoc.id,
          contentTitle: content.title,
          taskCategory: task.category,
          dueDate: task.dueDate?.toDate().toISOString(),
          estimatedTime: task.estimatedTime,
          reason
        });
      } else {
        // No available volunteers, make task unclaimed
        updateData['features.feat:task.assignedTo'] = FieldValue.delete();
        updateData['features.feat:task.status'] = 'unclaimed';

        logger.warn('No available volunteers for reassignment', {
          contentId: taskDoc.id,
          requiredSkills,
          reason
        });
      }

      await taskDoc.ref.update(updateData);
    }

    // Send notification to original user about reassignment
    if (userTasksQuery.size > 0) {
      await sendTaskNotification(userId, 'tasks_reassigned', {
        taskCount: userTasksQuery.size,
        reason
      });
    }

  } catch (error) {
    logger.error('Failed to reassign user tasks', {
      userId,
      reason,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Deadline monitoring and escalation
 * Runs daily to check for approaching deadlines
 */
export const monitorTaskDeadlines = onSchedule('every day 09:00', async () => {
  try {
    logger.info('Starting daily deadline monitoring');

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Find tasks with approaching deadlines
    const approachingDeadlinesQuery = await db.collection('content')
      .where('features.feat:task.status', 'in', ['claimed', 'in-progress'])
      .get();

    const approachingTasks: Array<{ contentId: string; content: ContentDoc; task: NonNullable<ContentFeatures['feat:task']> }> = [];
    const overdueTasks: Array<{ contentId: string; content: ContentDoc; task: NonNullable<ContentFeatures['feat:task']> }> = [];

    approachingDeadlinesQuery.docs.forEach(doc => {
      const content = doc.data() as ContentDoc;
      const task = content.features['feat:task'];

      if (!task || !task.dueDate || !task.assignedTo) return;

      const dueDate = task.dueDate.toDate();

      if (dueDate <= now) {
        overdueTasks.push({ contentId: doc.id, content, task });
      } else if (dueDate <= oneDayFromNow) {
        approachingTasks.push({ contentId: doc.id, content, task });
      }
    });

    logger.info('Found tasks with deadline issues', {
      approachingCount: approachingTasks.length,
      overdueCount: overdueTasks.length
    });

    // Send approaching deadline notifications
    for (const { contentId, content, task } of approachingTasks) {
      if (task.assignedTo) {
        await sendTaskNotification(task.assignedTo, 'deadline_approaching', {
          contentId,
          contentTitle: content.title,
          taskCategory: task.category,
          dueDate: task.dueDate?.toDate().toISOString(),
          hoursRemaining: Math.floor((task.dueDate!.toDate().getTime() - now.getTime()) / (60 * 60 * 1000))
        });
      }
    }

    // Handle overdue tasks
    for (const { contentId, content, task } of overdueTasks) {
      // Send overdue notification to assignee
      if (task.assignedTo) {
        await sendTaskNotification(task.assignedTo, 'task_overdue', {
          contentId,
          contentTitle: content.title,
          taskCategory: task.category,
          dueDate: task.dueDate?.toDate().toISOString(),
          hoursOverdue: Math.floor((now.getTime() - task.dueDate!.toDate().getTime()) / (60 * 60 * 1000))
        });
      }

      // Escalate to administrators for tasks overdue by more than 24 hours
      const hoursOverdue = (now.getTime() - task.dueDate!.toDate().getTime()) / (60 * 60 * 1000);
      if (hoursOverdue >= 24) {
        await escalateOverdueTask(contentId, content, task, hoursOverdue);
      }
    }

    logger.info('Deadline monitoring completed', {
      notificationsSent: approachingTasks.length + overdueTasks.length,
      escalations: overdueTasks.filter(t => {
        const hoursOverdue = (now.getTime() - t.task.dueDate!.toDate().getTime()) / (60 * 60 * 1000);
        return hoursOverdue >= 24;
      }).length
    });

  } catch (error) {
    logger.error('Failed to monitor task deadlines', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * Helper function to escalate overdue tasks to administrators
 */
async function escalateOverdueTask(
  contentId: string,
  content: ContentDoc,
  task: NonNullable<ContentFeatures['feat:task']>,
  hoursOverdue: number
): Promise<void> {
  try {
    // Find administrators and moderators
    const adminQuery = await db.collection('userProfiles')
      .where('role', 'in', ['administrator', 'moderator'])
      .limit(5)
      .get();

    for (const adminDoc of adminQuery.docs) {
      await sendTaskNotification(adminDoc.id, 'task_escalated', {
        contentId,
        contentTitle: content.title,
        taskCategory: task.category,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate?.toDate().toISOString(),
        hoursOverdue: Math.floor(hoursOverdue)
      });
    }

    logger.info('Task escalated to administrators', {
      contentId,
      assignedTo: task.assignedTo,
      hoursOverdue: Math.floor(hoursOverdue)
    });

  } catch (error) {
    logger.error('Failed to escalate overdue task', {
      contentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Helper function to send task notifications
 * This will be enhanced when we implement the full notification service
 */
async function sendTaskNotification(
  userId: string,
  notificationType: string,
  notificationData: Record<string, any>
): Promise<void> {
  try {
    // For now, we'll just store the notification in Firestore
    // Later, this can be enhanced to send emails, push notifications, etc.

    await db.collection('notifications').add({
      userId,
      type: notificationType,
      data: notificationData,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))) // 30 days
    });

    logger.info('Task notification sent', {
      userId,
      type: notificationType,
      data: notificationData
    });

  } catch (error) {
    logger.error('Failed to send task notification', {
      userId,
      type: notificationType,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
