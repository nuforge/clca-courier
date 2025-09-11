<template>
  <div class="canva-template-selector">
    <!-- Header -->
    <div class="template-selector-header q-mb-md">
      <div class="text-h6 q-mb-xs">{{ $t(TRANSLATION_KEYS.CANVA.SELECT_TEMPLATE) }}</div>
      <div class="text-caption text-grey-7">
        {{ $t(TRANSLATION_KEYS.CANVA.SELECT_TEMPLATE_DESCRIPTION) }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-pa-lg">
      <q-spinner-orbit size="2em" color="primary" />
      <div class="q-mt-md text-grey-7">{{ $t(TRANSLATION_KEYS.CANVA.LOADING_TEMPLATES) }}</div>
    </div>

    <!-- Error State -->
    <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      <div>{{ error }}</div>
      <template v-slot:action>
        <q-btn
          flat
          color="white"
          :label="$t(TRANSLATION_KEYS.COMMON.RETRY)"
          @click="loadTemplates"
        />
      </template>
    </q-banner>

    <!-- No Templates State -->
    <q-banner v-else-if="templates.length === 0" class="bg-info text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="info" />
      </template>
      <div>{{ $t(TRANSLATION_KEYS.CANVA.NO_TEMPLATES_AVAILABLE) }}</div>
    </q-banner>

    <!-- Template Selection Grid -->
    <div v-else class="template-grid">
      <div class="row q-gutter-md">
        <div
          v-for="template in templates"
          :key="template.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            class="template-card cursor-pointer"
            :class="{
              'selected': selectedTemplateId === template.id,
              'disabled': !template.isActive
            }"
            @click="selectTemplate(template)"
            :style="!template.isActive ? 'opacity: 0.5' : ''"
          >
            <!-- Template Thumbnail -->
            <q-img
              v-if="template.thumbnailUrl"
              :src="template.thumbnailUrl"
              :alt="template.name"
              height="120px"
              fit="cover"
              class="template-thumbnail"
            >
              <div v-if="!template.isActive" class="absolute-full flex flex-center bg-black-50">
                <q-chip color="orange" text-color="white" size="sm">
                  {{ $t(TRANSLATION_KEYS.CANVA.TEMPLATE_INACTIVE) }}
                </q-chip>
              </div>
            </q-img>
            <div v-else class="template-placeholder flex flex-center" style="height: 120px; background: #f5f5f5;">
              <q-icon name="image" size="2em" color="grey-5" />
            </div>

            <!-- Selection Indicator -->
            <div
              v-if="selectedTemplateId === template.id"
              class="absolute-top-right q-ma-sm"
            >
              <q-icon name="check_circle" color="positive" size="md" />
            </div>

            <!-- Template Info -->
            <q-card-section>
              <div class="text-subtitle2 q-mb-xs">{{ template.name }}</div>
              <div class="text-caption text-grey-7 line-height-sm">
                {{ template.description || $t(TRANSLATION_KEYS.CANVA.NO_DESCRIPTION) }}
              </div>

              <!-- Field Mapping Preview -->
              <div v-if="template.fieldMapping && Object.keys(template.fieldMapping).length > 0" class="q-mt-sm">
                <div class="text-caption text-weight-medium q-mb-xs">
                  {{ $t(TRANSLATION_KEYS.CANVA.MAPPED_FIELDS) }}:
                </div>
                <div class="field-tags">
                  <q-chip
                    v-for="(formField, templateField) in template.fieldMapping"
                    :key="templateField"
                    size="xs"
                    color="primary"
                    text-color="white"
                    class="q-mr-xs q-mb-xs"
                  >
                    {{ formField }}
                  </q-chip>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Selected Template Info -->
    <q-card v-if="selectedTemplate" class="selected-template-info q-mt-md" flat bordered>
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">{{ selectedTemplate.name }}</div>
            <div class="text-caption text-grey-7">{{ selectedTemplate.description }}</div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              color="negative"
              :label="$t(TRANSLATION_KEYS.COMMON.CLEAR_SELECTION)"
              @click="clearSelection"
            />
          </div>
        </div>

        <!-- Field Mapping Details -->
        <div v-if="selectedTemplate.fieldMapping && Object.keys(selectedTemplate.fieldMapping).length > 0" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t(TRANSLATION_KEYS.CANVA.FIELD_MAPPING_DETAILS) }}:</div>
          <div class="field-mapping-list">
            <div
              v-for="(formField, templateField) in selectedTemplate.fieldMapping"
              :key="templateField"
              class="field-mapping-item q-mb-xs"
            >
              <q-chip size="sm" color="grey-3" text-color="dark" class="q-mr-sm">
                {{ templateField }}
              </q-chip>
              <q-icon name="arrow_forward" size="xs" class="q-mx-sm" />
              <q-chip size="sm" color="primary" text-color="white">
                {{ formField }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { firestoreService } from '../../services/firebase-firestore.service';
import type { CanvaTemplateConfig } from '../../services/canva/types';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';

// Component props
interface Props {
  modelValue?: string | undefined; // Selected template ID
  contentType?: string | undefined; // Filter templates by content type
}

// Component emits
interface Emits {
  (e: 'update:modelValue', value: string | undefined): void;
  (e: 'template-selected', template: CanvaTemplateConfig): void;
  (e: 'template-cleared'): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const $q = useQuasar();

// Reactive state
const templates = ref<CanvaTemplateConfig[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed properties
const selectedTemplateId = computed(() => props.modelValue);

const selectedTemplate = computed(() => {
  return templates.value.find(template => template.id === selectedTemplateId.value);
});

// Methods

/**
 * Load available templates from Firestore
 */
async function loadTemplates(): Promise<void> {
  try {
    isLoading.value = true;
    error.value = null;

    logger.debug('Loading Canva templates from Firestore config');

    // Get templates from the admin config document
    const configData = await firestoreService.getDocument('app/config');
    const canvaTemplates = configData?.canvaTemplates as CanvaTemplateConfig[] || [];

    // Filter by content type if specified
    templates.value = props.contentType
      ? canvaTemplates.filter(template =>
          !template.contentTypes || template.contentTypes.includes(props.contentType!)
        )
      : canvaTemplates;

    // Filter only active templates
    templates.value = templates.value.filter(template => template.isActive !== false);

    logger.info(`Loaded ${templates.value.length} Canva templates`, {
      contentType: props.contentType,
      totalTemplates: canvaTemplates.length,
      filteredTemplates: templates.value.length
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    error.value = t(TRANSLATION_KEYS.CANVA.LOAD_TEMPLATES_ERROR, { error: errorMessage });
    logger.error('Error loading Canva templates:', err);

    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

/**
 * Select a template
 */
function selectTemplate(template: CanvaTemplateConfig): void {
  if (!template.isActive) {
    $q.notify({
      type: 'warning',
      message: t(TRANSLATION_KEYS.CANVA.TEMPLATE_INACTIVE_WARNING),
      position: 'top',
    });
    return;
  }

  logger.debug('Template selected:', {
    templateId: template.id,
    templateName: template.name,
    fieldMapping: template.fieldMapping
  });

  emit('update:modelValue', template.id);
  emit('template-selected', template);

  $q.notify({
    type: 'positive',
    message: t(TRANSLATION_KEYS.CANVA.TEMPLATE_SELECTED, { name: template.name }),
    position: 'top',
  });
}

/**
 * Clear template selection
 */
function clearSelection(): void {
  logger.debug('Template selection cleared');

  emit('update:modelValue', undefined);
  emit('template-cleared');
}

// Lifecycle
onMounted(() => {
  void loadTemplates();
});
</script>

<style scoped>
.template-card {
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.template-card:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-card.selected {
  border-color: var(--q-primary);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.template-card.disabled {
  cursor: not-allowed;
}

.template-placeholder {
  border: 2px dashed #e0e0e0;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.field-mapping-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.selected-template-info {
  border-left: 4px solid var(--q-primary);
}

.line-height-sm {
  line-height: 1.3;
}
</style>
