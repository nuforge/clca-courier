<template>
  <q-card class="real-time-task-monitor">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="text-h6">
          {{ $t('volunteer.realTimeMonitor.title') }}
        </div>
        <div class="row items-center q-gutter-sm">
          <q-badge
            v-if="connectionStatus === 'connected'"
            color="positive"
            :label="$t('volunteer.realTimeMonitor.connected')"
          />
          <q-badge
            v-else-if="connectionStatus === 'connecting'"
            color="orange"
            :label="$t('volunteer.realTimeMonitor.connecting')"
          />
          <q-badge
            v-else
            color="negative"
            :label="$t('volunteer.realTimeMonitor.disconnected')"
          />
          <q-btn
            flat
            round
            :icon="autoRefresh ? 'pause' : 'play_arrow'"
            :color="autoRefresh ? 'negative' : 'positive'"
            @click="toggleAutoRefresh"
            :title="autoRefresh ? $t('volunteer.realTimeMonitor.pauseRefresh') : $t('volunteer.realTimeMonitor.startRefresh')"
          />
          <q-btn
            flat
            round
            icon="refresh"
            color="primary"
            @click="manualRefresh"
            :loading="isManualRefreshing"
            :title="$t('volunteer.realTimeMonitor.manualRefresh')"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Task Statistics Overview -->
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        {{ $t('volunteer.realTimeMonitor.overview') }}
      </div>
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section class="text-center">
              <div class="text-h4 text-blue">{{ taskStats.totalTasks }}</div>
              <div class="text-caption">{{ $t('volunteer.realTimeMonitor.totalTasks') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-orange-1">
            <q-card-section class="text-center">
              <div class="text-h4 text-orange">{{ taskStats.unassignedTasks }}</div>
              <div class="text-caption">{{ $t('volunteer.realTimeMonitor.unassigned') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-red-1">
            <q-card-section class="text-center">
              <div class="text-h4 text-red">{{ taskStats.overdueTasks }}</div>
              <div class="text-caption">{{ $t('volunteer.realTimeMonitor.overdue') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-yellow-1">
            <q-card-section class="text-center">
              <div class="text-h4 text-yellow-8">{{ taskStats.approachingDeadlines }}</div>
              <div class="text-caption">{{ $t('volunteer.realTimeMonitor.approaching') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Task Status Distribution -->
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        {{ $t('volunteer.realTimeMonitor.statusDistribution') }}
      </div>
      <div class="row q-gutter-md">
        <div
          v-for="(count, status) in taskStats.tasksByStatus"
          :key="status"
          class="col-auto"
        >
          <div class="flex items-center q-gutter-sm">
            <q-icon
              :name="getStatusIcon(status as TaskStatus)"
              :color="getStatusColor(status as TaskStatus)"
              size="sm"
            />
            <span class="text-body2">
              {{ $t(`volunteer.taskStatus.${status}`) }}: {{ count }}
            </span>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Volunteer Workload Overview -->
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        {{ $t('volunteer.realTimeMonitor.volunteerWorkload') }}
      </div>

      <q-skeleton v-if="isLoadingWorkload" type="rect" height="200px" />

      <div v-else-if="workloadData.length === 0" class="text-center text-grey-6 q-py-lg">
        <q-icon name="person_off" size="md" class="q-mb-sm" />
        <div>{{ $t('volunteer.realTimeMonitor.noVolunteers') }}</div>
      </div>

      <div v-else class="q-gutter-sm">
        <q-expansion-item
          v-for="volunteer in workloadData"
          :key="volunteer.uid"
          :label="volunteer.displayName"
          :caption="`${volunteer.activeTasks} ${$t('volunteer.realTimeMonitor.activeTasks')}, ${volunteer.completedTasks} ${$t('volunteer.realTimeMonitor.completed')}`"
          :header-class="getWorkloadHeaderClass(volunteer.activeTasks)"
        >
          <q-card flat>
            <q-card-section>
              <div class="row q-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-chip
                    :color="getWorkloadColor(volunteer.activeTasks)"
                    text-color="white"
                    :label="`${volunteer.activeTasks} ${$t('volunteer.realTimeMonitor.active')}`"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-chip
                    color="positive"
                    text-color="white"
                    :label="`${volunteer.completedTasks} ${$t('volunteer.realTimeMonitor.completed')}`"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-chip
                    color="grey-6"
                    text-color="white"
                    :label="`${volunteer.averageTime.toFixed(1)}h ${$t('volunteer.realTimeMonitor.avgTime')}`"
                  />
                </div>
              </div>

              <div v-if="volunteer.recentTasks.length > 0" class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">
                  {{ $t('volunteer.realTimeMonitor.recentTasks') }}
                </div>
                <div class="q-gutter-xs">
                  <q-chip
                    v-for="task in volunteer.recentTasks"
                    :key="task.contentId"
                    size="sm"
                    :color="getTaskCategoryColor(task.category)"
                    text-color="white"
                    :label="task.title"
                    clickable
                    @click="navigateToTask(task.contentId)"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Recent Activity Timeline -->
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        {{ $t('volunteer.realTimeMonitor.recentActivity') }}
      </div>

      <q-skeleton v-if="isLoadingActivity" type="text" class="text-subtitle1" />
      <q-skeleton v-if="isLoadingActivity" type="text" />
      <q-skeleton v-if="isLoadingActivity" type="text" width="60%" />

      <q-timeline v-else-if="recentActivity.length > 0" color="primary">
        <q-timeline-entry
          v-for="activity in recentActivity"
          :key="`${activity.contentId}-${activity.timestamp}`"
          :title="activity.title"
          :subtitle="formatTimestamp(activity.timestamp)"
          :icon="getActivityIcon(activity.type)"
          :color="getActivityColor(activity.type)"
        >
          <div class="text-body2">
            {{ activity.description }}
          </div>
          <div v-if="activity.volunteerName" class="text-caption text-grey-6">
            {{ $t('volunteer.realTimeMonitor.by') }} {{ activity.volunteerName }}
          </div>
        </q-timeline-entry>
      </q-timeline>

      <div v-else class="text-center text-grey-6 q-py-lg">
        <q-icon name="timeline" size="md" class="q-mb-sm" />
        <div>{{ $t('volunteer.realTimeMonitor.noActivity') }}</div>
      </div>
    </q-card-section>

    <!-- Error Display -->
    <q-banner v-if="error" class="bg-red-1 text-red">
      <template v-slot:avatar>
        <q-icon name="error" color="red" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn
          flat
          color="red"
          :label="$t('volunteer.realTimeMonitor.retry')"
          @click="retryConnection"
        />
      </template>
    </q-banner>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { Unsubscribe } from 'firebase/firestore';

import { contentQueryService, type TaskStatistics } from '../services/contentQueryService';
import { firestoreService } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';
import { formatDateTime, getRelativeTime } from '../utils/date-formatter';
import type { ContentDoc } from '../types/core/content.types';
import type { TaskCategory, TaskStatus } from '../services/task.service';

// Interfaces
interface VolunteerWorkload {
  uid: string;
  displayName: string;
  activeTasks: number;
  completedTasks: number;
  averageTime: number;
  recentTasks: Array<{
    contentId: string;
    title: string;
    category: TaskCategory;
  }>;
}

interface ActivityEvent {
  contentId: string;
  title: string;
  description: string;
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'task_overdue';
  timestamp: Date;
  volunteerName?: string;
}

// Composables
const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

// Reactive state
const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('disconnected');
const autoRefresh = ref(true);
const isManualRefreshing = ref(false);
const isLoadingWorkload = ref(true);
const isLoadingActivity = ref(true);
const error = ref<string | null>(null);

// Data
const taskStats = ref<TaskStatistics>({
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
});

const workloadData = ref<VolunteerWorkload[]>([]);
const recentActivity = ref<ActivityEvent[]>([]);

// Subscriptions
let taskStatsUnsubscribe: Unsubscribe | null = null;
let activityUnsubscribe: Unsubscribe | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

// Computed
const formattedLastUpdate = computed(() => {
  return formatDateTime(new Date());
});

// Methods
const getStatusIcon = (status: TaskStatus): string => {
  const icons = {
    'unclaimed': 'help_outline',
    'claimed': 'person',
    'in-progress': 'work',
    'completed': 'check_circle'
  };
  return icons[status] || 'help';
};

const getStatusColor = (status: TaskStatus): string => {
  const colors = {
    'unclaimed': 'orange',
    'claimed': 'blue',
    'in-progress': 'purple',
    'completed': 'green'
  };
  return colors[status] || 'grey';
};

const getWorkloadColor = (activeTasks: number): string => {
  if (activeTasks >= 5) return 'red';
  if (activeTasks >= 3) return 'orange';
  if (activeTasks >= 1) return 'blue';
  return 'grey';
};

const getWorkloadHeaderClass = (activeTasks: number): string => {
  if (activeTasks >= 5) return 'bg-red-1';
  if (activeTasks >= 3) return 'bg-orange-1';
  return '';
};

const getTaskCategoryColor = (category: TaskCategory): string => {
  const colors = {
    'review': 'blue',
    'layout': 'purple',
    'fact-check': 'orange',
    'approve': 'green',
    'print': 'brown'
  };
  return colors[category] || 'grey';
};

const getActivityIcon = (type: ActivityEvent['type']): string => {
  const icons = {
    'task_created': 'add_task',
    'task_assigned': 'person_add',
    'task_completed': 'task_alt',
    'task_overdue': 'warning'
  };
  return icons[type] || 'info';
};

const getActivityColor = (type: ActivityEvent['type']): string => {
  const colors = {
    'task_created': 'blue',
    'task_assigned': 'green',
    'task_completed': 'positive',
    'task_overdue': 'negative'
  };
  return colors[type] || 'grey';
};

const formatTimestamp = (timestamp: Date): string => {
  return getRelativeTime(timestamp);
};

const navigateToTask = (contentId: string): void => {
  router.push(`/volunteer/tasks?highlight=${contentId}`);
};

const toggleAutoRefresh = (): void => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }

  logger.info('Auto refresh toggled', { autoRefresh: autoRefresh.value });
};

const manualRefresh = async (): Promise<void> => {
  if (isManualRefreshing.value) return;

  isManualRefreshing.value = true;
  error.value = null;

  try {
    await Promise.all([
      loadTaskStatistics(),
      loadWorkloadData(),
      loadRecentActivity()
    ]);

    $q.notify({
      type: 'positive',
      message: t('volunteer.realTimeMonitor.refreshSuccess'),
      timeout: 1000
    });

  } catch (err) {
    logger.error('Manual refresh failed', { error: err });
    error.value = t('volunteer.realTimeMonitor.refreshError');

    $q.notify({
      type: 'negative',
      message: t('volunteer.realTimeMonitor.refreshError'),
      timeout: 3000
    });
  } finally {
    isManualRefreshing.value = false;
  }
};

const retryConnection = async (): Promise<void> => {
  error.value = null;
  await initializeRealTimeConnection();
};

const startAutoRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(async () => {
    try {
      await Promise.all([
        loadTaskStatistics(),
        loadWorkloadData(),
        loadRecentActivity()
      ]);
    } catch (err) {
      logger.error('Auto refresh failed', { error: err });
    }
  }, 30000); // Refresh every 30 seconds
};

const stopAutoRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const loadTaskStatistics = async (): Promise<void> => {
  try {
    const stats = await contentQueryService.getTaskStatistics();
    taskStats.value = stats;

    logger.debug('Task statistics loaded', {
      totalTasks: stats.totalTasks,
      overdueTasks: stats.overdueTasks
    });

  } catch (err) {
    logger.error('Failed to load task statistics', { error: err });
    throw err;
  }
};

const loadWorkloadData = async (): Promise<void> => {
  try {
    isLoadingWorkload.value = true;

    const workloadEntries = Object.entries(taskStats.value.volunteerWorkload);
    const workloadPromises = workloadEntries.map(async ([uid, data]) => {
      try {
        const profile = await firestoreService.getUserProfile(uid);
        if (!profile) return null;

        // Get recent tasks for this volunteer
        const recentTasksResult = await contentQueryService.queryTaskContent(
          { assignedTo: uid, taskStatus: ['claimed', 'in-progress'] },
          { field: 'updatedAt', direction: 'desc' },
          { limit: 3 }
        );

        const recentTasks = recentTasksResult.content.map(content => ({
          contentId: content.id,
          title: content.title.length > 20 ? `${content.title.substring(0, 20)}...` : content.title,
          category: content.features['feat:task']?.category || 'review'
        }));

        return {
          uid,
          displayName: profile.displayName,
          activeTasks: data.activeTasks,
          completedTasks: data.completedTasks,
          averageTime: data.averageTime,
          recentTasks
        };
      } catch (err) {
        logger.error('Failed to load volunteer data', { uid, error: err });
        return null;
      }
    });

    const results = await Promise.all(workloadPromises);
    workloadData.value = results.filter(Boolean) as VolunteerWorkload[];

    // Sort by active tasks (highest first)
    workloadData.value.sort((a, b) => b.activeTasks - a.activeTasks);

  } catch (err) {
    logger.error('Failed to load workload data', { error: err });
    throw err;
  } finally {
    isLoadingWorkload.value = false;
  }
};

const loadRecentActivity = async (): Promise<void> => {
  try {
    isLoadingActivity.value = true;

    // Get recent task updates from the last 24 hours
    const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000));

    const recentTasksResult = await contentQueryService.queryTaskContent(
      {
        createdDateRange: {
          start: new Date(yesterday) as any // Type conversion for Timestamp
        }
      },
      { field: 'updatedAt', direction: 'desc' },
      { limit: 10 }
    );

    const activities: ActivityEvent[] = [];

    for (const content of recentTasksResult.content) {
      const task = content.features['feat:task'];
      if (!task) continue;

      let volunteerName = '';
      if (task.assignedTo) {
        try {
          const profile = await firestoreService.getUserProfile(task.assignedTo);
          volunteerName = profile?.displayName || 'Unknown Volunteer';
        } catch (err) {
          logger.warn('Failed to get volunteer name', { uid: task.assignedTo });
        }
      }

      // Determine activity type and description
      let activityType: ActivityEvent['type'];
      let description: string;

      if (task.status === 'completed') {
        activityType = 'task_completed';
        description = t('volunteer.realTimeMonitor.taskCompleted', { category: t(`volunteer.taskCategory.${task.category}`) });
      } else if (task.assignedTo && task.status === 'claimed') {
        activityType = 'task_assigned';
        description = t('volunteer.realTimeMonitor.taskAssigned', { category: t(`volunteer.taskCategory.${task.category}`) });
      } else {
        activityType = 'task_created';
        description = t('volunteer.realTimeMonitor.taskCreated', { category: t(`volunteer.taskCategory.${task.category}`) });
      }

      activities.push({
        contentId: content.id,
        title: content.title,
        description,
        type: activityType,
        timestamp: content.timestamps.updated.toDate(),
        volunteerName
      });
    }

    recentActivity.value = activities;

  } catch (err) {
    logger.error('Failed to load recent activity', { error: err });
    throw err;
  } finally {
    isLoadingActivity.value = false;
  }
};

const initializeRealTimeConnection = async (): Promise<void> => {
  try {
    connectionStatus.value = 'connecting';
    error.value = null;

    // Load initial data
    await Promise.all([
      loadTaskStatistics(),
      loadWorkloadData(),
      loadRecentActivity()
    ]);

    // Set up real-time subscriptions
    taskStatsUnsubscribe = contentQueryService.subscribeToTaskContent(
      {}, // All tasks
      async () => {
        // Reload statistics when tasks change
        await loadTaskStatistics();
        await loadWorkloadData();
      },
      { limit: 100 }
    );

    connectionStatus.value = 'connected';

    // Start auto refresh if enabled
    if (autoRefresh.value) {
      startAutoRefresh();
    }

    logger.info('Real-time task monitor initialized');

  } catch (err) {
    logger.error('Failed to initialize real-time connection', { error: err });
    connectionStatus.value = 'disconnected';
    error.value = t('volunteer.realTimeMonitor.connectionError');
    throw err;
  }
};

const cleanup = (): void => {
  if (taskStatsUnsubscribe) {
    taskStatsUnsubscribe();
    taskStatsUnsubscribe = null;
  }

  if (activityUnsubscribe) {
    activityUnsubscribe();
    activityUnsubscribe = null;
  }

  stopAutoRefresh();

  logger.debug('Real-time task monitor cleaned up');
};

// Lifecycle
onMounted(async () => {
  try {
    await initializeRealTimeConnection();
  } catch (err) {
    // Error already handled in initializeRealTimeConnection
  }
});

onUnmounted(() => {
  cleanup();
});

// Watch for auto refresh changes
watch(autoRefresh, (newValue) => {
  if (newValue) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});
</script>

<style scoped>
.real-time-task-monitor {
  min-height: 500px;
}

/* Accessibility improvements */
.real-time-task-monitor :focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Animation for status changes */
.q-badge {
  transition: all 0.3s ease;
}

/* Timeline entry hover effect */
.q-timeline-entry:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

/* Workload indicators */
.bg-red-1 {
  border-left: 4px solid var(--q-red);
}

.bg-orange-1 {
  border-left: 4px solid var(--q-orange);
}
</style>
