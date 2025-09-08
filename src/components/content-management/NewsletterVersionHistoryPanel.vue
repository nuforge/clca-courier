<!--
  Newsletter Version History Panel
  Displays version history for newsletters with restore functionality
-->
<template>
  <div class="version-history-panel">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-pa-md">
      <q-spinner-dots color="primary" size="40px" />
      <div class="text-body2 q-mt-sm">Loading version history...</div>
    </div>

    <!-- Error State -->
    <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="mdi-alert" />
      </template>
      <div class="text-weight-bold">Error Loading History</div>
      <div>{{ error }}</div>
      <template v-slot:action>
        <q-btn @click="loadHistory" flat color="white" label="Retry" size="sm" />
      </template>
    </q-banner>

    <!-- Empty State -->
    <div v-else-if="history.length === 0" class="text-center q-pa-lg">
      <q-icon name="mdi-history" size="48px" color="grey-5" />
      <div class="text-body1 q-mt-sm text-grey-7">No version history available</div>
      <div class="text-body2 text-grey-6">
        Version history will appear here after the first edit with versioning enabled.
      </div>
    </div>

    <!-- History List -->
    <div v-else class="history-list">
      <!-- Statistics -->
      <div class="history-stats q-pa-sm rounded-borders q-mb-md">
        <div class="row items-center">
          <div class="col">
            <div class="text-body2 text-grey-7">
              Total Versions: <span class="text-weight-bold">{{ history.length }}</span>
            </div>
          </div>
          <div class="col-auto">
            <q-btn @click="toggleExpandAll" flat dense :icon="allExpanded ? 'mdi-collapse-all' : 'mdi-expand-all'"
              :label="allExpanded ? 'Collapse All' : 'Expand All'" size="sm" />
          </div>
        </div>
      </div>

      <!-- Version Entries -->
      <q-list bordered separator class="rounded-borders">
        <q-expansion-item v-for="(entry, index) in history" :key="entry.id"
          :model-value="expandedItems[entry.id] || false"
          @update:model-value="(val: boolean) => toggleExpansion(entry.id, val)" :class="[
            'version-entry',
            { 'current-version': index === 0 },
            { 'text-primary': index === 0 }
          ]">
          <template v-slot:header>
            <div class="full-width row items-center no-wrap">
              <!-- Version Info -->
              <div class="col">
                <div class="row items-center">
                  <!-- Version Badge -->
                  <q-badge :color="index === 0 ? 'primary' : 'grey-6'" :label="`v${entry.version}`"
                    class="text-weight-bold q-mr-sm" />

                  <!-- Current Version Indicator -->
                  <q-badge v-if="index === 0" color="positive" label="Current" class="q-mr-sm" />

                  <!-- Change Type -->
                  <q-chip :icon="getChangeTypeIcon(entry.changeType)" :color="getChangeTypeColor(entry.changeType)"
                    size="sm" dense>
                    {{ getChangeTypeLabel(entry.changeType) }}
                  </q-chip>
                </div>

                <!-- Comment -->
                <div v-if="entry.comment" class="text-body2 text-grey-7 q-mt-xs">
                  {{ entry.comment }}
                </div>
              </div>

              <!-- Timestamp -->
              <div class="col-auto text-right">
                <div class="text-body2 text-grey-7">
                  {{ formatTimestamp(entry.timestamp) }}
                </div>
                <div class="text-caption text-grey-6">
                  by {{ getUserDisplayName(entry.userId) }}
                </div>
              </div>
            </div>
          </template>

          <!-- Expanded Content -->
          <div class="q-pa-md">
            <!-- Changes Summary -->
            <div v-if="Object.keys(entry.changes).length > 0" class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">
                <q-icon name="mdi-pencil" class="q-mr-xs" />
                Changes Made
              </div>

              <q-list dense bordered class="rounded-borders">
                <q-item v-for="[field, [oldValue, newValue]] in getChangeEntries(entry.changes)" :key="field"
                  class="change-item">
                  <q-item-section avatar>
                    <q-icon name="mdi-swap-horizontal" color="grey-6" size="sm" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ getFieldDisplayName(field) }}</q-item-label>
                    <q-item-label caption>
                      <span class="text-negative">{{ formatValue(oldValue) }}</span>
                      <q-icon name="mdi-arrow-right" class="q-mx-xs" size="xs" />
                      <span class="text-positive">{{ formatValue(newValue) }}</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Version Actions -->
            <div class="row items-center">
              <q-btn v-if="index !== 0" @click="restoreVersion(entry.version)" color="primary" outline size="sm"
                icon="mdi-restore" label="Restore This Version" :loading="isRestoring === entry.version"
                class="q-mr-sm" />

              <q-btn @click="viewVersion(entry)" color="grey-7" flat size="sm" icon="mdi-eye" label="View Details"
                class="q-mr-sm" />

              <q-btn v-if="index !== 0" @click="compareWithCurrent(entry)" color="grey-7" flat size="sm"
                icon="mdi-compare" label="Compare" />
            </div>
          </div>
        </q-expansion-item>
      </q-list>
    </div>

    <!-- Restore Confirmation Dialog -->
    <q-dialog v-model="showRestoreDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            <q-icon name="mdi-restore" class="q-mr-sm" />
            Confirm Version Restore
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-body1 q-mb-md">
            Are you sure you want to restore to version {{ restoreTargetVersion }}?
          </div>
          <div class="text-body2 text-grey-7">
            This will create a new version with the content from version {{ restoreTargetVersion }}.
            The current version will be preserved in history.
          </div>

          <!-- Comment Input -->
          <q-input v-model="restoreComment" label="Restoration Comment (Optional)" type="textarea" rows="2"
            class="q-mt-md" hint="Describe why you're restoring this version" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" color="grey-7" />
          <q-btn @click="confirmRestore" color="primary" label="Restore Version" :loading="isRestoring !== null" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { firestoreService } from '../../services/firebase-firestore.service';
