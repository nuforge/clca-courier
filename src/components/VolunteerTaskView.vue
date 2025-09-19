<!--
  VolunteerTaskView - Main dashboard view for volunteers
  Comprehensive volunteer workflow interface for task management
-->
<template>
  <div class="volunteer-task-view">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-my-none">
          <q-icon :name="UI_ICONS.assignment" class="q-mr-sm" />
          {{ $t('tasks.volunteer.dashboard_title') }}
        </h4>
        <p class="text-body2 text-grey-7 q-my-none">
          {{ $t('tasks.volunteer.dashboard_subtitle') }}
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          :icon="UI_ICONS.refresh"
          :label="$t('common.refresh')"
          @click="refreshAllData"
          :loading="isRefreshing"
        />
      </div>
    </div>

    <!-- User Stats Overview -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-orange">{{ myTasks.claimed.length + myTasks.inProgress.length }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.volunteer.active_tasks') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-positive">{{ myTasks.completed.length }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.volunteer.completed_tasks') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">{{ availableTasks.length }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.volunteer.available_tasks') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h4 text-secondary">{{ userSkills.length }}</div>
            <div class="text-body2 text-grey-7">{{ $t('tasks.volunteer.my_skills') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <h6 class="q-mt-none q-mb-md">{{ $t('tasks.volunteer.quick_actions') }}</h6>
        <div class="row q-gutter-md">
          <div class="col-auto">
            <q-btn
              color="primary"
              :icon="UI_ICONS.search"
              :label="$t('tasks.volunteer.browse_tasks')"
              @click="showBrowseTasksDialog = true"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="secondary"
              :icon="UI_ICONS.accountCog"
              :label="$t('tasks.volunteer.update_skills')"
              @click="showSkillsDialog = true"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="info"
              :icon="UI_ICONS.chartLine"
              :label="$t('tasks.volunteer.view_progress')"
              @click="showProgressDialog = true"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Task Sections -->
    <BaseTabbedContent
      :tabs="taskTabs"
      :loading="isLoading"
      content-class="q-pa-none"
    >
      <!-- My Active Tasks -->
      <template #my-tasks>
        <div v-if="activeTasks.length === 0" class="text-center q-pa-lg">
          <q-icon name="assignment_turned_in" size="48px" color="grey-5" />
          <div class="q-mt-md text-h6">{{ $t('tasks.volunteer.no_active_tasks') }}</div>
          <div class="text-body2 text-grey-7 q-mb-md">
            {{ $t('tasks.volunteer.no_active_tasks_desc') }}
          </div>
          <q-btn
            color="primary"
            :label="$t('tasks.volunteer.find_tasks')"
            @click="showBrowseTasksDialog = true"
          />
        </div>

        <div v-else class="q-gutter-md">
          <TaskCard
            v-for="task in activeTasks"
            :key="task.taskId"
            :task-details="task"
            :show-actions="true"
            :show-admin-actions="false"
            @task-updated="handleTaskUpdated"
            @view-content="handleViewContent"
          />
        </div>
      </template>

      <!-- Available Tasks -->
      <template #available-tasks>
        <div v-if="!isLoading && recommendedTasks.length === 0" class="text-center q-pa-lg">
          <q-icon name="search" size="48px" color="grey-5" />
          <div class="q-mt-md text-h6">{{ $t('tasks.volunteer.no_recommended_tasks') }}</div>
          <div class="text-body2 text-grey-7 q-mb-md">
            {{ $t('tasks.volunteer.no_recommended_tasks_desc') }}
          </div>
          <q-btn
            color="primary"
            :label="$t('tasks.volunteer.browse_all_tasks')"
            @click="showBrowseTasksDialog = true"
          />
        </div>

        <div v-else>
          <!-- Recommended Tasks -->
          <div v-if="recommendedTasks.length > 0" class="q-mb-lg">
            <h6 class="q-mb-md">
              <q-icon name="recommend" class="q-mr-sm" />
              {{ $t('tasks.volunteer.recommended_for_you') }}
            </h6>
            <div class="q-gutter-md">
              <TaskCard
                v-for="task in recommendedTasks.slice(0, 3)"
                :key="task.taskId"
                :task-details="task"
                :show-actions="true"
                :show-admin-actions="false"
                @task-updated="handleTaskUpdated"
                @view-content="handleViewContent"
              />
            </div>
          </div>

          <!-- All Available Tasks -->
          <div>
            <h6 class="q-mb-md">
              <q-icon name="assignment" class="q-mr-sm" />
              {{ $t('tasks.volunteer.all_available') }}
            </h6>
            <TaskList
              :title="''"
              :subtitle="''"
              :status="'unclaimed'"
              :show-actions="true"
              :show-admin-actions="false"
              :show-statistics="false"
              :auto-refresh="true"
              :refresh-interval="60000"
              @task-updated="handleTaskUpdated"
              @view-content="handleViewContent"
            />
          </div>
        </div>
      </template>

      <!-- Completed Tasks -->
      <template #completed-tasks>
        <TaskList
          :title="''"
          :subtitle="''"
          :user-id="currentUserId"
          :status="'completed'"
          :show-actions="false"
          :show-admin-actions="false"
          :show-statistics="false"
          @view-content="handleViewContent"
        />
      </template>
    </BaseTabbedContent>

    <!-- Browse Tasks Dialog -->
    <q-dialog v-model="showBrowseTasksDialog" maximized>
      <q-card>
        <q-bar class="bg-primary text-white">
          <div class="text-h6">{{ $t('tasks.volunteer.browse_tasks') }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="q-pa-md">
          <TaskList
            :title="$t('tasks.volunteer.all_tasks')"
            :subtitle="$t('tasks.volunteer.browse_desc')"
            :show-actions="true"
            :show-admin-actions="false"
            :show-statistics="true"
            @task-updated="handleTaskUpdated"
            @view-content="handleViewContent"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Skills Management Dialog -->
    <q-dialog v-model="showSkillsDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ $t('tasks.volunteer.manage_skills') }}</div>
          <div class="text-subtitle2 text-grey-6">
            {{ $t('tasks.volunteer.skills_desc') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Current Skills -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('tasks.volunteer.current_skills') }}</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="skill in userSkills"
                :key="skill"
                :label="skill"
                removable
                @remove="removeSkill(skill)"
                color="primary"
                text-color="white"
              />
            </div>
          </div>

          <!-- Add New Skill -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('tasks.volunteer.add_skill') }}</div>
            <q-select
              v-model="newSkillValue"
              :options="availableSkillOptions"
              :label="$t('tasks.volunteer.select_skill')"
              outlined
              use-input
              clearable
              @filter="filterSkillOptions"
              @update:model-value="addSkill"
            />
          </div>

          <!-- Availability -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('tasks.volunteer.availability') }}</div>
            <q-option-group
              v-model="userAvailability"
              :options="availabilityOptions"
              color="primary"
              @update:model-value="updateAvailability"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.close')" color="grey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Progress Dialog -->
    <q-dialog v-model="showProgressDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">{{ $t('tasks.volunteer.progress_title') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Progress Stats -->
          <div class="row q-gutter-md q-mb-lg">
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-positive">{{ totalCompletedTasks }}</div>
                  <div class="text-body2">{{ $t('tasks.volunteer.total_completed') }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-primary">{{ averageCompletionTime }}</div>
                  <div class="text-body2">{{ $t('tasks.volunteer.avg_completion') }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Tasks by Category -->
          <div class="q-mb-lg">
            <div class="text-subtitle1 q-mb-md">{{ $t('tasks.volunteer.tasks_by_category') }}</div>
            <div class="q-gutter-sm">
              <q-linear-progress
                v-for="(count, category) in tasksByCategory"
                :key="category"
                :value="count / Math.max(totalCompletedTasks, 1)"
                :buffer="1"
                color="primary"
                class="q-mb-xs"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge color="white" text-color="primary" :label="`${category}: ${count}`" />
                </div>
              </q-linear-progress>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="q-mb-lg">
            <div class="text-subtitle1 q-mb-md">{{ $t('tasks.volunteer.recent_activity') }}</div>
            <q-list bordered separator>
              <q-item v-for="task in myTasks.completed.slice(0, 5)" :key="task.taskId">
                <q-item-section avatar>
                  <q-icon :name="getCategoryIcon(task.task.category)" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ task.contentTitle }}</q-item-label>
                  <q-item-label caption>
                    {{ $t(`tasks.category.${task.task.category}`) }} •
                    {{ formatDateTime(task.task.updatedAt, 'SHORT_WITH_TIME') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.close')" color="grey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { taskService } from '../services/task.service';
import { taskAssignmentLogic } from '../utils/taskAssignmentLogic';
import { firestoreService } from '../services/firebase-firestore.service';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { userUtils } from '../utils/userUtils';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import { UI_ICONS } from '../constants/ui-icons';
import BaseTabbedContent from './BaseTabbedContent.vue';
import TaskCard from './TaskCard.vue';
import TaskList from './TaskList.vue';
import type { TaskDetails, TaskCategory } from '../services/task.service';
import type { UserProfile } from '../services/firebase-firestore.service';

// Composables
const { t } = useI18n();
const $q = useQuasar();

// State
const isLoading = ref(false);
const isRefreshing = ref(false);
const myTasks = ref<{
  claimed: TaskDetails[];
  inProgress: TaskDetails[];
  completed: TaskDetails[];
}>({
  claimed: [],
  inProgress: [],
  completed: []
});
const availableTasks = ref<TaskDetails[]>([]);
const recommendedTasks = ref<TaskDetails[]>([]);
const userProfile = ref<UserProfile | null>(null);
const showBrowseTasksDialog = ref(false);
const showSkillsDialog = ref(false);
const showProgressDialog = ref(false);
const newSkillValue = ref<string>('');
const availableSkillList = ref<string[]>([
  'writing', 'editing', 'proofreading', 'design', 'layout', 'canva',
  'graphics', 'research', 'fact-checking', 'verification', 'management',
  'decision-making', 'printing', 'production', 'logistics'
]);
const availableSkillOptions = ref<string[]>([]);

// Real-time subscription
let taskSubscription: (() => void) | null = null;

// Current user
const currentUser = computed(() => firebaseAuthService.getCurrentUser());
const currentUserId = computed(() => currentUser.value?.uid || '');

// User skills and availability
const userSkills = computed(() =>
  userProfile.value ? userUtils.getTagsByNamespace(userProfile.value, 'skill') : []
);

const userAvailability = ref<string>('occasional');

const availabilityOptions = computed(() => [
  { label: t('tasks.volunteer.availability_regular'), value: 'regular' },
  { label: t('tasks.volunteer.availability_occasional'), value: 'occasional' },
  { label: t('tasks.volunteer.availability_on_call'), value: 'on-call' }
]);

// Task tabs configuration
const taskTabs = computed(() => [
  {
    name: 'my-tasks',
    label: t('tasks.volunteer.my_tasks'),
    icon: 'assignment_ind',
    badge: myTasks.value.claimed.length + myTasks.value.inProgress.length
  },
  {
    name: 'available-tasks',
    label: t('tasks.volunteer.available_tasks'),
    icon: 'assignment',
    badge: availableTasks.value.length
  },
  {
    name: 'completed-tasks',
    label: t('tasks.volunteer.completed'),
    icon: 'assignment_turned_in',
    badge: myTasks.value.completed.length
  }
]);

// Computed task arrays
const activeTasks = computed(() => [
  ...myTasks.value.claimed,
  ...myTasks.value.inProgress
]);

// Progress statistics
const totalCompletedTasks = computed(() => myTasks.value.completed.length);

const averageCompletionTime = computed(() => {
  if (myTasks.value.completed.length === 0) return '0h';
  // This would need actual completion time tracking
  return '2.5h'; // Placeholder
});

const tasksByCategory = computed(() => {
  const categories: Record<string, number> = {};
  myTasks.value.completed.forEach(task => {
    const category = task.task.category;
    categories[category] = (categories[category] || 0) + 1;
  });
  return categories;
});

// Methods
const loadUserProfile = async () => {
  if (!currentUserId.value) return;

  try {
    const profile = await firestoreService.getUserProfile(currentUserId.value);
    if (profile) {
      userProfile.value = profile;
      userAvailability.value = profile.availability;
    }
  } catch (error) {
    logger.error('Failed to load user profile', { error });
  }
};

const loadMyTasks = async () => {
  if (!currentUserId.value) return;

  try {
    const [claimed, inProgress, completed] = await Promise.all([
      taskService.getUserTasks(currentUserId.value, 'claimed'),
      taskService.getUserTasks(currentUserId.value, 'in-progress'),
      taskService.getUserTasks(currentUserId.value, 'completed')
    ]);

    myTasks.value = { claimed, inProgress, completed };

  } catch (error) {
    logger.error('Failed to load user tasks', { error });
    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.load_failed')
    });
  }
};

const loadAvailableTasks = async () => {
  try {
    const tasks = await taskService.getTasksByStatus('unclaimed', 20);
    availableTasks.value = tasks;

    // Get recommended tasks if user has skills
    if (userSkills.value.length > 0) {
      const recommended = await taskAssignmentLogic.findBestVolunteersForTask(
        'review', // Default category
        'medium', // Default priority
        userSkills.value.map(skill => `skill:${skill}`),
        5
      );

      // Convert volunteer candidates back to task recommendations
      // This is a simplified approach - in practice, you'd want a more sophisticated recommendation system
      recommendedTasks.value = tasks.slice(0, 3);
    }

  } catch (error) {
    logger.error('Failed to load available tasks', { error });
  }
};

const refreshAllData = async () => {
  isRefreshing.value = true;
  try {
    await Promise.all([
      loadUserProfile(),
      loadMyTasks(),
      loadAvailableTasks()
    ]);
  } finally {
    isRefreshing.value = false;
  }
};

const handleTaskUpdated = async (task: TaskDetails) => {
  // Refresh user tasks to reflect changes
  await loadMyTasks();
  await loadAvailableTasks();
};

const handleViewContent = (contentId: string) => {
  // Emit or handle content viewing
  logger.info('View content requested', { contentId });
  // Could open a content viewer dialog or navigate to content page
};

const addSkill = async (skill: string) => {
  if (!skill || !userProfile.value || userSkills.value.includes(skill)) {
    newSkillValue.value = '';
    return;
  }

  try {
    const updatedTags = userUtils.addTag(userProfile.value, `skill:${skill}`);
    await firestoreService.updateUserProfile(currentUserId.value, { tags: updatedTags });

    // Update local profile
    userProfile.value.tags = updatedTags;
    newSkillValue.value = '';

    $q.notify({
      type: 'positive',
      message: t('tasks.volunteer.skill_added', { skill })
    });

  } catch (error) {
    logger.error('Failed to add skill', { skill, error });
    $q.notify({
      type: 'negative',
      message: t('tasks.volunteer.skill_add_failed')
    });
  }
};

const removeSkill = async (skill: string) => {
  if (!userProfile.value) return;

  try {
    const updatedTags = userUtils.removeTag(userProfile.value, `skill:${skill}`);
    await firestoreService.updateUserProfile(currentUserId.value, { tags: updatedTags });

    // Update local profile
    userProfile.value.tags = updatedTags;

    $q.notify({
      type: 'positive',
      message: t('tasks.volunteer.skill_removed', { skill })
    });

  } catch (error) {
    logger.error('Failed to remove skill', { skill, error });
    $q.notify({
      type: 'negative',
      message: t('tasks.volunteer.skill_remove_failed')
    });
  }
};

const updateAvailability = async (availability: string) => {
  if (!userProfile.value) return;

  try {
    await firestoreService.updateUserProfile(currentUserId.value, { availability });
    userProfile.value.availability = availability as 'regular' | 'occasional' | 'on-call';

    $q.notify({
      type: 'positive',
      message: t('tasks.volunteer.availability_updated')
    });

  } catch (error) {
    logger.error('Failed to update availability', { availability, error });
    $q.notify({
      type: 'negative',
      message: t('tasks.volunteer.availability_update_failed')
    });
  }
};

const filterSkillOptions = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      availableSkillOptions.value = availableSkillList.value;
    } else {
      const needle = val.toLowerCase();
      availableSkillOptions.value = availableSkillList.value.filter(
        skill => skill.toLowerCase().includes(needle) && !userSkills.value.includes(skill)
      );
    }
  });
};

const getCategoryIcon = (category: TaskCategory): string => {
  const icons = {
    review: 'rate_review',
    layout: 'design_services',
    'fact-check': 'fact_check',
    approve: 'approval',
    print: 'print'
  };
  return icons[category];
};

const setupRealTimeSubscription = () => {
  if (!currentUserId.value) return;

  taskSubscription = taskService.subscribeToUserTasks(
    currentUserId.value,
    (updatedTasks) => {
      // Update tasks based on status
      const claimed = updatedTasks.filter(t => t.task.status === 'claimed');
      const inProgress = updatedTasks.filter(t => t.task.status === 'in-progress');
      const completed = updatedTasks.filter(t => t.task.status === 'completed');

      myTasks.value = { claimed, inProgress, completed };
    }
  );
};

// Lifecycle
onMounted(async () => {
  isLoading.value = true;
  try {
    await refreshAllData();
    setupRealTimeSubscription();
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (taskSubscription) {
    taskSubscription();
  }
});

// Initialize skill options
availableSkillOptions.value = availableSkillList.value;
</script>

<style scoped>
.volunteer-task-view {
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.q-linear-progress {
  height: 24px;
  border-radius: 12px;
}
</style>
