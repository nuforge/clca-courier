<!--
  Admin Dashboard - Central hub for all administrative functions
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h4 class="q-my-none">
            <q-icon :name="UI_ICONS.cog" class="q-mr-sm" />
            Admin Dashboard
          </h4>
          <p class="text-body2 q-my-none">
            Central hub for site administration and management
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :icon="UI_ICONS.refresh"
            label="Refresh Stats"
            @click="refreshStats"
            :loading="isLoadingStats"
          />
        </div>
      </div>

      <!-- Statistics Overview -->
      <BaseStatsGrid
        :stats="adminStats"
        :loading="isLoadingStats"
        :columns="4"
        class="q-mb-lg"
        @stat-click="handleStatClick"
        @refresh="refreshStats"
      />

      <!-- Main Admin Functions -->
      <BaseActionToolbar
        :sections="actionSections"
        :columns="2"
        :loading="isLoadingStats"
        @action-click="handleActionClick"
      />

      <!-- Recent Activity -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon :name="UI_ICONS.timeline" class="q-mr-sm" />
            Recent Activity
          </div>
          <q-list>
            <q-item
              v-for="activity in recentActivity"
              :key="activity.id"
              clickable
            >
              <q-item-section avatar>
                <q-icon :name="getActivityIcon(activity.type)" :color="getActivityColor(activity.type)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ activity.description }}</q-item-label>
                <q-item-label caption>{{ formatDateTime(activity.timestamp) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  :color="getActivityColor(activity.type)"
                  text-color="white"
                  size="sm"
                >
                  {{ activity.type }}
                </q-chip>
              </q-item-section>
            </q-item>

            <q-item v-if="recentActivity.length === 0">
              <q-item-section>
                <q-item-label class="text-grey-6">No recent activity</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <!-- Categories Management Dialog -->
    <CategoriesDialog
      v-model="showCategoriesDialog"
      @updated="refreshStats"
      @openThemeEditor="$router.push('/admin/theme')"
    />

    <!-- Colors Management Dialog -->
    <ColorsDialog
      v-model="showColorsDialog"
      @updated="refreshStats"
      @openThemeEditor="$router.push('/admin/theme')"
    />

    <!-- Upload Dialog -->
    <q-dialog v-model="showUploadDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Upload Newsletter PDF</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>Use the Newsletter Management page for PDF uploads.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn label="Go to Newsletters" color="primary" to="/admin/newsletters" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Placeholder dialogs -->
    <q-dialog v-model="showNewsletterSettings">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Newsletter Settings</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>Newsletter settings functionality will be added in future update.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showUserManagement">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">User Management</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>User management functionality will be added in future update.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAddAdminDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Administrator</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>Admin management functionality will be added in future update.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showRolesDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Role Management</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>Role management functionality will be added in future update.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Task Management Dialog -->
    <q-dialog v-model="showTaskManagement" maximized>
      <q-card>
        <q-bar class="bg-purple text-white">
          <div class="text-h6">
            <q-icon :name="UI_ICONS.assignment" class="q-mr-sm" />
            Volunteer Task Management
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="q-pa-md">
          <TaskList
            title="All Editorial Tasks"
            subtitle="Manage volunteer workflow tasks and assignments"
            :show-actions="false"
            :show-admin-actions="true"
            :show-statistics="true"
            :auto-refresh="true"
            :refresh-interval="30000"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Volunteer Workloads Dialog -->
    <q-dialog v-model="showVolunteerWorkloads">
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            <q-icon :name="UI_ICONS.accountGroup" class="q-mr-sm" />
            Volunteer Workloads
          </div>
          <div class="text-subtitle2 text-grey-6">
            Monitor volunteer activity and task distribution
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Task Statistics Summary -->
          <div v-if="taskStats" class="row q-gutter-md q-mb-lg">
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-blue">{{ taskStats.inProgressTasks }}</div>
                  <div class="text-body2">Active Tasks</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-orange">{{ taskStats.unclaimedTasks }}</div>
                  <div class="text-body2">Unclaimed</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-positive">{{ taskStats.completedTasks }}</div>
                  <div class="text-body2">Completed</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h5 text-negative">{{ taskStats.overdueTasks }}</div>
                  <div class="text-body2">Overdue</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Category Breakdown -->
          <div v-if="taskStats" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-md">Tasks by Category</div>
            <div class="row q-gutter-sm">
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
          <div v-if="taskStats" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-md">Tasks by Priority</div>
            <div class="row q-gutter-sm">
              <q-chip
                :label="`High: ${taskStats.tasksByPriority.high}`"
                color="negative"
                text-color="white"
              />
              <q-chip
                :label="`Medium: ${taskStats.tasksByPriority.medium}`"
                color="orange"
                text-color="white"
              />
              <q-chip
                :label="`Low: ${taskStats.tasksByPriority.low}`"
                color="blue-grey"
                text-color="white"
              />
            </div>
          </div>

          <!-- Average Completion Time -->
          <div v-if="taskStats && taskStats.averageCompletionTime > 0" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-sm">Performance Metrics</div>
            <q-card flat bordered>
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-body2">Average Completion Time</div>
                  </div>
                  <div class="col-auto">
                    <div class="text-h6 text-primary">
                      {{ Math.round(taskStats.averageCompletionTime) }} min
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="grey" v-close-popup />
          <q-btn
            color="primary"
            label="View All Tasks"
            @click="showTaskManagement = true; showVolunteerWorkloads = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { firestoreService } from '../services/firebase-firestore.service';
import { taskService } from '../services/task.service';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import CategoriesDialog from '../components/admin/CategoriesDialog.vue';
import ColorsDialog from '../components/admin/ColorsDialog.vue';
import BaseStatsGrid from '../components/BaseStatsGrid.vue';
import BaseActionToolbar from '../components/BaseActionToolbar.vue';
import TaskList from '../components/TaskList.vue';
import { useSiteTheme } from '../composables/useSiteTheme';
import { UI_ICONS } from '../constants/ui-icons';
import type { TaskStatistics } from '../services/task.service';

// Component interfaces
interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  style?: 'outline' | 'flat';
  size?: 'sm' | 'md';
  to?: string;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionSection {
  title: string;
  titleIcon: string;
  description: string;
  primaryAction: ActionButton;
  secondaryActions: ActionButton[];
}

const $q = useQuasar();
const { getContentIcon, getStatusIcon } = useSiteTheme();

// State
const isLoadingStats = ref(false);
const stats = ref({
  totalContent: 0,
  pendingReviews: 0,
  publishedContent: 0,
  newsletters: 0,
});

const taskStats = ref<TaskStatistics | null>(null);

const recentActivity = ref<Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
}>>([]);

// Dialog states
const showCategoriesDialog = ref(false);
const showColorsDialog = ref(false);
const showUploadDialog = ref(false);
const showNewsletterSettings = ref(false);
const showUserManagement = ref(false);
const showAddAdminDialog = ref(false);
const showRolesDialog = ref(false);
const showTaskManagement = ref(false);
const showVolunteerWorkloads = ref(false);

// Methods
const refreshStats = async () => {
  isLoadingStats.value = true;
  try {
    // Get content statistics
    const allContent = await firestoreService.getApprovedContent();
    stats.value.totalContent = allContent.length;
    stats.value.pendingReviews = allContent.filter(c => c.status === 'pending').length;
    stats.value.publishedContent = allContent.filter(c => c.status === 'published').length;

    // Get newsletter statistics (future: from newsletter service)
    stats.value.newsletters = 24; // Placeholder value

    // Get task statistics
    try {
      taskStats.value = await taskService.getTaskStatistics();
    } catch (error) {
      logger.warn('Failed to load task statistics', { error });
      taskStats.value = null;
    }

    // Get recent activity (sample data)
    recentActivity.value = [
      {
        id: '1',
        type: 'content',
        description: 'New article submitted for review',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'newsletter',
        description: 'Newsletter published for September 2025',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    logger.success('Admin dashboard statistics updated');
  } catch (error) {
    logger.error('Failed to load admin statistics', { error });
    $q.notify({
      type: 'negative',
      message: 'Failed to load statistics',
      position: 'top',
    });
  } finally {
    isLoadingStats.value = false;
  }
};

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'content': return UI_ICONS.documentPlus;
    case 'newsletter': return UI_ICONS.bookPlus;
    case 'user': return UI_ICONS.accountPlus;
    case 'system': return UI_ICONS.cog;
    default: return UI_ICONS.info;
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'content': return 'primary';
    case 'newsletter': return 'secondary';
    case 'user': return 'info';
    case 'system': return 'warning';
    default: return 'grey';
  }
};

// Computed properties for base components
const adminStats = computed((): StatItem[] => {
  const contentIcon = getContentIcon('article');
  const pendingIcon = getStatusIcon('pending');
  const publishedIcon = getStatusIcon('published');
  const notificationIcon = getContentIcon('notification');

  const baseStats = [
    {
      label: 'Total Content',
      value: stats.value.totalContent,
      icon: contentIcon.icon,
      color: contentIcon.color,
      description: 'Total content items'
    },
    {
      label: 'Pending Reviews',
      value: stats.value.pendingReviews,
      icon: pendingIcon.icon,
      color: pendingIcon.color,
      description: 'Content awaiting review'
    },
    {
      label: 'Published',
      value: stats.value.publishedContent,
      icon: publishedIcon.icon,
      color: publishedIcon.color,
      description: 'Published content'
    },
    {
      label: 'Newsletters',
      value: stats.value.newsletters,
      icon: notificationIcon.icon,
      color: notificationIcon.color,
      description: 'Total newsletters'
    }
  ];

  // Add task statistics if available
  if (taskStats.value) {
    baseStats.push(
      {
        label: 'Active Tasks',
        value: taskStats.value.unclaimedTasks + taskStats.value.inProgressTasks,
        icon: UI_ICONS.assignment,
        color: 'blue',
        description: 'Unclaimed and in-progress tasks'
      },
      {
        label: 'Overdue Tasks',
        value: taskStats.value.overdueTasks,
        icon: UI_ICONS.warning,
        color: 'negative',
        description: 'Tasks past due date'
      }
    );
  }

  return baseStats;
});

const actionSections = computed((): ActionSection[] => {
  const announcementIcon = getContentIcon('announcement');
  const newsletterIcon = getContentIcon('newsletter');
  const pendingIcon = getStatusIcon('pending');
  const publishedIcon = getStatusIcon('published');

  return [
    {
      title: 'Content Management',
      titleIcon: announcementIcon.icon,
      description: 'Review and manage user-submitted content',
      primaryAction: {
        label: 'Review Content',
        icon: UI_ICONS.eye,
        color: 'primary',
        style: 'outline',
        to: '/admin/content'
      },
      secondaryActions: [
        {
          label: `${stats.value.pendingReviews} Pending`,
          icon: pendingIcon.icon,
          color: 'orange',
          style: 'flat',
          size: 'sm',
          to: '/admin/content?tab=pending'
        },
        {
          label: `${stats.value.publishedContent} Published`,
          icon: publishedIcon.icon,
          color: 'positive',
          style: 'flat',
          size: 'sm',
          to: '/admin/content?tab=published'
        }
      ]
    },
    {
      title: 'Newsletter Management',
      titleIcon: newsletterIcon.icon,
      description: 'Manage newsletter archive and publications',
      primaryAction: {
        label: 'Manage Newsletters',
        icon: UI_ICONS.edit,
        color: 'secondary',
        style: 'outline',
        to: '/admin/newsletters'
      },
      secondaryActions: [
        {
          label: 'Upload PDF',
          icon: UI_ICONS.upload,
          color: 'info',
          style: 'flat',
          size: 'sm',
          action: 'showUploadDialog'
        },
        {
          label: 'Settings',
          icon: UI_ICONS.cog,
          color: 'accent',
          style: 'flat',
          size: 'sm',
          action: 'showNewsletterSettings'
        }
      ]
    },
    {
      title: 'Site Configuration',
      titleIcon: UI_ICONS.palette,
      description: 'Manage themes, categories, and site-wide settings',
      primaryAction: {
        label: 'Theme Editor',
        icon: UI_ICONS.paletteOutline,
        color: 'grey-6',
        style: 'outline',
        to: '/admin/theme'
      },
      secondaryActions: [
        {
          label: 'Quick Categories',
          icon: UI_ICONS.tagMultiple,
          color: 'brown',
          style: 'flat',
          size: 'sm',
          action: 'showCategoriesDialog'
        },
        {
          label: 'Quick Colors',
          icon: UI_ICONS.colorFill,
          color: 'deep-purple',
          style: 'flat',
          size: 'sm',
          action: 'showColorsDialog'
        }
      ]
    },
    {
      title: 'Canva Integration Demo',
      titleIcon: UI_ICONS.palette,
      description: 'Test and demonstrate Canva Connect API features',
      primaryAction: {
        label: 'Canva Demo',
        icon: UI_ICONS.autoFix,
        color: 'accent',
        style: 'outline',
        to: '/admin/canva-demo'
      },
      secondaryActions: [
        {
          label: 'Autofill Test',
          icon: UI_ICONS.autoFix,
          color: 'purple',
          style: 'flat',
          size: 'sm',
          to: '/admin/canva-demo#autofill'
        },
        {
          label: 'Export Test',
          icon: UI_ICONS.download,
          color: 'indigo',
          style: 'flat',
          size: 'sm',
          to: '/admin/canva-demo#export'
        }
      ]
    },
    {
      title: 'User Management',
      titleIcon: UI_ICONS.accountGroup,
      description: 'Manage user accounts and permissions',
      primaryAction: {
        label: 'Manage Users',
        icon: UI_ICONS.accountCog,
        color: 'info',
        style: 'outline',
        action: 'showUserManagement'
      },
      secondaryActions: [
        {
          label: 'Add Admin',
          icon: UI_ICONS.accountPlus,
          color: 'green',
          style: 'flat',
          size: 'sm',
          action: 'showAddAdminDialog'
        },
        {
          label: 'Roles',
          icon: UI_ICONS.accountKey,
          color: 'purple',
          style: 'flat',
          size: 'sm',
          action: 'showRolesDialog'
        }
      ]
    },
    {
      title: 'Volunteer Task Management',
      titleIcon: UI_ICONS.assignment,
      description: 'Manage editorial workflow tasks and volunteer assignments',
      primaryAction: {
        label: 'Task Dashboard',
        icon: UI_ICONS.dashboard,
        color: 'purple',
        style: 'outline',
        action: 'showTaskManagement'
      },
      secondaryActions: [
        {
          label: `${taskStats.value?.unclaimedTasks || 0} Unclaimed`,
          icon: UI_ICONS.assignment,
          color: 'orange',
          style: 'flat',
          size: 'sm',
          action: 'showTaskManagement'
        },
        {
          label: 'Volunteer Workloads',
          icon: UI_ICONS.accountGroup,
          color: 'blue',
          style: 'flat',
          size: 'sm',
          action: 'showVolunteerWorkloads'
        }
      ]
    }
  ];
});

// Event handlers
const handleStatClick = (stat: StatItem) => {
  logger.info('Stat clicked:', stat.label);
};

const handleActionClick = (action: ActionButton) => {
  switch (action.action) {
    case 'showUploadDialog':
      showUploadDialog.value = true;
      break;
    case 'showNewsletterSettings':
      showNewsletterSettings.value = true;
      break;
    case 'showCategoriesDialog':
      showCategoriesDialog.value = true;
      break;
    case 'showColorsDialog':
      showColorsDialog.value = true;
      break;
    case 'showUserManagement':
      showUserManagement.value = true;
      break;
    case 'showAddAdminDialog':
      showAddAdminDialog.value = true;
      break;
    case 'showRolesDialog':
      showRolesDialog.value = true;
      break;
    case 'showTaskManagement':
      showTaskManagement.value = true;
      break;
    case 'showVolunteerWorkloads':
      showVolunteerWorkloads.value = true;
      break;
    default:
      logger.info('Action clicked:', action.label);
  }
};

// Lifecycle
onMounted(() => {
  void refreshStats();
});
</script>

<style scoped>
.full-height {
  height: 100%;
}
</style>
