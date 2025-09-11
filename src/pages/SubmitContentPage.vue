<template>
  <q-page class="content-submission-page q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Header Section -->
        <div class="q-mb-lg">
          <h1 class="text-h4 text-weight-light q-mb-md">{{ $t('pages.contentSubmission.title') }}</h1>
          <p class="text-body1 text-grey-7">{{ $t('pages.contentSubmission.subtitle') }}</p>
        </div>

        <!-- Progress Stepper -->
        <q-stepper
          v-model="currentStep"
          ref="stepper"
          color="primary"
          animated
          flat
          class="bg-transparent"
        >
          <!-- Step 1: Content Type Selection -->
          <q-step
            :name="1"
            :title="$t('content.submission.steps.contentType.title')"
            icon="category"
            :done="currentStep > 1"
            :header-nav="currentStep > 1"
          >
            <ContentTypeStep
              v-model:selected-type="wizardState.contentType"
              @next="handleNext"
            />
          </q-step>

          <!-- Step 2: Basic Information -->
          <q-step
            :name="2"
            :title="$t('content.submission.steps.basicInfo.title')"
            icon="edit"
            :done="currentStep > 2"
            :header-nav="currentStep > 2"
          >
            <BasicInfoStep
              v-model:title="wizardState.basicData.title"
              v-model:description="wizardState.basicData.description"
              :content-type="wizardState.contentType"
              @next="handleNext"
              @back="handleBack"
            />
          </q-step>

          <!-- Step 3: Features Configuration -->
          <q-step
            :name="3"
            :title="$t('content.submission.steps.features.title')"
            icon="tune"
            :done="currentStep > 3"
            :header-nav="currentStep > 3"
          >
            <FeaturesStep
              v-model:features="wizardState.features"
              :content-type="wizardState.contentType"
              @next="handleNext"
              @back="handleBack"
              @initializing-feature="handleInitializingFeature"
              @feature-initialized="handleFeatureInitialized"
            />
          </q-step>

          <!-- Step 4: Preview & Submit -->
          <q-step
            :name="4"
            :title="$t('content.submission.steps.preview.title')"
            icon="preview"
          >
            <PreviewStep
              :preview-content="previewContentDoc"
              :is-submitting="isSubmitting"
              @submit="handleSubmit"
              @back="handleBack"
            />
          </q-step>
        </q-stepper>

        <!-- Auto-save Indicator -->
        <div
          v-if="autoSaveStatus !== 'idle'"
          class="fixed-bottom-right q-ma-md"
        >
          <q-chip
            :color="autoSaveStatus === 'saving' ? 'orange' : 'positive'"
            text-color="white"
            :icon="autoSaveStatus === 'saving' ? 'sync' : 'check'"
            class="animate-fade-in"
          >
            {{ $t(`content.submission.autoSave.${autoSaveStatus}`) }}
          </q-chip>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';
import { contentSubmissionService } from '../services/content-submission.service';
import {
  createContentDoc,
  type ContentFeatures
} from '../types/core/content.types';

// Import step components
import ContentTypeStep from '../components/submission/ContentTypeStep.vue';
import BasicInfoStep from '../components/submission/BasicInfoStep.vue';
import FeaturesStep from '../components/submission/FeaturesStep.vue';
import PreviewStep from '../components/submission/PreviewStep.vue';

// Composables
const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

// State
const currentStep = ref(1);
const stepper = ref();
const isSubmitting = ref(false);
const autoSaveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
const draftId = ref<string | null>(null);
const isSaving = ref(false); // Prevent recursive saves
const isInitializingFeatures = ref(false); // Prevent auto-save during feature initialization

// Wizard state
const wizardState = ref({
  contentType: null as string | null,
  basicData: {
    title: '',
    description: ''
  },
  features: {} as Partial<ContentFeatures>
});

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null;

// Computed preview content
const previewContentDoc = computed(() => {
  if (!wizardState.value.contentType || !wizardState.value.basicData.title) {
    return null;
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    logger.warn('User not authenticated for content preview');
    return null;
  }

  try {
    const tags = [`content-type:${wizardState.value.contentType}`];

    const baseDoc = createContentDoc({
      title: wizardState.value.basicData.title,
      description: wizardState.value.basicData.description,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      tags,
      features: wizardState.value.features,
      status: 'draft'
    });

    // Add a temporary ID for preview purposes
    return {
      id: 'preview-temp-id',
      ...baseDoc
    };
  } catch (error) {
    logger.error('Failed to create preview content doc', error);
    return null;
  }
});

