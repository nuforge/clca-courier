<!--
  Newsletter Edit Dialog Component
  Handles editing newsletter metadata with form validation and versioning
-->
<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 700px; max-width: 900px; min-height: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div>
          <div class="text-h6">Edit Newsletter Metadata</div>
          <div v-if="newsletter" class="text-caption text-grey-6">
            Version {{ newsletter.version || 1 }} •
            Last updated {{ formatDate(newsletter.updatedAt) }} by {{ newsletter.updatedBy }}
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height: 70vh">
        <div v-if="newsletter">
          <q-tabs v-model="activeTab" align="left" dense class="text-grey-6" active-color="primary" narrow-indicator>
            <q-tab name="metadata" icon="mdi-file-document-edit" label="Metadata" />
            <q-tab name="content" icon="mdi-text-box" label="Content" />
            <q-tab name="processing" icon="mdi-cog" label="Processing" />
            <q-tab name="history" icon="mdi-history" label="Version History" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <!-- Metadata Tab -->
            <q-tab-panel name="metadata">
              <div v-if="localNewsletter" class="row q-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model="localNewsletter.title" label="Title" outlined dense />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="localNewsletter.year" label="Year" type="number" outlined dense />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="localNewsletter.season" :options="seasonOptions" label="Season" outlined dense
                    clearable emit-value map-options />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="localNewsletter.volume" label="Volume" type="number" outlined dense />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="localNewsletter.issue" label="Issue" type="number" outlined dense />
                </div>
                <div class="col-12">
                  <q-input v-model="localNewsletter.description" label="Description" type="textarea" outlined
                    rows="3" />
                </div>
                <div class="col-12">
                  <q-input v-model="contributorsString" label="Contributors (comma-separated)" type="textarea" outlined
                    rows="2" />
                </div>
                <div class="col-12">
                  <q-select v-model="localNewsletter.tags" :options="availableTags" label="Tags" multiple outlined dense
                    use-chips use-input @new-value="addNewTag" hint="Start typing to add custom tags" />
                </div>
                <div class="col-12">
                  <q-select v-model="localNewsletter.categories" :options="availableCategories" label="Categories"
                    multiple outlined dense use-chips />
                </div>
                <div class="col-12 col-md-6">
                  <q-toggle v-model="localNewsletter.isPublished" label="Published" left-label />
                </div>
                <div class="col-12 col-md-6">
                  <q-toggle v-model="localNewsletter.featured" label="Featured" left-label />
                </div>
              </div>
            </q-tab-panel>

            <!-- Content Tab -->
            <q-tab-panel name="content">
              <div v-if="localNewsletter" class="q-gutter-md">
                <q-input v-model="localNewsletter.searchableText" label="Searchable Text Content" type="textarea"
                  outlined rows="8" readonly hint="Auto-extracted text content (read-only)" />
                <div class="row q-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model="localNewsletter.wordCount" label="Word Count" type="number" outlined dense
                      readonly />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model="localNewsletter.pageCount" label="Page Count" type="number" outlined dense
                      readonly />
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <!-- Processing Tab -->
            <q-tab-panel name="processing">
              <div v-if="localNewsletter" class="q-gutter-md">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-h6 q-mb-md">Processing Actions</div>
                    <div class="row q-gutter-sm">
                      <q-btn color="primary" icon="mdi-text-search" label="Extract Text"
                        @click="$emit('extract-text', localNewsletter)" :loading="extractingText" outline />
                      <q-btn color="accent" icon="mdi-image" label="Generate Thumbnail"
                        @click="$emit('generate-thumbnail', localNewsletter)" :loading="generatingThumbnail" outline />
                      <q-btn color="secondary" icon="mdi-sync" label="Sync to Firebase"
                        @click="$emit('sync-newsletter', localNewsletter)" :loading="syncing" outline />
                    </div>
                  </q-card-section>
                </q-card>

                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-h6 q-mb-md">File Information</div>
                    <div class="row q-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input v-model="localNewsletter.filename" label="Filename" outlined dense readonly />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-input :model-value="formatFileSize(localNewsletter.fileSize)" label="File Size" outlined
                          dense readonly />
                      </div>
                      <div class="col-12">
                        <q-input v-model="localNewsletter.downloadUrl" label="Download URL" outlined dense readonly />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-tab-panel>

            <!-- Version History Tab -->
            <q-tab-panel name="history">
              <NewsletterVersionHistoryPanel v-if="localNewsletter" :newsletter-id="localNewsletter.id"
                @version-restored="$emit('version-restored', localNewsletter.id)" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn color="primary" label="Save Changes" @click="saveChanges" :loading="saving" />
        <q-btn v-if="localNewsletter?.extractedText" color="secondary" label="Apply Extracted Metadata"
          @click="applyExtractedMetadata" outline />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ContentManagementNewsletter } from '../../types';
import NewsletterVersionHistoryPanel from './NewsletterVersionHistoryPanel.vue';

interface Props {
  modelValue: boolean;
  newsletter: ContentManagementNewsletter | null;
  extractingText?: boolean;
  generatingThumbnail?: boolean;
  syncing?: boolean;
  saving?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save-newsletter', newsletter: ContentManagementNewsletter): void;
  (e: 'extract-text', newsletter: ContentManagementNewsletter): void;
  (e: 'generate-thumbnail', newsletter: ContentManagementNewsletter): void;
  (e: 'sync-newsletter', newsletter: ContentManagementNewsletter): void;
  (e: 'apply-extracted-metadata'): void;
  (e: 'version-restored', newsletterId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const activeTab = ref('metadata');
const localNewsletter = ref<ContentManagementNewsletter | null>(null);

// Watch for prop changes and update local copy
watch(() => props.newsletter, (newNewsletter) => {
  if (newNewsletter) {
    localNewsletter.value = { ...newNewsletter };
  } else {
    localNewsletter.value = null;
  }
}, { immediate: true, deep: true });

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const contributorsString = computed({
  get: () => {
    if (Array.isArray(localNewsletter.value?.contributors)) {
      return localNewsletter.value.contributors.join(', ');
    }
    return localNewsletter.value?.contributors || '';
  },
  set: (value: string) => {
    if (localNewsletter.value) {
      localNewsletter.value.contributors = value.split(',').map(c => c.trim()).filter(Boolean);
    }
  }
});

// Form options
const seasonOptions = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
];

const availableTags = [
  'Community Events',
  'Lake Activities',
  'Boating',
  'Swimming',
  'Fishing',
  'Nature',
  'Wildlife',
  'Safety',
  'Environment',
  'History',
  'Culture',
  'Recreation',
  'Property',
  'Maintenance',
  'Rules & Regulations',
  'Emergency Services',
  'Seasonal Activities',
  'Board Updates',
  'Member News',
  'Photo Gallery'
];

const availableCategories = [
  'Community Events',
  'Lake Activities',
  'Safety & Emergency',
  'Environment & Nature',
  'Property & Maintenance',
  'Board Updates',
  'Member News',
  'Recreation',
  'History & Culture'
];

// Methods
const saveChanges = (): void => {
  if (localNewsletter.value) {
    emit('save-newsletter', localNewsletter.value);
  }
};

const applyExtractedMetadata = (): void => {
  emit('apply-extracted-metadata');
};

const addNewTag = (val: string, done: (item: string, mode?: 'add' | 'add-unique' | 'toggle') => void): void => {
  if (val.length > 0) {
    done(val, 'add-unique');
  }
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Reset tab when dialog opens/closes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    activeTab.value = 'metadata';
  }
});
</script>
