/**
 * Task Assignment Logic - Intelligent Volunteer Matching
 *
 * Handles automatic task assignment based on volunteer skills, availability,
 * workload balancing, and task priority. Integrates with the UserProfile
 * system enhanced in Week 1 of the volunteer workflow implementation.
 */

import { logger } from './logger';
import { userUtils } from './userUtils';
import { getCurrentTimestamp } from './date-formatter';
import { firestoreService } from '../services/firebase-firestore.service';
import { taskService } from '../services/task.service';
import type { UserProfile } from '../services/firebase-firestore.service';
import type { TaskCategory, TaskPriority, TaskAssignmentCriteria, VolunteerWorkload } from '../services/task.service';
import type { ContentFeatures } from '../types/core/content.types';

/**
 * Volunteer candidate with scoring information
 */
export interface VolunteerCandidate {
  userProfile: UserProfile;
  score: number;
  matchedSkills: string[];
  currentWorkload: number;
  availabilityMatch: boolean;
  reasonsSelected: string[];
  reasonsRejected: string[];
}

/**
 * Task assignment result
 */
export interface TaskAssignmentResult {
  success: boolean;
  assignedTo?: string;
  assignedUserName?: string;
  candidates: VolunteerCandidate[];
  reason: string;
  fallbackSuggestions?: string[];
}

/**
 * Assignment configuration parameters
 */
export interface AssignmentConfig {
  maxWorkloadPerVolunteer: number;
  skillMatchWeight: number;
  availabilityWeight: number;
  workloadWeight: number;
  priorityBoost: Record<TaskPriority, number>;
  minRequiredSkillMatch: number; // minimum percentage of skills that must match
}

/**
 * Default assignment configuration
 */
const DEFAULT_CONFIG: AssignmentConfig = {
  maxWorkloadPerVolunteer: 5,
  skillMatchWeight: 0.4,
  availabilityWeight: 0.3,
  workloadWeight: 0.3,
  priorityBoost: {
    low: 1.0,
    medium: 1.2,
    high: 1.5
  },
  minRequiredSkillMatch: 0.3 // 30% of required skills must match
};

/**
 * Task skill requirements mapping
 */
const TASK_SKILL_REQUIREMENTS: Record<TaskCategory, string[]> = {
  'review': ['skill:writing', 'skill:editing', 'skill:proofreading'],
  'layout': ['skill:design', 'skill:layout', 'skill:canva', 'skill:graphics'],
  'fact-check': ['skill:research', 'skill:fact-checking', 'skill:verification'],
  'approve': ['skill:editing', 'skill:management', 'skill:decision-making'],
  'print': ['skill:printing', 'skill:production', 'skill:logistics']
};

/**
 * Availability priority mapping
 */
const AVAILABILITY_PRIORITY: Record<string, number> = {
  'regular': 1.0,
  'occasional': 0.7,
  'on-call': 0.4
};

class TaskAssignmentLogic {
  private config: AssignmentConfig;

