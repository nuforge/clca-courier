<!--
  Task Management Page - Dedicated page for volunteer workflow management
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <AdminHeaderSection
        :title="$t('pages.taskManagement.title')"
        :subtitle="$t('pages.taskManagement.subtitle')"
        :icon="UI_ICONS.assignment"
        :show-refresh="true"
        :refresh-label="$t('common.refresh')"
        :loading="isLoadingStats"
        @refresh="refreshTaskStats"
      />

      <!-- Task Statistics Overview -->
      <div v-if="taskStats" class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.assignment" color="blue" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ taskStats.inProgressTasks }}</div>
              <div class="text-caption text-grey-6">{{ $t('pages.taskManagement.stats.activeTasks') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.assignment" color="orange" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ taskStats.unclaimedTasks }}</div>
              <div class="text-caption text-grey-6">{{ $t('pages.taskManagement.stats.unclaimed') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.checkCircle" color="positive" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ taskStats.completedTasks }}</div>
              <div class="text-caption text-grey-6">{{ $t('pages.taskManagement.stats.completed') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.warning" color="negative" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ taskStats.overdueTasks }}</div>
              <div class="text-caption text-grey-6">{{ $t('pages.taskManagement.stats.overdue') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Task Management Tabs -->
      <BaseTabbedContent
        v-model:active-tab="activeTab"
        :tabs="taskTabs"
      >
        <!-- All Tasks Tab -->
        <template #all-tasks>
          <TaskList
            title="All Editorial Tasks"
            subtitle="Manage volunteer workflow tasks and assignments"
            :show-actions="false"
            :show-admin-actions="true"
            :show-statistics="true"
            :auto-refresh="true"
            :refresh-interval="30000"
          />
        </template>

        <!-- Volunteer Workloads Tab -->
        <template #workloads>
          <div v-if="taskStats">
            <!-- Category Breakdown -->
            <div class="q-mb-lg">
              <div class="text-subtitle1 q-mb-md">{{ $t('pages.taskManagement.tasksByCategory') }}</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(count, category) in taskStats.tasksByCategory"
                  :key="category"
                  class="col-auto"
                >
                  <q-chip
                    :label="`${category}: ${count}`"
                    color="primary"
                    text-color="white"
                  />
                </div>
              </div>
            </div>

            <!-- Priority Breakdown -->
            <div class="q-mb-lg">
              <div class="text-subtitle1 q-mb-md">{{ $t('pages.taskManagement.tasksByPriority') }}</div>
              <div class="row q-gutter-sm">
                <q-chip
                  :label="`${$t('tasks.priority.high')}: ${taskStats.tasksByPriority.high}`"
                  color="negative"
                  text-color="white"
                />
                <q-chip
                  :label="`${$t('tasks.priority.medium')}: ${taskStats.tasksByPriority.medium}`"
                  color="orange"
                  text-color="white"
                />
                <q-chip
                  :label="`${$t('tasks.priority.low')}: ${taskStats.tasksByPriority.low}`"
                  color="blue-grey"
                  text-color="white"
                />
              </div>
            </div>

            <!-- Performance Metrics -->
            <div v-if="taskStats.averageCompletionTime > 0" class="q-mb-lg">
              <div class="text-subtitle1 q-mb-sm">{{ $t('pages.taskManagement.performanceMetrics') }}</div>
              <q-card flat bordered>
                <q-card-section>
                  <div class="row items-center">
                    <div class="col">
                      <div class="text-body2">{{ $t('pages.taskManagement.averageCompletionTime') }}</div>
                    </div>
                    <div class="col-auto">
                      <div class="text-h6 text-primary">
                        {{ Math.round(taskStats.averageCompletionTime) }} {{ $t('common.minutes') }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div v-else class="text-center q-pa-lg">
            <q-spinner-hourglass color="primary" size="3rem" />
            <div class="text-body1 q-ml-md">{{ $t('common.loading') }}...</div>
          </div>
        </template>

        <!-- Task Analytics Tab -->
        <template #analytics>
          <div class="text-center q-pa-lg">
            <q-icon name="analytics" size="4rem" class="text-grey-5" />
            <div class="text-h6 q-mt-md text-grey-6">
              {{ $t('pages.taskManagement.analytics.comingSoon') }}
            </div>
            <div class="text-body2 text-grey-6">
              {{ $t('pages.taskManagement.analytics.description') }}
            </div>
          </div>
        </template>
      </BaseTabbedContent>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { taskService } from '../services/task.service';
import { logger } from '../utils/logger';
import AdminHeaderSection from '../components/admin/AdminHeaderSection.vue';
import BaseTabbedContent from '../components/BaseTabbedContent.vue';
import TaskList from '../components/TaskList.vue';
import { UI_ICONS } from '../constants/ui-icons';
import type { TaskStatistics } from '../services/task.service';
import type { TabConfig } from '../components/BaseTabbedContent.vue';

const $q = useQuasar();
const { t } = useI18n();

// State
const isLoadingStats = ref(false);
const taskStats = ref<TaskStatistics | null>(null);
const activeTab = ref('all-tasks');

// Tab configuration
const taskTabs = computed((): TabConfig[] => [
  {
    name: 'all-tasks',
    label: t('pages.taskManagement.tabs.allTasks'),
    icon: UI_ICONS.assignment,
    description: 'View and manage all editorial tasks'
  },
  {
    name: 'workloads',
    label: t('pages.taskManagement.tabs.workloads'),
    icon: UI_ICONS.accountGroup,
    description: 'Monitor volunteer workloads and distribution'
  },
  {
    name: 'analytics',
    label: t('pages.taskManagement.tabs.analytics'),
    icon: UI_ICONS.chartLine,
    description: 'Task analytics and performance metrics'
  }
]);

// Methods
const refreshTaskStats = async () => {
  isLoadingStats.value = true;
  try {
    taskStats.value = await taskService.getTaskStatistics();
    logger.success('Task statistics updated');
  } catch (error) {
    logger.error('Failed to load task statistics', { error });
    $q.notify({
      type: 'negative',
      message: t('pages.taskManagement.errors.loadStatsFailed'),
      position: 'top',
    });
  } finally {
    isLoadingStats.value = false;
  }
};

// Lifecycle
onMounted(() => {
  void refreshTaskStats();
});
</script>

<style scoped>
/* Using only Quasar utility classes */
</style>
