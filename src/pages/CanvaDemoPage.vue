<!--
  Canva Integration Demo Page - Admin-only demonstration of Canva features
  Shows real designs, selection, and live operations with working API
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h4 class="q-my-none">
            <q-icon :name="UI_ICONS.palette" class="q-mr-sm" />
            Canva Integration Demo
          </h4>
          <p class="text-body2 text-grey-6 q-my-none">
            Live Canva API integration with real designs and operations
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :icon="UI_ICONS.refresh"
            label="Refresh Designs"
            @click="refreshDesigns"
            :loading="isLoadingDesigns"
          />
        </div>
      </div>

      <!-- Canva Authentication Status -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon :name="UI_ICONS.canva" class="q-mr-sm" />
            Canva Account Connection
          </div>
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto">
              <q-icon
                :name="isCanvaAuthenticated ? UI_ICONS.checkCircle : UI_ICONS.closeCircle"
                :color="isCanvaAuthenticated ? 'positive' : 'negative'"
                size="2rem"
              />
            </div>
            <div class="col">
              <div class="text-subtitle1">
                {{ isCanvaAuthenticated ? 'Connected to Canva' : 'Not Connected' }}
              </div>
              <div class="text-caption text-grey-6">
                {{ isCanvaAuthenticated ? `Ready to work with ${userDesigns.length} designs` : 'Connect your Canva account to access designs' }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                v-if="!isCanvaAuthenticated"
                color="primary"
                :icon="UI_ICONS.login"
                label="Connect Canva"
                @click="connectToCanva"
                :loading="isCanvaLoading"
              />
              <q-btn
                v-else
                color="negative"
                :icon="UI_ICONS.logout"
                label="Disconnect"
                @click="disconnectFromCanva"
                outline
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Design Selection & Operations -->
      <div v-if="isCanvaAuthenticated" class="row q-col-gutter-md">
        <!-- Design Grid -->
        <div class="col-12 col-md-8">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.palette" class="q-mr-sm" />
                Your Canva Designs ({{ userDesigns.length }})
              </div>

              <!-- Design Grid -->
              <div v-if="userDesigns.length > 0" class="row q-col-gutter-sm">
                <div
                  v-for="design in userDesigns"
                  :key="design.id"
                  class="col-6 col-sm-4 col-md-3"
                >
                  <q-card
                    flat
                    bordered
                    :class="{ 'bg-primary-1': selectedDesign?.id === design.id }"
                    @click="selectDesign(design)"
                    style="cursor: pointer;"
                    class="design-card"
                  >
                    <q-img
                      v-if="design.thumbnailUrl"
                      :src="design.thumbnailUrl"
                      :alt="design.title"
                      style="height: 120px;"
                      fit="cover"
                    >
                      <div class="absolute-top-right q-pa-xs">
                        <q-icon
                          v-if="selectedDesign?.id === design.id"
                          name="check_circle"
                          color="positive"
                          size="sm"
                        />
                      </div>
                    </q-img>
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-weight-medium ellipsis-2-lines">
                        {{ design.title }}
                      </div>
                      <div class="text-caption text-grey-6">
                        ID: {{ design.id.substring(0, 8) }}...
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <div v-else class="text-center q-py-lg">
                <q-icon name="mdi-palette-outline" size="3rem" color="grey-5" />
                <div class="text-h6 text-grey-6 q-mt-md">No designs found</div>
                <div class="text-caption text-grey-6">Create some designs in Canva to see them here</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Design Operations -->
        <div class="col-12 col-md-4">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.autoFix" class="q-mr-sm" />
                Design Operations
              </div>

              <!-- Selected Design Info -->
              <div v-if="selectedDesign" class="q-mb-md">
                <div class="text-subtitle2 q-mb-xs">Selected Design:</div>
                <div class="text-body2 text-weight-medium">{{ selectedDesign.title }}</div>
                <div class="text-caption text-grey-6">ID: {{ selectedDesign.id }}</div>
              </div>

              <div v-else class="q-mb-md">
                <q-banner class="bg-grey-2">
                  <template v-slot:avatar>
                    <q-icon name="info" color="grey-6" />
                  </template>
                  <div class="text-caption">Select a design to perform operations</div>
                </q-banner>
              </div>

              <!-- Operation Buttons -->
              <div class="q-col-gutter-sm">
                <q-btn
                  color="positive"
                  icon="add"
                  label="Create Test Design"
                  @click="createTestDesign"
                  :loading="isOperating"
                  class="full-width"
                />

      <q-btn
        color="primary"
        :icon="UI_ICONS.create"
        label="Duplicate Design"
        @click="duplicateDesign"
        :loading="isOperating"
        :disable="!selectedDesign"
        class="full-width"
      />

                <q-btn
                  color="secondary"
                  :icon="UI_ICONS.download"
                  label="Export Design"
                  @click="exportDesign"
                  :loading="isOperating"
                  :disable="!selectedDesign"
                  class="full-width"
                />

                <q-btn
                  color="accent"
                  :icon="UI_ICONS.autoFix"
                  label="Test Autofill (Enterprise Only)"
                  @click="testAutofill"
                  :loading="isOperating"
                  :disable="!selectedDesign"
                  class="full-width"
                />

                <q-btn
                  color="info"
                  icon="open_in_new"
                  label="Open in Canva"
                  @click="openInCanva"
                  :disable="!selectedDesign"
                  class="full-width"
                  outline
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Quick Stats -->
          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="analytics" class="q-mr-sm" />
                Quick Stats
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="text-h4 text-primary">{{ userDesigns.length }}</div>
                  <div class="text-caption text-grey-6">Total Designs</div>
                </div>
                <div class="col-6">
                  <div class="text-h4 text-positive">{{ operationsCompleted }}</div>
                  <div class="text-caption text-grey-6">Operations</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Connection Required Message -->
      <div v-else class="text-center q-py-xl">
        <q-icon name="mdi-palette-outline" size="4rem" color="grey-5" />
        <div class="text-h5 text-grey-6 q-mt-md">Connect to Canva</div>
        <div class="text-body1 text-grey-6 q-mb-lg">Connect your Canva account to access and manage your designs</div>
        <q-btn
          color="primary"
          :icon="UI_ICONS.login"
          label="Connect Canva Account"
          @click="connectToCanva"
          :loading="isCanvaLoading"
          size="lg"
        />
      </div>

      <!-- Activity Log -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon :name="UI_ICONS.console" class="q-mr-sm" />
            Activity Log
          </div>
          <div class="activity-logs">
            <div
              v-for="(log, index) in activityLogs"
              :key="index"
              class="log-entry"
              :class="`log-${log.type}`"
            >
              <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="activityLogs.length === 0" class="text-grey-6 text-center q-py-md">
              No activity yet. Connect to Canva and start working with your designs!
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
import { UI_ICONS } from '../constants/ui-icons';
import { useCanvaAuth } from '../composables/useCanvaAuth';
import { canvaApiService } from '../services/canva-api.service';

const $q = useQuasar();
const {
  isAuthenticated: isCanvaAuthenticated,
  isLoading: isCanvaLoading,
  initiateOAuth,
  signOut,
  refreshAuthState
} = useCanvaAuth();

// State
const isLoadingDesigns = ref(false);
const isOperating = ref(false);
const userDesigns = ref<Array<{ id: string; title: string; thumbnailUrl?: string }>>([]);
const selectedDesign = ref<{ id: string; title: string; thumbnailUrl?: string } | null>(null);
const operationsCompleted = ref(0);

const activityLogs = ref<Array<{
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}>>([]);

// Methods
const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
  activityLogs.value.unshift({
    timestamp: new Date(),
    type,
    message,
  });

  // Keep only last 50 logs
  if (activityLogs.value.length > 50) {
    activityLogs.value = activityLogs.value.slice(0, 50);
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

const refreshDesigns = async () => {
  if (!isCanvaAuthenticated.value) {
    addLog('warning', 'Please connect to Canva first');
    return;
  }

  isLoadingDesigns.value = true;
  addLog('info', 'Refreshing designs from Canva...');

  try {
    const designs = await canvaApiService.getTemplates();
    userDesigns.value = designs;

    addLog('success', `Loaded ${designs.length} designs from Canva`);

    // Clear selection if selected design is no longer available
    if (selectedDesign.value && !designs.find(d => d.id === selectedDesign.value?.id)) {
      selectedDesign.value = null;
      addLog('info', 'Selected design no longer available, cleared selection');
    }

  } catch (error) {
    logger.error('Failed to refresh designs:', error);

    // Add detailed error information to activity log
    let errorMessage = `Failed to refresh designs: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Failed to refresh designs from Canva',
    });
  } finally {
    isLoadingDesigns.value = false;
  }
};

const selectDesign = (design: { id: string; title: string; thumbnailUrl?: string }) => {
  selectedDesign.value = design;
  addLog('info', `Selected design: ${design.title}`);
};

const duplicateDesign = async () => {
  if (!selectedDesign.value) return;

  isOperating.value = true;
    addLog('info', `Attempting to duplicate design: ${selectedDesign.value.title}`);

  try {
    const result = await canvaApiService.duplicateDesign(selectedDesign.value.id);

    addLog('success', `Design duplicated successfully: ${result.id}`);
    operationsCompleted.value++;

    $q.notify({
      type: 'positive',
      message: 'Design duplicated successfully!',
      caption: `New Design ID: ${result.id}`,
      actions: [
        {
          label: 'Open Design',
          color: 'white',
          handler: () => {
            window.open(result.editUrl, '_blank');
          },
        },
      ],
    });

    // Refresh designs to show the new one
    await refreshDesigns();

  } catch (error) {
    logger.error('Design creation failed:', error);

    // Add detailed error information to activity log
    let errorMessage = `Design creation failed: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Failed to create new design',
    });
  } finally {
    isOperating.value = false;
  }
};

