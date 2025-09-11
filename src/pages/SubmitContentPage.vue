<template>
  <q-page class="submit-content-page">
    <div class="container q-pa-md">
      <!-- Page Header -->
      <div class="page-header q-mb-xl">
        <h3 class="page-title q-mt-none q-mb-md">
          {{ pageTitle }}
        </h3>
        <p class="page-description text-grey-7">
          {{ pageDescription }}
        </p>

        <!-- Breadcrumb Navigation -->
        <q-breadcrumbs class="q-mt-md">
          <q-breadcrumbs-el :label="t(TRANSLATION_KEYS.NAVIGATION.HOME)" to="/" />
          <q-breadcrumbs-el :label="t(TRANSLATION_KEYS.NAVIGATION.CONTRIBUTE)" to="/contribute" />
          <q-breadcrumbs-el :label="contentTypeLabel" />
        </q-breadcrumbs>
      </div>

      <!-- Quick Mode Banner (for quick photo upload) -->
      <q-banner v-if="isQuickMode" class="bg-info text-white q-mb-lg" rounded>
        <template v-slot:avatar>
          <q-icon name="mdi-flash" />
        </template>
        <div class="text-subtitle1">{{ t('content.quickUpload') || 'Quick Upload Mode' }}</div>
        <div class="text-caption">{{ t('content.quickUploadDescription') || 'Streamlined submission for quick sharing' }}</div>
      </q-banner>

      <!-- Guided Mode Banner -->
      <q-banner v-if="isGuidedMode" class="bg-primary text-white q-mb-lg" rounded>
        <template v-slot:avatar>
          <q-icon name="mdi-map" />
        </template>
        <div class="text-subtitle1">{{ t('content.guidedSubmission') || 'Guided Submission Process' }}</div>
        <div class="text-caption">{{ t('content.guidedSubmissionDescription') || "You're following our step-by-step guide for the best results" }}</div>
        <template v-slot:action>
          <q-btn
            flat
            color="white"
            :label="t('content.backToGuide') || 'Back to Guide'"
            @click="() => router.push('/contribute')"
            size="sm"
          />
        </template>
      </q-banner>

      <!-- Canva Integration Banner -->
      <q-banner v-if="hasCanvaTemplates && !submissionSuccess" class="bg-deep-purple-1 text-deep-purple-9 q-mb-lg" rounded>
        <template v-slot:avatar>
          <q-icon name="mdi-palette" color="deep-purple" />
        </template>
        <div class="text-subtitle1">{{ $t(TRANSLATION_KEYS.CANVA.DESIGN_WITH_TEMPLATES) || 'Professional Design Templates Available' }}</div>
        <div class="text-caption">
          {{ $t(TRANSLATION_KEYS.CANVA.TEMPLATES_AVAILABLE_MESSAGE) || 'Create professional designs automatically using our Canva brand templates' }}
        </div>
        <template v-slot:action>
          <q-btn
            flat
            color="deep-purple"
            :label="$t(TRANSLATION_KEYS.CANVA.LEARN_MORE) || 'Learn More'"
            @click="showCanvaInfo = true"
            size="sm"
          />
        </template>
      </q-banner>      <!-- Success State -->
      <div v-if="submissionSuccess" class="success-state text-center q-pa-xl">
        <q-icon name="check_circle" size="4em" color="positive" class="q-mb-md" />
        <h4 class="q-mt-none q-mb-md">{{ t(TRANSLATION_KEYS.SUCCESS.CONTENT_SUBMITTED) || 'Content Submitted Successfully!' }}</h4>
        <p class="text-grey-7 q-mb-lg">
          Thank you for your submission. Our editorial team will review your content and
          provide feedback within 3-5 business days.
        </p>
        <div class="row justify-center ">
          <q-btn color="primary" label="Submit Another" @click="resetForm" />
          <q-btn color="grey-7" outline label="Back to Contribute" to="/contribute" />
        </div>
      </div>

      <!-- Submission Form -->
      <div v-else class="submission-form">
        <ContentSubmissionForm @submitted="onSubmissionSuccess" @cancelled="onFormCancel"
          v-bind="initialContentType ? { initialType: initialContentType } : {}" :quick-mode="isQuickMode" />
      </div>

      <!-- Debug Panel (development only) -->
      <div v-if="showDebugPanel" class="debug-section q-mt-xl">
        <q-separator class="q-mb-lg" />
        <q-expansion-item icon="bug_report" label="Debug Panel (Development)">
          <FirebaseDebugPanel />
        </q-expansion-item>
      </div>

      <!-- Help Section -->
      <div class="help-section q-mt-xl">
        <q-separator class="q-mb-lg" />
        <h5 class="q-mt-none q-mb-md">{{ t(TRANSLATION_KEYS.CONTENT.NEED_HELP) || 'Need Help?' }}</h5>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4 q-pa-md">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="article" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CONTENT.CONTENT_GUIDELINES) || 'Content Guidelines' }}</div>
                  <p class="text-caption text-grey-7">
                    {{ t(TRANSLATION_KEYS.CONTENT.GUIDELINES_DESCRIPTION) || 'Learn about our content standards and best practices for submissions.' }}
                  </p>
                  <q-btn color="primary" outline size="sm" :label="t(TRANSLATION_KEYS.CONTENT.VIEW_GUIDELINES) || 'View Guidelines'" @click="showGuidelines = true" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4 q-pa-md">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="image" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CONTENT.IMAGE_HOSTING) || 'Image Hosting' }}</div>
                  <p class="text-caption text-grey-7">
                    {{ t(TRANSLATION_KEYS.CONTENT.IMAGE_HOSTING_DESCRIPTION) || 'Best practices for hosting images externally to keep costs low.' }}
                  </p>
                  <q-btn color="primary" outline size="sm" :label="t(TRANSLATION_KEYS.CONTENT.IMAGE_GUIDE) || 'Image Guide'" @click="showImageGuide = true" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4 q-pa-md">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="support" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CONTENT.GET_SUPPORT) || 'Get Support' }}</div>
                  <p class="text-caption text-grey-7">
                    {{ t(TRANSLATION_KEYS.CONTENT.SUPPORT_DESCRIPTION) || 'Contact our editorial team if you need assistance with your submission.' }}
                  </p>
                  <q-btn color="primary" outline size="sm" :label="t(TRANSLATION_KEYS.NAVIGATION.CONTACT)"
                    href="mailto:editor@conashaughlakes.com" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Content Guidelines Dialog -->
      <q-dialog v-model="showGuidelines" max-width="800px">
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Content Guidelines</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="guidelines-content">
              <h6>Content Standards</h6>
              <ul>
                <li>Keep content family-friendly and appropriate for all ages</li>
                <li>Focus on topics relevant to the CLCA community</li>
                <li>Provide accurate and verified information</li>
                <li>Respect privacy and avoid sharing personal information without consent</li>
                <li>Use clear, engaging writing that serves the community</li>
              </ul>

              <h6>Submission Process</h6>
              <ol>
                <li><strong>Submit:</strong> Fill out the form with your content</li>
                <li><strong>Review:</strong> Editorial team reviews for quality and appropriateness</li>
                <li><strong>Feedback:</strong> Receive feedback or approval within 3-5 business days
                </li>
                <li><strong>Revise:</strong> Make any requested changes if needed</li>
                <li><strong>Publish:</strong> Approved content is included in the next newsletter</li>
              </ol>

              <h6>Content Types</h6>
              <ul>
                <li><strong>Articles:</strong> Stories, experiences, informational pieces</li>
                <li><strong>Events:</strong> Community gatherings, meetings, activities</li>
                <li><strong>Projects:</strong> Community improvements, volunteer initiatives</li>
                <li><strong>Announcements:</strong> Important community notices</li>
                <li><strong>Classifieds:</strong> Items for sale, services offered, housing</li>
                <li><strong>Photo Stories:</strong> Visual narratives about community life</li>
              </ul>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Image Guide Dialog -->
      <q-dialog v-model="showImageGuide" max-width="700px">
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Image Hosting Guide</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="image-guide-content">
              <p class="text-subtitle2 text-primary q-mb-md">
                We recommend external image hosting to keep the newsletter cost-effective while
                maintaining high quality.
              </p>

              <h6>Recommended Services</h6>

              <div class="service-section q-mb-md">
                <div class="text-weight-medium">Google Photos (Recommended)</div>
                <ul class="q-mt-xs">
                  <li>Free with Google account</li>
                  <li>Easy sharing and high quality</li>
                  <li>Mobile app available</li>
                  <li>Automatic backup from phone</li>
                </ul>
              </div>

              <div class="service-section q-mb-md">
                <div class="text-weight-medium">Google Drive</div>
                <ul class="q-mt-xs">
                  <li>Good for document attachments</li>
                  <li>Easy permission management</li>
                  <li>Works with any file type</li>
                </ul>
              </div>

              <h6>Image Quality Tips</h6>
              <ul>
                <li>Use high resolution for print quality (300 DPI preferred)</li>
                <li>Keep file sizes reasonable (under 10MB each)</li>
                <li>Use JPEG format for photos, PNG for graphics</li>
                <li>Include descriptive captions for accessibility</li>
              </ul>

              <h6>Troubleshooting</h6>
              <ul>
                <li>If image doesn't load, check sharing permissions</li>
                <li>Test URLs in a private browser window</li>
                <li>Contact us if you need help with hosting setup</li>
              </ul>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Canva Integration Info Dialog -->
      <q-dialog v-model="showCanvaInfo" max-width="800px">
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 flex items-center">
              <q-icon name="mdi-palette" color="deep-purple" class="q-mr-sm" />
              {{ $t(TRANSLATION_KEYS.CANVA.DESIGN_WITH_TEMPLATES) }}
            </div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="canva-info-content">
              <p class="text-subtitle2 text-deep-purple q-mb-md">
                {{ $t(TRANSLATION_KEYS.CANVA.TEMPLATES_AVAILABLE_MESSAGE) }}
              </p>

              <h6>How Template-Based Design Works</h6>
              <ol>
                <li><strong>Select a Template:</strong> Choose from our professionally designed Canva brand templates</li>
                <li><strong>Auto-Fill Content:</strong> Your form data automatically populates the template fields</li>
                <li><strong>Professional Results:</strong> Get publication-ready designs without design experience</li>
                <li><strong>Edit if Needed:</strong> Fine-tune the design in Canva before finalizing</li>
              </ol>

              <h6>Template Features</h6>
              <ul>
                <li><strong>Brand Consistent:</strong> All templates follow CLCA brand guidelines</li>
                <li><strong>Field Mapping:</strong> Your content automatically fills the right places</li>
                <li><strong>Multiple Formats:</strong> Optimized for print and digital distribution</li>
                <li><strong>Professional Quality:</strong> Designed by professionals for community content</li>
              </ul>

              <div v-if="availableTemplates.length > 0" class="q-mt-md">
                <h6>Available Templates</h6>
                <div class="template-preview-grid row q-gutter-sm">
                  <div
                    v-for="template in availableTemplates.slice(0, 4)"
                    :key="template.id"
                    class="col-12 col-sm-6 col-md-3"
                  >
                    <q-card flat bordered class="template-preview-card">
                      <q-img
                        v-if="template.thumbnailUrl"
                        :src="template.thumbnailUrl"
                        :alt="template.name"
                        height="80px"
                        fit="cover"
                      />
                      <div v-else class="template-placeholder flex flex-center" style="height: 80px; background: #f5f5f5;">
                        <q-icon name="image" size="1.5em" color="grey-5" />
                      </div>
                      <q-card-section class="q-pa-sm">
                        <div class="text-caption text-weight-medium">{{ template.name }}</div>
                        <div class="text-caption text-grey-7" style="font-size: 0.7rem;">
                          {{ template.description || 'Professional template' }}
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
                <div v-if="availableTemplates.length > 4" class="text-center q-mt-sm">
                  <div class="text-caption text-grey-7">
                    +{{ availableTemplates.length - 4 }} more templates available
                  </div>
                </div>
              </div>

              <div class="q-mt-md q-pa-md" style="background: rgba(121, 85, 72, 0.1); border-radius: 8px;">
                <div class="text-weight-medium q-mb-xs">Getting Started:</div>
                <div class="text-caption">
                  Simply fill out your content form below, and look for the template selection section before creating your design.
                  The system will guide you through choosing the right template for your content type.
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import ContentSubmissionForm from '../components/contribution/ContentSubmissionForm.vue';
import FirebaseDebugPanel from '../components/contribution/FirebaseDebugPanel.vue';
import { firestoreService } from '../services/firebase-firestore.service';
import type { ContentType } from '../types/core/content.types';
import type { CanvaTemplateConfig } from '../services/canva/types';
import { logger } from '../utils/logger';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// Reactive state
const submissionSuccess = ref(false);
const showGuidelines = ref(false);
const showImageGuide = ref(false);
const showCanvaInfo = ref(false);
const submittedContentId = ref<string | null>(null);
const availableTemplates = ref<CanvaTemplateConfig[]>([]);

