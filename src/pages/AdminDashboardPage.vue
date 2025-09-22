<!--
  Admin Dashboard - Central hub for all administrative functions
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <AdminHeaderSection
        title="Admin Dashboard"
        subtitle="Central hub for site administration and management"
        :icon="UI_ICONS.cog"
        :loading="isLoadingStats"
        @refresh="refreshStats"
      />

      <!-- Statistics Overview -->
      <AdminStatsOverview
        :stats="stats"
        :task-stats="taskStats"
        :loading="isLoadingStats"
        :columns="4"
        @stat-click="handleStatClick"
        @refresh="refreshStats"
      />

      <!-- Main Admin Functions -->
      <AdminActionsSection
        :stats="stats"
        :task-stats="taskStats"
        :loading="isLoadingStats"
        :columns="2"
        @action-click="handleActionClick"
      />

      <!-- Recent Activity -->
      <AdminRecentActivity
        :activities="recentActivity"
        @activity-click="handleActivityClick"
      />
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

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { firestoreService } from '../services/firebase-firestore.service';
import { taskService } from '../services/task.service';
import { logger } from '../utils/logger';
import CategoriesDialog from '../components/admin/CategoriesDialog.vue';
import ColorsDialog from '../components/admin/ColorsDialog.vue';
import AdminHeaderSection from '../components/admin/AdminHeaderSection.vue';
import AdminStatsOverview from '../components/admin/AdminStatsOverview.vue';
import AdminActionsSection from '../components/admin/AdminActionsSection.vue';
import AdminRecentActivity from '../components/admin/AdminRecentActivity.vue';
import { UI_ICONS } from '../constants/ui-icons';
import type { TaskStatistics } from '../services/task.service';

// Component interfaces for activity items
interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
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

const $q = useQuasar();

// State
const isLoadingStats = ref(false);
const stats = ref({
  totalContent: 0,
  pendingReviews: 0,
  publishedContent: 0,
  newsletters: 0,
});

const taskStats = ref<TaskStatistics | null>(null);

const recentActivity = ref<ActivityItem[]>([]);

// Dialog states
const showCategoriesDialog = ref(false);
const showColorsDialog = ref(false);
const showUploadDialog = ref(false);
const showNewsletterSettings = ref(false);
const showUserManagement = ref(false);
const showAddAdminDialog = ref(false);
const showRolesDialog = ref(false);

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

// Event handlers
const handleStatClick = (stat: unknown) => {
  logger.info('Stat clicked:', stat);
};

const handleActivityClick = (activity: ActivityItem) => {
  logger.info('Activity clicked:', activity.type, activity.id);
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
