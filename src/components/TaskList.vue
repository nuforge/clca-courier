<!--
  TaskList - Filterable and sortable task list
  Volunteer workflow system component for displaying multiple tasks
-->
<template>
  <div class="task-list">
    <!-- Header and Filters -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h5 class="q-my-none">
          <q-icon :name="UI_ICONS.assignment" class="q-mr-sm" />
          {{ title }}
        </h5>
        <p class="text-body2 text-grey-7 q-my-none" v-if="subtitle">
          {{ subtitle }}
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          :icon="UI_ICONS.refresh"
          :label="$t('common.refresh')"
          @click="refreshTasks"
          :loading="isLoading"
          size="sm"
        />
      </div>
    </div>

    <!-- Filters and Search -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md">
          <!-- Search -->
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              :placeholder="$t('tasks.list.search_placeholder')"
              outlined
              dense
              clearable
              :debounce="300"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-md-2">
            <q-select
              v-model="statusFilter"
              :options="statusFilterOptions"
              :label="$t('tasks.list.status_filter')"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>

          <!-- Category Filter -->
          <div class="col-12 col-md-2">
            <q-select
              v-model="categoryFilter"
              :options="categoryFilterOptions"
              :label="$t('tasks.list.category_filter')"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>

          <!-- Priority Filter -->
          <div class="col-12 col-md-2">
            <q-select
              v-model="priorityFilter"
              :options="priorityFilterOptions"
              :label="$t('tasks.list.priority_filter')"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>

          <!-- Sort -->
          <div class="col-12 col-md-2">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              :label="$t('tasks.list.sort_by')"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Filter chips -->
        <div class="row q-mt-md" v-if="hasActiveFilters">
          <div class="col">
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('tasks.list.active_filters') }}:
            </div>
            <q-chip
              v-if="statusFilter"
              :label="$t(`tasks.status.${statusFilter}`)"
              removable
              @remove="statusFilter = null"
              color="primary"
              text-color="white"
              size="sm"
            />
            <q-chip
              v-if="categoryFilter"
              :label="$t(`tasks.category.${categoryFilter}`)"
              removable
              @remove="categoryFilter = null"
              color="secondary"
              text-color="white"
              size="sm"
            />
            <q-chip
              v-if="priorityFilter"
              :label="$t(`tasks.priority.${priorityFilter}`)"
              removable
              @remove="priorityFilter = null"
              color="accent"
              text-color="white"
              size="sm"
            />
            <q-btn
              flat
              size="sm"
              :label="$t('common.clear_all')"
              @click="clearFilters"
              class="q-ml-sm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Task Statistics -->
    <div class="row q-gutter-md q-mb-lg" v-if="showStatistics">
      <div class="col-12 col-md-3">
        <q-card flat class="text-center">
          <q-card-section>
            <div class="text-h4 text-primary">{{ filteredTasks.length }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.list.total_tasks') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat class="text-center">
          <q-card-section>
            <div class="text-h4 text-orange">{{ unclaimedCount }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.list.unclaimed') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat class="text-center">
          <q-card-section>
            <div class="text-h4 text-blue">{{ inProgressCount }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.list.in_progress') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat class="text-center">
          <q-card-section>
            <div class="text-h4 text-positive">{{ completedCount }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.list.completed') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-pa-lg">
      <q-spinner size="50px" color="primary" />
      <div class="q-mt-md">{{ $t('tasks.list.loading') }}</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error" size="48px" color="negative" />
      <div class="q-mt-md text-h6">{{ $t('errors.failed_to_load') }}</div>
      <div class="text-body2 text-grey-7 q-mb-md">{{ error }}</div>
      <q-btn color="primary" @click="refreshTasks">
        {{ $t('common.try_again') }}
      </q-btn>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center q-pa-lg">
      <q-icon name="assignment" size="48px" color="grey-5" />
      <div class="q-mt-md text-h6">{{ $t('tasks.list.no_tasks') }}</div>
      <div class="text-body2 text-grey-7 q-mb-md">
        {{ hasActiveFilters ? $t('tasks.list.no_tasks_filtered') : $t('tasks.list.no_tasks_available') }}
      </div>
      <q-btn
        v-if="hasActiveFilters"
        color="primary"
        @click="clearFilters"
      >
        {{ $t('common.clear_filters') }}
      </q-btn>
    </div>

    <!-- Task Cards -->
    <div v-else class="task-list-container">
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="q-gutter-md">
        <TaskCard
          v-for="task in paginatedTasks"
          :key="task.taskId"
          :task-details="task"
          :show-actions="showActions"
          :show-admin-actions="showAdminActions"
          @task-updated="handleTaskUpdated"
          @view-content="handleViewContent"
        />
      </div>

      <!-- Grid View -->
      <div v-else class="row q-gutter-md">
        <div
          v-for="task in paginatedTasks"
          :key="task.taskId"
          class="col-12 col-md-6 col-lg-4"
        >
          <TaskCard
            :task-details="task"
            :show-actions="showActions"
            :show-admin-actions="showAdminActions"
            @task-updated="handleTaskUpdated"
            @view-content="handleViewContent"
          />
        </div>
      </div>

      <!-- Pagination -->
      <div class="row justify-center q-mt-lg" v-if="totalPages > 1">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="7"
          direction-links
          boundary-links
          color="primary"
          @update:model-value="scrollToTop"
        />
      </div>
    </div>

    <!-- View Mode Toggle -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn-toggle
        v-model="viewMode"
        toggle-color="primary"
        :options="[
          { label: '', value: 'list', icon: 'view_list' },
          { label: '', value: 'grid', icon: 'view_module' }
        ]"
        size="sm"
      />
    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { taskService } from '../services/task.service';
import { logger } from '../utils/logger';
import { UI_ICONS } from '../constants/ui-icons';
import TaskCard from './TaskCard.vue';
import type { TaskDetails, TaskStatus, TaskCategory, TaskPriority } from '../services/task.service';

// Props
interface Props {
  title?: string;
  subtitle?: string;
  userId?: string; // If provided, show only tasks for this user
  status?: TaskStatus; // If provided, filter by this status
  showActions?: boolean;
  showAdminActions?: boolean;
  showStatistics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Tasks',
  showActions: true,
  showAdminActions: false,
  showStatistics: true,
  autoRefresh: false,
  refreshInterval: 30000 // 30 seconds
});

// Emits
const emit = defineEmits<{
  taskUpdated: [task: TaskDetails];
  viewContent: [contentId: string];
  taskSelected: [task: TaskDetails];
}>();

// Composables
const { t } = useI18n();
const $q = useQuasar();

// State
const tasks = ref<TaskDetails[]>([]);
const isLoading = ref(false);
const error = ref<string>('');
const searchQuery = ref('');
const statusFilter = ref<TaskStatus | null>(null);
const categoryFilter = ref<TaskCategory | null>(null);
const priorityFilter = ref<TaskPriority | null>(null);
const sortBy = ref('created_desc');
const viewMode = ref<'list' | 'grid'>('list');
const currentPage = ref(1);
const pageSize = 10;

// Auto-refresh
let refreshTimer: NodeJS.Timeout | null = null;

// Filter options
const statusFilterOptions = computed(() => [
  { label: t('tasks.status.unclaimed'), value: 'unclaimed' },
  { label: t('tasks.status.claimed'), value: 'claimed' },
  { label: t('tasks.status.in-progress'), value: 'in-progress' },
  { label: t('tasks.status.completed'), value: 'completed' }
]);

const categoryFilterOptions = computed(() => [
  { label: t('tasks.category.review'), value: 'review' },
  { label: t('tasks.category.layout'), value: 'layout' },
  { label: t('tasks.category.fact-check'), value: 'fact-check' },
  { label: t('tasks.category.approve'), value: 'approve' },
  { label: t('tasks.category.print'), value: 'print' }
]);

const priorityFilterOptions = computed(() => [
  { label: t('tasks.priority.high'), value: 'high' },
  { label: t('tasks.priority.medium'), value: 'medium' },
  { label: t('tasks.priority.low'), value: 'low' }
]);

const sortOptions = computed(() => [
  { label: t('tasks.list.sort.created_desc'), value: 'created_desc' },
  { label: t('tasks.list.sort.created_asc'), value: 'created_asc' },
  { label: t('tasks.list.sort.due_date'), value: 'due_date' },
  { label: t('tasks.list.sort.priority'), value: 'priority' },
  { label: t('tasks.list.sort.category'), value: 'category' },
  { label: t('tasks.list.sort.status'), value: 'status' }
]);

// Computed properties
const hasActiveFilters = computed(() =>
  !!statusFilter.value || !!categoryFilter.value || !!priorityFilter.value || !!searchQuery.value
);

const filteredTasks = computed(() => {
  let filtered = [...tasks.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(task =>
      task.contentTitle.toLowerCase().includes(query) ||
      task.contentAuthor.toLowerCase().includes(query) ||
      task.task.instructions?.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.task.status === statusFilter.value);
  }

  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(task => task.task.category === categoryFilter.value);
  }

  // Priority filter
  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.task.priority === priorityFilter.value);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'created_desc':
        return b.task.createdAt.toMillis() - a.task.createdAt.toMillis();
      case 'created_asc':
        return a.task.createdAt.toMillis() - b.task.createdAt.toMillis();
      case 'due_date':
        if (!a.task.dueDate && !b.task.dueDate) return 0;
        if (!a.task.dueDate) return 1;
        if (!b.task.dueDate) return -1;
        return a.task.dueDate.toMillis() - b.task.dueDate.toMillis();
      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.task.priority] - priorityOrder[a.task.priority];
      }
      case 'category':
        return a.task.category.localeCompare(b.task.category);
      case 'status': {
        const statusOrder = { unclaimed: 1, claimed: 2, 'in-progress': 3, completed: 4 };
        return statusOrder[a.task.status] - statusOrder[b.task.status];
      }
      default:
        return 0;
    }
  });

  return filtered;
});

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredTasks.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredTasks.value.length / pageSize));