const exportDesign = async () => {
  if (!selectedDesign.value) return;

  isOperating.value = true;
  addLog('info', `Exporting design: ${selectedDesign.value.title}`);

  try {
    const result = await canvaApiService.exportDesign(selectedDesign.value.id);

    addLog('success', `Design export initiated: ${result.exportUrl}`);
    operationsCompleted.value++;

    $q.notify({
      type: 'positive',
      message: 'Design export started! Check the activity log for progress.',
    });

  } catch (error) {
    logger.error('Design export failed:', error);

    // Add detailed error information to activity log
    let errorMessage = `Design export failed: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Failed to export design',
    });
  } finally {
    isOperating.value = false;
  }
};

const createTestDesign = async () => {
  isOperating.value = true;
  addLog('info', 'Creating test design to verify API connectivity');

  try {
    const result = await canvaApiService.createTestDesign();

    addLog('success', `Test design created successfully: ${result.id}`);
    operationsCompleted.value++;

    $q.notify({
      type: 'positive',
      message: 'Test design created successfully!',
      actions: [
        {
          label: 'Open Design',
          color: 'white',
          handler: () => {
            window.open(result.editUrl, '_blank');
          },
        },
      ],
    });

    // Refresh designs to show the new one
    await refreshDesigns();

  } catch (error) {
    logger.error('Test design creation failed:', error);

    // Add detailed error information to activity log
    let errorMessage = `Test design creation failed: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Failed to create test design',
    });
  } finally {
    isOperating.value = false;
  }
};

