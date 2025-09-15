<!--
  ContentDoc Table Component
  Displays ContentDoc objects in a table format with actions
  Uses the new ContentDoc architecture with feature-based rendering
-->
<template>
  <div>
    <q-table :rows="content" :columns="tableColumns" row-key="id" selection="multiple" :selected="selectedContentItems"
      @update:selected="(value: readonly ContentDoc[]) => $emit('update:selected', value.map(item => item.id))"
      :pagination="{ rowsPerPage: 10 }" class="full-width">

      <!-- Status column -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="getStatusIcon(props.value).color">
            <q-icon :name="getStatusIcon(props.value).icon" class="q-mr-xs" />
            {{ props.value.toUpperCase() }}
          </q-badge>
        </q-td>
      </template>

      <!-- Type column -->
      <template v-slot:body-cell-type="props">
        <q-td :props="props">
          <q-badge color="grey" :label="(props.value || 'UNKNOWN').toUpperCase()" />
        </q-td>
      </template>

      <!-- Title column -->
      <template v-slot:body-cell-title="props">
        <q-td :props="props" class="cursor-pointer" @click="$emit('view', props.row)">
          <div class="text-weight-medium">{{ props.value }}</div>
          <div class="text-caption text-grey">{{ truncateText(props.row.description, 100) }}</div>

          <!-- Feature indicators -->
          <div class="q-mt-xs">
            <TagDisplay
              :tags="getFeatureTags(props.row)"
              variant="default"
              size="xs"
              dense
            />
          </div>
        </q-td>
      </template>

      <!-- Author column -->
      <template v-slot:body-cell-author="props">
        <q-td :props="props">
          <div>{{ props.row.authorName || 'Unknown Author' }}</div>
        </q-td>
      </template>

      <!-- Date column -->
      <template v-slot:body-cell-created="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.timestamps.created, 'SHORT_WITH_TIME') }}
        </q-td>
      </template>

      <!-- Tags column -->
      <template v-slot:body-cell-tags="props">
        <q-td :props="props">
          <TagDisplay :tags="props.row.tags" :max-display="3" :show-more="true" size="xs" dense/>
        </q-td>
      </template>

      <!-- Featured column -->
      <template v-slot:body-cell-featured="props">
        <q-td :props="props">
          <q-toggle :model-value="contentUtils.hasTag(props.row, 'featured')"
            @update:model-value="(value: boolean) => handleToggleFeatured(props.row.id, value)" color="orange"
            :disable="props.row.status !== 'published'">
            <q-tooltip>
              {{ props.row.status !== 'published' ? 'Must be published to feature' : 'Toggle featured' }}
            </q-tooltip>
          </q-toggle>
        </q-td>
      </template>

      <!-- Actions column -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <q-btn flat round size="sm" icon="visibility" @click="$emit('view', props.row)" color="grey">
              <q-tooltip>View Details</q-tooltip>
            </q-btn>

            <!-- Draft actions -->
            <template v-if="showPublishActions && props.row.status === 'draft'">
              <q-btn flat round size="sm" icon="publish" @click="$emit('publish', props.row.id)" color="positive">
                <q-tooltip>Publish</q-tooltip>
              </q-btn>
              <q-btn flat round size="sm" icon="block" @click="$emit('reject', props.row.id)" color="orange">
                <q-tooltip>Reject</q-tooltip>
              </q-btn>
              <q-btn flat round size="sm" icon="delete" @click="$emit('delete', props.row.id)" color="negative">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </template>

            <!-- Published actions -->
            <template v-if="showUnpublishActions && props.row.status === 'published'">
              <q-btn flat round size="sm" icon="unpublished" @click="$emit('unpublish', props.row.id)" color="orange">
                <q-tooltip>Unpublish</q-tooltip>
              </q-btn>
              <q-btn flat round size="sm" icon="archive" @click="$emit('archive', props.row.id)" color="negative">
                <q-tooltip>Archive</q-tooltip>
              </q-btn>
            </template>

            <!-- Archived actions -->
            <template v-if="showRestoreActions && props.row.status === 'archived'">
              <q-btn flat round size="sm" icon="restore" @click="$emit('restore', props.row.id)" color="positive">
                <q-tooltip>Restore</q-tooltip>
              </q-btn>
            </template>

            <template v-if="props.row.status === 'rejected'">
              <q-btn flat round size="sm" icon="restore" @click="$emit('restore', props.row.id)" color="positive">
                <q-tooltip>Restore</q-tooltip>
              </q-btn>
            </template>

            <template v-if="props.row.status === 'deleted'">
              <q-btn flat round size="sm" icon="restore" @click="$emit('restore', props.row.id)" color="positive">
                <q-tooltip>Restore</q-tooltip>
              </q-btn>
            </template>

            <!-- Canva Export for Print (Admin/Editor only) -->
            <template v-if="showCanvaExport && contentUtils.hasFeature(props.row, 'integ:canva') && hasCanvaExportPermission">
              <!-- Export button when design is ready for export -->
              <q-btn
                flat
                round
                size="sm"
                icon="print"
                @click="$emit('export-for-print', props.row)"
                color="purple"
                :loading="isExportingContent(props.row.id)"
                :disable="isExportingContent(props.row.id)"
              >
                <q-tooltip>{{ $t(TRANSLATION_KEYS.CANVA.EXPORT_FOR_PRINT) }}</q-tooltip>
              </q-btn>

              <!-- Download button when export is complete -->
              <q-btn
                v-if="contentUtils.getFeature(props.row, 'integ:canva')?.exportUrl"
                flat
                round
                size="sm"
                icon="download"
                @click="$emit('download-design', contentUtils.getFeature(props.row, 'integ:canva')?.exportUrl || '', `design-${contentUtils.getFeature(props.row, 'integ:canva')?.designId || 'unknown'}.pdf`)"
                color="green"
              >
                <q-tooltip>{{ $t(TRANSLATION_KEYS.CANVA.DOWNLOAD_DESIGN) }}</q-tooltip>
              </q-btn>
            </template>

            <!-- Newsletter Ready Toggle (for published content) -->
            <template v-if="props.row.status === 'published'">
              <q-btn
                flat
                round
                size="sm"
                :icon="props.row.tags.includes('newsletter:ready') ? 'mdi-newspaper-variant' : 'mdi-newspaper-variant-outline'"
                :color="props.row.tags.includes('newsletter:ready') ? 'primary' : 'grey'"
                @click="handleToggleNewsletterReady(props.row.id, !props.row.tags.includes('newsletter:ready'))"
              >
                <q-tooltip>
                  {{ props.row.tags.includes('newsletter:ready') ? 'Remove from Newsletter' : 'Add to Newsletter' }}
                </q-tooltip>
              </q-btn>
            </template>
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContentDoc } from '../../types/core/content.types';
import { contentUtils } from '../../types/core/content.types';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { useRoleAuth } from '../../composables/useRoleAuth';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';
import { formatDateTime } from '../../utils/date-formatter';
import TagDisplay from '../common/TagDisplay.vue';

