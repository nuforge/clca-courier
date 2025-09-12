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
                  icon="mdi-plus"
                  label="Start Contributing"
                  class="full-width"
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
              <div class="col-6 col-sm-3" v-for="(section, index) in quickNavSections" :key="index">
                <q-btn
                  flat
                  no-caps
                  :icon="section.icon"
                  :label="section.label"
                  class="full-width"
                  @click="scrollToSection(section.id)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Overview -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="overview">{{ $t('pages.contributeGuide.overview') }}</h2>
            <p class="text-body1">
              Welcome to The Courier's contributor guide! This comprehensive resource will help you understand our content submission process,
              quality standards, and best practices for sharing your stories with the community.
            </p>
          </q-card-section>
        </q-card>

        <!-- Process Steps Timeline -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="process">{{ $t('pages.contributeGuide.process') }}</h2>

            <q-timeline layout="comfortable">
              <q-timeline-entry
                v-for="(step, index) in processSteps"
                :key="index"
                :title="`${step.number}. ${step.title}`"
                :color="step.color"
                :icon="`mdi-numeric-${step.number}-circle`"
              >
                <div class="text-body1 q-mb-sm">{{ step.description }}</div>
                <div class="text-body2 text-grey-7 q-mb-sm">{{ step.details.join(' • ') }}</div>
                <q-banner dense rounded class="bg-info text-white">
                  <template v-slot:avatar>
                    <q-icon name="mdi-lightbulb" />
                  </template>
                  {{ step.tip }}
                </q-banner>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>

        <!-- Content Types Grid -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="content-types">Content Types</h2>
            <p class="text-body2 text-grey-7 q-mb-lg">
              Choose the content type that best matches what you want to share with the community.
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
                        <q-icon :name="contentType.icon" size="lg" :color="contentType.color" />
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
                        <q-chip size="sm" color="grey-3" text-color="grey-8" dense>
                          <q-icon name="mdi-clock" size="xs" class="q-mr-xs" />
                          {{ contentType.timeEstimate }}
                        </q-chip>
                      </div>
                      <div class="col-auto">
                        <q-chip size="sm" :color="contentType.difficultyColor" text-color="white" dense>
                          {{ contentType.difficulty }}
                        </q-chip>
                      </div>
                    </div>

                    <div class="q-mb-sm">
                      <p class="text-caption text-weight-medium q-mb-xs">Requirements:</p>
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
                      :color="contentType.color"
                      :to="`/contribute/submit?type=${contentType.type}`"
                    >
                      Quick Submit
                      <q-icon name="mdi-chevron-right" right />
                    </q-btn>
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Guidelines Section -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="guidelines">{{ $t('pages.contributeGuide.guidelines') }}</h2>

            <div class="row q-col-gutter-lg">
              <!-- Positive Guidelines -->
              <div class="col-12 col-md-6">
                <q-card flat bordered class="full-height bg-positive-1">
                  <q-card-section>
                    <div class="row q-col-gutter-sm items-center q-mb-md">
                      <div class="col-auto">
                        <q-icon name="mdi-check-circle" size="md" color="positive" />
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
                        <q-icon name="mdi-close-circle" size="md" color="negative" />
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
            <h2 class="text-h5 q-mb-md" id="quality">{{ $t('pages.contributeGuide.qualityStandards') }}</h2>

            <div class="row q-col-gutter-md">
              <div v-for="standard in qualityStandards" :key="standard.category" class="col-12 col-md-4">
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
            <h2 class="text-h5 q-mb-md" id="review">{{ $t('pages.contributeGuide.reviewPhases') }}</h2>

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
                  <q-icon name="mdi-clock" size="xs" class="q-mr-xs" />
                  {{ phase.duration }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>

        <!-- FAQ Section -->
        <q-card flat :class="cardClasses" class="q-mb-lg">
          <q-card-section>
            <h2 class="text-h5 q-mb-md" id="faq">{{ $t('pages.contributeGuide.faq') }}</h2>

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

        <!-- Call to Action -->
        <q-card flat :class="cardClasses" class="text-center">
          <q-card-section>
            <div class="row q-col-gutter-md justify-center items-center">
              <div class="col-12 col-md-8">
                <h2 class="text-h6 q-ma-none q-mb-sm">
                  Ready to Share Your Story?
                </h2>
                <p class="text-body2 text-grey-7 q-ma-none q-mb-md">
                  Start the submission process and help keep our community connected.
                </p>
              </div>
              <div class="col-12 col-md-4">
                <q-btn
                  :to="'/contribute/submit'"
                  color="primary"
                  size="lg"
                  no-caps
                  icon="mdi-plus"
                  label="Submit Content"
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
import { useI18n } from 'vue-i18n';
import { useTheme } from '../composables/useTheme';

// Composables
const { t } = useI18n();
const { cardClasses } = useTheme();

// Quick navigation sections
const quickNavSections = [
  { id: 'overview', label: t('pages.contributeGuide.overview'), icon: 'mdi-information' },
  { id: 'process', label: t('pages.contributeGuide.process'), icon: 'mdi-timeline-clock' },
  { id: 'content-types', label: 'Content Types', icon: 'mdi-file-document-multiple' },
  { id: 'guidelines', label: t('pages.contributeGuide.guidelines'), icon: 'mdi-check-all' },
  { id: 'quality', label: t('pages.contributeGuide.qualityStandards'), icon: 'mdi-star' },
  { id: 'review', label: t('pages.contributeGuide.reviewPhases'), icon: 'mdi-timeline' },
  { id: 'faq', label: t('pages.contributeGuide.faq'), icon: 'mdi-help-circle' }
];

// Process steps with detailed information
const processSteps = [
  {
    number: 1,
    title: 'Choose Content Type',
    description: 'Select the type of content you want to share with the community.',
    color: 'primary',
    details: ['News articles', 'Event announcements', 'Photos', 'Classifieds'],
    tip: 'Not sure which type? Start with "Community News" for general announcements.'
  },
  {
    number: 2,
    title: 'Prepare Your Content',
    description: 'Gather all materials and review our content guidelines.',
    color: 'secondary',
    details: ['Write your content', 'Gather images', 'Check guidelines', 'Verify information'],
    tip: 'Use our preparation checklist to ensure you have everything ready.'
  },
  {
    number: 3,
    title: 'Submit for Review',
    description: 'Fill out our submission form with your prepared content.',
    color: 'accent',
    details: ['Complete form', 'Add features', 'Preview content', 'Submit'],
    tip: 'Save drafts as you work to avoid losing your progress.'
  },
  {
    number: 4,
    title: 'Editorial Review',
    description: 'Our team reviews your submission for quality and community guidelines.',
    color: 'warning',
    details: ['Content review', 'Fact checking', 'Style editing', 'Approval decision'],
    tip: 'Following our guidelines closely speeds up the review process.'
  },
  {
    number: 5,
    title: 'Publication',
    description: 'Approved content is published in our newsletter and community feed.',
    color: 'positive',
    details: ['Newsletter inclusion', 'Website publication', 'Community notification'],
    tip: 'You\'ll receive notification when your content goes live!'
  }
];

// Content types with detailed information
const contentTypes = [
  {
    type: 'news',
    title: 'Community News',
    description: 'Share news, stories, and updates that matter to our community',
    icon: 'mdi-newspaper',
    color: 'primary',
    timeEstimate: '15-30 min',
    difficulty: 'Easy',
    difficultyColor: 'positive',
    requirements: ['200-800 words preferred', 'Community-relevant topic', 'Clear, engaging writing']
  },
  {
    type: 'photos',
    title: 'Photos & Media',
    description: 'Submit photos from community events, nature shots, or resident spotlights',
    icon: 'mdi-camera',
    color: 'secondary',
    timeEstimate: '20-45 min',
    difficulty: 'Medium',
    difficultyColor: 'warning',
    requirements: ['High resolution (300 DPI+)', 'Descriptive captions', 'Community-appropriate content']
  },
  {
    type: 'events',
    title: 'Events & Activities',
    description: 'Announce upcoming community events, meetings, or activities',
    icon: 'mdi-calendar',
    color: 'accent',
    timeEstimate: '10-20 min',
    difficulty: 'Easy',
    difficultyColor: 'positive',
    requirements: ['Event details', 'Date and time', 'Location or contact info']
  },
  {
    type: 'announcements',
    title: 'Announcements',
    description: 'Share official announcements or important community information',
    icon: 'mdi-bullhorn',
    color: 'info',
    timeEstimate: '10-15 min',
    difficulty: 'Easy',
    difficultyColor: 'positive',
    requirements: ['Clear subject', 'Factual information', 'Appropriate for all residents']
  },
  {
    type: 'classifieds',
    title: 'Classifieds',
    description: 'Post items for sale, services offered, or community announcements',
    icon: 'mdi-tag',
    color: 'orange',
    timeEstimate: '5-15 min',
    difficulty: 'Easy',
    difficultyColor: 'positive',
    requirements: ['Clear item description', 'Contact information', 'Fair pricing if applicable']
  },
  {
    type: 'articles',
    title: 'Articles & Features',
    description: 'Submit in-depth articles, educational content, or feature stories',
    icon: 'mdi-file-document-edit',
    color: 'deep-purple',
    timeEstimate: '45-90 min',
    difficulty: 'Advanced',
    difficultyColor: 'negative',
    requirements: ['500+ words recommended', 'Well-researched content', 'Proper citations if needed']
  }
];

// Guidelines
const positiveGuidelines = [
  'Community-relevant content that serves residents',
  'Family-friendly language and topics',
  'Accurate, verified information',
  'Clear, engaging writing style',
  'High-quality images with proper captions',
  'Respect for privacy and permissions',
  'Constructive, positive community spirit'
];

const negativeGuidelines = [
  'Personal disputes or complaints',
  'Commercial advertising (unless approved)',
  'Political endorsements or partisan content',
  'Inappropriate language or content',
  'Unverified rumors or gossip',
  'Personal contact information without permission',
  'Copyright-protected material without permission'
];

// Quality standards
const qualityStandards = [
  {
    category: 'Writing Quality',
    icon: 'mdi-pencil',
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
    icon: 'mdi-image',
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
    icon: 'mdi-check-circle',
    color: 'accent',
    points: [
      'Fact-checked content',
      'Reliable sources cited',
      'Current and relevant information',
      'Contact details verified'
    ]
  }
];

// Review process phases
const reviewPhases = [
  {
    title: 'Initial Review',
    subtitle: 'Content screening',
    description: 'Basic compliance and community standards check',
    icon: 'mdi-magnify',
    color: 'primary',
    duration: '24-48 hours'
  },
  {
    title: 'Editorial Review',
    subtitle: 'Quality assessment',
    description: 'Grammar, clarity, and editorial standards review',
    icon: 'mdi-pencil',
    color: 'secondary',
    duration: '2-3 business days'
  },
  {
    title: 'Final Approval',
    subtitle: 'Publication decision',
    description: 'Final approval and scheduling for publication',
    icon: 'mdi-check-circle',
    color: 'positive',
    duration: '1 business day'
  },
  {
    title: 'Publication',
    subtitle: 'Content goes live',
    description: 'Your content appears in the community feed and newsletter',
    icon: 'mdi-web',
    color: 'accent',
    duration: 'Immediate'
  }
];

// FAQ data
const faqs = [
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
];

// Scroll to section function
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style scoped>
.full-height {
  height: 100%;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus improvements for keyboard navigation */
.q-btn:focus,
.q-card:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .q-card {
    border-width: 2px;
  }
}
</style>