const testAutofill = async () => {
  if (!selectedDesign.value) return;

  isOperating.value = true;
  addLog('info', `Testing autofill with design: ${selectedDesign.value.title}`);

  try {
    // Test autofill functionality (disabled - requires Enterprise)
    const result = await canvaApiService.createDesignWithAutofill();

    addLog('success', `Autofill test successful: ${result.designId}`);
    operationsCompleted.value++;

    $q.notify({
      type: 'positive',
      message: 'Autofill test completed successfully!',
      actions: [
        {
          label: 'Open Design',
          color: 'white',
          handler: () => {
            window.open(result.editUrl, '_blank');
          },
        },
      ],
    });

  } catch (error) {
    logger.error('Autofill test failed:', error);

    // Add detailed error information to activity log
    let errorMessage = `Autofill test failed: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Autofill requires Canva Enterprise - feature not available',
    });
  } finally {
    isOperating.value = false;
  }
};

const openInCanva = async () => {
  if (!selectedDesign.value) return;

  isOperating.value = true;
  addLog('info', `Opening design in Canva: ${selectedDesign.value.title}`);

  try {
    // Get the design details to get the edit URL
    const design = await canvaApiService.getDesign(selectedDesign.value.id);

    if (design.editUrl) {
      // Open the design in Canva
      window.open(design.editUrl, '_blank');
      addLog('success', `Opened design in Canva: ${design.editUrl}`);

      $q.notify({
        type: 'positive',
        message: 'Design opened in Canva!',
      });
    } else {
      throw new Error('No edit URL available for this design');
    }

  } catch (error) {
    logger.error('Failed to open design in Canva:', error);

    // Add detailed error information to activity log
    let errorMessage = `Failed to open design in Canva: ${String(error)}`;

    // If it's an axios error, add the response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(axiosError.response.data, null, 2)}`;
      }
    }

    addLog('error', errorMessage);

    $q.notify({
      type: 'negative',
      message: 'Failed to open design in Canva',
    });
  } finally {
    isOperating.value = false;
  }
};

// Authentication methods
const connectToCanva = () => {
  addLog('info', 'Initiating Canva OAuth connection');
  initiateOAuth();
};

const disconnectFromCanva = () => {
  addLog('info', 'Disconnecting from Canva');
  signOut();
  userDesigns.value = [];
  selectedDesign.value = null;
  operationsCompleted.value = 0;

  $q.notify({
    type: 'info',
    message: 'Disconnected from Canva',
  });
};

// Lifecycle
onMounted(async () => {
  addLog('info', 'Canva Demo Page loaded');

  // Refresh auth state and wait for it to complete
  await refreshAuthState();

  // Auto-refresh designs if already connected
  if (isCanvaAuthenticated.value) {
    addLog('info', 'Authentication restored, refreshing designs...');
    void refreshDesigns();
  } else {
    addLog('info', 'No authentication found, user needs to connect');
  }
});
</script>

<style scoped>
.design-card {
  transition: all 0.2s ease;
}

.design-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.activity-logs {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--q-border);
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 12px;
}

.log-timestamp {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-info {
  color: var(--q-primary);
}

.log-success {
  color: var(--q-positive);
}

.log-warning {
  color: var(--q-warning);
}

.log-error {
  color: var(--q-negative);
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
