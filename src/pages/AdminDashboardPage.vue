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
            <q-icon name="mdi-view-dashboard" class="q-mr-sm" />
            Admin Dashboard
          </h4>
          <p class="text-body2 text-grey-6 q-my-none">
            Central hub for site administration and management
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="mdi-refresh"
            label="Refresh Stats"
            @click="refreshStats"
            :loading="isLoadingStats"
          />
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-file-document-multiple" size="2rem" color="primary" />
              <div class="text-h5 q-mt-sm">{{ stats.totalContent }}</div>
              <div class="text-caption text-grey-6">Total Content</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-clock-outline" size="2rem" color="orange" />
              <div class="text-h5 q-mt-sm">{{ stats.pendingReviews }}</div>
              <div class="text-caption text-grey-6">Pending Reviews</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-earth" size="2rem" color="positive" />
              <div class="text-h5 q-mt-sm">{{ stats.publishedContent }}</div>
              <div class="text-caption text-grey-6">Published</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-book-open-page-variant" size="2rem" color="secondary" />
              <div class="text-h5 q-mt-sm">{{ stats.newsletters }}</div>
              <div class="text-caption text-grey-6">Newsletters</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Main Admin Functions -->
      <div class="row q-col-gutter-md">
        <!-- Content Management -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-file-document-edit" class="q-mr-sm" />
                Content Management
              </div>
              <p class="text-body2 text-grey-6">
                Review and manage user-submitted content
              </p>
              <div class="q-col-gutter-sm">
                <q-btn
                  color="primary"
                  icon="mdi-eye-check"
                  label="Review Content"
                  to="/admin/content"
                  class="full-width"
                />
                <div class="row q-col-gutter-xs">
                  <div class="col">
                    <q-btn
                      color="orange"
                      icon="mdi-clock"
                      :label="`${stats.pendingReviews} Pending`"
                      size="sm"
                      to="/admin/content?tab=pending"
                      class="full-width"
                    />
                  </div>
                  <div class="col">
                    <q-btn
                      color="positive"
                      icon="mdi-earth"
                      :label="`${stats.publishedContent} Published`"
                      size="sm"
                      to="/admin/content?tab=published"
                      class="full-width"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Newsletter Management -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-book-open-page-variant" class="q-mr-sm" />
                Newsletter Management
              </div>
              <p class="text-body2 text-grey-6">
                Manage newsletter archive and publications
              </p>
              <div class="q-col-gutter-sm">
                <q-btn
                  color="secondary"
                  icon="mdi-book-edit"
                  label="Manage Newsletters"
                  to="/admin/newsletters"
                  class="full-width"
                />
                <div class="row q-col-gutter-xs">
                  <div class="col">
                    <q-btn
                      color="info"
                      icon="mdi-upload"
                      label="Upload PDF"
                      size="sm"
                      @click="showUploadDialog = true"
                      class="full-width"
                    />
                  </div>
                  <div class="col">
                    <q-btn
                      color="accent"
                      icon="mdi-cog"
                      label="Settings"
                      size="sm"
                      @click="showNewsletterSettings = true"
                      class="full-width"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Site Configuration -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-palette" class="q-mr-sm" />
                Site Configuration
              </div>
              <p class="text-body2 text-grey-6">
                Manage themes, categories, and site-wide settings
              </p>
              <div class="q-col-gutter-sm">
                <q-btn
                  color="accent"
                  icon="mdi-palette-outline"
                  label="Theme & Categories"
                  @click="showThemeDialog = true"
                  class="full-width"
                />
                <div class="row q-col-gutter-xs">
                  <div class="col">
                    <q-btn
                      color="brown"
                      icon="mdi-tag-multiple"
                      label="Categories"
                      size="sm"
                      @click="showCategoriesDialog = true"
                      class="full-width"
                    />
                  </div>
                  <div class="col">
                    <q-btn
                      color="deep-purple"
                      icon="mdi-format-color-fill"
                      label="Colors"
                      size="sm"
                      @click="showColorsDialog = true"
                      class="full-width"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- User Management -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-account-group" class="q-mr-sm" />
                User Management
              </div>
              <p class="text-body2 text-grey-6">
                Manage user accounts and permissions
              </p>
              <div class="q-gutter-sm">
                <q-btn
                  color="info"
                  icon="mdi-account-cog"
                  label="Manage Users"
                  @click="showUserManagement = true"
                  class="full-width"
                />
                <div class="row q-gutter-xs">
                  <div class="col">
                    <q-btn
                      color="green"
                      icon="mdi-account-plus"
                      label="Add Admin"
                      size="sm"
                      @click="showAddAdminDialog = true"
                      class="full-width"
                    />
                  </div>
                  <div class="col">
                    <q-btn
                      color="purple"
                      icon="mdi-account-key"
                      label="Roles"
                      size="sm"
                      @click="showRolesDialog = true"
                      class="full-width"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Recent Activity -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-timeline-clock" class="q-mr-sm" />
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

    <!-- Theme Configuration Dialog -->
    <ThemeConfigDialog
      v-model="showThemeDialog"
      @updated="refreshStats"
    />

    <!-- Categories Management Dialog -->
    <CategoriesDialog
      v-model="showCategoriesDialog"
      @updated="refreshStats"
      @open-theme-editor="showThemeDialog = true"
    />

    <!-- Colors Management Dialog -->
    <ColorsDialog
      v-model="showColorsDialog"
      @updated="refreshStats"
      @open-theme-editor="showThemeDialog = true"
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
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import ThemeConfigDialog from '../components/admin/ThemeConfigDialog.vue';
import CategoriesDialog from '../components/admin/CategoriesDialog.vue';
import ColorsDialog from '../components/admin/ColorsDialog.vue';

const $q = useQuasar();

// State
const isLoadingStats = ref(false);
const stats = ref({
  totalContent: 0,
  pendingReviews: 0,
  publishedContent: 0,
  newsletters: 0,
});

const recentActivity = ref<Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
}>>([]);

// Dialog states
const showThemeDialog = ref(false);
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

    // Get newsletter statistics (placeholder)
    stats.value.newsletters = 24; // TODO: Get from actual newsletter service

    // Get recent activity (placeholder)
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
    case 'content': return 'mdi-file-document-plus';
    case 'newsletter': return 'mdi-book-plus';
    case 'user': return 'mdi-account-plus';
    case 'system': return 'mdi-cog';
    default: return 'mdi-information';
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