// URL parameters
const initialContentType = computed<ContentType | undefined>(() => {
  const type = route.query.type as string;
  // Map URL parameter values to actual ContentType values
  switch (type) {
    case 'article': return 'article';
    case 'photo': return 'photo_story';
    case 'event': return 'event';
    case 'announcement': return 'announcement';
    case 'classified': return 'classified';
    default: return undefined;
  }
});

const isQuickMode = computed(() => route.query.mode === 'quick');
const isGuidedMode = computed(() => route.query.guided === 'true');

const showDebugPanel = computed(() => {
  // Show debug panel in development or when explicitly requested
  return process.env.NODE_ENV === 'development' || route.query.debug === 'true';
});

// Page content based on content type
const contentTypeLabel = computed(() => {
  const urlType = route.query.type as string;
  switch (urlType) {
    case 'article': return 'Submit Article';
    case 'photo': return isQuickMode.value ? 'Quick Photo Upload' : 'Submit Photos';
    case 'event': return 'Post Event';
    case 'announcement': return 'Share Community News';
    case 'classified': return 'Post Classified Ad';
    default: return 'Submit Content';
  }
});

const pageTitle = computed(() => {
  if (isQuickMode.value) {
    return `Quick ${route.query.type === 'photo' ? 'Photo Upload' : 'Submission'}`;
  }
  if (isGuidedMode.value) {
    return `Guided ${contentTypeLabel.value}`;
  }
  return contentTypeLabel.value;
});

