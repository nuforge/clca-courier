<!--
  Gmail-inspired Newsletter Management Table
  Advanced table component with contextual actions and modern selection UI
-->
<template>
  <div class="newsletter-management-container">
    <!-- Contextual Action Bar (using reserved space approach to prevent jumping) -->
    <div class="contextual-action-bar-container">
      <div class="contextual-action-bar bg-primary text-white" v-show="selectedNewsletters.length > 0">
        <div class="row items-center">
          <!-- Selection Info -->
          <div class="col-auto">
            <q-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @update:model-value="handleSelectAll"
              color="white" keep-color class="q-mr-md" />
            <span class="text-weight-medium">
              {{ selectedCount }} of {{ totalCount }} selected
            </span>
          </div>

          <q-space />

          <!-- Contextual Actions -->
          <div class="col-auto">
            <div class="row items-center">
              <!-- Quick Toggle Actions -->
              <q-btn-group class="q-mr-sm">
                <q-btn flat dense icon="mdi-star" @click="bulkToggleFeatured(true)"
                  :loading="processingStates.isSyncing" color="amber" text-color="white">
                  <q-tooltip>Mark as Featured</q-tooltip>
                </q-btn>
                <q-btn flat dense icon="mdi-star-outline" @click="bulkToggleFeatured(false)"
                  :loading="processingStates.isSyncing" color="grey-6" text-color="white">
                  <q-tooltip>Remove Featured</q-tooltip>
                </q-btn>
              </q-btn-group>

              <q-separator vertical inset color="white" class="q-mx-sm" />

              <q-btn-group class="q-mr-sm">
                <q-btn flat dense icon="mdi-eye" @click="bulkTogglePublished(true)"
                  :loading="processingStates.isSyncing" color="positive" text-color="white">
                  <q-tooltip>Publish</q-tooltip>
                </q-btn>
                <q-btn flat dense icon="mdi-eye-off" @click="bulkTogglePublished(false)"
                  :loading="processingStates.isSyncing" color="orange" text-color="white">
                  <q-tooltip>Unpublish</q-tooltip>
                </q-btn>
              </q-btn-group>

              <q-separator vertical inset color="white" class="q-mx-sm" />

              <!-- Bulk Operations -->
              <q-btn flat dense icon="mdi-text-search" @click="$emit('extract-selected-text')"
                :loading="processingStates.isExtracting" color="secondary" text-color="white" class="q-mr-sm">
                <q-tooltip>Extract Text</q-tooltip>
              </q-btn>

              <q-btn flat dense icon="mdi-image-multiple" @click="$emit('generate-selected-thumbnails')"
                :loading="processingStates.isGeneratingThumbs" color="accent" text-color="white" class="q-mr-sm">
                <q-tooltip>Generate Thumbnails</q-tooltip>
              </q-btn>

              <q-btn flat dense icon="mdi-cloud-upload" @click="$emit('sync-selected')"
                :loading="processingStates.isSyncing" color="positive" text-color="white" class="q-mr-sm">
                <q-tooltip>Sync to Firebase</q-tooltip>
              </q-btn>

              <q-btn flat dense icon="mdi-delete" @click="$emit('bulk-delete')" color="negative" text-color="white"
                class="q-mr-sm">
                <q-tooltip>Delete Selected</q-tooltip>
              </q-btn>

              <q-separator vertical inset color="white" class="q-mx-sm" />

              <!-- Clear Selection -->
              <q-btn flat dense icon="mdi-close" @click="clearSelection" color="negative" text-color="white">
                <q-tooltip>Clear Selection</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Table -->
    <q-table :rows="sortedNewsletters" :columns="columns" v-model:pagination="paginationModel"
      :loading="processingStates.isLoading" flat bordered class="newsletter-table" row-key="id"
      @row-click="handleRowClick" @request="onTableRequest">
      <!-- Custom header for selection column -->
      <template v-slot:header-cell-selection="props">
        <q-th :props="props">
          <q-checkbox :model-value="isCurrentPageAllSelected" :indeterminate="isCurrentPageIndeterminate"
            @update:model-value="handleSelectCurrentPage" color="primary" />
        </q-th>
      </template>

      <!-- Selection column with quick actions -->
      <template v-slot:body-cell-selection="props">
        <q-td :props="props" class="selection-cell" @mouseenter="hoveredRow = props.row.id"
          @mouseleave="hoveredRow = null">
          <div class="selection-wrapper">
            <!-- Primary Checkbox -->
            <q-checkbox :model-value="selectedNewsletters.some(n => n.id === props.row.id)"
              @update:model-value="(val) => $emit('update:selectedNewsletters', val ? [...selectedNewsletters, props.row] : selectedNewsletters.filter(n => n.id !== props.row.id))"
              color="primary" class="primary-checkbox" @click.stop />

            <!-- Quick Action Toggles (always visible like Gmail stars) -->
            <div class="quick-actions always-visible">
              <q-btn flat dense size="sm" :icon="props.row.featured ? 'mdi-star' : 'mdi-star-outline'"
                :color="props.row.featured ? 'amber' : 'grey-5'" @click.stop="toggleFeatured(props.row)"
                :loading="featuredStates[props.row.id]">
                <q-tooltip>{{ props.row.featured ? 'Remove from Featured' : 'Add to Featured' }}</q-tooltip>
              </q-btn>

              <q-btn flat dense size="sm" :icon="props.row.isPublished ? 'mdi-eye' : 'mdi-eye-off'"
                :color="props.row.isPublished ? 'positive' : 'orange'" @click.stop="togglePublished(props.row)"
                :loading="publishingStates[props.row.id]">
                <q-tooltip>{{ props.row.isPublished ? 'Unpublish' : 'Publish' }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Sync Status column -->
      <template v-slot:body-cell-syncStatus="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          <div class="text-center">
            <q-icon v-if="props.row.syncStatus === 'synced'" name="mdi-check-circle" color="positive" size="sm">
              <q-tooltip>Synced with Firebase</q-tooltip>
            </q-icon>
            <q-icon v-else-if="props.row.syncStatus === 'local'" name="mdi-alert-circle" color="warning" size="sm">
              <q-tooltip>Local changes not synced</q-tooltip>
            </q-icon>
            <q-icon v-else-if="props.row.syncStatus === 'firebase'" name="mdi-cloud" color="info" size="sm">
              <q-tooltip>Firebase only (no local data)</q-tooltip>
            </q-icon>
            <q-icon v-else name="mdi-help-circle" color="grey" size="sm">
              <q-tooltip>Unknown sync status</q-tooltip>
            </q-icon>
          </div>
        </q-td>
      </template>

      <!-- Data Source column -->
      <template v-slot:body-cell-dataSource="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          <div class="text-center">
            <q-icon :name="`mdi-${props.row.dataSource?.icon || 'help'}`" :color="props.row.dataSource?.color || 'grey'"
              size="sm">
              <q-tooltip>
                <div class="text-weight-medium">{{ props.row.dataSource?.description || 'Unknown source' }}</div>
                <div class="text-caption q-mt-xs">
                  Status: {{ props.row.dataSource?.status || 'unknown' }}
                  <span v-if="props.row.dataSource?.status === 'metadata-only'" class="text-orange">
                    <br />⚠️ File object lost - re-import needed for processing
                  </span>
                </div>
              </q-tooltip>
            </q-icon>
            <!-- Status indicator for metadata-only items -->
            <q-badge v-if="props.row.dataSource?.status === 'metadata-only'" color="orange" floating rounded
              style="top: -4px; right: -4px;">
              !
            </q-badge>
          </div>
        </q-td>
      </template>

      <!-- Thumbnail column -->
      <template v-slot:body-cell-thumbnail="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          <q-avatar size="40px" class="newsletter-thumbnail">
            <img v-if="props.row.thumbnailUrl" :src="props.row.thumbnailUrl" :alt="props.row.title" />
            <q-icon v-else name="mdi-file-pdf-box" color="grey-5" />
          </q-avatar>
        </q-td>
      </template>

      <!-- Year column -->
      <template v-slot:body-cell-year="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          {{ props.row.year }}
        </q-td>
      </template>

      <!-- Date column (simplified to use displayDate) -->
      <template v-slot:body-cell-date="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          <div class="text-center">
            <div class="text-weight-medium">
              {{ props.row.displayDate || 'Unknown' }}
            </div>
          </div>
        </q-td>
      </template>

      <!-- Page Count column -->
      <template v-slot:body-cell-pageCount="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          {{ props.row.pageCount || '—' }}
        </q-td>
      </template>

      <!-- Word Count column -->
      <template v-slot:body-cell-wordCount="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          {{ props.row.wordCount ? props.row.wordCount.toLocaleString() : '—' }}
        </q-td>
      </template>

      <!-- Title column with enhanced formatting -->
      <template v-slot:body-cell-title="props">
        <q-td :props="props" class="newsletter-title-cell" @mouseenter="hoveredRow = props.row.id"
          @mouseleave="hoveredRow = null">
          <div class="newsletter-info">
            <div class="title-line">
              <span class="text-weight-medium newsletter-title">{{ props.row.title }}</span>
              <!-- Status badges -->
              <div class="status-badges">
                <q-chip v-if="props.row.featured" size="xs" icon="mdi-star" color="amber" text-color="white" dense>
                  Featured
                </q-chip>
                <q-chip v-if="!props.row.isPublished" size="xs" icon="mdi-eye-off" color="orange" text-color="white"
                  dense>
                  Draft
                </q-chip>
              </div>
            </div>
            <div class="text-caption text-grey-6">{{ props.row.filename }}</div>
            <div v-if="props.row.description" class="text-caption text-grey-7 newsletter-description">
              {{ props.row.description }}
            </div>
          </div>
        </q-td>
      </template>

      <!-- Tags column with chips -->
      <template v-slot:body-cell-keywords="props">
        <q-td :props="props" class="keywords-cell" @mouseenter="hoveredRow = props.row.id"
          @mouseleave="hoveredRow = null">
          <div v-if="props.row.tags && props.row.tags.length > 0" class="keyword-chips">
            <q-chip v-for="tag in props.row.tags.slice(0, 3)" :key="tag" size="sm" color="secondary" text-color="white"
              :label="tag" class="q-ma-xs" />
            <q-btn v-if="props.row.tags.length > 3" flat dense size="sm" color="secondary"
              :label="`+${props.row.tags.length - 3}`" @click="$emit('show-extracted-content', props.row)" />
          </div>
          <span v-else class="text-grey-5">No tags</span>
        </q-td>
      </template>

      <!-- Status column -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props" @mouseenter="hoveredRow = props.row.id" @mouseleave="hoveredRow = null">
          <q-chip :color="isLocalPdf(props.row) ? 'green' : 'orange'"
            :icon="isLocalPdf(props.row) ? 'mdi-laptop' : 'mdi-cloud'" size="sm" text-color="white">
            {{ isLocalPdf(props.row) ? 'Local' : 'Remote' }}
          </q-chip>
        </q-td>
      </template>

      <!-- Hover Actions Column -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="actions-cell" @mouseenter="hoveredRow = props.row.id"
          @mouseleave="hoveredRow = null">
          <div class="hover-actions" :class="{ 'visible': hoveredRow === props.row.id }">
            <!-- Special re-import action for metadata-only files -->
            <q-btn v-if="props.row.dataSource?.status === 'metadata-only'" flat dense icon="mdi-file-import"
              color="orange" @click.stop="$emit('re-import-file', props.row)" size="sm">
              <q-tooltip>Re-import file for processing</q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-eye" color="primary" @click.stop="$emit('open-pdf', props.row)" size="sm">
              <q-tooltip>View PDF</q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-pencil" color="warning" @click.stop="$emit('edit-newsletter', props.row)"
              size="sm">
              <q-tooltip>Edit Metadata</q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-text-search" color="secondary" @click.stop="$emit('extract-text', props.row)"
              :loading="extractingText[props.row.id]" :disable="props.row.dataSource?.status === 'metadata-only'"
              size="sm">
              <q-tooltip>
                {{ props.row.dataSource?.status === 'metadata-only' ? 'Re-import file first' : 'Extract Text' }}
              </q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-image" color="accent" @click.stop="$emit('generate-thumbnail', props.row)"
              :loading="generatingThumb[props.row.id]" :disable="props.row.dataSource?.status === 'metadata-only'"
              size="sm">
              <q-tooltip>
                {{ props.row.dataSource?.status === 'metadata-only' ? 'Re-import file first' : 'Generate Thumbnail' }}
              </q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-cloud-upload" color="positive" @click.stop="$emit('sync-single', props.row)"
              :loading="syncingIndividual[props.row.id]" size="sm">
              <q-tooltip>Sync to Firebase</q-tooltip>
            </q-btn>

            <q-btn flat dense icon="mdi-delete" color="negative" @click.stop="$emit('delete-newsletter', props.row)"
              size="sm">
              <q-tooltip>Delete Newsletter</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UnifiedNewsletter } from 'src/types/core/newsletter.types';
