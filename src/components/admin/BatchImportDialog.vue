<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section>
        <div class="text-h6">{{ $t('batchImport.dialogTitle') }}</div>
        <div class="text-subtitle2 text-grey-7">
          {{ $t('batchImport.dialogSubtitle') }}
        </div>
      </q-card-section>

      <q-card-section>
        <!-- File Upload Area -->
        <div class="q-mb-md">
          <q-file
            v-model="selectedFile"
            :label="$t('batchImport.selectFile')"
            accept=".json"
            filled
            @update:model-value="handleFileSelect"
          >
            <template v-slot:prepend>
              <q-icon name="upload_file" />
            </template>
          </q-file>
        </div>

        <!-- Import Options -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t('batchImport.importOptions') }}</div>

          <q-checkbox
            v-model="importOptions.importArticles"
            :label="$t('batchImport.importArticles')"
            class="q-mb-xs"
          />
          <q-checkbox
            v-model="importOptions.importNewsletter"
            :label="$t('batchImport.importNewsletters')"
            class="q-mb-xs"
          />
          <q-checkbox
            v-model="importOptions.skipExisting"
            :label="$t('batchImport.skipExisting')"
            class="q-mb-xs"
          />
        </div>

        <!-- Preview Section -->
        <div v-if="preview" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t('batchImport.preview') }}</div>
          <q-card flat bordered>
            <q-card-section>
              <div class="row q-gutter-md">
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.totalItems') }}</div>
                  <div class="text-h6">{{ preview.totalItems }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.articlesFound') }}</div>
                  <div class="text-h6">{{ preview.articlesFound }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.newslettersFound') }}</div>
                  <div class="text-h6">{{ preview.newslettersFound }}</div>
                </div>
              </div>

              <!-- Sample Articles -->
              <div v-if="preview.sampleArticles.length > 0" class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">{{ $t('batchImport.sampleArticles') }}</div>
                <q-list dense>
                  <q-item
                    v-for="(article, index) in preview.sampleArticles"
                    :key="index"
                    dense
                  >
                    <q-item-section>
                      <q-item-label>{{ article.title }}</q-item-label>
                      <q-item-label caption>
                        {{ $t('batchImport.contentLength', { length: article.contentLength }) }}
                        • {{ article.tags.slice(0, 3).join(', ') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Progress Section -->
        <div v-if="isImporting" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t('batchImport.processing') }}</div>
          <q-linear-progress
            :value="importProgress / 100"
            color="primary"
            class="q-mb-sm"
          />
          <div class="text-caption text-center">
            {{ Math.round(importProgress) }}% {{ $t('batchImport.complete') }}
          </div>
        </div>

        <!-- Results Section -->
        <div v-if="lastResult" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t('batchImport.results') }}</div>
          <q-card flat bordered>
            <q-card-section>
              <div class="row q-gutter-md">
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.articlesImported') }}</div>
                  <div class="text-h6 text-positive">{{ lastResult.articlesImported }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.newslettersImported') }}</div>
                  <div class="text-h6 text-positive">{{ lastResult.newslettersImported }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-7">{{ $t('batchImport.processingTime') }}</div>
                  <div class="text-h6">{{ lastResult.processingTime }}ms</div>
                </div>
              </div>

              <!-- Errors -->
              <div v-if="lastResult.errors.length > 0" class="q-mt-md">
                <div class="text-caption text-negative q-mb-xs">{{ $t('batchImport.errors') }}</div>
                <q-list dense>
                  <q-item
                    v-for="(error, index) in lastResult.errors.slice(0, 5)"
                    :key="index"
                    dense
                  >
                    <q-item-section>
                      <q-item-label class="text-negative">{{ error }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="lastResult.errors.length > 5" dense>
                    <q-item-section>
                      <q-item-label class="text-grey-7">
                        {{ $t('batchImport.moreErrors', { count: lastResult.errors.length - 5 }) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="$t('common.cancel')"
          @click="handleCancel"
          :disable="isImporting"
        />
        <q-btn
          :label="$t('batchImport.import')"
          color="primary"
          @click="handleImport"
          :loading="isImporting"
          :disable="!selectedFile || !hasValidOptions"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useBatchImport } from '../../composables/useBatchImport';
import type { ImportOptions } from '../../services/batch-import.service';

interface Props {
  modelValue: boolean;
}

import type { ImportResult } from '../../services/batch-import.service';

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'import-complete', result: ImportResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const {
  isImporting,
  importProgress,
  lastImportResult,
  importFromFile,
  getImportPreview
} = useBatchImport();

// Local state
const selectedFile = ref<File | null>(null);
const preview = ref<{
  totalItems: number;
  articlesFound: number;
  newslettersFound: number;
  estimatedProcessingTime: number;
  sampleArticles: Array<{ title: string; contentLength: number; tags: string[] }>;
} | null>(null);
const importOptions = ref<ImportOptions>({
  importArticles: true,
  importNewsletter: false,
  skipExisting: true
});

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const hasValidOptions = computed(() =>
  importOptions.value.importArticles || importOptions.value.importNewsletter
);

const lastResult = computed(() => lastImportResult.value);

// Methods
const handleFileSelect = async (file: File | null) => {
  if (!file) {
    preview.value = null;
    return;
  }

  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    preview.value = getImportPreview(jsonData);
  } catch (error) {
    console.error('Failed to preview file:', error);
    preview.value = null;
  }
};

const handleImport = async () => {
  if (!selectedFile.value) return;

  try {
    const result = await importFromFile(selectedFile.value, importOptions.value);
    emit('import-complete', result);
  } catch (error) {
    console.error('Import failed:', error);
  }
};

const handleCancel = () => {
  show.value = false;
  selectedFile.value = null;
  preview.value = null;
};

// Watch for dialog close
watch(show, (newValue) => {
  if (!newValue) {
    selectedFile.value = null;
    preview.value = null;
  }
});
</script>

<style lang="scss" scoped>
.q-card {
  border-radius: 8px;
}

.q-linear-progress {
  height: 8px;
  border-radius: 4px;
}
</style>
