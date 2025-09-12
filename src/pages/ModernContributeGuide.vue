<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Header Section -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <h1 class="text-h3 text-weight-light q-ma-none q-mb-sm">
                  {{ $t('pages.contributeGuide.title') }}
                </h1>
                <p class="text-body1 text-grey-7 q-ma-none">
                  {{ $t('pages.contributeGuide.subtitle') }}
                </p>
              </div>
              <div class="col-12 col-md-4 text-center">
                <q-btn
                  :to="'/contribute/submit'"
                  color="primary"
                  size="lg"
                  no-caps
                  :icon="UI_ICONS.documentPlus"
                  :label="$t('pages.contribute.quickSubmit')"
                  class="full-width"
                  :aria-label="$t('pages.contribute.quickSubmit')"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Quick Navigation -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h6 q-mb-md">Quick Navigation</h2>
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-3" v-for="(section, index) in navigationSections" :key="index">
                <q-btn
                  flat
                  no-caps
                  :icon="section.icon"
                  :label="section.label"
                  class="full-width"
                  @click="scrollToSection(section.id)"
                  :aria-label="`Navigate to ${section.label}`"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Process Overview -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-md items-center q-mb-md">
              <div class="col">
                <h2 class="text-h5 q-ma-none" id="process">
                  {{ $t('pages.contributeGuide.process') }}
                </h2>
              </div>
              <div class="col-auto">
                <q-icon :name="UI_ICONS.info" size="md" color="primary" />
              </div>
            </div>

            <div class="row q-col-gutter-lg">
              <div
                v-for="(step, index) in processSteps"
                :key="index"
                class="col-12 col-md-6 col-lg-4"
              >
                <div class="process-step">
                  <div class="row q-col-gutter-sm items-center q-mb-sm">
                    <div class="col-auto">
                      <q-avatar :color="step.color" text-color="white" size="md">
                        {{ index + 1 }}
                      </q-avatar>
                    </div>
                    <div class="col">
                      <h3 class="text-subtitle1 text-weight-medium q-ma-none">
                        {{ step.title }}
                      </h3>
                    </div>
                  </div>
                  <p class="text-body2 text-grey-7 q-ml-lg">
                    {{ step.description }}
                  </p>
                  <div v-if="step.tip" class="q-ml-lg">
                    <q-banner dense rounded class="bg-info text-white">
                      <template v-slot:avatar>
                        <q-icon :name="UI_ICONS.info" />
                      </template>
                      {{ step.tip }}
                    </q-banner>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Content Types -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="content-types">
              Content Types
            </h2>
            <p class="text-body2 text-grey-7 q-mb-lg">
              {{ $t('content.submission.steps.contentType.description') }}
            </p>

            <div class="row q-col-gutter-md">
              <div
                v-for="contentType in contentTypes"
                :key="contentType.type"
                class="col-12 col-md-6"
              >
                <q-card flat bordered class="full-height">
                  <q-card-section>
                    <div class="row q-col-gutter-sm items-center q-mb-sm">
                      <div class="col-auto">
                        <q-icon
                          :name="getContentIcon(contentType.type)"
                          size="lg"
                          :color="getContentTypeTheme(contentType.type).color"
                        />
                      </div>
                      <div class="col">
                        <h3 class="text-subtitle1 text-weight-medium q-ma-none">
                          {{ contentType.title }}
                        </h3>
                      </div>
                    </div>

                    <p class="text-body2 text-grey-7 q-mb-md">
                      {{ contentType.description }}
                    </p>

                    <div class="row q-col-gutter-xs q-mb-sm">
                      <div class="col-auto">
                        <q-chip
                          size="sm"
                          :color="contentType.difficultyColor"
                          text-color="white"
                          dense
                        >
                          {{ contentType.difficulty }}
                        </q-chip>
                      </div>
                      <div class="col-auto">
                        <q-chip size="sm" color="grey-3" text-color="grey-8" dense>
                          <q-icon :name="UI_ICONS.clock" size="xs" class="q-mr-xs" />
                          {{ contentType.timeEstimate }}
                        </q-chip>
                      </div>
                    </div>

                    <div class="q-mb-sm">
                      <p class="text-caption text-weight-medium q-mb-xs">
                        {{ $t('pages.contribute.requirements') }}:
                      </p>
                      <ul class="text-body2 text-grey-7 q-ma-none q-pl-md">
                        <li v-for="requirement in contentType.requirements" :key="requirement">
                          {{ requirement }}
                        </li>
                      </ul>
                    </div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      no-caps
                      :color="getContentTypeTheme(contentType.type).color"
                      :to="`/contribute/submit?type=${contentType.type}`"
                      :aria-label="`${$t('pages.contribute.quickSubmit')} ${contentType.title}`"
                    >
                      {{ $t('pages.contribute.quickSubmit') }}
                      <q-icon :name="UI_ICONS.chevronRight" right />
                    </q-btn>
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Guidelines -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="guidelines">
              {{ $t('pages.contributeGuide.guidelines') }}
            </h2>

            <div class="row q-col-gutter-lg">
              <!-- Positive Guidelines -->
              <div class="col-12 col-md-6">
                <q-card flat bordered class="full-height bg-positive-1">
                  <q-card-section>
                    <div class="row q-col-gutter-sm items-center q-mb-md">
                      <div class="col-auto">
                        <q-icon :name="UI_ICONS.checkCircle" size="md" color="positive" />
                      </div>
                      <div class="col">
                        <h3 class="text-subtitle1 text-weight-medium text-positive q-ma-none">
                          {{ $t('pages.contributeGuide.positiveGuidelines') }}
                        </h3>
                      </div>
                    </div>

                    <ul class="text-body2 q-ma-none q-pl-md">
                      <li v-for="guideline in positiveGuidelines" :key="guideline" class="q-mb-xs">
                        {{ guideline }}
                      </li>
                    </ul>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Negative Guidelines -->
              <div class="col-12 col-md-6">
                <q-card flat bordered class="full-height bg-negative-1">
                  <q-card-section>
                    <div class="row q-col-gutter-sm items-center q-mb-md">
                      <div class="col-auto">
                        <q-icon :name="UI_ICONS.error" size="md" color="negative" />
                      </div>
                      <div class="col">
                        <h3 class="text-subtitle1 text-weight-medium text-negative q-ma-none">
                          {{ $t('pages.contributeGuide.negativeGuidelines') }}
                        </h3>
                      </div>
                    </div>

                    <ul class="text-body2 q-ma-none q-pl-md">
                      <li v-for="guideline in negativeGuidelines" :key="guideline" class="q-mb-xs">
                        {{ guideline }}
                      </li>
                    </ul>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Quality Standards -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="quality">
              {{ $t('pages.contributeGuide.qualityStandards') }}
            </h2>

            <div class="row q-col-gutter-md">
              <div
                v-for="standard in qualityStandards"
                :key="standard.category"
                class="col-12 col-md-4"
              >
                <q-card flat bordered class="full-height">
                  <q-card-section>
                    <div class="row q-col-gutter-sm items-center q-mb-sm">
                      <div class="col-auto">
                        <q-icon :name="standard.icon" size="lg" :color="standard.color" />
                      </div>
                      <div class="col">
                        <h3 class="text-subtitle1 text-weight-medium q-ma-none">
                          {{ standard.category }}
                        </h3>
                      </div>
                    </div>

                    <ul class="text-body2 text-grey-7 q-ma-none q-pl-sm">
                      <li v-for="point in standard.points" :key="point" class="q-mb-xs">
                        {{ point }}
                      </li>
                    </ul>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Review Process -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="review">
              {{ $t('pages.contributeGuide.reviewPhases') }}
            </h2>

            <q-timeline layout="comfortable">
              <q-timeline-entry
                v-for="(phase, index) in reviewPhases"
                :key="index"
                :title="phase.title"
                :subtitle="phase.subtitle"
                :icon="phase.icon"
                :color="phase.color"
              >
                <div class="text-body2 text-grey-7">
                  {{ phase.description }}
                </div>
                <div v-if="phase.duration" class="text-caption text-grey-6 q-mt-xs">
                  <q-icon :name="UI_ICONS.clock" size="xs" class="q-mr-xs" />
                  {{ phase.duration }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>

        <!-- FAQ -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="faq">
              {{ $t('pages.contributeGuide.faq') }}
            </h2>

            <q-list separator>
              <q-expansion-item
                v-for="(faq, index) in faqs"
                :key="index"
                :label="faq.question"
                :header-class="'text-weight-medium'"
                expand-separator
              >
                <q-card>
                  <q-card-section>
                    <div class="text-body2 text-grey-7">
                      {{ faq.answer }}
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Help Resources -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md">{{ $t('pages.contribute.helpResources') }}</h2>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered class="full-height">
                  <q-card-section class="text-center">
                    <q-icon :name="UI_ICONS.fileMultiple" size="xl" color="primary" class="q-mb-sm" />
                    <h3 class="text-subtitle1 text-weight-medium q-ma-none q-mb-xs">
                      {{ $t('content.contentGuidelines') }}
                    </h3>
                    <p class="text-body2 text-grey-7 q-mb-md">
                      {{ $t('content.guidelinesDescription') }}
                    </p>
                    <q-btn
                      flat
                      color="primary"
                      :label="$t('content.viewGuidelines')"
                      no-caps
                      @click="scrollToSection('guidelines')"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="full-height">
                  <q-card-section class="text-center">
                    <q-icon :name="UI_ICONS.eye" size="xl" color="secondary" class="q-mb-sm" />
                    <h3 class="text-subtitle1 text-weight-medium q-ma-none q-mb-xs">
                      {{ $t('content.imageHosting') }}
                    </h3>
                    <p class="text-body2 text-grey-7 q-mb-md">
                      {{ $t('content.imageHostingDescription') }}
                    </p>
                    <q-btn
                      flat
                      color="secondary"
                      :label="$t('content.imageGuide')"
                      no-caps
                      href="https://support.google.com/photos/"
                      target="_blank"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="full-height">
                  <q-card-section class="text-center">
                    <q-icon :name="UI_ICONS.help" size="xl" color="accent" class="q-mb-sm" />
                    <h3 class="text-subtitle1 text-weight-medium q-ma-none q-mb-xs">
                      {{ $t('content.getSupport') }}
                    </h3>
                    <p class="text-body2 text-grey-7 q-mb-md">
                      {{ $t('content.supportDescription') }}
                    </p>
                    <q-btn
                      flat
                      color="accent"
                      label="Contact Us"
                      no-caps
                      :to="'/about'"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Call to Action -->
        <q-card flat :class="cardClasses" class="text-center">
          <q-card-section>
            <div class="row q-col-gutter-md justify-center items-center">
              <div class="col-12 col-md-8">
                <h2 class="text-h6 q-ma-none q-mb-sm">
                  {{ $t('pages.contribute.description') }}
                </h2>
                <p class="text-body2 text-grey-7 q-ma-none q-mb-md">
                  {{ $t('content.submission.subtitle') }}
                </p>
              </div>
              <div class="col-12 col-md-4">
                <q-btn
                  :to="'/contribute/submit'"
                  color="primary"
                  size="lg"
                  no-caps
                  :icon="UI_ICONS.create"
                  :label="$t('content.submission.title')"
                  class="full-width"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '../composables/useTheme';
import { useSiteThemeStore } from '../stores/site-theme.store';
import { UI_ICONS } from '../constants/ui-icons';

// Composables
const { t } = useI18n();
const { cardClasses } = useTheme();
const themeStore = useSiteThemeStore();

// Helper functions
const getContentIcon = (type: string) => themeStore.getContentIcon(type).icon;
const getContentTypeTheme = (type: string) => themeStore.getContentIcon(type);

// Navigation sections for quick access
const navigationSections = computed(() => [
  { id: 'process', label: t('pages.contributeGuide.process'), icon: UI_ICONS.timeline },
  { id: 'content-types', label: 'Content Types', icon: UI_ICONS.fileMultiple },
  { id: 'guidelines', label: t('pages.contributeGuide.guidelines'), icon: UI_ICONS.checkAll },
  { id: 'quality', label: t('pages.contributeGuide.qualityStandards'), icon: UI_ICONS.checkCircle },
  { id: 'review', label: t('pages.contributeGuide.reviewPhases'), icon: UI_ICONS.timeline },
  { id: 'faq', label: t('pages.contributeGuide.faq'), icon: UI_ICONS.help }
]);

// Process steps with enhanced visual design
const processSteps = computed(() => [
  {
    title: t('pages.contribute.processSteps.select.title'),
    description: t('pages.contribute.processSteps.select.description'),
    tip: t('content.submission.steps.contentType.validationError'),
    color: 'primary'
  },
  {
    title: t('pages.contribute.processSteps.prepare.title'),
    description: t('pages.contribute.processSteps.prepare.description'),
    tip: t('pages.contribute.preparationChecklist'),
    color: 'secondary'
  },
  {
    title: t('pages.contribute.processSteps.submit.title'),
    description: t('pages.contribute.processSteps.submit.description'),
    tip: t('content.submission.autoSave.saving'),
    color: 'accent'
  },
  {
    title: t('pages.contribute.processSteps.review.title'),
    description: t('pages.contribute.processSteps.review.description'),
    tip: '3-5 business days typical review time',
    color: 'warning'
  },
  {
    title: t('pages.contribute.processSteps.publish.title'),
    description: t('pages.contribute.processSteps.publish.description'),
    tip: t('content.submission.success.submitted'),
    color: 'positive'
  }
]);

// Content types with enhanced metadata
const contentTypes = computed(() => [
  {
    type: 'news',
    title: t('content.contentType.news'),
    description: t('content.submission.contentTypes.news.description'),
    requirements: [
      '200-800 words preferred',
      'Community-relevant topic',
      'Clear, engaging writing'
    ],
    difficulty: t('content.difficulty.easy'),
    difficultyColor: 'positive',
    timeEstimate: '15-30 min'
  },
  {
    type: 'event',
    title: t('content.contentType.event'),
    description: t('content.submission.contentTypes.event.description'),
    requirements: [
      'Event details',
      'Date and time',
      'Location or contact info'
    ],
    difficulty: t('content.difficulty.easy'),
    difficultyColor: 'positive',
    timeEstimate: '10-20 min'
  },
  {
    type: 'announcement',
    title: t('content.contentType.announcement'),
    description: t('content.submission.contentTypes.announcement.description'),
    requirements: [
      'Clear subject',
      'Factual information',
      'Appropriate for all residents'
    ],
    difficulty: t('content.difficulty.easy'),
    difficultyColor: 'positive',
    timeEstimate: '10-15 min'
  },
  {
    type: 'classified',
    title: t('content.contentType.classified'),
    description: t('content.submission.contentTypes.classified.description'),
    requirements: [
      'Clear item description',
      'Contact information',
      'Fair pricing if applicable'
    ],
    difficulty: t('content.difficulty.easy'),
    difficultyColor: 'positive',
    timeEstimate: '5-15 min'
  },
  {
    type: 'photo',
    title: t('content.contentType.photo'),
    description: t('content.submission.contentTypes.photo.description'),
    requirements: [
      'High resolution (300 DPI+)',
      'Descriptive captions',
      'Community-appropriate content'
    ],
    difficulty: t('content.difficulty.medium'),
    difficultyColor: 'warning',
    timeEstimate: '20-45 min'
  },
  {
    type: 'article',
    title: t('content.contentType.article'),
    description: t('content.submission.contentTypes.article.description'),
    requirements: [
      '500+ words recommended',
      'Well-researched content',
      'Proper citations if needed'
    ],
    difficulty: t('content.difficulty.hard'),
    difficultyColor: 'negative',
    timeEstimate: '45-90 min'
  }
]);

// Guidelines data
const positiveGuidelines = computed(() => [
  'Community-relevant content that serves residents',
  'Family-friendly language and topics',
  'Accurate, verified information',
  'Clear, engaging writing style',
  'High-quality images with proper captions',
  'Respect for privacy and permissions',
  'Constructive, positive community spirit'
]);

const negativeGuidelines = computed(() => [
  'Personal disputes or complaints',
  'Commercial advertising (unless approved)',
  'Political endorsements or partisan content',
  'Inappropriate language or content',
  'Unverified rumors or gossip',
  'Personal contact information without permission',
  'Copyright-protected material without permission'
]);

// Quality standards
const qualityStandards = computed(() => [
  {
    category: 'Writing Quality',
    icon: UI_ICONS.edit,
    color: 'primary',
    points: [
      'Clear, concise language',
      'Proper grammar and spelling',
      'Engaging and informative',
      'Appropriate length for content type'
    ]
  },
  {
    category: 'Visual Content',
    icon: UI_ICONS.eye,
    color: 'secondary',
    points: [
      'High resolution (300+ DPI)',
      'Well-composed shots',
      'Descriptive captions',
      'Proper image permissions'
    ]
  },
  {
    category: 'Information Accuracy',
    icon: UI_ICONS.checkCircle,
    color: 'accent',
    points: [
      'Fact-checked content',
      'Reliable sources cited',
      'Current and relevant information',
      'Contact details verified'
    ]
  }
]);

// Review process phases
const reviewPhases = computed(() => [
  {
    title: 'Initial Review',
    subtitle: 'Content screening',
    description: 'Basic compliance and community standards check',
    icon: UI_ICONS.search,
    color: 'primary',
    duration: '24-48 hours'
  },
  {
    title: 'Editorial Review',
    subtitle: 'Quality assessment',
    description: 'Grammar, clarity, and editorial standards review',
    icon: UI_ICONS.edit,
    color: 'secondary',
    duration: '2-3 business days'
  },
  {
    title: 'Final Approval',
    subtitle: 'Publication decision',
    description: 'Final approval and scheduling for publication',
    icon: UI_ICONS.checkCircle,
    color: 'positive',
    duration: '1 business day'
  },
  {
    title: 'Publication',
    subtitle: 'Content goes live',
    description: 'Your content appears in the community feed and newsletter',
    icon: UI_ICONS.checkCircle,
    color: 'accent',
    duration: 'Immediate'
  }
]);

// FAQ data
const faqs = computed(() => [
  {
    question: 'How long does the review process take?',
    answer: 'Most submissions are reviewed within 3-5 business days. Complex content requiring fact-checking may take longer. You\'ll receive email updates throughout the process.'
  },
  {
    question: 'Can I edit my content after submission?',
    answer: 'Minor edits can usually be accommodated during the review process. Contact our editorial team as soon as possible with any changes. Major revisions may require resubmission.'
  },
  {
    question: 'What image formats do you accept?',
    answer: 'We prefer high-resolution JPEG images (300+ DPI) for photos and PNG for graphics. We recommend hosting images on Google Photos or Google Drive and providing sharing links rather than uploading large files.'
  },
  {
    question: 'Can I submit content on behalf of an organization?',
    answer: 'Yes, but please clearly identify the organization and your role. Include appropriate contact information and ensure you have authorization to submit on their behalf.'
  },
  {
    question: 'How often can I submit content?',
    answer: 'We welcome regular contributors! However, we may limit the amount of content from single contributors in each issue to ensure diverse voices. Quality content is always preferred over quantity.'
  },
  {
    question: 'What happens if my content is rejected?',
    answer: 'We provide detailed feedback for rejected submissions. Most rejections are for minor issues that can be easily addressed. You\'re always welcome to revise and resubmit.'
  }
]);

// Scroll to section function
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style lang="scss" scoped>
.process-step {
  border-left: 2px solid transparent;
  padding-left: 1rem;
  transition: border-color 0.3s ease;

  &:hover {
    border-left-color: var(--q-primary);
  }
}

.full-height {
  height: 100%;
}

// Accessibility improvements
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Focus improvements for keyboard navigation
.q-btn:focus,
.q-card:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

// High contrast mode support
@media (prefers-contrast: high) {
  .q-card {
    border-width: 2px;
  }
}
</style>
