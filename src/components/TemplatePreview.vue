<template>
  <q-dialog v-model="showPreview" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t('templatePreview.title', { template: templateName }) }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="preview-container">
          <iframe
            :srcdoc="previewHtml"
            class="preview-iframe"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="$t('common.close')" v-close-popup />
        <q-btn
          color="primary"
          :label="$t('templatePreview.useTemplate')"
          @click="selectTemplate"
          :loading="isLoading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { templateManagementService, type TemplatePreviewData } from '../services/template-management.service';
import { logger } from '../utils/logger';

const props = defineProps<{
  modelValue: boolean;
  templateName: string;
  contentData?: TemplatePreviewData | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'template-selected': [templateName: string];
}>();

const showPreview = ref(false);
const previewHtml = ref('');
const isLoading = ref(false);

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    showPreview.value = true;
    await loadPreview();
  } else {
    showPreview.value = false;
  }
});

const loadPreview = async () => {
  if (!props.templateName) return;

  isLoading.value = true;

  try {
    // Use provided content data or create sample data
    const contentData = props.contentData || templateManagementService.createSampleData('news');

    const result = await templateManagementService.previewTemplate(props.templateName, contentData);

    if (result.success && result.html) {
      previewHtml.value = result.html;
    } else {
      logger.error('Failed to load template preview:', result.error);
      previewHtml.value = '<p>Failed to load template preview</p>';
    }
  } catch (error) {
    logger.error('Error loading template preview:', error);
    previewHtml.value = '<p>Error loading template preview</p>';
  } finally {
    isLoading.value = false;
  }
};

const selectTemplate = () => {
  emit('template-selected', props.templateName);
  showPreview.value = false;
};
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 70vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
