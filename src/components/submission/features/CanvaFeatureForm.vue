<template>
  <div class="canva-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="design_services" class="q-mr-sm" />
      {{ $t('features.canva.label') }}
    </div>

    <!-- Info Card -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-start">
          <q-icon name="info" size="md" class="text-info q-mr-md q-mt-xs" />
          <div>
            <div class="text-subtitle2 q-mb-sm">{{ $t('features.canva.infoTitle') }}</div>
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ $t('features.canva.infoDescription') }}
            </p>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-gutter-md">
      <!-- Design ID Input -->
      <q-input
        v-model="localCanvaFeature.designId"
        :label="$t('features.canva.designId')"
        :hint="$t('features.canva.designIdHint')"
        filled
        :rules="[required]"
        maxlength="50"
      />

      <!-- Edit URL Input -->
      <q-input
        v-model="localCanvaFeature.editUrl"
        :label="$t('features.canva.editUrl')"
        :hint="$t('features.canva.editUrlHint')"
        filled
        :rules="[required, urlValidation]"
        type="url"
      />

      <!-- Export URL Input (Optional) -->
      <q-input
        v-model="localCanvaFeature.exportUrl"
        :label="$t('features.canva.exportUrl')"
        :hint="$t('features.canva.exportUrlHint')"
        filled
        :rules="[optionalUrlValidation]"
        type="url"
      />

      <!-- Action Buttons -->
      <div class="row q-gutter-sm">
        <q-btn
          v-if="localCanvaFeature.editUrl"
          :label="$t('features.canva.openInCanva')"
          color="primary"
          outline
          icon="open_in_new"
          @click="openEditUrl"
          class="q-px-lg"
        />

        <q-btn
          v-if="localCanvaFeature.exportUrl"
          :label="$t('features.canva.downloadExport')"
          color="secondary"
          outline
          icon="download"
          @click="downloadExport"
          class="q-px-lg"
        />
      </div>

      <!-- Preview Section -->
      <div v-if="isValid" class="canva-preview q-mt-md">
        <div class="text-subtitle2 q-mb-sm">{{ $t('features.canva.preview') }}</div>
        <q-card flat bordered>
          <q-card-section>
            <div class="row q-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ $t('features.canva.designId') }}</div>
                <div class="text-body2">{{ localCanvaFeature.designId }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ $t('features.canva.status') }}</div>
                <div class="text-body2">
                  <q-chip
                    :color="localCanvaFeature.exportUrl ? 'positive' : 'warning'"
                    text-color="white"
                    size="sm"
                  >
                    {{ localCanvaFeature.exportUrl ? $t('features.canva.exported') : $t('features.canva.inProgress') }}
                  </q-chip>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Types
interface CanvaFeature {
  designId: string;
  editUrl: string;
  exportUrl?: string;
}

interface Props {
  canvaFeature?: CanvaFeature;
}

interface Emits {
  (e: 'update:canvaFeature', value: CanvaFeature): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

// Local state
const localCanvaFeature = ref<CanvaFeature>({
  designId: '',
  editUrl: '',
  exportUrl: ''
});

// Validation rules
const required = (val: string) => !!val || t('forms.validation.required', { field: t('forms.required') });

const urlValidation = (val: string) => {
  if (!val) return true;
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:' || t('forms.validation.invalidFormat', { field: 'URL' });
  } catch {
    return t('forms.validation.invalidFormat', { field: 'URL' });
  }
};

const optionalUrlValidation = (val: string) => {
  if (!val) return true;
  return urlValidation(val);
};

// Computed properties
const isValid = computed(() => {
  return localCanvaFeature.value.designId &&
         localCanvaFeature.value.editUrl &&
         urlValidation(localCanvaFeature.value.editUrl) === true;
});

// Methods
const openEditUrl = () => {
  if (localCanvaFeature.value.editUrl) {
    window.open(localCanvaFeature.value.editUrl, '_blank');
  }
};

const downloadExport = () => {
  if (localCanvaFeature.value.exportUrl) {
    window.open(localCanvaFeature.value.exportUrl, '_blank');
  }
};

// Watchers
watch(
  localCanvaFeature,
  (newValue) => {
    if (isValid.value) {
      emit('update:canvaFeature', { ...newValue });
    }
  },
  { deep: true }
);

// Initialize from prop
watch(
  () => props.canvaFeature,
  (newFeature) => {
    if (newFeature) {
      localCanvaFeature.value = { ...newFeature };
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.canva-feature-form {
  .canva-preview {
    border-radius: 8px;
  }
}
</style>