  constructor(config: Partial<AssignmentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Automatically assign a task to the best available volunteer
   */
  async autoAssignTask(
    contentId: string,
    taskCategory: TaskCategory,
    taskPriority: TaskPriority,
    requiredSkills: string[] = [],
    dryRun = false
  ): Promise<TaskAssignmentResult> {
    try {
      logger.debug('Starting automatic task assignment', {
        contentId,
        taskCategory,
        taskPriority,
        requiredSkills,
        dryRun
      });

      // Get all volunteers eligible for task assignments
      const volunteers = await this.getEligibleVolunteers();

      if (volunteers.length === 0) {
        return {
          success: false,
          candidates: [],
          reason: 'No volunteers available for task assignments',
          fallbackSuggestions: ['Contact administrators to recruit more volunteers']
        };
      }

      // Get current workloads for all volunteers
      const workloads = await taskService.getVolunteerWorkloads();
      const workloadMap = new Map<string, VolunteerWorkload>();
      workloads.forEach(w => workloadMap.set(w.userId, w));

      // Determine required skills for the task
      const taskRequiredSkills = [
        ...TASK_SKILL_REQUIREMENTS[taskCategory],
        ...requiredSkills
      ];

      // Score and rank volunteers
      const candidates = await this.scoreVolunteers(
        volunteers,
        taskRequiredSkills,
        taskPriority,
        workloadMap
      );

      // Filter candidates that meet minimum requirements
      const qualifiedCandidates = candidates.filter(candidate =>
        this.meetsMinimumRequirements(candidate, taskRequiredSkills)
      );

      if (qualifiedCandidates.length === 0) {
        return {
          success: false,
          candidates,
          reason: 'No volunteers meet the minimum skill requirements for this task',
          fallbackSuggestions: this.generateFallbackSuggestions(taskCategory, candidates)
        };
      }

      // Select the best candidate
      const bestCandidate = qualifiedCandidates[0];

      // Perform actual assignment if not dry run
      if (!dryRun) {
        await taskService.assignTask(contentId, bestCandidate.userProfile.uid, 'automatic');
      }

      logger.info('Task automatically assigned', {
        contentId,
        taskCategory,
        assignedTo: bestCandidate.userProfile.uid,
        assignedUserName: bestCandidate.userProfile.displayName,
        score: bestCandidate.score,
        dryRun
      });

      return {
        success: true,
        assignedTo: bestCandidate.userProfile.uid,
        assignedUserName: bestCandidate.userProfile.displayName,
        candidates: qualifiedCandidates,
        reason: `Assigned to ${bestCandidate.userProfile.displayName} (score: ${bestCandidate.score.toFixed(2)})`
      };

    } catch (error) {
      logger.error('Failed to auto-assign task', {
        contentId,
        taskCategory,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        candidates: [],
        reason: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find the best volunteers for a specific task type
   */
  async findBestVolunteersForTask(
    taskCategory: TaskCategory,
    taskPriority: TaskPriority,
    requiredSkills: string[] = [],
    maxCandidates = 5
  ): Promise<VolunteerCandidate[]> {
    try {
      logger.debug('Finding best volunteers for task', {
        taskCategory,
        taskPriority,
        requiredSkills,
        maxCandidates
      });

      const volunteers = await this.getEligibleVolunteers();
      const workloads = await taskService.getVolunteerWorkloads();
      const workloadMap = new Map<string, VolunteerWorkload>();
      workloads.forEach(w => workloadMap.set(w.userId, w));

      const taskRequiredSkills = [
        ...TASK_SKILL_REQUIREMENTS[taskCategory],
        ...requiredSkills
      ];

      const candidates = await this.scoreVolunteers(
        volunteers,
        taskRequiredSkills,
        taskPriority,
        workloadMap
      );

      return candidates
        .filter(candidate => this.meetsMinimumRequirements(candidate, taskRequiredSkills))
        .slice(0, maxCandidates);

    } catch (error) {
      logger.error('Failed to find best volunteers', {
        taskCategory,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get all volunteers eligible for task assignments
   */
  private async getEligibleVolunteers(): Promise<UserProfile[]> {
    try {
      const allProfiles = await firestoreService.getUserProfiles();

      return allProfiles.filter(profile =>
        profile.isApproved &&
        profile.preferences?.taskAssignments &&
        profile.tags && profile.tags.length > 0 &&
        ['contributor', 'canva_contributor', 'editor', 'moderator', 'administrator'].includes(profile.role)
      );

    } catch (error) {
      logger.error('Failed to get eligible volunteers', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Score volunteers based on skills, availability, and workload
   */
  private async scoreVolunteers(
    volunteers: UserProfile[],
    requiredSkills: string[],
    taskPriority: TaskPriority,
    workloadMap: Map<string, VolunteerWorkload>
  ): Promise<VolunteerCandidate[]> {
    const candidates: VolunteerCandidate[] = [];

    for (const volunteer of volunteers) {
      const candidate = await this.scoreVolunteer(
        volunteer,
        requiredSkills,
        taskPriority,
        workloadMap.get(volunteer.uid)
      );
      candidates.push(candidate);
    }

    // Sort by score (highest first)
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Score an individual volunteer
   */
  private async scoreVolunteer(
    volunteer: UserProfile,
    requiredSkills: string[],
    taskPriority: TaskPriority,
    workload?: VolunteerWorkload
  ): Promise<VolunteerCandidate> {
    const candidate: VolunteerCandidate = {
      userProfile: volunteer,
      score: 0,
      matchedSkills: [],
      currentWorkload: workload?.currentTasks || 0,
      availabilityMatch: false,
      reasonsSelected: [],
      reasonsRejected: []
    };

    // 1. Skill matching score
    const volunteerSkills = userUtils.getTagsByNamespace(volunteer, 'skill');
    const matchedSkills = volunteerSkills.filter(skill =>
      requiredSkills.some(required => required.includes(skill))
    );

    candidate.matchedSkills = matchedSkills;

    if (matchedSkills.length > 0) {
      const skillScore = (matchedSkills.length / requiredSkills.length) * this.config.skillMatchWeight;
      candidate.score += skillScore;
      candidate.reasonsSelected.push(`Matches ${matchedSkills.length}/${requiredSkills.length} required skills`);
    } else {
      candidate.reasonsRejected.push('No matching skills found');
    }

    // 2. Availability score
    const availabilityScore = AVAILABILITY_PRIORITY[volunteer.availability] || 0;
    candidate.availabilityMatch = availabilityScore > 0.5;
    candidate.score += availabilityScore * this.config.availabilityWeight;

    if (candidate.availabilityMatch) {
      candidate.reasonsSelected.push(`Available (${volunteer.availability})`);
    } else {
      candidate.reasonsRejected.push(`Limited availability (${volunteer.availability})`);
    }

    // 3. Workload score (inverse - lower workload = higher score)
    const currentWorkload = candidate.currentWorkload;
    const workloadScore = Math.max(0, 1 - (currentWorkload / this.config.maxWorkloadPerVolunteer));
    candidate.score += workloadScore * this.config.workloadWeight;

    if (currentWorkload < this.config.maxWorkloadPerVolunteer) {
      candidate.reasonsSelected.push(`Low workload (${currentWorkload} current tasks)`);
    } else {
      candidate.reasonsRejected.push(`High workload (${currentWorkload} current tasks)`);
    }

    // 4. Priority boost
    candidate.score *= this.config.priorityBoost[taskPriority];

    // 5. Role-based boost
    const roleBoost = this.getRoleBoost(volunteer.role);
    candidate.score *= roleBoost;

    if (roleBoost > 1) {
      candidate.reasonsSelected.push(`Experience level (${volunteer.role})`);
    }

    // Normalize score to 0-100 range
    candidate.score = Math.min(100, candidate.score * 100);

    return candidate;
  }

  /**
   * Check if candidate meets minimum requirements
   */
  private meetsMinimumRequirements(
    candidate: VolunteerCandidate,
    requiredSkills: string[]
  ): boolean {
    // Check skill match percentage
    const skillMatchPercentage = candidate.matchedSkills.length / requiredSkills.length;
    if (skillMatchPercentage < this.config.minRequiredSkillMatch) {
      candidate.reasonsRejected.push(`Insufficient skill match (${Math.round(skillMatchPercentage * 100)}% < ${Math.round(this.config.minRequiredSkillMatch * 100)}%)`);
      return false;
    }

    // Check workload limit
    if (candidate.currentWorkload >= this.config.maxWorkloadPerVolunteer) {
      candidate.reasonsRejected.push(`Workload limit exceeded (${candidate.currentWorkload} >= ${this.config.maxWorkloadPerVolunteer})`);
      return false;
    }

    return true;
  }

  /**
   * Get role-based scoring boost
   */
  private getRoleBoost(role: string): number {
    const roleBoosts: Record<string, number> = {
      'member': 0.8,
      'contributor': 1.0,
      'canva_contributor': 1.1,
      'editor': 1.3,
      'moderator': 1.4,
      'administrator': 1.5
    };

    return roleBoosts[role] || 1.0;
  }

  /**
   * Generate fallback suggestions when no volunteers are available
   */
  private generateFallbackSuggestions(
    taskCategory: TaskCategory,
    candidates: VolunteerCandidate[]
  ): string[] {
    const suggestions: string[] = [];

    if (candidates.length === 0) {
      suggestions.push('Recruit volunteers with relevant skills');
      suggestions.push('Post in community forums for help');
    } else {
      // Analyze why candidates were rejected
      const rejectionReasons = candidates.flatMap(c => c.reasonsRejected);
      const commonReasons = this.getMostCommonReasons(rejectionReasons);

      if (commonReasons.includes('workload')) {
        suggestions.push('Wait for current tasks to be completed');
        suggestions.push('Recruit additional volunteers');
      }

      if (commonReasons.includes('skill')) {
        const requiredSkills = TASK_SKILL_REQUIREMENTS[taskCategory];
        suggestions.push(`Recruit volunteers with skills: ${requiredSkills.join(', ')}`);
        suggestions.push('Provide training for existing volunteers');
      }

      if (commonReasons.includes('availability')) {
        suggestions.push('Adjust task timeline to accommodate volunteer availability');
        suggestions.push('Recruit volunteers with more regular availability');
      }
    }

    suggestions.push('Assign task manually to override automatic assignment');

    return suggestions;
  }

  /**
   * Find most common rejection reasons
   */
  private getMostCommonReasons(reasons: string[]): string[] {
    const reasonCounts = new Map<string, number>();

    reasons.forEach(reason => {
      const key = reason.toLowerCase();
      if (key.includes('workload')) {
        reasonCounts.set('workload', (reasonCounts.get('workload') || 0) + 1);
      } else if (key.includes('skill')) {
        reasonCounts.set('skill', (reasonCounts.get('skill') || 0) + 1);
      } else if (key.includes('availability')) {
        reasonCounts.set('availability', (reasonCounts.get('availability') || 0) + 1);
      }
    });

    return Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  /**
   * Update assignment configuration
   */
  updateConfig(newConfig: Partial<AssignmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Task assignment configuration updated', { newConfig });
  }

  /**
   * Get current configuration
   */
  getConfig(): AssignmentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const taskAssignmentLogic = new TaskAssignmentLogic();

// Export types for use in other modules
export type {
  VolunteerCandidate,
  TaskAssignmentResult,
  AssignmentConfig
};