import { logger } from '../../utils/logger';
import type { NewsletterHistory } from '../../types/core/newsletter.types';

// Props
interface Props {
  newsletterId: string;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'restore-version', version: number): void;
  (e: 'view-version', entry: NewsletterHistory): void;
  (e: 'compare-versions', entry: NewsletterHistory): void;
}

const emit = defineEmits<Emits>();

// State
const isLoading = ref(false);
const error = ref<string | null>(null);
const history = ref<NewsletterHistory[]>([]);
const expandedItems = ref<Record<string, boolean>>({});
const allExpanded = ref(false);

// Restore dialog
const showRestoreDialog = ref(false);
const restoreTargetVersion = ref<number | null>(null);
const restoreComment = ref('');
const isRestoring = ref<number | null>(null);

// Computed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const currentVersion = computed(() => {
  return history.value.length > 0 ? history.value[0] : null;
});

// Methods
async function loadHistory(): Promise<void> {
  try {
    isLoading.value = true;
    error.value = null;

    const historyData = await firestoreService.getNewsletterHistory(props.newsletterId);
    history.value = historyData;

    logger.info(`Loaded ${historyData.length} version entries for newsletter ${props.newsletterId}`);

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load version history';
    logger.error('Error loading newsletter history:', err);
  } finally {
    isLoading.value = false;
  }
}

function toggleExpansion(entryId: string, expanded: boolean): void {
  expandedItems.value[entryId] = expanded;
}

function toggleExpandAll(): void {
  allExpanded.value = !allExpanded.value;
  const newState = allExpanded.value;

  history.value.forEach((entry: NewsletterHistory) => {
    expandedItems.value[entry.id] = newState;
  });
}

function getChangeEntries(changes: Record<string, [unknown, unknown]>): Array<[string, [unknown, unknown]]> {
  return Object.entries(changes);
}

function restoreVersion(version: number): void {
  restoreTargetVersion.value = version;
  restoreComment.value = '';
  showRestoreDialog.value = true;
}

async function confirmRestore(): Promise<void> {
  if (restoreTargetVersion.value === null) return;

  try {
    isRestoring.value = restoreTargetVersion.value;

    await firestoreService.restoreNewsletterVersion(
      props.newsletterId,
      restoreTargetVersion.value,
      restoreComment.value
    );

    showRestoreDialog.value = false;
    emit('restore-version', restoreTargetVersion.value);

    // Reload history to show the new version
    await loadHistory();

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to restore version';
    logger.error('Error restoring version:', err);
  } finally {
    isRestoring.value = null;
  }
}

function viewVersion(entry: NewsletterHistory): void {
  emit('view-version', entry);
}

function compareWithCurrent(entry: NewsletterHistory): void {
  emit('compare-versions', entry);
}

// Formatting helpers
function formatTimestamp(timestamp: unknown): string {
  try {
    // Handle Firestore Timestamp or regular Date
    let date: Date;

    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      // Firestore Timestamp
      date = (timestamp as { toDate(): Date }).toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

function getUserDisplayName(userId: string): string {
  // TODO: Implement user lookup if needed
  return userId.substring(0, 8) + '...';
}

function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    tags: 'Tags',
    featured: 'Featured Status',
    isPublished: 'Publication Status',
    publicationDate: 'Publication Date',
    displayDate: 'Display Date',
    season: 'Season',
    year: 'Year',
    month: 'Month',
    pageCount: 'Page Count',
    fileSize: 'File Size',
    searchableText: 'Searchable Text',
    thumbnailUrl: 'Thumbnail URL',
  };

  return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '(empty)';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  // Handle primitives (string, number, etc.)
  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  }

  // Fallback for any remaining types
  return '(unknown)';
}

function getChangeTypeIcon(changeType: string): string {
  const iconMap: Record<string, string> = {
    create: 'mdi-plus',
    update: 'mdi-pencil',
    publish: 'mdi-publish',
    archive: 'mdi-archive',
  };

  return iconMap[changeType] || 'mdi-pencil';
}

function getChangeTypeColor(changeType: string): string {
  const colorMap: Record<string, string> = {
    create: 'positive',
    update: 'primary',
    publish: 'info',
    archive: 'warning',
  };

  return colorMap[changeType] || 'grey-6';
}

function getChangeTypeLabel(changeType: string): string {
  const labelMap: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    publish: 'Published',
    archive: 'Archived',
  };

  return labelMap[changeType] || 'Changed';
}

// Lifecycle
onMounted(() => {
  void loadHistory();
});
</script>

<style scoped>
.version-history-panel {
  max-height: 600px;
  overflow-y: auto;
}

.version-entry.current-version {
  border-left: 4px solid var(--q-primary);
}

.change-item .q-item__section--avatar {
  min-width: 32px;
}

.history-stats {
  border: 1px solid var(--q-separator-color);
}
</style>
