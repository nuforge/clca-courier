<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header Section -->
          <q-card flat :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-book-open" class="q-mr-sm" />
                Contributor's Guide
              </div>
              <p class="text-body1">
                Everything you need to know about contributing content to The Courier.
                This comprehensive guide covers our submission process, content guidelines, and best practices.
              </p>

              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  icon="mdi-pencil"
                  label="Start Contributing"
                  to="/contribute"
                  size="md"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Table of Contents -->
          <q-card :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Quick Navigation</div>
              <div class="row">
                <div class="col-12 col-md-6">
                  <q-list>
                    <q-item clickable @click="scrollToSection('process')">
                      <q-item-section side>
                        <q-icon name="mdi-map" />
                      </q-item-section>
                      <q-item-section>Submission Process</q-item-section>
                    </q-item>
                    <q-item clickable @click="scrollToSection('types')">
                      <q-item-section side>
                        <q-icon name="mdi-format-list-bulleted-type" />
                      </q-item-section>
                      <q-item-section>Content Types</q-item-section>
                    </q-item>
                    <q-item clickable @click="scrollToSection('guidelines')">
                      <q-item-section side>
                        <q-icon name="mdi-clipboard-list" />
                      </q-item-section>
                      <q-item-section>Content Guidelines</q-item-section>
                    </q-item>
                  </q-list>
                </div>
                <div class="col-12 col-md-6">
                  <q-list>
                    <q-item clickable @click="scrollToSection('quality')">
                      <q-item-section side>
                        <q-icon name="mdi-star" />
                      </q-item-section>
                      <q-item-section>Quality Standards</q-item-section>
                    </q-item>
                    <q-item clickable @click="scrollToSection('review')">
                      <q-item-section side>
                        <q-icon name="mdi-account-check" />
                      </q-item-section>
                      <q-item-section>Review Process</q-item-section>
                    </q-item>
                    <q-item clickable @click="scrollToSection('faq')">
                      <q-item-section side>
                        <q-icon name="mdi-help-circle" />
                      </q-item-section>
                      <q-item-section>FAQ</q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Submission Process -->
          <section id="process">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-map" class="q-mr-sm" />
                  Submission Process
                </div>

                <div class="process-timeline">
                  <div v-for="(step, index) in processSteps" :key="step.number" class="process-step">
                    <div class="process-step-header">
                      <q-avatar :color="step.color" text-color="white" size="40px">
                        {{ step.number }}
                      </q-avatar>
                      <div class="process-step-title">{{ step.title }}</div>
                    </div>
                    <div class="process-step-content">
                      <p>{{ step.description }}</p>
                      <ul v-if="step.details">
                        <li v-for="detail in step.details" :key="detail">{{ detail }}</li>
                      </ul>
                      <div v-if="step.tip" class="step-tip">
                        <q-icon name="mdi-lightbulb" class="q-mr-sm" />
                        <strong>Tip:</strong> {{ step.tip }}
                      </div>
                    </div>
                    <q-separator v-if="index < processSteps.length - 1" class="q-my-lg" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- Content Types -->
          <section id="types">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-format-list-bulleted-type" class="q-mr-sm" />
                  Content Types & Guidelines
                </div>

                <div class="row">
                  <div v-for="contentType in contentTypes" :key="contentType.id" class="col-12 col-md-6 q-pa-sm">
                    <q-expansion-item
                      :icon="contentType.icon"
                      :label="contentType.title"
                      header-class="text-weight-medium"
                    >
                      <q-card flat bordered class="q-mt-sm">
                        <q-card-section>
                          <p class="text-body2 q-mb-md">{{ contentType.description }}</p>

                          <div class="q-mb-md">
                            <div class="text-subtitle2 q-mb-sm">Best For:</div>
                            <q-chip
                              v-for="example in contentType.examples"
                              :key="example"
                              size="sm"
                              outline
                              class="q-mr-xs q-mb-xs"
                            >
                              {{ example }}
                            </q-chip>
                          </div>

                          <div class="q-mb-md">
                            <div class="text-subtitle2 q-mb-sm">Requirements:</div>
                            <ul class="text-body2">
                              <li v-for="req in contentType.requirements" :key="req">{{ req }}</li>
                            </ul>
                          </div>

                          <div class="content-type-stats">
                            <q-badge color="grey-5" text-color="grey-8">{{ contentType.timeEstimate }}</q-badge>
                            <q-badge :color="contentType.color" class="q-ml-sm">{{ contentType.difficulty }}</q-badge>
                          </div>
                        </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- Content Guidelines -->
          <section id="guidelines">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-clipboard-list" class="q-mr-sm" />
                  Content Guidelines
                </div>

                <div class="row">
                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-md text-positive">
                      <q-icon name="mdi-check-circle" class="q-mr-sm" />
                      Do Include
                    </div>
                    <q-list>
                      <q-item v-for="guideline in positiveGuidelines" :key="guideline">
                        <q-item-section side>
                          <q-icon name="mdi-check" color="positive" />
                        </q-item-section>
                        <q-item-section>{{ guideline }}</q-item-section>
                      </q-item>
                    </q-list>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-md text-negative">
                      <q-icon name="mdi-close-circle" class="q-mr-sm" />
                      Avoid
                    </div>
                    <q-list>
                      <q-item v-for="guideline in negativeGuidelines" :key="guideline">
                        <q-item-section side>
                          <q-icon name="mdi-close" color="negative" />
                        </q-item-section>
                        <q-item-section>{{ guideline }}</q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- Quality Standards -->
          <section id="quality">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-star" class="q-mr-sm" />
                  Quality Standards
                </div>

                <div class="row">
                  <div v-for="standard in qualityStandards" :key="standard.category" class="col-12 col-md-4 q-pa-sm">
                    <q-card flat bordered>
                      <q-card-section class="text-center">
                        <q-icon :name="standard.icon" :color="standard.color" size="2em" class="q-mb-sm" />
                        <div class="text-h6 q-mb-sm">{{ standard.category }}</div>
                        <ul class="text-body2 text-left">
                          <li v-for="criterion in standard.criteria" :key="criterion">{{ criterion }}</li>
                        </ul>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- Review Process -->
          <section id="review">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-account-check" class="q-mr-sm" />
                  Review Process
                </div>

                <div class="review-timeline">
                  <q-timeline color="primary">
                    <q-timeline-entry
                      v-for="phase in reviewPhases"
                      :key="phase.title"
                      :title="phase.title"
                      :subtitle="phase.timeframe"
                      :icon="phase.icon"
                    >
                      <div>{{ phase.description }}</div>
                      <ul class="q-mt-sm">
                        <li v-for="detail in phase.details" :key="detail">{{ detail }}</li>
                      </ul>
                    </q-timeline-entry>
                  </q-timeline>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- FAQ -->
          <section id="faq">
            <q-card :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h5 q-mb-md">
                  <q-icon name="mdi-help-circle" class="q-mr-sm" />
                  Frequently Asked Questions
                </div>

                <div class="row">
                  <div v-for="faq in faqs" :key="faq.question" class="col-12 q-pa-sm">
                    <q-expansion-item
                      :label="faq.question"
                      icon="mdi-help-circle-outline"
                      header-class="text-weight-medium"
                    >
                      <q-card flat bordered class="q-mt-sm">
                        <q-card-section>
                          <div v-html="faq.answer"></div>
                        </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </section>

          <!-- Call to Action -->
          <q-card :class="cardClasses" class="q-mt-lg text-center">
            <q-card-section>
              <div class="text-h6 q-mb-md">Ready to Contribute?</div>
              <p class="text-body2 q-mb-lg">
                Start sharing your stories, photos, and ideas with the CLCA community today.
              </p>
              <div class="row justify-center q-gutter-md">
                <q-btn
                  color="primary"
                  icon="mdi-pencil"
                  label="Start Contributing"
                  to="/contribute"
                  size="lg"
                />
                <q-btn
                  color="grey-7"
                  outline
                  icon="mdi-email"
                  label="Contact Editor"
                  href="mailto:editor@conashaughlakes.com"
                  size="lg"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'