import type { ProcessingStates } from 'src/types/core/content-management.types';
import { useTableSettingsStore } from 'src/stores/table-settings.store';

interface Props {
  newsletters: UnifiedNewsletter[];
  selectedNewsletters: UnifiedNewsletter[];
  processingStates: ProcessingStates;
  extractingText: Record<string, boolean>;
  generatingThumb: Record<string, boolean>;
  syncingIndividual: Record<string, boolean>;
  publishingStates: Record<string, boolean>;
  featuredStates: Record<string, boolean>;
}

const props = defineProps<Props>();

// Use table settings store for persistent settings
const tableStore = useTableSettingsStore();

// Get pagination from store instead of props
const pagination = computed(() => tableStore.newsletterManagementTable.pagination);

// Create a reactive pagination model for v-model binding
const paginationModel = computed({
  get: () => pagination.value,
  set: (newPagination) => {
    tableStore.updateNewsletterManagementPagination(newPagination);
  }
});

// Handle table requests (sorting, pagination changes)
const onTableRequest = (requestProps: { pagination: Record<string, unknown> }) => {
  console.log('🔄 Table request received:', requestProps.pagination);
  tableStore.updateNewsletterManagementPagination(requestProps.pagination);
};

const emit = defineEmits<{
  'update:selectedNewsletters': [newsletters: UnifiedNewsletter[]];
  'extract-selected-text': [];
  'generate-selected-thumbnails': [];
  'sync-selected': [];
  'bulk-toggle-featured': [featured: boolean];
  'bulk-toggle-published': [published: boolean];
  'toggle-featured': [newsletter: UnifiedNewsletter];
  'toggle-published': [newsletter: UnifiedNewsletter];
  'open-pdf': [newsletter: UnifiedNewsletter];
  'edit-newsletter': [newsletter: UnifiedNewsletter];
  'extract-text': [newsletter: UnifiedNewsletter];
  'generate-thumbnail': [newsletter: UnifiedNewsletter];
  'sync-single': [newsletter: UnifiedNewsletter];
  'show-extracted-content': [newsletter: UnifiedNewsletter];
  'delete-newsletter': [newsletter: UnifiedNewsletter];
  'bulk-delete': [];
  're-import-file': [newsletter: UnifiedNewsletter];
}>();

