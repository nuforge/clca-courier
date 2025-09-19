/**
 * TaskCard Component Test Suite
 * Tests for individual task display and action component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import TaskCard from '../../../src/components/TaskCard.vue';
import { taskService } from '../../../src/services/task.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { firebaseAuthService } from '../../../src/services/firebase-auth.service';
import { Timestamp } from 'firebase/firestore';
import type { TaskDetails } from '../../../src/services/task.service';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';

// Mock dependencies
vi.mock('../../../src/services/task.service');
vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/services/firebase-auth.service');
vi.mock('../../../src/utils/logger');

const mockTaskService = taskService as any;
const mockFirestoreService = firestoreService as any;
const mockFirebaseAuthService = firebaseAuthService as any;

// Global Quasar setup for testing
const quasarWrapper = (component: any, options: any = {}) => {
  return mount(component, {
    global: {
      plugins: [
        [Quasar, {
          plugins: {}
        }]
      ]
    },
    ...options
  });
};

describe('TaskCard', () => {
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
    tags: ['skill:writing'],
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

  const createMockTask = (overrides: Partial<TaskDetails> = {}): TaskDetails => ({
    taskId: 'test-task-id',
    contentId: 'test-content-id',
    contentTitle: 'Test Article Title',
    contentAuthor: 'Content Author',
    task: {
      category: 'review',
      estimatedTime: 30,
      status: 'unclaimed',
      priority: 'medium',
      instructions: 'Please review this article carefully',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirebaseAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockFirestoreService.getUserProfile.mockResolvedValue(mockUserProfile);
    mockTaskService.assignTask.mockResolvedValue(undefined);
    mockTaskService.updateTaskStatus.mockResolvedValue(undefined);
  });

  describe('Task Display', () => {
    it('should render task information correctly', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails }
      });

      expect(wrapper.text()).toContain('Test Article Title');
      expect(wrapper.text()).toContain('Content Author');
      expect(wrapper.text()).toContain('30'); // estimated time
      expect(wrapper.text()).toContain('Please review this article carefully');
    });

    it('should display correct category chip', () => {
      const taskDetails = createMockTask({
        task: { ...createMockTask().task, category: 'layout' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails }
      });

      const categoryChip = wrapper.find('[data-testid="category-chip"]');
      expect(categoryChip.exists()).toBe(true);
    });

    it('should display correct priority chip with appropriate color', () => {
      const highPriorityTask = createMockTask({
        task: { ...createMockTask().task, priority: 'high' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: highPriorityTask }
      });

      const priorityChip = wrapper.find('[data-testid="priority-chip"]');
      expect(priorityChip.exists()).toBe(true);
    });

    it('should display status chip with correct styling', () => {
      const claimedTask = createMockTask({
        task: { ...createMockTask().task, status: 'claimed', assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: claimedTask }
      });

      const statusChip = wrapper.find('[data-testid="status-chip"]');
      expect(statusChip.exists()).toBe(true);
    });

    it('should show due date when present', () => {
      const taskWithDueDate = createMockTask({
        task: {
          ...createMockTask().task,
          dueDate: Timestamp.fromDate(new Date('2025-12-31T10:00:00Z'))
        },
        timeRemaining: 120 // 2 hours remaining
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: taskWithDueDate }
      });

      expect(wrapper.text()).toContain('Due date');
      expect(wrapper.text()).toContain('2h'); // time remaining
    });

    it('should indicate overdue tasks', () => {
      const overdueTask = createMockTask({
        task: {
          ...createMockTask().task,
          dueDate: Timestamp.fromDate(new Date('2025-01-01T10:00:00Z'))
        },
        timeRemaining: -60, // 1 hour overdue
        isOverdue: true
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: overdueTask }
      });

      expect(wrapper.find('.text-negative').exists()).toBe(true);
    });

    it('should show assigned user when task is assigned', () => {
      const assignedTask = createMockTask({
        task: { ...createMockTask().task, assignedTo: 'other-user' },
        assignedUserName: 'Other User'
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: assignedTask }
      });

      expect(wrapper.text()).toContain('Assigned to');
      expect(wrapper.text()).toContain('Other User');
    });

    it('should display created and updated timestamps', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails }
      });

      expect(wrapper.text()).toContain('Created');
    });
  });

  describe('Action Buttons', () => {
    it('should show claim button for unclaimed tasks', () => {
      const unclaimedTask = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: unclaimedTask, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      expect(claimButton.exists()).toBe(true);
      expect(claimButton.text()).toContain('Claim');
    });

    it('should show start button for claimed tasks assigned to current user', () => {
      const claimedTask = createMockTask({
        task: { ...createMockTask().task, status: 'claimed', assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: claimedTask, showActions: true }
      });

      const startButton = wrapper.find('[data-testid="start-button"]');
      expect(startButton.exists()).toBe(true);
      expect(startButton.text()).toContain('Start');
    });

    it('should show complete button for in-progress tasks assigned to current user', () => {
      const inProgressTask = createMockTask({
        task: { ...createMockTask().task, status: 'in-progress', assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: inProgressTask, showActions: true }
      });

      const completeButton = wrapper.find('[data-testid="complete-button"]');
      expect(completeButton.exists()).toBe(true);
      expect(completeButton.text()).toContain('Complete');
    });

    it('should always show view content button', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true }
      });

      const viewButton = wrapper.find('[data-testid="view-content-button"]');
      expect(viewButton.exists()).toBe(true);
      expect(viewButton.text()).toContain('View Content');
    });

    it('should show admin actions when enabled', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      const manageButton = wrapper.find('[data-testid="manage-button"]');
      expect(manageButton.exists()).toBe(true);
      expect(manageButton.text()).toContain('Manage');
    });

    it('should hide actions when showActions is false', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: false }
      });

      const actionsSection = wrapper.find('[data-testid="card-actions"]');
      expect(actionsSection.exists()).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should handle task claiming', async () => {
      const unclaimedTask = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: unclaimedTask, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      await claimButton.trigger('click');

      expect(mockTaskService.assignTask).toHaveBeenCalledWith(
        'test-content-id',
        'test-user-id',
        'self-claimed'
      );
    });

    it('should handle task status updates', async () => {
      const claimedTask = createMockTask({
        task: { ...createMockTask().task, status: 'claimed', assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: claimedTask, showActions: true }
      });

      const startButton = wrapper.find('[data-testid="start-button"]');
      await startButton.trigger('click');

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
        'test-content-id',
        'in-progress'
      );
    });

    it('should emit taskUpdated when task changes', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      await claimButton.trigger('click');

      // Wait for async operations
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('taskUpdated')).toBeTruthy();
    });

    it('should emit viewContent when view button is clicked', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true }
      });

      const viewButton = wrapper.find('[data-testid="view-content-button"]');
      await viewButton.trigger('click');

      expect(wrapper.emitted('viewContent')).toBeTruthy();
      expect(wrapper.emitted('viewContent')![0]).toEqual(['test-content-id']);
    });
  });

  describe('Task Management Dialog', () => {
    beforeEach(() => {
      mockFirestoreService.getUserProfiles.mockResolvedValue([
        mockUserProfile,
        {
          ...mockUserProfile,
          uid: 'other-user',
          displayName: 'Other User'
        }
      ]);
    });

    it('should open management dialog when manage button is clicked', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      const manageButton = wrapper.find('[data-testid="manage-button"]');
      await manageButton.trigger('click');

      await wrapper.vm.$nextTick();

      const dialog = wrapper.find('[data-testid="manage-dialog"]');
      expect(dialog.exists()).toBe(true);
    });

    it('should load available users for reassignment', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      const manageButton = wrapper.find('[data-testid="manage-button"]');
      await manageButton.trigger('click');

      await wrapper.vm.$nextTick();

      expect(mockFirestoreService.getUserProfiles).toHaveBeenCalled();
    });

    it('should handle task reassignment', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      // Open dialog
      const manageButton = wrapper.find('[data-testid="manage-button"]');
      await manageButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Select new user and save
      wrapper.vm.selectedUser = 'other-user';
      const saveButton = wrapper.find('[data-testid="save-changes-button"]');
      await saveButton.trigger('click');

      expect(mockTaskService.assignTask).toHaveBeenCalledWith(
        'test-content-id',
        'other-user',
        'manual'
      );
    });

    it('should handle status updates in management dialog', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      // Open dialog
      const manageButton = wrapper.find('[data-testid="manage-button"]');
      await manageButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Change status and save
      wrapper.vm.selectedStatus = 'completed';
      const saveButton = wrapper.find('[data-testid="save-changes-button"]');
      await saveButton.trigger('click');

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
        'test-content-id',
        'completed'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle claim errors gracefully', async () => {
      mockTaskService.assignTask.mockRejectedValue(new Error('Assignment failed'));

      const unclaimedTask = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: unclaimedTask, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      await claimButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Task should not be updated on error
      expect(wrapper.emitted('taskUpdated')).toBeFalsy();
    });

    it('should handle status update errors gracefully', async () => {
      mockTaskService.updateTaskStatus.mockRejectedValue(new Error('Update failed'));

      const claimedTask = createMockTask({
        task: { ...createMockTask().task, status: 'claimed', assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: claimedTask, showActions: true }
      });

      const startButton = wrapper.find('[data-testid="start-button"]');
      await startButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Task should not be updated on error
      expect(wrapper.emitted('taskUpdated')).toBeFalsy();
    });

    it('should handle user loading errors in management dialog', async () => {
      mockFirestoreService.getUserProfiles.mockRejectedValue(new Error('Failed to load users'));

      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true, showAdminActions: true }
      });

      const manageButton = wrapper.find('[data-testid="manage-button"]');
      await manageButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Dialog should not open on error
      const dialog = wrapper.find('[data-testid="manage-dialog"]');
      expect(dialog.exists()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      const unclaimedTask = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: unclaimedTask, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      expect(claimButton.attributes('aria-label')).toBeTruthy();
    });

    it('should have proper role attributes', () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails }
      });

      const card = wrapper.find('.task-card');
      expect(card.exists()).toBe(true);
    });

    it('should handle keyboard navigation', async () => {
      const taskDetails = createMockTask();
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails, showActions: true }
      });

      const claimButton = wrapper.find('[data-testid="claim-button"]');
      await claimButton.trigger('keydown.enter');

      expect(mockTaskService.assignTask).toHaveBeenCalled();
    });
  });

  describe('Card Styling', () => {
    it('should apply high priority styling', () => {
      const highPriorityTask = createMockTask({
        task: { ...createMockTask().task, priority: 'high' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: highPriorityTask }
      });

      expect(wrapper.find('.task-card--high-priority').exists()).toBe(true);
    });

    it('should apply overdue styling', () => {
      const overdueTask = createMockTask({
        isOverdue: true
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: overdueTask }
      });

      expect(wrapper.find('.task-card--overdue').exists()).toBe(true);
    });

    it('should apply assigned styling', () => {
      const assignedTask = createMockTask({
        task: { ...createMockTask().task, assignedTo: 'test-user-id' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: assignedTask }
      });

      expect(wrapper.find('.task-card--assigned').exists()).toBe(true);
    });

    it('should apply completed styling', () => {
      const completedTask = createMockTask({
        task: { ...createMockTask().task, status: 'completed' }
      });
      const wrapper = quasarWrapper(TaskCard, {
        props: { taskDetails: completedTask }
      });

      expect(wrapper.find('.task-card--completed').exists()).toBe(true);
    });
  });
});

