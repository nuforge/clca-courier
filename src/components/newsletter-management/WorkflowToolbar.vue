<template>
  <q-card class="q-mb-lg">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="mdi-cog" class="q-mr-sm" />
        Workflow Toolbar
      </div>

      <q-tabs v-model="activeTab" class="text-primary" align="left">
        <q-tab name="import" icon="mdi-import" label="Import & Drafts" />
        <q-tab name="database" icon="mdi-database" label="Database" />
        <q-tab name="enhance" icon="mdi-magic-staff" label="Content" />
        <q-tab name="metadata" icon="mdi-tag-multiple" label="Metadata" />
        <q-tab name="ai" icon="mdi-robot" label="AI Generate" />
        <q-tab name="stats" icon="mdi-chart-line" label="Stats" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated>
        <!-- Import and Draft Management -->
        <q-tab-panel name="import">
          <div class="row ">
            <q-btn color="positive" icon="mdi-file-import" label="Import PDFs" @click="$emit('import-pdfs')" />
            <q-btn v-if="hasDrafts" color="positive" icon="mdi-upload" :label="`Upload ${draftCount} Drafts to Cloud`"
              @click="$emit('upload-drafts')" :loading="isUploading" />
            <q-btn v-if="hasDrafts" color="negative" icon="mdi-delete" label="Clear Drafts"
              @click="$emit('clear-drafts')" />
          </div>
        </q-tab-panel>

        <!-- Database Operations -->
        <q-tab-panel name="database">
          <div class="row ">
            <q-btn color="blue" icon="mdi-refresh" label="Refresh Data" @click="$emit('refresh-data')"
              :loading="isLoading" />
            <q-btn color="orange" icon="mdi-database-sync" label="Sync All to Firebase" @click="$emit('sync-all')"
              :loading="isSyncing" />
            <q-btn color="red" icon="mdi-backup-restore" label="Backup Data" @click="$emit('backup-data')" />
          </div>
        </q-tab-panel>

        <!-- Content Enhancement -->
        <q-tab-panel name="enhance">
          <div class="row ">
            <q-btn color="secondary" icon="mdi-text-search" label="Extract All Text" @click="$emit('extract-all-text')"
              :loading="isExtractingText" />
            <q-btn color="accent" icon="mdi-image-multiple" label="Generate All Thumbnails"
              @click="$emit('generate-all-thumbnails')" :loading="isGeneratingThumbs" />
          </div>
        </q-tab-panel>

        <!-- Metadata Operations -->
        <q-tab-panel name="metadata">
          <div class="row ">
            <q-btn color="purple" icon="mdi-counter" label="Extract Page Count" @click="$emit('extract-page-count')"
              :loading="isExtractingPageCount" />
            <q-btn color="brown" icon="mdi-file-document-outline" label="Extract File Size"
              @click="$emit('extract-file-size')" :loading="isExtractingFileSize" />
            <q-btn color="lime" icon="mdi-calendar-search" label="Extract Dates" @click="$emit('extract-dates')"
              :loading="isExtractingDates" />
          </div>
        </q-tab-panel>

        <!-- AI Content Generation -->
        <q-tab-panel name="ai">
          <div class="row ">
            <q-btn color="teal" icon="mdi-tag-plus" label="Generate Keywords" @click="$emit('generate-keywords')"
              :loading="isGeneratingKeywords" />
            <q-btn color="indigo" icon="mdi-text-box-plus" label="Generate Descriptions"
              @click="$emit('generate-descriptions')" :loading="isGeneratingDescriptions" />
            <q-btn color="blue-5" icon="mdi-format-title" label="Generate Titles" @click="$emit('generate-titles')"
              :loading="isGeneratingTitles" />
          </div>
        </q-tab-panel>

        <!-- Quick Stats -->
        <q-tab-panel name="stats">
          <div class="row ">
            <div class="col-auto">
              <q-chip color="primary" text-color="white" icon="mdi-file-multiple">
                Total: {{ totalNewsletters }}
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip color="green" text-color="white" icon="mdi-text">
                With Text: {{ newslettersWithText }}
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip color="orange" text-color="white" icon="mdi-image">
                With Thumbnails: {{ newslettersWithThumbnails }}
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip color="purple" text-color="white" icon="mdi-harddisk">
                Size: {{ formatFileSize(totalFileSize) }}
              </q-chip>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// =============================================
// PROPS - ALL DATA FROM STORE
// =============================================

interface Props {
  hasDrafts: boolean;
  draftCount: number;
  isLoading: boolean;
  isUploading: boolean;
  isSyncing: boolean;
  isExtractingText: boolean;
  isGeneratingThumbs: boolean;
  isExtractingPageCount: boolean;
  isExtractingFileSize: boolean;
  isExtractingDates: boolean;
  isGeneratingKeywords: boolean;
  isGeneratingDescriptions: boolean;
  isGeneratingTitles: boolean;
  totalNewsletters: number;
  newslettersWithText: number;
  newslettersWithThumbnails: number;
  totalFileSize: number;
}

defineProps<Props>();

// =============================================
// EMITS - ALL ACTIONS
// =============================================

defineEmits<{
  'import-pdfs': [];
  'upload-drafts': [];
  'clear-drafts': [];
  'refresh-data': [];
  'sync-all': [];
  'backup-data': [];
  'extract-all-text': [];
  'generate-all-thumbnails': [];
  'extract-page-count': [];
  'extract-file-size': [];
  'extract-dates': [];
  'generate-keywords': [];
  'generate-descriptions': [];
  'generate-titles': [];
}>();

// =============================================
// LOCAL STATE
// =============================================

const activeTab = ref('import');

// =============================================
// UTILITIES
// =============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