const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark'
  } else {
    return 'bg-white text-dark'
  }
})

// Process steps with detailed information
const processSteps = [
  {
    number: 1,
    title: 'Choose Content Type',
    description: 'Select the type of content that best fits what you want to share.',
    color: 'primary',
    details: [
      'Review available content types and their guidelines',
      'Consider your audience and the value your content provides',
      'Use our guided selection process for best results'
    ],
    tip: 'Not sure which type? Start with "Community News" for general announcements.'
  },
  {
    number: 2,
    title: 'Prepare Your Content',
    description: 'Gather all materials and information needed for your submission.',
    color: 'secondary',
    details: [
      'Write your content following our guidelines',
      'Collect and organize any images or media',
      'Ensure you have all necessary details and contact information'
    ],
    tip: 'Use our preparation checklist to ensure you have everything ready.'
  },
  {
    number: 3,
    title: 'Submit for Review',
    description: 'Complete the submission form with your content and details.',
    color: 'accent',
    details: [
      'Fill out all required fields accurately',
      'Include hosting links for images (Google Photos recommended)',
      'Double-check your contact information'
    ],
    tip: 'Save drafts as you work to avoid losing your progress.'
  },
  {
    number: 4,
    title: 'Editorial Review',
    description: 'Our editorial team reviews your submission for quality and appropriateness.',
    color: 'positive',
    details: [
      'Content is checked against community guidelines',
      'Editorial team may suggest improvements',
      'Review typically takes 3-5 business days'
    ],
    tip: 'Following our guidelines closely speeds up the review process.'
  },
  {
    number: 5,
    title: 'Publication',
    description: 'Approved content is included in the next newsletter issue.',
    color: 'info',
    details: [
      'You\'ll receive confirmation when content is approved',
      'Content appears in the next scheduled newsletter',
      'Digital content may appear on our website immediately'
    ],
    tip: 'Check the newsletter publication schedule to know when your content will appear.'
  }
]