const pageDescription = computed(() => {
  const urlType = route.query.type as string;
  const baseDescriptions: Record<string, string> = {
    article: 'Share your stories, experiences, or community insights with detailed articles and rich content.',
    photo: isQuickMode.value
      ? 'Quickly upload and share photos with the community.'
      : 'Submit curated photo collections with detailed descriptions and context.',
    event: 'Promote community events, meetings, or activities to keep everyone informed.',
    announcement: 'Share important community news, updates, or general announcements.',
    classified: 'Post items for sale, services offered, wanted items, or free giveaways.',
  };

  const description = baseDescriptions[urlType] || 'Share your content with the CLCA community. All submissions are reviewed by our editorial team before publication.';

  if (isGuidedMode.value) {
    return `${description} You're using our guided submission process for the best results.`;
  }

  return description;
});

// Canva-related computed properties
const hasCanvaTemplates = computed(() => availableTemplates.value.length > 0);

// Event handlers
function onSubmissionSuccess(contentId: string) {
  submittedContentId.value = contentId;
  submissionSuccess.value = true;

  // Scroll to top to show success message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onFormCancel() {
  void router.push('/contribute');
}

function resetForm() {
  submissionSuccess.value = false;
  submittedContentId.value = null;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load available Canva templates
async function loadCanvaTemplates(): Promise<void> {
  try {
    logger.debug('Loading Canva templates for content type filtering');

    const configData = await firestoreService.getDocument('app/config');
    const canvaTemplates = configData?.canvaTemplates as CanvaTemplateConfig[] || [];

    // Filter active templates only
    availableTemplates.value = canvaTemplates.filter(template => template.isActive !== false);

    logger.info(`Loaded ${availableTemplates.value.length} active Canva templates`);
  } catch (error) {
    logger.warn('Failed to load Canva templates:', error);
    // Don't show error to user as templates are optional
    availableTemplates.value = [];
  }
}

// Lifecycle
onMounted(() => {
  // Load available Canva templates
  void loadCanvaTemplates();

  // Any initialization needed based on URL parameters
  logger.debug('SubmitContentPage mounted with:', {
    contentType: initialContentType.value,
    quickMode: isQuickMode.value
  });
});
</script>

<style scoped>
.submit-content-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: var(--q-primary);
  font-weight: 600;
  font-size: 2.5rem;
  margin: 0;
}

