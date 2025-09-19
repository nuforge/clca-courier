/**
 * Task Assignment Logic Test Suite
 * Tests for intelligent volunteer matching and task assignment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskAssignmentLogic } from '../../../src/utils/taskAssignmentLogic';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { taskService } from '../../../src/services/task.service';
import { logger } from '../../../src/utils/logger';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';
import type { TaskCategory, TaskPriority, VolunteerWorkload } from '../../../src/services/task.service';
import type { VolunteerCandidate, TaskAssignmentResult } from '../../../src/utils/taskAssignmentLogic';

// Mock dependencies
vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/services/task.service');
vi.mock('../../../src/utils/logger');

const mockFirestoreService = firestoreService as any;
const mockTaskService = taskService as any;

describe('TaskAssignmentLogic', () => {
  const mockVolunteers: UserProfile[] = [
    {
      uid: 'volunteer-1',
      email: 'writer@example.com',
      displayName: 'Writer Volunteer',
      role: 'contributor',
      permissions: [],
      isApproved: true,
      tags: ['skill:writing', 'skill:editing', 'language:english'],
      availability: 'regular',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: [],
        taskAssignments: true
      },
      createdAt: '2025-01-01T00:00:00Z',
      lastLoginAt: '2025-01-01T00:00:00Z'
    },
    {
      uid: 'volunteer-2',
      email: 'designer@example.com',
      displayName: 'Design Volunteer',
      role: 'canva_contributor',
      permissions: [],
      isApproved: true,
      tags: ['skill:design', 'skill:layout', 'skill:canva'],
      availability: 'occasional',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: [],
        taskAssignments: true
      },
      createdAt: '2025-01-01T00:00:00Z',
      lastLoginAt: '2025-01-01T00:00:00Z'
    },
    {
      uid: 'volunteer-3',
      email: 'researcher@example.com',
      displayName: 'Research Volunteer',
      role: 'editor',
      permissions: [],
      isApproved: true,
      tags: ['skill:research', 'skill:fact-checking', 'skill:verification'],
      availability: 'on-call',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: [],
        taskAssignments: true
      },
      createdAt: '2025-01-01T00:00:00Z',
      lastLoginAt: '2025-01-01T00:00:00Z'
    },
    {
      uid: 'volunteer-4',
      email: 'overloaded@example.com',
      displayName: 'Overloaded Volunteer',
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
    }
  ];

  const mockWorkloads: VolunteerWorkload[] = [
    {
      userId: 'volunteer-1',
      userName: 'Writer Volunteer',
      userEmail: 'writer@example.com',
      currentTasks: 2,
      completedTasks: 15,
      averageCompletionTime: 45,
      skills: ['writing', 'editing'],
      availability: 'regular'
    },
    {
      userId: 'volunteer-2',
      userName: 'Design Volunteer',
      userEmail: 'designer@example.com',
      currentTasks: 1,
      completedTasks: 8,
      averageCompletionTime: 60,
      skills: ['design', 'layout', 'canva'],
      availability: 'occasional'
    },
    {
      userId: 'volunteer-3',
      userName: 'Research Volunteer',
      userEmail: 'researcher@example.com',
      currentTasks: 0,
      completedTasks: 22,
      averageCompletionTime: 35,
      skills: ['research', 'fact-checking', 'verification'],
      availability: 'on-call'
    },
    {
      userId: 'volunteer-4',
      userName: 'Overloaded Volunteer',
      userEmail: 'overloaded@example.com',
      currentTasks: 5, // At maximum workload
      completedTasks: 10,
      averageCompletionTime: 50,
      skills: ['writing', 'editing'],
      availability: 'regular'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockFirestoreService.getUserProfiles.mockResolvedValue(mockVolunteers);
    mockTaskService.getVolunteerWorkloads.mockResolvedValue(mockWorkloads);
    mockTaskService.assignTask.mockResolvedValue(undefined);
  });

  describe('autoAssignTask', () => {
    it('should assign task to best matching volunteer', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing', 'skill:editing'],
        false // not dry run
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo).toBe('volunteer-1'); // Writer with regular availability and low workload
      expect(result.assignedUserName).toBe('Writer Volunteer');
      expect(result.candidates).toHaveLength(3); // All qualified volunteers
      expect(mockTaskService.assignTask).toHaveBeenCalledWith(
        'test-content-id',
        'volunteer-1',
        'automatic'
      );
    });

    it('should not assign task in dry run mode', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true // dry run
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo).toBe('volunteer-1');
      expect(mockTaskService.assignTask).not.toHaveBeenCalled();
    });

    it('should prioritize high priority tasks', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'high', // high priority
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(true);
      // High priority should boost scores, volunteer-1 should still be selected
      expect(result.assignedTo).toBe('volunteer-1');
      expect(result.candidates[0].score).toBeGreaterThan(50); // Boosted score
    });

    it('should select design volunteer for layout tasks', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'layout',
        'medium',
        [],
        true
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo).toBe('volunteer-2'); // Design volunteer
      expect(result.assignedUserName).toBe('Design Volunteer');
    });

    it('should select research volunteer for fact-check tasks', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'fact-check',
        'medium',
        [],
        true
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo).toBe('volunteer-3'); // Research volunteer
      expect(result.assignedUserName).toBe('Research Volunteer');
    });

    it('should fail when no volunteers are available', async () => {
      mockFirestoreService.getUserProfiles.mockResolvedValue([]);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No volunteers available for task assignments');
      expect(result.fallbackSuggestions).toContain('Contact administrators to recruit more volunteers');
    });

    it('should fail when no volunteers meet minimum requirements', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'print', // Requires printing skills that none of our volunteers have
        'medium',
        ['skill:specialized-printing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No volunteers meet the minimum skill requirements for this task');
      expect(result.fallbackSuggestions).toContain('Recruit volunteers with skills: skill:printing, skill:production, skill:logistics');
    });

    it('should exclude overloaded volunteers', async () => {
      // Set volunteer-1 and volunteer-2 to maximum workload
      const overloadedWorkloads = mockWorkloads.map(w => ({
        ...w,
        currentTasks: w.userId === 'volunteer-4' ? 5 : 6 // Over limit
      }));
      mockTaskService.getVolunteerWorkloads.mockResolvedValue(overloadedWorkloads);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'fact-check',
        'medium',
        [],
        true
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo).toBe('volunteer-3'); // Only available volunteer
    });

    it('should provide helpful fallback suggestions', async () => {
      // Create scenario where all volunteers are overloaded
      const overloadedWorkloads = mockWorkloads.map(w => ({
        ...w,
        currentTasks: 6 // All over limit
      }));
      mockTaskService.getVolunteerWorkloads.mockResolvedValue(overloadedWorkloads);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.fallbackSuggestions).toContain('Wait for current tasks to be completed');
      expect(result.fallbackSuggestions).toContain('Recruit additional volunteers');
    });

    it('should handle errors gracefully', async () => {
      mockFirestoreService.getUserProfiles.mockRejectedValue(new Error('Database error'));

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to auto-assign task',
        expect.objectContaining({
          contentId: 'test-content-id',
          taskCategory: 'review',
          error: 'Database error'
        })
      );
    });
  });

  describe('findBestVolunteersForTask', () => {
    it('should return ranked list of best volunteers', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        3
      );

      expect(candidates).toHaveLength(3);
      expect(candidates[0].userProfile.uid).toBe('volunteer-1'); // Best match
      expect(candidates[0].score).toBeGreaterThan(candidates[1].score);
      expect(candidates[1].score).toBeGreaterThan(candidates[2].score);
    });

    it('should limit results to maxCandidates', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        2 // limit to 2
      );

      expect(candidates).toHaveLength(2);
    });

    it('should include matched skills in candidate details', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing', 'skill:editing'],
        5
      );

      const writerCandidate = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      expect(writerCandidate?.matchedSkills).toContain('writing');
      expect(writerCandidate?.matchedSkills).toContain('editing');
    });

    it('should include availability match status', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const regularVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      const onCallVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-3');

      expect(regularVolunteer?.availabilityMatch).toBe(true);
      expect(onCallVolunteer?.availabilityMatch).toBe(false);
    });

    it('should include workload information', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const writerCandidate = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      expect(writerCandidate?.currentWorkload).toBe(2);
    });

    it('should include selection and rejection reasons', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const writerCandidate = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      expect(writerCandidate?.reasonsSelected).toContain('Available (regular)');
      expect(writerCandidate?.reasonsSelected).toContain('Low workload (2 current tasks)');

      const designCandidate = candidates.find(c => c.userProfile.uid === 'volunteer-2');
      expect(designCandidate?.reasonsRejected).toContain('No matching skills found');
    });
  });

  describe('Scoring Algorithm', () => {
    it('should score perfect skill match higher', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'layout',
        'medium',
        ['skill:design', 'skill:layout'],
        5
      );

      const designerScore = candidates.find(c => c.userProfile.uid === 'volunteer-2')?.score || 0;
      const writerScore = candidates.find(c => c.userProfile.uid === 'volunteer-1')?.score || 0;

      expect(designerScore).toBeGreaterThan(writerScore);
    });

    it('should score regular availability higher than occasional', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const regularVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      const occasionalVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-2');

      // Regular should score higher than occasional for availability component
      expect(regularVolunteer?.score).toBeGreaterThan(occasionalVolunteer?.score || 0);
    });

    it('should score lower workload higher', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const lowWorkloadVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-1');
      const overloadedVolunteer = candidates.find(c => c.userProfile.uid === 'volunteer-4');

      expect(lowWorkloadVolunteer?.score).toBeGreaterThan(overloadedVolunteer?.score || 0);
    });

    it('should apply role-based boost correctly', async () => {
      const candidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'fact-check',
        'medium',
        ['skill:research'],
        5
      );

      const editorCandidate = candidates.find(c => c.userProfile.uid === 'volunteer-3');
      expect(editorCandidate?.reasonsSelected).toContain('Experience level (editor)');
    });

    it('should apply priority boost for high priority tasks', async () => {
      const highPriorityCandidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'high',
        ['skill:writing'],
        5
      );

      const mediumPriorityCandidates = await taskAssignmentLogic.findBestVolunteersForTask(
        'review',
        'medium',
        ['skill:writing'],
        5
      );

      const highPriorityScore = highPriorityCandidates[0]?.score || 0;
      const mediumPriorityScore = mediumPriorityCandidates[0]?.score || 0;

      expect(highPriorityScore).toBeGreaterThan(mediumPriorityScore);
    });
  });

  describe('Configuration Management', () => {
    it('should allow updating assignment configuration', () => {
      const newConfig = {
        maxWorkloadPerVolunteer: 3,
        skillMatchWeight: 0.5
      };

      taskAssignmentLogic.updateConfig(newConfig);

      const currentConfig = taskAssignmentLogic.getConfig();
      expect(currentConfig.maxWorkloadPerVolunteer).toBe(3);
      expect(currentConfig.skillMatchWeight).toBe(0.5);
      expect(logger.info).toHaveBeenCalledWith(
        'Task assignment configuration updated',
        { newConfig }
      );
    });

    it('should maintain default values for unchanged config', () => {
      taskAssignmentLogic.updateConfig({ maxWorkloadPerVolunteer: 3 });

      const config = taskAssignmentLogic.getConfig();
      expect(config.maxWorkloadPerVolunteer).toBe(3);
      expect(config.skillMatchWeight).toBe(0.4); // Default value
    });
  });

  describe('Edge Cases', () => {
    it('should handle volunteers with no skills', async () => {
      const volunteersWithNoSkills = mockVolunteers.map(v => ({
        ...v,
        tags: [] // No skills
      }));
      mockFirestoreService.getUserProfiles.mockResolvedValue(volunteersWithNoSkills);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No volunteers meet the minimum skill requirements for this task');
    });

    it('should handle tasks with no required skills', async () => {
      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        [], // No specific skills required
        true
      );

      expect(result.success).toBe(true);
      // Should still work with default task category skills
    });

    it('should handle volunteers with task assignments disabled', async () => {
      const volunteersOptedOut = mockVolunteers.map(v => ({
        ...v,
        preferences: { ...v.preferences, taskAssignments: false }
      }));
      mockFirestoreService.getUserProfiles.mockResolvedValue(volunteersOptedOut);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No volunteers available for task assignments');
    });

    it('should handle missing workload data gracefully', async () => {
      mockTaskService.getVolunteerWorkloads.mockResolvedValue([]);

      const result = await taskAssignmentLogic.autoAssignTask(
        'test-content-id',
        'review',
        'medium',
        ['skill:writing'],
        true
      );

      // Should still work, just assume zero workload for all volunteers
      expect(result.success).toBe(true);
    });
  });
});

