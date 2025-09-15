<!--
  Template Management Dialog
  Component for managing newsletter templates
-->
<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Template Management</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Available Templates -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6">Available Templates</div>
                <div class="text-caption text-grey-6">Click to preview or test templates</div>
              </q-card-section>

              <q-card-section>
                <q-list>
                  <q-item
                    v-for="template in availableTemplates"
                    :key="template"
                    clickable
                    @click="previewTemplate(template)"
                  >
                    <q-item-section>
                      <q-item-label>{{ getTemplateDisplayName(template) }}</q-item-label>
                      <q-item-label caption>{{ getTemplateDescription(template) }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        flat
                        icon="preview"
                        @click.stop="previewTemplate(template)"
                        size="sm"
                      />
                      <q-btn
                        flat
                        icon="mdi-test-tube"
                        @click.stop="testTemplate(template)"
                        size="sm"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Template Preview -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6">Template Preview</div>
                <div class="text-caption text-grey-6">Preview of selected template</div>
              </q-card-section>

              <q-card-section>
                <div v-if="selectedTemplatePreview" class="template-preview-container">
                  <iframe
                    :srcdoc="selectedTemplatePreview"
                    class="template-preview-iframe"
                    sandbox="allow-same-origin"
                  />
                </div>
                <div v-else class="text-center text-grey-6 q-pa-lg">
                  Select a template to preview
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { templateManagementService } from '../../services/template-management.service';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const availableTemplates = ref<string[]>([]);
const selectedTemplatePreview = ref<string>('');

const loadAvailableTemplates = () => {
  try {
    // Use local template info instead of calling the CORS-blocked service
    const localTemplates = ['article', 'event', 'announcement', 'editorial', 'fullpage'];
    availableTemplates.value = localTemplates;

    logger.info('Loaded local templates', { count: localTemplates.length });
  } catch (error) {
    logger.error('Error loading templates:', error);
    // Fallback to basic templates
    availableTemplates.value = ['article', 'event', 'announcement'];
  }
};

const previewTemplate = (templateName: string) => {
  try {
    // Create a local preview since the CORS-blocked service isn't available
    const templateInfo = templateManagementService.getTemplateInfo(templateName);
    const sampleData = templateManagementService.createSampleData('news');

    // Generate a simple HTML preview
    const previewHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border: 2px solid #1976d2; border-radius: 8px; padding: 20px; background: #f5f5f5;">
          <h2 style="color: #1976d2; margin-top: 0;">${templateInfo.displayName}</h2>
          <p style="color: #666; font-style: italic;">${templateInfo.description}</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <h3 style="color: #333;">Sample Content</h3>
          <h4 style="color: #1976d2;">${sampleData.title}</h4>
          <p style="line-height: 1.6; color: #333;">${sampleData.content}</p>
          <div style="margin-top: 20px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
            <strong>Template Type:</strong> ${templateInfo.contentType}<br>
            <strong>Layout:</strong> ${templateInfo.layout}
          </div>
        </div>
      </div>
    `;

    selectedTemplatePreview.value = previewHtml;

    $q.notify({
      type: 'info',
      message: `Previewing ${templateInfo.displayName}`,
      caption: 'This is a local preview - actual templates may vary'
    });
  } catch (error) {
    logger.error('Error previewing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error previewing template'
    });
  }
};

const testTemplate = (templateName: string) => {
  try {
    // Since the CORS-blocked service isn't available, show a helpful message
    const templateInfo = templateManagementService.getTemplateInfo(templateName);

    $q.notify({
      type: 'info',
      message: `Template Testing Not Available`,
      caption: `Template "${templateInfo.displayName}" would be tested here. CORS configuration needed for full functionality.`,
      timeout: 5000
    });

    logger.info('Template test requested but CORS service unavailable', { templateName });
  } catch (error) {
    logger.error('Error testing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error testing template'
    });
  }
};

const getTemplateDisplayName = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.displayName;
};

const getTemplateDescription = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.description;
};

onMounted(() => {
  loadAvailableTemplates();
});
</script>

<style scoped>
.template-preview-container {
  width: 100%;
  height: 60vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.template-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