// Content types with detailed information
const contentTypes = [
  {
    id: 'article',
    title: 'Articles & Stories',
    icon: 'mdi-newspaper-variant',
    color: 'primary',
    description: 'Share detailed stories, community insights, resident spotlights, or local history.',
    examples: ['Community member profiles', 'Local history articles', 'Seasonal activities', 'HOA updates'],
    timeEstimate: '15-30 minutes',
    difficulty: 'Easy',
    requirements: ['200-800 words preferred', 'Community-relevant topic', 'Clear, engaging writing']
  },
  {
    id: 'photo',
    title: 'Photo Stories',
    icon: 'mdi-camera',
    color: 'secondary',
    description: 'Submit curated photo collections with detailed descriptions, captions, and context.',
    examples: ['Event coverage', 'Seasonal highlights', 'Community projects', 'Wildlife spotting'],
    timeEstimate: '10-20 minutes',
    difficulty: 'Easy',
    requirements: ['High resolution (300 DPI+)', 'Descriptive captions', 'Community-appropriate content']
  },
  {
    id: 'event',
    title: 'Events & Activities',
    icon: 'mdi-calendar-plus',
    color: 'accent',
    description: 'Promote community events, meetings, or activities to keep everyone informed.',
    examples: ['Community meetings', 'Social events', 'Workshops', 'Volunteer opportunities'],
    timeEstimate: '5-15 minutes',
    difficulty: 'Easy',
    requirements: ['Event details', 'Date and time', 'Location or contact info']
  },
  {
    id: 'announcement',
    title: 'Community News',
    icon: 'mdi-bullhorn',
    color: 'positive',
    description: 'Share important community announcements, updates, or general news.',
    examples: ['Board updates', 'Policy changes', 'Community achievements', 'General announcements'],
    timeEstimate: '5-20 minutes',
    difficulty: 'Easy',
    requirements: ['Clear subject', 'Factual information', 'Appropriate for all residents']
  }
]

// Guidelines
const positiveGuidelines = [
  'Community-relevant content that serves residents',
  'Family-friendly language and topics',
  'Accurate, verified information',
  'Clear, engaging writing style',
  'High-quality images with proper captions',
  'Respect for privacy and permissions',
  'Constructive, positive community spirit'
]

const negativeGuidelines = [
  'Personal disputes or complaints',
  'Commercial advertising (unless approved)',
  'Political endorsements or partisan content',
  'Inappropriate language or content',
  'Unverified rumors or gossip',
  'Personal contact information without permission',
  'Copyright-protected material without permission'
]

// Quality standards
const qualityStandards = [
  {
    category: 'Content Quality',
    icon: 'mdi-text',
    color: 'primary',
    criteria: [
      'Clear, well-written text',
      'Proper grammar and spelling',
      'Engaging and informative',
      'Appropriate length for content type'
    ]
  },
  {
    category: 'Visual Quality',
    icon: 'mdi-image',
    color: 'secondary',
    criteria: [
      'High resolution images (300+ DPI)',
      'Good composition and lighting',
      'Descriptive captions',
      'Appropriate file formats'
    ]
  },
  {
    category: 'Community Value',
    icon: 'mdi-heart',
    color: 'positive',
    criteria: [
      'Relevant to CLCA residents',
      'Adds value to community',
      'Promotes positive engagement',
      'Respects community standards'
    ]
  }
]

