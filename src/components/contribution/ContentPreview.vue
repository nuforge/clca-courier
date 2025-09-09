<template>
  <q-dialog
    v-model="showDialog"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="preview-card">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Content Preview</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- Preview Content -->
      <q-card-section class="q-pt-none" style="height: calc(100vh - 100px); overflow-y: auto;">
        <div class="preview-container">
          <!-- Content Header -->
          <div class="content-header q-mb-lg">
            <div class="content-type-badge q-mb-sm">
              <q-chip
                :icon="getTypeIcon(content.type)"
                :color="getTypeColor(content.type)"
                text-color="white"
                size="sm"
              >
                {{ getTypeLabel(content.type) }}
              </q-chip>
              <q-chip
                :color="getPriorityColor(content.priority)"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              >
                {{ content.priority.charAt(0).toUpperCase() + content.priority.slice(1) }} Priority
              </q-chip>
            </div>

            <h2 class="content-title q-mt-sm q-mb-sm">{{ content.title }}</h2>

            <div class="content-meta text-grey-6">
              <div class="row items-center ">
                <div class="flex items-center">
                  <q-icon name="person" size="sm" class="q-mr-xs" />
                  {{ content.author.displayName }}
                </div>
                <div class="flex items-center">
                  <q-icon name="schedule" size="sm" class="q-mr-xs" />
                  {{ formatDate(content.createdAt) }}
                </div>
                <div class="flex items-center">
                  <q-icon name="label" size="sm" class="q-mr-xs" />
                  {{ content.category }}
                </div>
                <div v-if="content.targetIssue" class="flex items-center">
                  <q-icon name="book" size="sm" class="q-mr-xs" />
                  {{ content.targetIssue }}
                </div>
              </div>
            </div>
          </div>

          <!-- Content Body -->
          <div class="content-body q-mb-lg">
            <div
              class="content-html"
              v-html="content.content"
            ></div>
          </div>

          <!-- Type-Specific Metadata -->
          <div v-if="hasMetadata" class="content-metadata q-mb-lg">
            <q-separator class="q-mb-md" />
            <h6 class="q-mt-none q-mb-md">Additional Information</h6>
            <MetadataPreview
              :metadata="content.metadata"
              :content-type="content.type"
            />
          </div>

          <!-- Attachments -->
          <div v-if="content.attachments.length > 0" class="content-attachments">
            <q-separator class="q-mb-md" />
            <h6 class="q-mt-none q-mb-md">Images & Media</h6>

            <div class="row ">
              <div
                v-for="attachment in content.attachments"
                :key="attachment.id"
                class="col-12 col-sm-6 col-md-4"
              >
                <q-card flat bordered>
                  <q-img
                    :src="attachment.externalUrl || attachment.firebaseUrl || ''"
                    :alt="attachment.alt || attachment.caption || 'Content image'"
                    class="attachment-image"
                    loading="lazy"
                  >
                    <template v-slot:loading>
                      <div class="absolute-full flex flex-center">
                        <q-spinner color="primary" size="2em" />
                      </div>
                    </template>
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey">
                        <div class="text-center text-grey-6">
                          <q-icon name="broken_image" size="2em" class="q-mb-sm" />
                          <div class="text-caption">Failed to load</div>
                        </div>
                      </div>
                    </template>
                  </q-img>

                  <q-card-section v-if="attachment.caption" class="q-pa-sm">
                    <div class="text-caption">{{ attachment.caption }}</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaseContentItem } from '../../types/core/content.types';
import { getContentTypeIcon } from '../../utils/content-icons';

// Placeholder for MetadataPreview component
import MetadataPreview from './MetadataPreview.vue';

interface Props {
  modelValue: boolean;
  content: BaseContentItem;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const hasMetadata = computed(() => {
  return Object.keys(props.content.metadata || {}).length > 0;
});

// Helper functions
function getTypeIcon(type: string): string {
  return getContentTypeIcon(type).icon;
}

function getTypeLabel(type: string): string {
  return getContentTypeIcon(type).label;
}

function getTypeColor(type: string): string {
  return getContentTypeIcon(type).color;
}

function getPriorityColor(priority: string): string {
  const colors = {
    low: 'grey',
    medium: 'orange',
    high: 'red',
  };
  return colors[priority as keyof typeof colors] || 'grey';
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.preview-card {
  height: 100vh;
}

.preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.content-title {
  color: var(--q-primary);
  font-weight: 600;
  font-size: 2rem;
  line-height: 1.3;
  margin: 0;
}

.content-meta {
  font-size: 0.9rem;
}

.content-body {
  font-size: 1rem;
  line-height: 1.7;
}

.attachment-image {
  height: 200px;
  width: 100%;
  object-fit: cover;
}

h6 {
  color: var(--q-primary);
  font-weight: 600;
}

/* Content HTML styling */
:deep(.content-html) {
  line-height: 1.7;
}

:deep(.content-html h1) {
  font-size: 1.8em;
  font-weight: 600;
  margin: 1.5em 0 0.8em 0;
  color: var(--q-primary);
}

:deep(.content-html h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1.3em 0 0.8em 0;
  color: var(--q-primary);
}

:deep(.content-html h3) {
  font-size: 1.3em;
  font-weight: 600;
  margin: 1.2em 0 0.8em 0;
  color: var(--q-primary);
}

:deep(.content-html p) {
  margin: 1em 0;
}

:deep(.content-html ul),
:deep(.content-html ol) {
  margin: 1em 0;
  padding-left: 2em;
}

:deep(.content-html li) {
  margin: 0.5em 0;
}

:deep(.content-html blockquote) {
  border-left: 4px solid var(--q-primary);
  margin: 1.5em 0;
  padding: 1em 1.5em;
  background: rgba(0, 0, 0, 0.02);
  font-style: italic;
}

:deep(.content-html a) {
  color: var(--q-primary);
  text-decoration: none;
}

:deep(.content-html a:hover) {
  text-decoration: underline;
}

:deep(.content-html code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

:deep(.content-html strong) {
  font-weight: 600;
}

:deep(.content-html em) {
  font-style: italic;
}

/* Dark theme support */
.body--dark :deep(.content-html blockquote) {
  background: rgba(255, 255, 255, 0.05);
}

.body--dark :deep(.content-html code) {
  background: rgba(255, 255, 255, 0.1);
}
</style>
