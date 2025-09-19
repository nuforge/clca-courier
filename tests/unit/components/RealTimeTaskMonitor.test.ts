/**
 * Real-Time Task Monitor Component Test Suite
 *
 * Tests for the real-time task monitoring dashboard component including
 * live updates, volunteer workload tracking, and activity monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar, Notify } from 'quasar';
import { nextTick } from 'vue';
import { Timestamp } from 'firebase/firestore';

import RealTimeTaskMonitor from '../../../src/components/RealTimeTaskMonitor.vue';
import { contentQueryService } from '../../../src/services/contentQueryService';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { logger } from '../../../src/utils/logger';
import type { TaskStatistics } from '../../../src/services/contentQueryService';
import type { ContentDoc } from '../../../src/types/core/content.types';

// Mock dependencies
vi.mock('../../../src/services/contentQueryService');
vi.mock('../../../src/services/firebase-firestore.service');
vi.mock('../../../src/utils/logger');
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock Quasar notify
const mockNotify = vi.fn();
vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useQuasar: () => ({
      notify: mockNotify
    })
  };
});

describe('RealTimeTaskMonitor', () => {
  let wrapper: VueWrapper<any>;
  let pinia: any;

  const mockTaskStatistics: TaskStatistics = {
    totalTasks: 25,
    tasksByStatus: {
      'unclaimed': 5,
      'claimed': 8,
      'in-progress': 7,
      'completed': 5
    },
    tasksByCategory: {
      'review': 10,
      'layout': 6,
      'fact-check': 4,
      'approve': 3,
      'print': 2
    },
    tasksByPriority: {
      'low': 8,
      'medium': 12,
      'high': 5
    },
    averageCompletionTime: 24.5,
    overdueTasks: 3,
    approachingDeadlines: 4,
    unassignedTasks: 5,
    volunteerWorkload: {
      'volunteer-1': {
        activeTasks: 3,
        completedTasks: 8,
        averageTime: 18.5
      },
      'volunteer-2': {
        activeTasks: 2,
        completedTasks: 5,
        averageTime: 22.0
      }
    },
    contentByType: {
      'news': 15,
      'event': 6,
      'announcement': 4
    },
    monthlyStats: []
  };

  const mockVolunteerProfile = {
    uid: 'volunteer-1',
    displayName: 'Test Volunteer',
    email: 'volunteer@example.com',
    role: 'contributor',
    tags: ['skill:writing'],
    availability: 'regular'
  };

  const mockContentWithTask: ContentDoc = {
    id: 'content-123',
    title: 'Test Article',
    description: 'Test content',
    authorId: 'author-123',
    authorName: 'Test Author',
    tags: ['content-type:news'],
    features: {
      'feat:task': {
        category: 'review',
        estimatedTime: 30,
        status: 'claimed',
        priority: 'medium',
        assignedTo: 'volunteer-1',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    },
    status: 'draft',
    timestamps: {
      created: Timestamp.now(),
      updated: Timestamp.now()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Pinia
    pinia = createTestingPinia({
      createSpy: vi.fn
    });

    // Mock contentQueryService methods
    vi.mocked(contentQueryService.getTaskStatistics).mockResolvedValue(mockTaskStatistics);
    vi.mocked(contentQueryService.queryTaskContent).mockResolvedValue({
      content: [mockContentWithTask],
      hasMore: false
    });
    vi.mocked(contentQueryService.subscribeToTaskContent).mockReturnValue(() => {});

    // Mock firestoreService
    vi.mocked(firestoreService.getUserProfile).mockResolvedValue(mockVolunteerProfile);

    // Mock global components and plugins
    const globalMocks = {
      $t: (key: string) => key,
      $q: { notify: mockNotify }
    };

    wrapper = mount(RealTimeTaskMonitor, {
      global: {
        plugins: [
          [Quasar, {
            plugins: [Notify]
          }],
          pinia
        ],
        mocks: globalMocks,
        stubs: {
          'q-card': { template: '<div class="q-card"><slot /></div>' },
          'q-card-section': { template: '<div class="q-card-section"><slot /></div>' },
          'q-separator': { template: '<hr class="q-separator" />' },
          'q-badge': { template: '<span class="q-badge"><slot /></span>' },
          'q-btn': { template: '<button class="q-btn" @click="$emit(\'click\')"><slot /></button>' },
          'q-icon': { template: '<i class="q-icon"><slot /></i>' },
          'q-skeleton': { template: '<div class="q-skeleton"></div>' },
          'q-expansion-item': { template: '<div class="q-expansion-item"><slot /></div>' },
          'q-chip': { template: '<span class="q-chip" @click="$emit(\'click\')"><slot /></span>' },
          'q-timeline': { template: '<div class="q-timeline"><slot /></div>' },
          'q-timeline-entry': { template: '<div class="q-timeline-entry"><slot /></div>' },
          'q-banner': { template: '<div class="q-banner"><slot /></div>' }
        }
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
  });

  describe('component initialization', () => {
    it('should render without errors', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.real-time-task-monitor').exists()).toBe(true);
    });

    it('should display connection status badge', async () => {
      await nextTick();

      const badges = wrapper.findAll('.q-badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should initialize with loading state', () => {
      expect(wrapper.vm.isLoadingWorkload).toBe(true);
      expect(wrapper.vm.isLoadingActivity).toBe(true);
    });

    it('should load initial data on mount', async () => {
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async operations

      expect(contentQueryService.getTaskStatistics).toHaveBeenCalled();
    });
  });

  describe('task statistics display', () => {
    beforeEach(async () => {
      await wrapper.vm.loadTaskStatistics();
      await nextTick();
    });

    it('should display total tasks count', () => {
      expect(wrapper.vm.taskStats.totalTasks).toBe(25);
    });

    it('should display task status distribution', () => {
      const statusStats = wrapper.vm.taskStats.tasksByStatus;
      expect(statusStats.unclaimed).toBe(5);
      expect(statusStats.claimed).toBe(8);
      expect(statusStats.completed).toBe(5);
    });

    it('should display overdue and approaching deadline counts', () => {
      expect(wrapper.vm.taskStats.overdueTasks).toBe(3);
      expect(wrapper.vm.taskStats.approachingDeadlines).toBe(4);
      expect(wrapper.vm.taskStats.unassignedTasks).toBe(5);
    });

    it('should render statistics cards correctly', () => {
      const cards = wrapper.findAll('.q-card .q-card-section');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('volunteer workload display', () => {
    beforeEach(async () => {
      await wrapper.vm.loadWorkloadData();
      await nextTick();
    });

    it('should load volunteer profiles for workload display', () => {
      expect(firestoreService.getUserProfile).toHaveBeenCalledWith('volunteer-1');
      expect(firestoreService.getUserProfile).toHaveBeenCalledWith('volunteer-2');
    });

    it('should display volunteer workload information', async () => {
      await nextTick();

      expect(wrapper.vm.workloadData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            uid: 'volunteer-1',
            displayName: 'Test Volunteer',
            activeTasks: 3,
            completedTasks: 8
          })
        ])
      );
    });

    it('should sort volunteers by active tasks', async () => {
      const sortedData = wrapper.vm.workloadData;
      if (sortedData.length > 1) {
        expect(sortedData[0].activeTasks).toBeGreaterThanOrEqual(sortedData[1].activeTasks);
      }
    });

    it('should handle empty workload data', async () => {
      vi.mocked(contentQueryService.getTaskStatistics).mockResolvedValue({
        ...mockTaskStatistics,
        volunteerWorkload: {}
      });

      await wrapper.vm.loadTaskStatistics();
      await wrapper.vm.loadWorkloadData();
      await nextTick();

      expect(wrapper.vm.workloadData).toHaveLength(0);
    });
  });

  describe('recent activity tracking', () => {
    beforeEach(async () => {
      await wrapper.vm.loadRecentActivity();
      await nextTick();
    });

    it('should load recent task activity', () => {
      expect(contentQueryService.queryTaskContent).toHaveBeenCalledWith(
        expect.objectContaining({
          createdDateRange: expect.any(Object)
        }),
        { field: 'updatedAt', direction: 'desc' },
        { limit: 10 }
      );
    });

    it('should process activity data correctly', async () => {
      await nextTick();

      expect(wrapper.vm.recentActivity).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            contentId: 'content-123',
            title: 'Test Article',
            type: expect.any(String),
            description: expect.any(String)
          })
        ])
      );
    });

    it('should fetch volunteer names for activities', () => {
      expect(firestoreService.getUserProfile).toHaveBeenCalledWith('volunteer-1');
    });
  });

  describe('real-time updates', () => {
    it('should set up real-time subscriptions', async () => {
      await wrapper.vm.initializeRealTimeConnection();

      expect(contentQueryService.subscribeToTaskContent).toHaveBeenCalled();
      expect(wrapper.vm.connectionStatus).toBe('connected');
    });

    it('should handle subscription errors gracefully', async () => {
      vi.mocked(contentQueryService.subscribeToTaskContent).mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      await wrapper.vm.initializeRealTimeConnection();

      expect(wrapper.vm.connectionStatus).toBe('disconnected');
      expect(wrapper.vm.error).toBeTruthy();
    });

    it('should clean up subscriptions on unmount', () => {
      const mockUnsubscribe = vi.fn();
      wrapper.vm.taskStatsUnsubscribe = mockUnsubscribe;

      wrapper.unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('auto refresh functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should toggle auto refresh on button click', async () => {
      const autoRefreshButton = wrapper.find('button[title*="refresh"]');
      expect(wrapper.vm.autoRefresh).toBe(true);

      await autoRefreshButton.trigger('click');
      expect(wrapper.vm.autoRefresh).toBe(false);

      await autoRefreshButton.trigger('click');
      expect(wrapper.vm.autoRefresh).toBe(true);
    });

    it('should start auto refresh interval when enabled', async () => {
      wrapper.vm.autoRefresh = true;
      wrapper.vm.startAutoRefresh();

      // Fast-forward time to trigger refresh
      vi.advanceTimersByTime(30000); // 30 seconds

      expect(contentQueryService.getTaskStatistics).toHaveBeenCalled();
    });

    it('should stop auto refresh when disabled', () => {
      wrapper.vm.startAutoRefresh();
      expect(wrapper.vm.refreshInterval).toBeTruthy();

      wrapper.vm.stopAutoRefresh();
      expect(wrapper.vm.refreshInterval).toBe(null);
    });
  });

  describe('manual refresh', () => {
    it('should trigger manual refresh on button click', async () => {
      const refreshButton = wrapper.find('button[title*="manual"]');

      await refreshButton.trigger('click');

      expect(wrapper.vm.isManualRefreshing).toBe(true);
      expect(contentQueryService.getTaskStatistics).toHaveBeenCalled();
    });

    it('should show success notification on successful refresh', async () => {
      await wrapper.vm.manualRefresh();

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'positive',
          message: 'volunteer.realTimeMonitor.refreshSuccess'
        })
      );
    });

    it('should show error notification on failed refresh', async () => {
      vi.mocked(contentQueryService.getTaskStatistics).mockRejectedValue(new Error('Refresh failed'));

      await wrapper.vm.manualRefresh();

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'negative',
          message: 'volunteer.realTimeMonitor.refreshError'
        })
      );
    });

    it('should prevent multiple simultaneous manual refreshes', async () => {
      wrapper.vm.isManualRefreshing = true;

      await wrapper.vm.manualRefresh();

      // Should not make additional calls while refresh is in progress
      expect(contentQueryService.getTaskStatistics).not.toHaveBeenCalled();
    });
  });

  describe('status icons and colors', () => {
    it('should return correct icons for task statuses', () => {
      expect(wrapper.vm.getStatusIcon('unclaimed')).toBe('help_outline');
      expect(wrapper.vm.getStatusIcon('claimed')).toBe('person');
      expect(wrapper.vm.getStatusIcon('in-progress')).toBe('work');
      expect(wrapper.vm.getStatusIcon('completed')).toBe('check_circle');
    });

    it('should return correct colors for task statuses', () => {
      expect(wrapper.vm.getStatusColor('unclaimed')).toBe('orange');
      expect(wrapper.vm.getStatusColor('claimed')).toBe('blue');
      expect(wrapper.vm.getStatusColor('in-progress')).toBe('purple');
      expect(wrapper.vm.getStatusColor('completed')).toBe('green');
    });

    it('should return correct workload colors based on task count', () => {
      expect(wrapper.vm.getWorkloadColor(0)).toBe('grey');
      expect(wrapper.vm.getWorkloadColor(2)).toBe('blue');
      expect(wrapper.vm.getWorkloadColor(4)).toBe('orange');
      expect(wrapper.vm.getWorkloadColor(6)).toBe('red');
    });

    it('should return correct activity icons for different types', () => {
      expect(wrapper.vm.getActivityIcon('task_created')).toBe('add_task');
      expect(wrapper.vm.getActivityIcon('task_assigned')).toBe('person_add');
      expect(wrapper.vm.getActivityIcon('task_completed')).toBe('task_alt');
      expect(wrapper.vm.getActivityIcon('task_overdue')).toBe('warning');
    });
  });

  describe('navigation and interaction', () => {
    it('should navigate to task details when clicking task chip', async () => {
      const mockRouter = wrapper.vm.$router || { push: vi.fn() };
      wrapper.vm.$router = mockRouter;

      await wrapper.vm.navigateToTask('content-123');

      expect(mockRouter.push).toHaveBeenCalledWith('/volunteer/tasks?highlight=content-123');
    });

    it('should handle task chip clicks in workload display', async () => {
      // Set up workload data
      wrapper.vm.workloadData = [{
        uid: 'volunteer-1',
        displayName: 'Test Volunteer',
        activeTasks: 1,
        completedTasks: 0,
        averageTime: 0,
        recentTasks: [{
          contentId: 'content-123',
          title: 'Test Task',
          category: 'review'
        }]
      }];

      await nextTick();

      // Find and click task chip
      const taskChip = wrapper.find('.q-chip');
      if (taskChip.exists()) {
        await taskChip.trigger('click');
        // Navigation should be triggered
      }
    });
  });

  describe('error handling', () => {
    it('should display error banner when connection fails', async () => {
      wrapper.vm.error = 'Connection failed';
      await nextTick();

      const errorBanner = wrapper.find('.q-banner');
      expect(errorBanner.exists()).toBe(true);
    });

    it('should provide retry functionality', async () => {
      wrapper.vm.error = 'Connection failed';
      await nextTick();

      const retryButton = wrapper.find('button[title*="retry"]');
      if (retryButton.exists()) {
        await retryButton.trigger('click');
        expect(wrapper.vm.error).toBe(null);
      }
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(contentQueryService.getTaskStatistics).mockRejectedValue(new Error('Service error'));

      await wrapper.vm.loadTaskStatistics();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load task statistics',
        expect.any(Object)
      );
    });
  });

  describe('performance optimization', () => {
    it('should debounce rapid refresh requests', async () => {
      const refreshSpy = vi.spyOn(wrapper.vm, 'loadTaskStatistics');

      // Trigger multiple rapid refreshes
      await wrapper.vm.manualRefresh();
      await wrapper.vm.manualRefresh();
      await wrapper.vm.manualRefresh();

      // Should only call once due to isManualRefreshing guard
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    it('should limit the number of recent activities displayed', async () => {
      const manyTasks = Array(20).fill(mockContentWithTask).map((task, i) => ({
        ...task,
        id: `content-${i}`
      }));

      vi.mocked(contentQueryService.queryTaskContent).mockResolvedValue({
        content: manyTasks,
        hasMore: false
      });

      await wrapper.vm.loadRecentActivity();

      // Should limit to reasonable number for performance
      expect(wrapper.vm.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should handle large workload datasets efficiently', async () => {
      const largeWorkload = Object.fromEntries(
        Array(100).fill(null).map((_, i) => [
          `volunteer-${i}`,
          {
            activeTasks: Math.floor(Math.random() * 10),
            completedTasks: Math.floor(Math.random() * 20),
            averageTime: Math.random() * 50
          }
        ])
      );

      vi.mocked(contentQueryService.getTaskStatistics).mockResolvedValue({
        ...mockTaskStatistics,
        volunteerWorkload: largeWorkload
      });

      const startTime = Date.now();
      await wrapper.vm.loadWorkloadData();
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('accessibility', () => {
    it('should provide proper ARIA labels', () => {
      const buttons = wrapper.findAll('button');
      buttons.forEach(button => {
        expect(button.attributes('title')).toBeDefined();
      });
    });

    it('should support keyboard navigation', async () => {
      const focusableElements = wrapper.findAll('button, .q-chip[clickable]');

      focusableElements.forEach(element => {
        expect(element.attributes('tabindex')).not.toBe('-1');
      });
    });

    it('should provide screen reader friendly content', () => {
      const badges = wrapper.findAll('.q-badge');
      badges.forEach(badge => {
        expect(badge.text()).toBeTruthy();
      });
    });
  });
});
