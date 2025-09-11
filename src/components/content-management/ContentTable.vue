<!--
  Content Table Component
  Displays user-submitted content in a table format with actions
-->
<template>
  <div>
    <q-table :rows="content" :columns="tableColumns" row-key="id" selection="multiple" :selected="selectedContentItems"
      @update:selected="(value: readonly UserContent[]) => $emit('update:selected', value.map(item => item.id))"
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
          <q-badge color="grey" :label="props.value.toUpperCase()" />
        </q-td>
      </template>

      <!-- Title column -->
      <template v-slot:body-cell-title="props">
        <q-td :props="props" class="cursor-pointer" @click="$emit('view', props.row)">
          <div class="text-weight-medium">{{ props.value }}</div>
          <div class="text-caption text-grey">{{ truncateText(props.row.content, 100) }}</div>
        </q-td>
      </template>

      <!-- Author column -->
      <template v-slot:body-cell-author="props">
        <q-td :props="props">
          <div>{{ props.row.authorName }}</div>
          <div class="text-caption text-grey">{{ props.row.authorEmail }}</div>
        </q-td>
      </template>

      <!-- Date column -->
      <template v-slot:body-cell-submissionDate="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <!-- Featured column -->
      <template v-slot:body-cell-featured="props">
        <q-td :props="props">
          <q-toggle :model-value="props.row.featured || false"
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

            <!-- Pending actions -->
            <template v-if="showActions && props.row.status === 'pending'">
              <q-btn flat round size="sm" icon="check" @click="$emit('approve', props.row.id)" color="positive">
                <q-tooltip>Approve</q-tooltip>
              </q-btn>
              <q-btn flat round size="sm" icon="close" @click="$emit('reject', props.row.id)" color="negative">
                <q-tooltip>Reject</q-tooltip>
              </q-btn>
            </template>

            <!-- Approved actions -->
            <template v-if="showPublishActions && props.row.status === 'approved'">
              <q-btn flat round size="sm" icon="publish" @click="$emit('publish', props.row.id)" color="blue">
                <q-tooltip>Publish</q-tooltip>
              </q-btn>
            </template>

            <!-- Published actions -->
            <template v-if="showUnpublishActions && props.row.status === 'published'">
              <q-btn flat round size="sm" icon="unpublished" @click="$emit('unpublish', props.row.id)" color="orange">
                <q-tooltip>Unpublish</q-tooltip>
              </q-btn>
            </template>

            <!-- Rejected actions -->
            <template v-if="showReconsiderActions && props.row.status === 'rejected'">
              <q-btn flat round size="sm" icon="refresh" @click="$emit('reconsider', props.row.id)" color="blue">
                <q-tooltip>Reconsider</q-tooltip>
              </q-btn>
            </template>

            <!-- Canva Export for Print (Admin/Editor only) -->
            <template v-if="showCanvaExport && props.row.canvaDesign && hasCanvaExportPermission">
              <!-- Export button when design is ready for export (draft or exported without exportUrl) -->
              <q-btn
                v-if="props.row.canvaDesign.status === 'draft' || (props.row.canvaDesign.status === 'exported' && !props.row.canvaDesign.exportUrl)"
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

              <!-- Loading indicator when export is in progress -->
              <q-btn
                v-else-if="props.row.canvaDesign.status === 'pending_export' || isExportingContent(props.row.id)"
                flat
                round
                size="sm"
                icon="hourglass_empty"
                color="orange"
                loading
                disable
              >
                <q-tooltip>{{ $t(TRANSLATION_KEYS.CANVA.EXPORT_PENDING) }}</q-tooltip>
              </q-btn>

              <!-- Download button when export is complete -->
              <q-btn
                v-else-if="props.row.canvaDesign.status === 'exported' && props.row.canvaDesign.exportUrl"
                flat
                round
                size="sm"
                icon="download"
                @click="$emit('download-design', props.row.canvaDesign.exportUrl, `design-${props.row.canvaDesign.id}.pdf`)"
                color="green"
              >
                <q-tooltip>{{ $t(TRANSLATION_KEYS.CANVA.DOWNLOAD_DESIGN) }}</q-tooltip>
              </q-btn>

              <!-- Failed state with retry option -->
              <q-btn
                v-else-if="props.row.canvaDesign.status === 'failed'"
                flat
                round
                size="sm"
                icon="error"
                @click="$emit('export-for-print', props.row)"
                color="red"
                :loading="isExportingContent(props.row.id)"
                :disable="isExportingContent(props.row.id)"
              >
                <q-tooltip>Export failed - Click to retry</q-tooltip>
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
import type { UserContent } from '../../services/firebase-firestore.service';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { useRoleAuth } from '../../composables/useRoleAuth';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';

const { getStatusIcon } = useSiteTheme();
const { isEditor } = useRoleAuth();

interface Props {
  content: UserContent[];
  selected: string[];
  showActions?: boolean;
  showPublishActions?: boolean;
  showUnpublishActions?: boolean;
  showReconsiderActions?: boolean;
  showCanvaExport?: boolean;
  isExportingContent?: (contentId: string) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  showPublishActions: false,
  showUnpublishActions: false,
  showReconsiderActions: false,
  showCanvaExport: false,
  isExportingContent: () => () => false,
});

const emit = defineEmits<{
  'update:selected': [value: string[]];
  'approve': [id: string];
  'reject': [id: string];
  'publish': [id: string];
  'unpublish': [id: string];
  'reconsider': [id: string];
  'view': [content: UserContent];
  'toggle-featured': [id: string, featured: boolean];
  'export-for-print': [content: UserContent];
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
    field: 'type',
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
    name: 'submissionDate',
    label: 'Submitted',
    align: 'left' as const,
    field: 'submissionDate',
    sortable: true,
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

// Utility functions
const formatDate = (dateValue: string | Date | { seconds: number; nanoseconds: number }) => {
  let date: Date;

  // Handle Firestore Timestamp objects
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    date = new Date((dateValue as { seconds: number }).seconds * 1000);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return 'Invalid Date';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}; const truncateText = (text: string, maxLength: number) => {
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
</style>
