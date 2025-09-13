<!--
  Canva Integration Demo Page - Admin-only demonstration of Canva features
  Shows autofill functionality, template selection, and export workflows
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
            Test and demonstrate Canva Connect API features with ContentDoc integration
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :icon="UI_ICONS.refresh"
            label="Refresh Demo"
            @click="refreshDemo"
            :loading="isLoading"
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
                {{ isCanvaAuthenticated ? 'Ready to create and export designs' : 'Connect your Canva account to test live features' }}
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

      <!-- Demo Status Overview -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.checkCircle" color="positive" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ demoStats.connectedUsers }}</div>
              <div class="text-caption text-grey-6">Connected Users</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.palette" color="primary" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ demoStats.templatesAvailable }}</div>
              <div class="text-caption text-grey-6">Templates Available</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.download" color="info" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ demoStats.exportsCompleted }}</div>
              <div class="text-caption text-grey-6">Exports Completed</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon :name="UI_ICONS.autoFix" color="accent" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ demoStats.autofillTests }}</div>
              <div class="text-caption text-grey-6">Autofill Tests</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Demo Sections -->
      <div class="row q-col-gutter-md">
        <!-- Autofill Demo -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.autoFix" class="q-mr-sm" />
                Autofill Demo
              </div>
              <p class="text-body2 text-grey-6 q-mb-md">
                Test ContentDoc feature mapping to Canva template fields
              </p>

              <!-- Sample ContentDoc -->
              <q-expansion-item
                icon="mdi-file-document"
                label="Sample ContentDoc Data"
                class="q-mb-md"
              >
                <div class="q-pa-sm rounded-borders">
                  <pre class="text-caption">{{ JSON.stringify(sampleContentDoc, null, 2) }}</pre>
                </div>
              </q-expansion-item>

              <!-- Autofill Controls -->
              <div class="q-col-gutter-sm">
                <q-select
                  v-model="selectedTemplate"
                  :options="templateOptions"
                  label="Select Template"
                  emit-value
                  map-options
                  option-value="id"
                  option-label="name"
                  class="q-mb-sm"
                />

                <q-btn
                  color="primary"
                  :icon="UI_ICONS.autoFix"
                  label="Test Autofill Mapping"
                  @click="testAutofillMapping"
                  :loading="isTestingAutofill"
                  class="full-width"
                />

                <q-btn
                  color="secondary"
                  :icon="UI_ICONS.palette"
                  label="Create Design with Autofill"
                  @click="createDesignWithAutofill"
                  :loading="isCreatingDesign"
                  :disable="!selectedTemplate"
                  class="full-width"
                />
              </div>

              <!-- Autofill Results -->
              <div v-if="autofillResults" class="q-mt-md">
                <q-expansion-item
                  icon="mdi-check-circle"
                  label="Autofill Results"
                  class="q-mb-sm"
                >
                  <div class="q-pa-sm rounded-borders">
                    <pre class="text-caption">{{ JSON.stringify(autofillResults, null, 2) }}</pre>
                  </div>
                </q-expansion-item>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Template Selection Demo -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.palette" class="q-mr-sm" />
                Template Selection Demo
              </div>
              <p class="text-body2 text-grey-6 q-mb-md">
                Browse available Canva templates and their field mappings
              </p>

              <!-- Template Grid -->
              <div class="row q-col-gutter-sm">
                <div
                  v-for="template in availableTemplates"
                  :key="template.id"
                  class="col-6"
                >
                  <q-card
                    flat
                    bordered
                    :class="{ 'bg-primary-1': selectedTemplate === template.id }"
                    @click="selectedTemplate = template.id"
                    style="cursor: pointer;"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="text-center">
                        <q-icon :name="template.icon" size="2rem" :color="template.color" />
                        <div class="text-caption q-mt-xs">{{ template.name }}</div>
                        <div class="text-caption text-grey-6">{{ template.fields.length }} fields</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- Template Details -->
              <div v-if="selectedTemplateDetails" class="q-mt-md">
                <q-expansion-item
                  icon="mdi-information"
                  label="Template Details"
                >
                  <div class="q-pa-sm">
                    <div class="text-subtitle2 q-mb-sm">{{ selectedTemplateDetails.name }}</div>
                    <div class="text-body2 text-grey-6 q-mb-sm">{{ selectedTemplateDetails.description }}</div>

                    <div class="text-subtitle2 q-mb-xs">Field Mappings:</div>
                    <q-list dense>
                      <q-item
                        v-for="field in selectedTemplateDetails.fields"
                        :key="field.canvaField"
                        dense
                      >
                        <q-item-section>
                          <q-item-label class="text-caption">
                            <strong>{{ field.canvaField }}</strong> → {{ field.contentPath }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </q-expansion-item>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Export Workflow Demo -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.download" class="q-mr-sm" />
                Export Workflow Demo
              </div>
              <p class="text-body2 text-grey-6 q-mb-md">
                Test the complete export workflow with real-time polling
              </p>

              <!-- Export Controls -->
              <div class="q-col-gutter-sm">
                <q-input
                  v-model="testDesignId"
                  label="Test Design ID"
                  hint="Enter a Canva design ID to test export"
                  class="q-mb-sm"
                />

                <q-btn
                  color="primary"
                  :icon="UI_ICONS.download"
                  label="Test Export Workflow"
                  @click="testExportWorkflow"
                  :loading="isTestingExport"
                  :disable="!testDesignId"
                  class="full-width"
                />
              </div>

              <!-- Export Status -->
              <div v-if="exportStatus" class="q-mt-md">
                <q-linear-progress
                  :value="exportProgress"
                  :color="exportStatusColor"
                  class="q-mb-sm"
                />
                <div class="text-caption text-center">
                  {{ exportStatus }} ({{ exportProgress * 100 }}%)
                </div>
              </div>

              <!-- Export Results -->
              <div v-if="exportResults" class="q-mt-md">
                <q-expansion-item
                  icon="mdi-download"
                  label="Export Results"
                >
                  <div class="q-pa-sm rounded-borders">
                    <pre class="text-caption">{{ JSON.stringify(exportResults, null, 2) }}</pre>
                  </div>
                </q-expansion-item>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Account Type Demo -->
        <div class="col-12 col-md-6">
          <q-card class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.account" class="q-mr-sm" />
                Account Type Demo
              </div>
              <p class="text-body2 text-grey-6 q-mb-md">
                Test feature availability across different Canva account types
              </p>

              <!-- Account Type Selector -->
              <q-select
                v-model="selectedAccountType"
                :options="accountTypeOptions"
                label="Select Account Type"
                emit-value
                map-options
                option-value="value"
                option-label="label"
                class="q-mb-md"
              />

              <!-- Feature Availability -->
              <div v-if="selectedAccountType" class="q-mb-md">
                <div class="text-subtitle2 q-mb-sm">Available Features:</div>
                <q-list dense>
                  <q-item
                    v-for="feature in accountFeatures"
                    :key="feature.name"
                    dense
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="feature.available ? UI_ICONS.checkCircle : UI_ICONS.closeCircle"
                        :color="feature.available ? 'positive' : 'negative'"
                        size="sm"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-caption">{{ feature.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Test Account Features -->
              <q-btn
                color="accent"
                :icon="UI_ICONS.testTube"
                label="Test Account Features"
                @click="testAccountFeatures"
                :loading="isTestingAccount"
                class="full-width"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Demo Logs -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon :name="UI_ICONS.console" class="q-mr-sm" />
            Demo Activity Log
          </div>
          <div class="demo-logs">
            <div
              v-for="(log, index) in demoLogs"
              :key="index"
              class="log-entry"
              :class="`log-${log.type}`"
            >
              <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="demoLogs.length === 0" class="text-grey-6 text-center q-py-md">
              No demo activity yet. Try the features above to see logs.
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { UI_ICONS } from '../constants/ui-icons';
import { type ContentDoc } from '../types/core/content.types';
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
const isLoading = ref(false);
const isTestingAutofill = ref(false);
const isCreatingDesign = ref(false);
const isTestingExport = ref(false);
const isTestingAccount = ref(false);

const demoStats = ref({
  connectedUsers: 0,
  templatesAvailable: 0,
  exportsCompleted: 0,
  autofillTests: 0,
});

const selectedTemplate = ref<string>('');
const autofillResults = ref<Record<string, unknown> | null>(null);
const testDesignId = ref('');
const exportStatus = ref<string>('');
const exportProgress = ref(0);
const exportResults = ref<Record<string, unknown> | null>(null);
const selectedAccountType = ref<string>('pro');

const demoLogs = ref<Array<{
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}>>([]);

// Sample ContentDoc for testing
const sampleContentDoc = ref<ContentDoc>({
  id: 'demo-content-001',
  title: 'Community BBQ Event',
  description: 'Join us for our annual summer BBQ at the lake pavilion. Food, games, and fun for the whole family!',
  authorId: 'demo-user-001',
  authorName: 'Demo User',
  tags: ['content-type:event', 'category:social', 'priority:high'],
  features: {
    'feat:date': {
      start: Timestamp.fromDate(new Date('2025-09-20T17:00:00Z')),
      end: Timestamp.fromDate(new Date('2025-09-20T20:00:00Z')),
      isAllDay: false,
    },
    'feat:location': {
      name: 'Lake Pavilion',
      address: '123 Lake Drive, Community, TX 75001',
    },
    'feat:task': {
      category: 'setup',
      qty: 3,
      unit: 'tables',
      status: 'unclaimed',
    },
  },
  status: 'draft',
  timestamps: {
    created: Timestamp.now(),
    updated: Timestamp.now(),
  },
});

// Template options
const templateOptions = ref([
  { id: 'event-flyer', name: 'Event Flyer', fields: ['title', 'date', 'location'] },
  { id: 'announcement', name: 'Announcement', fields: ['title', 'description', 'date'] },
  { id: 'volunteer-spotlight', name: 'Volunteer Spotlight', fields: ['name', 'role', 'description'] },
  { id: 'newsletter-header', name: 'Newsletter Header', fields: ['title', 'date', 'issue'] },
]);

// Available templates for selection
const availableTemplates = ref([
  {
    id: 'event-flyer',
    name: 'Event Flyer',
    description: 'Perfect for community events and gatherings',
    icon: 'mdi-calendar-star',
    color: 'primary',
    fields: [
      { canvaField: 'eventTitle', contentPath: 'title' },
      { canvaField: 'eventDate', contentPath: 'features.feat:date.start' },
      { canvaField: 'eventLocation', contentPath: 'features.feat:location.name' },
    ],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Great for important community announcements',
    icon: 'mdi-bullhorn',
    color: 'secondary',
    fields: [
      { canvaField: 'announcementTitle', contentPath: 'title' },
      { canvaField: 'announcementText', contentPath: 'description' },
      { canvaField: 'publishDate', contentPath: 'timestamps.created' },
    ],
  },
  {
    id: 'volunteer-spotlight',
    name: 'Volunteer Spotlight',
    description: 'Highlight community volunteers and their contributions',
    icon: 'mdi-account-star',
    color: 'accent',
    fields: [
      { canvaField: 'volunteerName', contentPath: 'authorName' },
      { canvaField: 'volunteerRole', contentPath: 'features.feat:task.category' },
      { canvaField: 'volunteerDescription', contentPath: 'description' },
    ],
  },
  {
    id: 'newsletter-header',
    name: 'Newsletter Header',
    description: 'Professional header for newsletter publications',
    icon: 'mdi-newspaper',
    color: 'info',
    fields: [
      { canvaField: 'newsletterTitle', contentPath: 'title' },
      { canvaField: 'issueDate', contentPath: 'features.feat:date.start' },
      { canvaField: 'issueNumber', contentPath: 'tags' },
    ],
  },
]);

// Account type options
const accountTypeOptions = ref([
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
  { label: 'Teams', value: 'teams' },
  { label: 'Enterprise', value: 'enterprise' },
]);

// Computed properties
const selectedTemplateDetails = computed(() => {
  return availableTemplates.value.find(t => t.id === selectedTemplate.value);
});

const accountFeatures = computed(() => {
  const features = [
    { name: 'Basic Templates', available: true },
    { name: 'Autofill', available: selectedAccountType.value !== 'free' },
    { name: 'Brand Templates', available: ['pro', 'teams', 'enterprise'].includes(selectedAccountType.value) },
    { name: 'Premium Assets', available: ['pro', 'teams', 'enterprise'].includes(selectedAccountType.value) },
    { name: 'Magic Resize', available: ['pro', 'teams', 'enterprise'].includes(selectedAccountType.value) },
    { name: 'Background Remover', available: ['pro', 'teams', 'enterprise'].includes(selectedAccountType.value) },
    { name: 'Team Collaboration', available: ['teams', 'enterprise'].includes(selectedAccountType.value) },
    { name: 'Approval Workflows', available: selectedAccountType.value === 'enterprise' },
  ];
  return features;
});

const exportStatusColor = computed(() => {
  switch (exportStatus.value) {
    case 'pending': return 'warning';
    case 'in_progress': return 'info';
    case 'completed': return 'positive';
    case 'failed': return 'negative';
    default: return 'grey';
  }
});

// Methods
const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
  demoLogs.value.unshift({
    timestamp: new Date(),
    type,
    message,
  });

  // Keep only last 50 logs
  if (demoLogs.value.length > 50) {
    demoLogs.value = demoLogs.value.slice(0, 50);
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

const prepareAutofillData = (contentDoc: ContentDoc, templateId: string): Record<string, unknown> => {
  const template = availableTemplates.value.find(t => t.id === templateId);
  if (!template) return {};

  const autofillData: Record<string, unknown> = {};

  template.fields.forEach(field => {
    try {
      // Simple path resolution for demo
      const value = getNestedValue(contentDoc, field.contentPath);
      if (value !== undefined && value !== null) {
        autofillData[field.canvaField] = formatValue(value);
      }
    } catch (error) {
      logger.warn(`Failed to map field ${field.contentPath}:`, error);
    }
  });

  return autofillData;
};

const getNestedValue = (obj: ContentDoc, path: string): unknown => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
};

const formatValue = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString();
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

const testAutofillMapping = () => {
  if (!selectedTemplate.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select a template first',
    });
    return;
  }

  isTestingAutofill.value = true;
  addLog('info', `Testing autofill mapping for template: ${selectedTemplate.value}`);

  try {
    const autofillData = prepareAutofillData(sampleContentDoc.value, selectedTemplate.value);
    autofillResults.value = autofillData;

    addLog('success', `Autofill mapping successful: ${Object.keys(autofillData).length} fields mapped`);

    $q.notify({
      type: 'positive',
      message: 'Autofill mapping test completed successfully',
    });
  } catch (error) {
    logger.error('Autofill mapping test failed:', error);
    addLog('error', `Autofill mapping failed: ${String(error)}`);

    $q.notify({
      type: 'negative',
      message: 'Autofill mapping test failed',
    });
  } finally {
    isTestingAutofill.value = false;
  }
};