// Statistics
const unclaimedCount = computed(() =>
  filteredTasks.value.filter(t => t.task.status === 'unclaimed').length
);

const inProgressCount = computed(() =>
  filteredTasks.value.filter(t => ['claimed', 'in-progress'].includes(t.task.status)).length
);

const completedCount = computed(() =>
  filteredTasks.value.filter(t => t.task.status === 'completed').length
);

// Methods
const loadTasks = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    let loadedTasks: TaskDetails[];

    if (props.userId) {
      // Load tasks for specific user
      loadedTasks = await taskService.getUserTasks(props.userId, props.status);
    } else {
      // Load all tasks
      loadedTasks = await taskService.getTasksByStatus(props.status);
    }

    tasks.value = loadedTasks;

    logger.debug('Tasks loaded successfully', {
      count: loadedTasks.length,
      userId: props.userId,
      status: props.status
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t('errors.unknown');
    error.value = errorMessage;
    logger.error('Failed to load tasks', { error: err });

    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.load_failed'),
      caption: errorMessage
    });
  } finally {
    isLoading.value = false;
  }
};

const refreshTasks = async () => {
  await loadTasks();
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = null;
  categoryFilter.value = null;
  priorityFilter.value = null;
  currentPage.value = 1;
};

const handleTaskUpdated = (updatedTask: TaskDetails) => {
  // Update task in local array
  const index = tasks.value.findIndex(t => t.taskId === updatedTask.taskId);
  if (index !== -1) {
    tasks.value[index] = updatedTask;
  }

  emit('taskUpdated', updatedTask);
};

const handleViewContent = (contentId: string) => {
  emit('viewContent', contentId);
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const setupAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      if (!isLoading.value) {
        void refreshTasks();
      }
    }, props.refreshInterval);
  }
};

const cleanup = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// Watchers
watch([() => props.userId, () => props.status], () => {
  void loadTasks();
}, { immediate: false });

watch(() => filteredTasks.value.length, () => {
  // Reset to first page if current page is out of bounds
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1;
  }
});

// Lifecycle
onMounted(() => {
  void loadTasks();
  setupAutoRefresh();
});

// Set initial status filter from props
if (props.status) {
  statusFilter.value = props.status;
}

// Cleanup on unmount
onBeforeUnmount(() => {
  cleanup();
});
</script>

<style scoped>
.task-list-container {
  min-height: 200px;
}

.task-list .q-card {
  transition: all 0.2s ease;
}

.task-list .q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

