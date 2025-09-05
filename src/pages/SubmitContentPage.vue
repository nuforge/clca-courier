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
          <q-breadcrumbs-el label="Home" to="/" />
          <q-breadcrumbs-el label="Contribute" to="/contribute" />
          <q-breadcrumbs-el :label="contentTypeLabel" />
        </q-breadcrumbs>
      </div>

      <!-- Quick Mode Banner (for quick photo upload) -->
      <q-banner v-if="isQuickMode" class="bg-info text-white q-mb-lg" rounded>
        <template v-slot:avatar>
          <q-icon name="mdi-flash" />
        </template>
        <div class="text-subtitle1">Quick Upload Mode</div>
        <div class="text-caption">Streamlined submission for quick photo sharing</div>
      </q-banner>

      <!-- Success State -->
      <div v-if="submissionSuccess" class="success-state text-center q-pa-xl">
        <q-icon name="check_circle" size="4em" color="positive" class="q-mb-md" />
        <h4 class="q-mt-none q-mb-md">Content Submitted Successfully!</h4>
        <p class="text-grey-7 q-mb-lg">
          Thank you for your submission. Our editorial team will review your content and
          provide feedback within 3-5 business days.
        </p>
        <div class="row justify-center q-gutter-md">
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
        <h5 class="q-mt-none q-mb-md">Need Help?</h5>

        <div class="row q-gutter-lg">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="article" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">Content Guidelines</div>
                  <p class="text-caption text-grey-7">
                    Learn about our content standards and best practices for submissions.
                  </p>
                  <q-btn color="primary" outline size="sm" label="View Guidelines" @click="showGuidelines = true" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="image" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">Image Hosting</div>
                  <p class="text-caption text-grey-7">
                    Best practices for hosting images externally to keep costs low.
                  </p>
                  <q-btn color="primary" outline size="sm" label="Image Guide" @click="showImageGuide = true" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="help-card">
              <q-card-section>
                <div class="text-center">
                  <q-icon name="support" size="2em" color="primary" class="q-mb-sm" />
                  <div class="text-h6 q-mb-sm">Get Support</div>
                  <p class="text-caption text-grey-7">
                    Contact our editorial team if you need assistance with your submission.
                  </p>
                  <q-btn color="primary" outline size="sm" label="Contact Us"
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ContentSubmissionForm from '../components/contribution/ContentSubmissionForm.vue';
import FirebaseDebugPanel from '../components/contribution/FirebaseDebugPanel.vue';
import type { ContentType } from '../types/core/content.types';

const router = useRouter();
const route = useRoute();

// Reactive state
const submissionSuccess = ref(false);
const showGuidelines = ref(false);
const showImageGuide = ref(false);
const submittedContentId = ref<string | null>(null);

// URL parameters
const initialContentType = computed<ContentType | undefined>(() => {
  const type = route.query.type as string;
  // Map URL parameter values to actual ContentType values
  switch (type) {
    case 'article': return 'article';
    case 'photo': return 'photo_story';
    case 'event': return 'event';
    case 'suggestion': return 'announcement'; // Map suggestions to announcements
    default: return undefined;
  }
});

const isQuickMode = computed(() => route.query.mode === 'quick');

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
    case 'suggestion': return 'Share Ideas';
    default: return 'Submit Content';
  }
});

const pageTitle = computed(() => {
  if (isQuickMode.value) {
    return 'Quick Photo Upload';
  }
  return contentTypeLabel.value;
});

const pageDescription = computed(() => {
  const urlType = route.query.type as string;
  switch (urlType) {
    case 'article':
      return 'Share your stories, experiences, or community insights with detailed articles and rich content.';
    case 'photo':
      return isQuickMode.value
        ? 'Quickly upload and share photos with the community.'
        : 'Submit curated photo collections with detailed descriptions and context.';
    case 'event':
      return 'Promote community events, meetings, or activities to keep everyone informed.';
    case 'suggestion':
      return 'Share your ideas for improving The Courier or our community.';
    default:
      return 'Share your stories, events, projects, and announcements with the CLCA community. All submissions are reviewed by our editorial team before publication.';
  }
});

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

// Lifecycle
onMounted(() => {
  // Any initialization needed based on URL parameters
  console.log('SubmitContentPage mounted with:', {
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
</style>