// Local reactive state
const hoveredRow = ref<string | null>(null);

// Computed properties
const selectedCount = computed(() => props.selectedNewsletters.length);
const totalCount = computed(() => props.newsletters.length);

// Gmail-style pagination-aware selection logic
const sortedNewsletters = computed(() => {
  const { sortBy, descending } = pagination.value;
  if (!sortBy) return props.newsletters;

  const sorted = [...props.newsletters].sort((a, b) => {
    let aValue: string | number | Date | undefined;
    let bValue: string | number | Date | undefined;

    // Handle specific sort fields
    switch (sortBy) {
      case 'year':
        aValue = a.year;
        bValue = b.year;
        break;
      case 'season':
        aValue = a.season;
        bValue = b.season;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'date':
      case 'publicationDate': {
        // Use the same logic as the column sort function
        const getDateValue = (newsletter: UnifiedNewsletter): number => {
          if (newsletter.publicationDate) {
            const date = new Date(newsletter.publicationDate);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }

          // Fallback to constructed date
          if (newsletter.month && newsletter.year) {
            return new Date(newsletter.year, newsletter.month - 1, 1).getTime();
          }

          if (newsletter.season && newsletter.year) {
            const seasonMonth = newsletter.season === 'spring' ? 3 :
              newsletter.season === 'summer' ? 6 :
                newsletter.season === 'fall' ? 9 : 12;
            return new Date(newsletter.year, seasonMonth - 1, 1).getTime();
          }

          return newsletter.year ? new Date(newsletter.year, 0, 1).getTime() : 0;
        };
        aValue = getDateValue(a);
        bValue = getDateValue(b);
        break;
      }
      case 'wordCount':
        aValue = a.wordCount || 0;
        bValue = b.wordCount || 0;
        break;
      case 'fileSize':
        aValue = a.fileSize || 0;
        bValue = b.fileSize || 0;
        break;
      case 'featured':
        aValue = a.featured ? 1 : 0;
        bValue = b.featured ? 1 : 0;
        break;
      case 'published':
        aValue = a.isPublished ? 1 : 0;
        bValue = b.isPublished ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    if (aValue < bValue) return descending ? 1 : -1;
    if (aValue > bValue) return descending ? -1 : 1;
    return 0;
  });

  return sorted;
});

const currentPageItems = computed(() => {
  const { page, rowsPerPage } = pagination.value;
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageItems = sortedNewsletters.value.slice(startIndex, endIndex);

  // Debug logging
  console.log('🔍 currentPageItems computed:', {
    page,
    rowsPerPage,
    startIndex,
    endIndex,
    sortBy: pagination.value.sortBy,
    descending: pagination.value.descending,
    totalNewsletters: props.newsletters.length,
    pageItemsCount: pageItems.length,
    pageItemTitles: pageItems.map((item: UnifiedNewsletter) => item.title)
  });

  return pageItems;
});

const currentPageSelectedCount = computed(() => {
  return currentPageItems.value.filter((item: UnifiedNewsletter) =>
    props.selectedNewsletters.some(selected => selected.id === item.id)
  ).length;
});

const currentPageTotalCount = computed(() => currentPageItems.value.length);

// Header checkbox state (for current page only) - Gmail tri-state logic
const currentPageSelectionState = computed(() => {
  if (currentPageTotalCount.value === 0) return 'none';
  if (currentPageSelectedCount.value === 0) return 'none';
  if (currentPageSelectedCount.value === currentPageTotalCount.value) return 'all';
  return 'some';
});

const isCurrentPageAllSelected = computed(() => currentPageSelectionState.value === 'all');
const isCurrentPageIndeterminate = computed(() => currentPageSelectionState.value === 'some');

// Global selection state (for contextual action bar) - Gmail tri-state logic
const globalSelectionState = computed(() => {
  if (totalCount.value === 0) return 'none';
  if (selectedCount.value === 0) return 'none';
  if (selectedCount.value === totalCount.value) return 'all';
  return 'some';
});

const isAllSelected = computed(() => globalSelectionState.value === 'all');
const isIndeterminate = computed(() => globalSelectionState.value === 'some');// Table configuration
const columns = [
  {
    name: 'selection',
    label: '',
    field: '',
    align: 'left' as const,
    style: 'width: 120px; min-width: 120px; max-width: 120px;',
  },
  {
    name: 'syncStatus',
    label: 'Sync',
    field: 'syncStatus',
    align: 'center' as const,
    style: 'width: 60px;',
    sortable: true,
  },
  {
    name: 'dataSource',
    label: 'Source',
    field: 'dataSource',
    align: 'center' as const,
    style: 'width: 70px;',
    sortable: false,
  },
  {
    name: 'thumbnail',
    label: '',
    field: 'thumbnailUrl',
    align: 'center' as const,
    style: 'width: 60px; min-width: 60px; max-width: 60px;',
  },
  {
    name: 'title',
    label: 'Newsletter',
    field: 'title',
    align: 'left' as const,
    sortable: true,
    style: 'width: 30%; min-width: 200px;',
  },
  {
    name: 'year',
    label: 'Year',
    field: 'year',
    align: 'center' as const,
    sortable: true,
    style: 'width: 80px;',
  },
  {
    name: 'date',
    label: 'Date',
    field: (row: UnifiedNewsletter) => {
      // Try to use actual publication date first
      if (row.publicationDate) {
        const date = new Date(row.publicationDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
          });
        }
      }

      // Fallback to constructed date from components
      if (row.month && row.year) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[row.month - 1]} ${row.year}`;
      }

      // Final fallback to season/year
      if (row.season && row.year) {
        const seasonName = row.season.charAt(0).toUpperCase() + row.season.slice(1);
        return `${seasonName} ${row.year}`;
      }

      // Just year if that's all we have
      return row.year ? row.year.toString() : '—';
    },
    align: 'center' as const,
    sortable: true,
    style: 'width: 120px;'
  },
  {
    name: 'pageCount',
    label: 'Pages',
    field: 'pageCount',
    align: 'center' as const,
    sortable: true,
    style: 'width: 80px;',
  },
  {
    name: 'fileSize',
    label: 'Size',
    field: 'fileSize',
    align: 'center' as const,
    sortable: true,
    style: 'width: 90px;',
    format: (val: number) => {
      if (!val || val === 0) return '—';

      const sizes = ['B', 'KB', 'MB', 'GB'];
      if (val === 0) return '0 B';

      const i = Math.floor(Math.log(val) / Math.log(1024));
      const formattedSize = (val / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);

      return `${formattedSize} ${sizes[i]}`;
    }
  },
  {
    name: 'wordCount',
    label: 'Word Count',
    field: 'wordCount',
    align: 'center' as const,
    sortable: true,
    style: 'width: 120px;',
    format: (val: number) => {
      if (!val || val === 0) return '—';

      // Present as estimates for more professional appearance
      if (val < 1000) {
        return `~${val}`;
      } else if (val < 10000) {
        // Round to nearest 100
        const rounded = Math.round(val / 100) * 100;
        return `~${rounded.toLocaleString()}`;
      } else {
        // Round to nearest 1000 for very large counts
        const rounded = Math.round(val / 1000) * 1000;
        return `~${rounded.toLocaleString()}`;
      }
    }
  },
  {
    name: 'keywords',
    label: 'Tags',
    field: 'tags',
    align: 'left' as const,
    style: 'width: 200px; max-width: 200px;',
  },
  {
    name: 'status',
    label: 'Source',
    field: 'downloadUrl',
    align: 'center' as const,
    style: 'width: 100px;',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 200px;',
  }
];

// Methods

// Gmail-style current page selection (header checkbox) - tri-state behavior
function handleSelectCurrentPage(selected: boolean) {
  console.log('📄 handleSelectCurrentPage called:', selected);
  console.log('📄 Current state:', currentPageSelectionState.value);
  console.log('📄 Page selected/total:', currentPageSelectedCount.value, '/', currentPageTotalCount.value);

  const currentState = currentPageSelectionState.value;

  if (currentState === 'none') {
    // No items selected → Select all items on current page
    const newSelection = [...props.selectedNewsletters];
    currentPageItems.value.forEach((item: UnifiedNewsletter) => {
      if (!newSelection.some(s => s.id === item.id)) {
        newSelection.push(item);
      }
    });
    console.log('📄 State: none → all. New selection:', newSelection.length);
    emit('update:selectedNewsletters', newSelection);

  } else if (currentState === 'some') {
    // Some items selected → Select remaining items on current page
    const newSelection = [...props.selectedNewsletters];
    currentPageItems.value.forEach((item: UnifiedNewsletter) => {
      if (!newSelection.some(s => s.id === item.id)) {
        newSelection.push(item);
      }
    });
    console.log('📄 State: some → all. New selection:', newSelection.length);
    emit('update:selectedNewsletters', newSelection);

  } else if (currentState === 'all') {
    // All items selected → Deselect all items on current page
    const newSelection = props.selectedNewsletters.filter(selected =>
      !currentPageItems.value.some((pageItem: UnifiedNewsletter) => pageItem.id === selected.id)
    );
    console.log('📄 State: all → none. New selection:', newSelection.length);
    emit('update:selectedNewsletters', newSelection);
  }
}

// Global selection (contextual action bar checkbox) - tri-state behavior
function handleSelectAll(selected: boolean) {
  console.log('🌐 handleSelectAll called:', selected);
  console.log('🌐 Current state:', globalSelectionState.value);
  console.log('🌐 Selected/total:', selectedCount.value, '/', totalCount.value);

  const currentState = globalSelectionState.value;

  if (currentState === 'none' || currentState === 'some') {
    // No items or some items selected → Select ALL newsletters (across all pages)
    console.log('🌐 State:', currentState, '→ all. Selecting all newsletters');
    emit('update:selectedNewsletters', [...props.newsletters]);
  } else if (currentState === 'all') {
    // All items selected → Deselect all
    console.log('🌐 State: all → none. Clearing selection');
    clearSelection();
  }
}

function clearSelection() {
  emit('update:selectedNewsletters', []);
}

function handleRowClick(evt: Event, row: UnifiedNewsletter) {
  // Toggle selection on row click (excluding action areas)
  const target = evt.target as HTMLElement;
  if (target.closest('.quick-actions') || target.closest('.hover-actions')) {
    return; // Don't select if clicking on action buttons
  }

  toggleRowSelection(row, !props.selectedNewsletters.some(n => n.id === row.id));
}

function toggleRowSelection(row: UnifiedNewsletter, selected: boolean) {
  if (selected) {
    emit('update:selectedNewsletters', [...props.selectedNewsletters, row]);
  } else {
    emit('update:selectedNewsletters', props.selectedNewsletters.filter(n => n.id !== row.id));
  }
}

function isLocalPdf(newsletter: UnifiedNewsletter): boolean {
  return !newsletter.downloadUrl?.startsWith('http') || newsletter.filename.includes('local');
}

// Bulk operations
function bulkToggleFeatured(featured: boolean) {
  emit('bulk-toggle-featured', featured);
}

function bulkTogglePublished(published: boolean) {
  emit('bulk-toggle-published', published);
}

// Individual toggles
function toggleFeatured(newsletter: UnifiedNewsletter) {
  emit('toggle-featured', newsletter);
}

function togglePublished(newsletter: UnifiedNewsletter) {
  emit('toggle-published', newsletter);
}
</script>

<style lang="scss" scoped>
.newsletter-management-container {
  .contextual-action-bar-container {
    min-height: 60px; // Reserve space for the action bar
    position: relative;
  }

  .contextual-action-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 12px 16px;
    border-radius: 4px 4px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .newsletter-table {
    .selection-cell {
      position: relative;
      width: 120px;
      padding: 8px 12px;

      .selection-wrapper {
        display: flex;
        align-items: center;
        gap: 4px;

        .primary-checkbox {
          flex-shrink: 0;
        }

        .quick-actions {
          display: flex;
          gap: 2px;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s ease;

          &.visible {
            opacity: 1;
            transform: translateX(0);
          }

          &.always-visible {
            opacity: 1;
            transform: translateX(0);
          }
        }
      }
    }

    .newsletter-title-cell {
      .newsletter-info {
        .title-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;

          .newsletter-title {
            flex: 1;
            line-height: 1.2;
          }

          .status-badges {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
          }
        }

        .newsletter-description {
          max-width: 280px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 4px;
        }
      }
    }

    .keywords-cell {
      .keyword-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        align-items: center;
      }
    }

    .actions-cell {
      .hover-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transform: translateX(4px);
        transition: all 0.2s ease;

        &.visible {
          opacity: 1;
          transform: translateX(0);
        }
      }
    }

    // Row states
    .q-tr {
      transition: background-color 0.2s ease;
      cursor: pointer;

      &.row-hovered {
        background-color: rgba(0, 0, 0, 0.02);
      }

      &.row-selected {
        background-color: rgba(25, 118, 210, 0.08);

        &.row-hovered {
          background-color: rgba(25, 118, 210, 0.12);
        }
      }
    }
  }

  .newsletter-thumbnail {
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>