const createDesignWithAutofill = async () => {
  if (!selectedTemplate.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select a template first',
    });
    return;
  }

  if (!isCanvaAuthenticated.value) {
    $q.notify({
      type: 'warning',
      message: 'Please connect your Canva account first',
    });
    return;
  }

  isCreatingDesign.value = true;
  addLog('info', `Creating design with autofill for template: ${selectedTemplate.value}`);

  try {
    const autofillData = prepareAutofillData(sampleContentDoc.value, selectedTemplate.value);

    // Use real Canva API
    const result = await canvaApiService.createDesignWithAutofill(
      selectedTemplate.value, // This should be a real Canva template ID
      autofillData
    );

    addLog('success', `Design created successfully: ${result.designId}`);

    $q.notify({
      type: 'positive',
      message: 'Design created with autofill successfully',
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
    logger.error('Design creation failed:', error);
    addLog('error', `Design creation failed: ${String(error)}`);

    $q.notify({
      type: 'negative',
      message: 'Design creation failed',
    });
  } finally {
    isCreatingDesign.value = false;
  }
};

const testExportWorkflow = async () => {
  if (!testDesignId.value) {
    $q.notify({
      type: 'warning',
      message: 'Please enter a design ID first',
    });
    return;
  }

  if (!isCanvaAuthenticated.value) {
    $q.notify({
      type: 'warning',
      message: 'Please connect your Canva account first',
    });
    return;
  }

  isTestingExport.value = true;
  exportStatus.value = 'pending';
  exportProgress.value = 0;
  addLog('info', `Testing export workflow for design: ${testDesignId.value}`);

  try {
    // Use real Canva API for export
    exportStatus.value = 'in_progress';
    exportProgress.value = 0.3;

    const exportResult = await canvaApiService.exportDesign(testDesignId.value);

    exportStatus.value = 'completed';
    exportProgress.value = 1.0;

    const finalResult = {
      designId: testDesignId.value,
      exportUrl: exportResult.exportUrl,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    exportResults.value = finalResult;
    addLog('success', `Export completed successfully: ${testDesignId.value}`);

    $q.notify({
      type: 'positive',
      message: 'Export workflow completed successfully',
      actions: [
        {
          label: 'Download',
          color: 'white',
          handler: () => {
            window.open(finalResult.exportUrl, '_blank');
          },
        },
      ],
    });
  } catch (error) {
    logger.error('Export workflow test failed:', error);
    exportStatus.value = 'failed';
    addLog('error', `Export workflow failed: ${String(error)}`);

    $q.notify({
      type: 'negative',
      message: 'Export workflow test failed',
    });
  } finally {
    isTestingExport.value = false;
  }
};

const testAccountFeatures = async () => {
  isTestingAccount.value = true;
  addLog('info', `Testing account features for: ${selectedAccountType.value}`);

  try {
    // Simulate account feature testing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const availableFeatures = accountFeatures.value.filter(f => f.available);
    addLog('success', `Account features tested: ${availableFeatures.length} features available`);

    $q.notify({
      type: 'positive',
      message: `Account features tested: ${availableFeatures.length} features available`,
    });
  } catch (error) {
    logger.error('Account feature test failed:', error);
    addLog('error', `Account feature test failed: ${String(error)}`);

    $q.notify({
      type: 'negative',
      message: 'Account feature test failed',
    });
  } finally {
    isTestingAccount.value = false;
  }
};

const refreshDemo = async () => {
  isLoading.value = true;
  addLog('info', 'Refreshing demo data');

  try {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));

    demoStats.value = {
      connectedUsers: Math.floor(Math.random() * 50) + 10,
      templatesAvailable: availableTemplates.value.length,
      exportsCompleted: Math.floor(Math.random() * 100) + 20,
      autofillTests: Math.floor(Math.random() * 200) + 50,
    };

    addLog('success', 'Demo data refreshed successfully');
  } catch (error) {
    logger.error('Demo refresh failed:', error);
    addLog('error', `Demo refresh failed: ${String(error)}`);
  } finally {
    isLoading.value = false;
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
  $q.notify({
    type: 'info',
    message: 'Disconnected from Canva',
  });
};

// Lifecycle
onMounted(() => {
  void refreshDemo();
  refreshAuthState(); // Check for stored Canva tokens
  addLog('info', 'Canva Demo Page loaded');
});
</script>

<style scoped>
.full-height {
  height: 100%;
}

.demo-logs {
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
</style>