// Review process phases
const reviewPhases = [
  {
    title: 'Initial Submission',
    timeframe: 'Immediate',
    icon: 'mdi-send',
    description: 'Your content is received and queued for review.',
    details: [
      'Automatic confirmation email sent',
      'Content enters editorial queue',
      'Initial format and completeness check'
    ]
  },
  {
    title: 'Editorial Review',
    timeframe: '1-3 business days',
    icon: 'mdi-account-edit',
    description: 'Editorial team reviews content for quality and guidelines compliance.',
    details: [
      'Content quality assessment',
      'Community guidelines check',
      'Fact verification if needed',
      'Suggestions for improvement (if any)'
    ]
  },
  {
    title: 'Approval & Scheduling',
    timeframe: '3-5 business days',
    icon: 'mdi-calendar-check',
    description: 'Approved content is scheduled for publication.',
    details: [
      'Final approval confirmation',
      'Newsletter issue assignment',
      'Publication date confirmation',
      'Author notification'
    ]
  },
  {
    title: 'Publication',
    timeframe: 'Next newsletter cycle',
    icon: 'mdi-publish',
    description: 'Your content appears in the newsletter and digital platforms.',
    details: [
      'Content published in newsletter',
      'Digital version available online',
      'Author receives publication confirmation'
    ]
  }
]

// FAQ data
const faqs = [
  {
    question: 'How long does the review process take?',
    answer: 'Most submissions are reviewed within 3-5 business days. Complex content requiring fact-checking may take longer. You\'ll receive email updates throughout the process.'
  },
  {
    question: 'Can I edit my submission after sending it?',
    answer: 'Minor edits can usually be accommodated during the review process. Contact our editorial team as soon as possible with any changes. Major revisions may require resubmission.'
  },
  {
    question: 'What image formats and sizes do you accept?',
    answer: 'We prefer high-resolution JPEG images (300+ DPI) for photos and PNG for graphics. We recommend hosting images on Google Photos or Google Drive and providing sharing links rather than uploading large files.'
  },
  {
    question: 'Can I submit content on behalf of an organization?',
    answer: 'Yes, but please clearly identify the organization and your role. Include appropriate contact information and ensure you have authorization to submit on their behalf.'
  },
  {
    question: 'Is there a limit to how much I can contribute?',
    answer: 'We welcome regular contributors! However, we may limit the amount of content from single contributors in each issue to ensure diverse voices. Quality content is always preferred over quantity.'
  },
  {
    question: 'What if my submission is rejected?',
    answer: 'We provide detailed feedback for rejected submissions. Most rejections are for minor issues that can be easily addressed. You\'re always welcome to revise and resubmit.'
  },
  {
    question: 'Can I include links to external websites?',
    answer: 'Yes, relevant links are welcome, especially for events, resources, or additional information. However, commercial links require editorial approval.'
  },
  {
    question: 'How do I submit time-sensitive content?',
    answer: 'For urgent community announcements, contact our editorial team directly. We can often accommodate time-sensitive content between regular newsletter cycles.'
  }
]

// Scroll to section function
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* Process Timeline Styles */
.process-timeline {
  max-width: 800px;
}

.process-step {
  margin-bottom: 2rem;
}

.process-step-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.process-step-title {
  margin-left: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--q-primary);
}

.process-step-content p {
  margin-bottom: 1rem;
}

.process-step-content ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.step-tip {
  background: rgba(var(--q-info-rgb), 0.1);
  border-left: 3px solid var(--q-info);
  padding: 0.75rem;
  margin-top: 1rem;
  border-radius: 4px;
}

/* Content Type Styles */
.content-type-stats {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

/* Review Timeline Styles */
.review-timeline {
  margin-top: 1rem;
}

/* Responsive Adjustments */
@media (max-width: 600px) {
  .process-step-header {
    flex-direction: column;
    text-align: center;
  }

  .process-step-title {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

/* Dark theme support */
.body--dark .step-tip {
  background: rgba(var(--q-info-rgb), 0.15);
}
</style>