.page-description {
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 800px;
}

.success-state {
  background: rgba(76, 175, 80, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 8px;
}

.help-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.help-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.guidelines-content h6 {
  color: var(--q-primary);
  font-weight: 600;
  margin: 1.5rem 0 0.8rem 0;
}

.guidelines-content h6:first-child {
  margin-top: 0;
}

.guidelines-content ul,
.guidelines-content ol {
  padding-left: 1.5rem;
  line-height: 1.6;
}

.guidelines-content li {
  margin: 0.5rem 0;
}

.image-guide-content h6 {
  color: var(--q-primary);
  font-weight: 600;
  margin: 1.5rem 0 0.8rem 0;
}

.image-guide-content h6:first-child {
  margin-top: 0;
}

.service-section {
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border-left: 3px solid var(--q-primary);
}

.service-section ul {
  margin: 0;
  padding-left: 1.5rem;
}

.service-section li {
  margin: 0.3rem 0;
}

/* Dark theme support */
.body--dark .service-section {
  background: rgba(255, 255, 255, 0.05);
}

.body--dark .success-state {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
}

/* Canva Integration Styles */
.canva-info-content h6 {
  color: var(--q-deep-purple);
  font-weight: 600;
  margin: 1.5rem 0 0.8rem 0;
}

.canva-info-content h6:first-child {
  margin-top: 0;
}

.canva-info-content ul,
.canva-info-content ol {
  padding-left: 1.5rem;
  line-height: 1.6;
}

.canva-info-content li {
  margin: 0.5rem 0;
}

.template-preview-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.template-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-preview-grid {
  max-height: 200px;
  overflow: hidden;
}
</style>
