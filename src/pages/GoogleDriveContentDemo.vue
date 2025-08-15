<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <h1 class="text-h3 q-mb-sm">Google Drive Content Management Demo</h1>
      <p class="text-subtitle1 text-grey-7">
        This page demonstrates the comprehensive Google Drive integration for managing newsletter content,
        including articles, issues, images, and collaborative editing workflows.
      </p>
    </div>

    <!-- Configuration Status -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="settings" class="q-mr-sm" />
          Configuration Status
        </div>

        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-list bordered separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon :name="hasApiKey ? 'check_circle' : 'error'" :color="hasApiKey ? 'green' : 'red'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Google API Key</q-item-label>
                  <q-item-label caption>{{ hasApiKey ? 'Configured' : 'Missing' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon :name="hasClientId ? 'check_circle' : 'error'" :color="hasClientId ? 'green' : 'red'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>OAuth Client ID</q-item-label>
                  <q-item-label caption>{{ hasClientId ? 'Configured' : 'Missing' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon :name="hasFolderIds ? 'check_circle' : 'warning'"
                    :color="hasFolderIds ? 'green' : 'orange'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Folder Configuration</q-item-label>
                  <q-item-label caption>{{ hasFolderIds ? 'All folders configured' : 'Some folders missing'
                    }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon :name="isInitialized ? 'check_circle' : 'pending'"
                    :color="isInitialized ? 'green' : 'grey'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Service Status</q-item-label>
                  <q-item-label caption>{{ isInitialized ? 'Initialized' : 'Not initialized'
                  }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="account_circle" color="blue" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Authentication</q-item-label>
                  <q-item-label caption>Click "Authenticate with Google" to sign in</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">Quick Setup</div>
                <p class="text-caption text-grey-7 q-mb-md">
                  Copy your .env.example to .env and fill in your Google credentials.
                </p>
                <q-btn color="primary" label="Initialize Service" @click="initializeService" :loading="initLoading"
                  :disable="!canInitialize" class="q-mb-sm" />
                <q-btn color="secondary" label="Authenticate with Google" @click="authenticateUser"
                  :loading="authLoading" :disable="!isInitialized" />
                <div v-if="authError" class="text-negative q-mt-sm">
                  <q-icon name="error" class="q-mr-xs" />
                  {{ authError }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Demo Sections -->
    <div class="row q-gutter-lg">
      <!-- Content Management Demo -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="article" class="q-mr-sm" />
              Content Management
            </div>

            <q-tabs v-model="contentTab" class="q-mb-md">
              <q-tab name="articles" label="Articles" />
              <q-tab name="events" label="Events" />
              <q-tab name="issues" label="Issues" />
              <q-tab name="classifieds" label="Classifieds" />
            </q-tabs>

            <q-tab-panels v-model="contentTab" class="bg-transparent">
              <!-- Articles Panel -->
              <q-tab-panel name="articles" class="q-pa-none">
                <div v-if="articles.length === 0" class="text-center q-pa-md text-grey-6">
                  <q-icon name="description" size="3rem" class="q-mb-md" />
                  <div>No articles found</div>
                  <div class="text-caption">Create Google Docs in your Content/Articles folder</div>
                </div>
                <q-list v-else separator>
                  <q-item v-for="article in articles.slice(0, 3)" :key="article.id" clickable
                    @click="viewContent(article)">
                    <q-item-section>
                      <q-item-label>{{ article.title }}</q-item-label>
                      <q-item-label caption>{{ formatDate(article.lastModified) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip :color="article.status === 'published' ? 'green' : 'orange'" text-color="white" size="sm">
                        {{ article.status }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>

              <!-- Events Panel -->
              <q-tab-panel name="events" class="q-pa-none">
                <div v-if="events.length === 0" class="text-center q-pa-md text-grey-6">
                  <q-icon name="event" size="3rem" class="q-mb-md" />
                  <div>No events found</div>
                  <div class="text-caption">Create Google Docs in your Content/Events folder</div>
                </div>
                <q-list v-else separator>
                  <q-item v-for="event in events.slice(0, 3)" :key="event.id" clickable @click="viewContent(event)">
                    <q-item-section>
                      <q-item-label>{{ event.title }}</q-item-label>
                      <q-item-label caption>{{ formatDate(event.lastModified) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip :color="event.status === 'published' ? 'green' : 'orange'" text-color="white" size="sm">
                        {{ event.status }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>

              <!-- Issues Panel -->
              <q-tab-panel name="issues" class="q-pa-none">
                <div v-if="issues.length === 0" class="text-center q-pa-md text-grey-6">
                  <q-icon name="picture_as_pdf" size="3rem" class="q-mb-md" />
                  <div>No issues found</div>
                  <div class="text-caption">Upload PDFs to your Issues folder</div>
                </div>
                <div v-else class="row q-gutter-sm">
                  <div v-for="issue in issues.slice(0, 2)" :key="issue.id" class="col-6">
                    <q-card flat bordered class="cursor-pointer" @click="viewIssue(issue)">
                      <div class="thumbnail-container">
                        <img v-if="issue.cacheThumbnailUrl" :src="issue.cacheThumbnailUrl" :alt="issue.title"
                          class="thumbnail" />
                        <div v-else class="thumbnail-placeholder">
                          <q-icon name="picture_as_pdf" size="2rem" />
                        </div>
                        <q-chip :color="getStatusColor(issue.status)" text-color="white" size="xs" class="status-chip">
                          {{ issue.status }}
                        </q-chip>
                      </div>
                      <q-card-section class="q-pa-sm">
                        <div class="text-subtitle2">{{ issue.title }}</div>
                        <div class="text-caption text-grey-6">{{ issue.date }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Classifieds Panel -->
              <q-tab-panel name="classifieds" class="q-pa-none">
                <div v-if="classifieds.length === 0" class="text-center q-pa-md text-grey-6">
                  <q-icon name="table_chart" size="3rem" class="q-mb-md" />
                  <div>No classifieds found</div>
                  <div class="text-caption">Create Google Sheets in your Content folder</div>
                </div>
                <q-list v-else separator>
                  <q-item v-for="(ad, index) in classifieds.slice(0, 3)" :key="index">
                    <q-item-section>
                      <q-item-label>{{ ad.title || 'Untitled' }}</q-item-label>
                      <q-item-label caption>{{ ad.category || 'No category' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-item-label caption>{{ ad.contact || 'No contact' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>
            </q-tab-panels>

            <q-separator class="q-my-md" />

            <div class="row q-gutter-sm">
              <q-btn color="primary" label="Sync Content" icon="sync" @click="syncContent" :loading="isLoading"
                size="sm" />
              <q-btn color="secondary" label="View All" icon="open_in_new" @click="openContentManager" size="sm" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- File Operations Demo -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="folder" class="q-mr-sm" />
              File Operations Demo
            </div>

            <!-- Upload Demo -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Upload Test</div>
              <q-file v-model="uploadFile" label="Select a file to test upload" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                max-file-size="10485760" @rejected="onFileRejected">
                <template v-slot:append>
                  <q-btn round dense flat icon="attach_file" @click="simulateUpload" :disable="!uploadFile" />
                </template>
              </q-file>
            </div>

            <!-- Search Demo -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Content Search</div>
              <q-input v-model="searchQuery" label="Search content..." dense @keyup.enter="performSearch">
                <template v-slot:append>
                  <q-btn round dense flat icon="search" @click="performSearch" />
                </template>
              </q-input>

              <div v-if="searchResults.length > 0" class="q-mt-sm">
                <q-list dense>
                  <q-item v-for="result in searchResults.slice(0, 3)" :key="result.id" clickable
                    @click="viewSearchResult(result)">
                    <q-item-section>
                      <q-item-label>{{ result.title }}</q-item-label>
                      <q-item-label caption>{{ result.contentType }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>

            <!-- Cache Management -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Cache Management</div>
              <div class="row q-gutter-xs">
                <q-btn size="sm" outline label="Clear Cache" icon="clear_all" @click="clearCache" />
                <q-btn size="sm" outline label="Refresh All" icon="refresh" @click="refreshContent"
                  :loading="isLoading" />
              </div>
            </div>

            <!-- Sync Status -->
            <q-banner v-if="syncStatus" :class="getSyncStatusColor()" rounded dense class="q-mt-md">
              <template v-slot:avatar>
                <q-icon :name="getSyncStatusIcon()" :color="getSyncStatusIconColor()" />
              </template>
              <div class="text-caption">
                <div><strong>Last Sync:</strong> {{ formatDate(syncStatus.lastSync) }}</div>
                <div v-if="syncStatus.errors.length > 0">
                  <strong>Errors:</strong> {{ syncStatus.errors.length }}
                </div>
                <div><strong>Status:</strong> {{ syncStatus.syncInProgress ? 'Syncing...' : 'Idle' }}
                </div>
              </div>
            </q-banner>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Live Collaboration Demo -->
    <q-card class="q-mt-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="people" class="q-mr-sm" />
          Live Collaboration Workflow
        </div>

        <div class="row q-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="edit" size="2rem" color="primary" class="q-mb-sm" />
                <div class="text-subtitle2">1. Edit in Google Docs</div>
                <p class="text-caption text-grey-7">
                  Content creators edit articles and events directly in Google Docs for real-time
                  collaboration.
                </p>
                <q-btn color="primary" outline label="Open Google Docs" icon="open_in_new" @click="openGoogleDocs"
                  size="sm" />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="sync" size="2rem" color="secondary" class="q-mb-sm" />
                <div class="text-subtitle2">2. Auto-Sync Content</div>
                <p class="text-caption text-grey-7">
                  The website automatically syncs changes from Google Drive and caches content
                  locally.
                </p>
                <div class="text-caption">
                  <q-icon name="schedule" size="sm" class="q-mr-xs" />
                  Every {{ syncInterval }} minutes
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="design_services" size="2rem" color="accent" class="q-mb-sm" />
                <div class="text-subtitle2">3. Design in Canva</div>
                <p class="text-caption text-grey-7">
                  Canva templates automatically pull the latest content for newsletter design and
                  layout.
                </p>
                <q-btn color="accent" outline label="Open Canva" icon="open_in_new" @click="openCanva" size="sm" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Content Preview Dialog -->
    <q-dialog v-model="showPreview" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ previewContent?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="previewContent?.content" v-html="previewContent.content" class="content-preview"></div>
          <div v-else class="text-center q-pa-xl text-grey-6">
            <q-icon name="description" size="3rem" class="q-mb-md" />
            <div>No content preview available</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Demo Instructions -->
    <q-card class="q-mt-lg bg-blue-1">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="info" class="q-mr-sm" />
          How to Use This Demo
        </div>

        <q-stepper v-model="step" flat class="bg-transparent">
          <q-step :name="1" title="Configure Environment" icon="settings" :done="step > 1" :header-nav="step > 1">
            <div>
              <p>Set up your Google Drive integration:</p>
              <ol>
                <li>Copy <code>.env.example</code> to <code>.env</code></li>
                <li>Add your Google API key and OAuth client ID</li>
                <li>Create folders in Google Drive and add their IDs to the config</li>
                <li>Click "Initialize Service" above</li>
              </ol>
            </div>
            <q-stepper-navigation>
              <q-btn @click="step = 2" color="primary" label="Next" />
            </q-stepper-navigation>
          </q-step>

          <q-step :name="2" title="Add Content" icon="create_new_folder" :done="step > 2" :header-nav="step > 2">
            <div>
              <p>Create test content in your Google Drive:</p>
              <ul>
                <li><strong>Articles:</strong> Create Google Docs in Content/Articles/</li>
                <li><strong>Events:</strong> Create Google Docs in Content/Events/</li>
                <li><strong>Issues:</strong> Upload PDFs to Issues/PDFs/</li>
                <li><strong>Classifieds:</strong> Create Google Sheets in Content/</li>
              </ul>
            </div>
            <q-stepper-navigation>
              <q-btn @click="step = 1" color="primary" flat label="Back" />
              <q-btn @click="step = 3" color="primary" label="Next" />
            </q-stepper-navigation>
          </q-step>

          <q-step :name="3" title="Test Features" icon="play_circle" :header-nav="step > 3">
            <div>
              <p>Try out the features:</p>
              <ul>
                <li>Click "Sync Content" to fetch your Google Drive content</li>
                <li>Search for content using the search box</li>
                <li>Click on items to preview them</li>
                <li>Test the collaborative workflow buttons</li>
              </ul>
            </div>
            <q-stepper-navigation>
              <q-btn @click="step = 2" color="primary" flat label="Back" />
              <q-btn color="primary" label="Start Testing" @click="startTesting" />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoogleDriveContent } from '../composables/useGoogleDriveContent';
import type {
  GoogleDriveContentConfig,
  IssueWithGoogleDrive,
  ContentPreview,
  SearchResult
} from '../types/google-drive-content';

// Composables
const {
  initialize,
  authenticate,
  syncContent: syncContentAction,
  refreshContent: refreshContentAction,
  articles,
  events,
  issues,
  classifieds,
  isLoading,
  syncStatus,
  isInitialized,
  searchContent,
} = useGoogleDriveContent();

// Component state
const contentTab = ref('articles');
const showPreview = ref(false);
const previewContent = ref<ContentPreview | null>(null);
const uploadFile = ref<File | null>(null);
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const initLoading = ref(false);
const authLoading = ref(false);
const authError = ref<string | null>(null);
const step = ref(1);

// Configuration checks
const hasApiKey = computed(() =>
  Boolean(import.meta.env.VITE_GOOGLE_API_KEY && import.meta.env.VITE_GOOGLE_API_KEY !== 'your_api_key_here')
);

const hasClientId = computed(() =>
  Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_client_id_here.apps.googleusercontent.com')
);

const hasFolderIds = computed(() => {
  const folders = [
    import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID,
    import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID,
    import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID,
    import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
  ];
  return folders.filter(id => id && id !== 'your_folder_id').length >= 2;
});

const canInitialize = computed(() => hasApiKey.value && hasClientId.value);

const syncInterval = computed(() =>
  import.meta.env.VITE_GOOGLE_DRIVE_SYNC_INTERVAL_MINUTES || '30'
);

// Methods
const initializeService = async () => {
  if (!canInitialize.value) {
    $q.notify({
      type: 'negative',
      message: 'Please configure your Google API credentials first',
    });
    return;
  }

  initLoading.value = true;

  try {
    const config: GoogleDriveContentConfig = {
      contentFolderId: import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID || '',
      issuesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID || '',
      imagesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID || '',
      templatesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID || '',
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    };

    await initialize(config);

    $q.notify({
      type: 'positive',
      message: 'Google Drive service initialized successfully!',
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  } finally {
    initLoading.value = false;
  }
};

const authenticateUser = async () => {
  authLoading.value = true;
  authError.value = null;

  try {
    await authenticate();
    $q.notify({
      type: 'positive',
      message: 'Authentication successful!',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    authError.value = errorMessage;

    // Provide helpful error messages for common OAuth issues
    if (errorMessage.includes('Not a valid origin')) {
      authError.value = 'OAuth origin not configured. Please add your localhost URL to Google Cloud Console.';
    } else if (errorMessage.includes('popup_blocked')) {
      authError.value = 'Popup blocked. Please allow popups for this site and try again.';
    }

    $q.notify({
      type: 'negative',
      message: `Authentication failed: ${authError.value}`,
    });
  } finally {
    authLoading.value = false;
  }
};

const syncContent = async () => {
  if (!isInitialized.value) {
    await initializeService();
    return;
  }

  try {
    await syncContentAction();
    $q.notify({
      type: 'positive',
      message: 'Content synchronized successfully!',
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }
};

const refreshContent = async () => {
  try {
    await refreshContentAction();
    $q.notify({
      type: 'positive',
      message: 'Content refreshed successfully!',
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }
};

const viewContent = (content: ContentPreview) => {
  previewContent.value = content;
  showPreview.value = true;
};

const viewIssue = (issue: IssueWithGoogleDrive) => {
  const url = issue.googleDriveUrl || issue.localUrl || issue.url;
  if (url) {
    window.open(url, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'No URL available for this issue',
    });
  }
};

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  searchResults.value = searchContent(searchQuery.value);

  if (searchResults.value.length === 0) {
    $q.notify({
      type: 'info',
      message: 'No results found for your search',
    });
  }
};

const viewSearchResult = (result: SearchResult) => {
  previewContent.value = {
    id: result.id,
    title: result.title,
    content: result.content || 'No content available',
    type: result.contentType === 'article' ? 'article' : 'event',
  };
  showPreview.value = true;
};

const simulateUpload = () => {
  if (!uploadFile.value) return;

  $q.notify({
    type: 'info',
    message: `Upload simulation: ${uploadFile.value.name} (${(uploadFile.value.size / 1024 / 1024).toFixed(2)} MB)`,
  });

  // Simulate upload process
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: 'File upload simulation completed!',
    });
    uploadFile.value = null;
  }, 2000);
};

const onFileRejected = () => {
  $q.notify({
    type: 'negative',
    message: 'File rejected. Please check size and format requirements.',
  });
};

const clearCache = () => {
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('google-')) {
      localStorage.removeItem(key);
    }
  });

  $q.notify({
    type: 'positive',
    message: 'Cache cleared successfully!',
  });
};

const openContentManager = () => {
  // Navigate to a full content manager (you could create a dedicated route)
  $q.notify({
    type: 'info',
    message: 'Full content manager would open here',
  });
};

const openGoogleDocs = () => {
  window.open('https://docs.google.com/document/create', '_blank');
};

const openCanva = () => {
  window.open('https://www.canva.com/', '_blank');
};

const startTesting = () => {
  step.value = 1;
  if (isInitialized.value) {
    void syncContent();
  } else {
    void initializeService();
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'google-drive': return 'blue';
    case 'local': return 'orange';
    case 'hybrid': return 'purple';
    default: return 'grey';
  }
};

const getSyncStatusColor = () => {
  if (!syncStatus.value) return 'bg-grey-2 text-grey-8';
  if (syncStatus.value.errors.length > 0) return 'bg-red-1 text-red-8';
  if (syncStatus.value.syncInProgress) return 'bg-blue-1 text-blue-8';
  return 'bg-green-1 text-green-8';
};

const getSyncStatusIcon = () => {
  if (!syncStatus.value) return 'help';
  if (syncStatus.value.errors.length > 0) return 'error';
  if (syncStatus.value.syncInProgress) return 'sync';
  return 'check_circle';
};

const getSyncStatusIconColor = () => {
  if (!syncStatus.value) return 'grey';
  if (syncStatus.value.errors.length > 0) return 'red';
  if (syncStatus.value.syncInProgress) return 'blue';
  return 'green';
};

// Import Quasar notify
import { useQuasar } from 'quasar';
const $q = useQuasar();

// Auto-initialize if credentials are available
onMounted(() => {
  if (canInitialize.value && !isInitialized.value) {
    // Auto-initialize after a short delay
    setTimeout(() => {
      void initializeService();
    }, 1000);
  }
});
</script>

<style scoped>
.thumbnail-container {
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.thumbnail {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.status-chip {
  position: absolute;
  top: 4px;
  right: 4px;
}

.content-preview {
  max-height: 70vh;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'Georgia', serif;
  line-height: 1.6;
}

code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