const { getStatusIcon } = useSiteTheme();
const { isEditor } = useRoleAuth();

interface Props {
  content: ContentDoc[];
  selected: string[];
  showPublishActions?: boolean;
  showUnpublishActions?: boolean;
  showRestoreActions?: boolean;
  showCanvaExport?: boolean;
  isExportingContent?: (contentId: string) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPublishActions: false,
  showUnpublishActions: false,
  showRestoreActions: false,
  showCanvaExport: false,
  isExportingContent: () => () => false,
});

const emit = defineEmits<{
  'update:selected': [value: string[]];
  'publish': [id: string];
  'unpublish': [id: string];
  'archive': [id: string];
  'restore': [id: string];
  'reject': [id: string];
  'delete': [id: string];
  'view': [content: ContentDoc];
  'toggle-featured': [id: string, featured: boolean];
  'toggle-newsletter-ready': [id: string, newsletterReady: boolean];
  'export-for-print': [content: ContentDoc];
  'download-design': [exportUrl: string, filename: string];
}>();

// Computed properties
const hasCanvaExportPermission = computed(() => isEditor.value);

// Safe wrapper for isExportingContent function
const isExportingContent = computed(() => props.isExportingContent || (() => false));

// Helper method to handle toggle featured
const handleToggleFeatured = (id: string, featured: boolean) => {
  emit('toggle-featured', id, featured);
};

// Helper method to handle toggle newsletter ready
const handleToggleNewsletterReady = (id: string, newsletterReady: boolean) => {
  emit('toggle-newsletter-ready', id, newsletterReady);
};

// Helper method to get feature tags
const getFeatureTags = (content: ContentDoc): string[] => {
  const featureTags: string[] = [];
  if (contentUtils.hasFeature(content, 'feat:date')) featureTags.push('feat:date');
  if (contentUtils.hasFeature(content, 'feat:location')) featureTags.push('feat:location');
  if (contentUtils.hasFeature(content, 'feat:task')) featureTags.push('feat:task');
  if (contentUtils.hasFeature(content, 'integ:canva')) featureTags.push('integ:canva');
  return featureTags;
};

// Computed for selected content items (convert IDs back to objects for table)
const selectedContentItems = computed(() =>
  props.content.filter(item => props.selected.includes(item.id))
);

// Table columns
const tableColumns = computed(() => [
  {
    name: 'status',
    label: 'Status',
    align: 'center' as const,
    field: 'status',
    sortable: true,
  },
  {
    name: 'type',
    label: 'Type',
    align: 'center' as const,
    field: (row: ContentDoc) => contentUtils.getContentType(row),
    sortable: true,
  },
  {
    name: 'title',
    label: 'Title & Content',
    align: 'left' as const,
    field: 'title',
    sortable: true,
    style: 'width: 40%',
  },
  {
    name: 'author',
    label: 'Author',
    align: 'left' as const,
    field: 'authorName',
    sortable: true,
  },
  {
    name: 'created',
    label: 'Created',
    align: 'left' as const,
    field: (row: ContentDoc) => row.timestamps.created,
    sortable: true,
  },
  {
    name: 'tags',
    label: 'Tags',
    align: 'left' as const,
    field: 'tags',
    sortable: false,
    style: 'width: 200px; max-width: 200px;',
  },
  {
    name: 'featured',
    label: 'Featured',
    align: 'center' as const,
    field: 'featured',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false,
  },
]);

// Utility functions - using centralized date formatter

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
}
</style>