// Auto-save functionality
const saveAsDraft = async () => {
  // Comprehensive guard against recursive calls
  if (!previewContentDoc.value || isSaving.value || isSubmitting.value) {
    logger.debug('Skipping saveAsDraft: guard conditions not met', {
      hasPreviewDoc: !!previewContentDoc.value,
      isSaving: isSaving.value,
      isSubmitting: isSubmitting.value
    });
    return;
  }

  try {
    isSaving.value = true;
    autoSaveStatus.value = 'saving';

    logger.debug('Starting auto-save operation');

    // Filter out incomplete features for draft saving
    const validFeatures: Record<string, unknown> = {};

    // Only include location feature if it has an address
    if (wizardState.value.features['feat:location']) {
      const locationFeature = wizardState.value.features['feat:location'] as { address?: string };
      if (locationFeature.address && locationFeature.address.trim().length > 0) {
        validFeatures['feat:location'] = wizardState.value.features['feat:location'];
      }
    }

    // Only include task feature if it has required fields
    if (wizardState.value.features['feat:task']) {
      const taskFeature = wizardState.value.features['feat:task'] as { category?: string; qty?: number; unit?: string };
      if (taskFeature.category && taskFeature.qty && taskFeature.qty > 0 && taskFeature.unit) {
        validFeatures['feat:task'] = wizardState.value.features['feat:task'];
      }
    }

    // Include date feature if present (less strict validation for dates)
    if (wizardState.value.features['feat:date']) {
      validFeatures['feat:date'] = wizardState.value.features['feat:date'];
    }

    // Include canva feature if present
    if (wizardState.value.features['integ:canva']) {
      validFeatures['integ:canva'] = wizardState.value.features['integ:canva'];
    }

    if (draftId.value) {
      // Update existing draft
      logger.debug('Updating existing draft', { draftId: draftId.value });
      // TODO: Implement update draft method in service
    } else {
      // Create new draft with filtered features
      const id = await contentSubmissionService.createContent(
        previewContentDoc.value.title,
        previewContentDoc.value.description,
        wizardState.value.contentType!,
        validFeatures,
        []
      );
      draftId.value = id;
      logger.debug('Created new draft', { draftId: id });
    }

    autoSaveStatus.value = 'saved';

    // Hide saved indicator after 3 seconds
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') {
        autoSaveStatus.value = 'idle';
      }
    }, 3000);
  } catch (error) {
    logger.error('Failed to auto-save draft', error);
    autoSaveStatus.value = 'idle';
  } finally {
    isSaving.value = false;
  }
};

const debouncedAutoSave = () => {
  // Don't trigger auto-save if already saving or submitting
  if (isSaving.value || isSubmitting.value) {
    logger.debug('Skipping auto-save: operation in progress');
    return;
  }

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(() => {
    // Double-check the saving state before actually saving
    if (wizardState.value.basicData.title.trim() && !isSaving.value && !isSubmitting.value) {
      void saveAsDraft();
    } else {
      logger.debug('Skipping auto-save: conditions not met', {
        hasTitle: !!wizardState.value.basicData.title.trim(),
        isSaving: isSaving.value,
        isSubmitting: isSubmitting.value
      });
    }
  }, 2000); // 2 second debounce
};

// Navigation handlers
const handleNext = () => {
  stepper.value?.next();
};

const handleBack = () => {
  stepper.value?.previous();
};

// Feature initialization handlers
const handleInitializingFeature = () => {
  isInitializingFeatures.value = true;
};

const handleFeatureInitialized = () => {
  isInitializingFeatures.value = false;
};

const handleSubmit = async () => {
  if (!previewContentDoc.value) {
    $q.notify({
      type: 'negative',
      message: t('submission.errors.invalidContent')
    });
    return;
  }

  try {
    isSubmitting.value = true;

    const contentId = await contentSubmissionService.createContent(
      previewContentDoc.value.title,
      previewContentDoc.value.description,
      wizardState.value.contentType!,
      wizardState.value.features,
      []
    );

    logger.success('Content submitted successfully', { contentId });

    $q.notify({
      type: 'positive',
      message: t('submission.success.submitted'),
      timeout: 5000
    });

    // Navigate to content management or success page
    await router.push('/admin/content');
  } catch (error) {
    logger.error('Failed to submit content', error);
    $q.notify({
      type: 'negative',
      message: t('submission.errors.submitFailed')
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Watchers for auto-save
watch(
  () => wizardState.value.basicData,
  () => {
    // Don't trigger auto-save if we're currently saving, submitting, or initializing features
    if (!isSaving.value && !isSubmitting.value && !isInitializingFeatures.value) {
      debouncedAutoSave();
    }
  },
  { deep: true }
);

watch(
  () => wizardState.value.features,
  () => {
    // Don't trigger auto-save if we're currently saving, submitting, or initializing features
    if (!isSaving.value && !isSubmitting.value && !isInitializingFeatures.value) {
      debouncedAutoSave();
    }
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  logger.debug('Content submission page mounted');
});

onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
});
</script>

<style lang="scss" scoped>
.content-submission-page {
  margin: 0 auto;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
