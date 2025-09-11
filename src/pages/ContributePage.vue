<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header Section -->
          <q-card flat :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-pencil" class="q-mr-sm" />
                Contribute to The Courier
              </div>
              <p class="text-body1">
                Share your stories, photos, events, and ideas with our community.
                Follow our guided process to ensure your content reaches fellow residents effectively.
              </p>

              <!-- Process Guide Toggle -->
              <div class="q-mt-md">
                <q-btn
                  @click="showProcessGuide = !showProcessGuide"
                  color="primary"
                  outline
                  :icon="showProcessGuide ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  :label="showProcessGuide ? 'Hide Process Guide' : 'Show Process Guide'"
                  size="sm"
                />
                <q-btn
                  to="/contribute/guide"
                  color="info"
                  outline
                  icon="mdi-book-open"
                  label="Complete Guide"
                  size="sm"
                  class="q-ml-sm"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Process Guide Section -->
          <q-slide-transition>
            <q-card v-show="showProcessGuide" :class="cardClasses" class="q-mb-lg">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-map" class="q-mr-sm" />
                  Submission Process Guide
                </div>

                <div class="row">
                  <div
                    v-for="step in processSteps"
                    :key="step.number"
                    class="col-12 col-md-6 col-lg-4 q-pa-sm"
                  >
                    <q-card
                      flat
                      bordered
                      :class="[
                        'process-step-card',
                        currentStep >= step.number ? 'active-step' : 'inactive-step'
                      ]"
                    >
                      <q-card-section class="text-center">
                        <q-avatar
                          :color="currentStep >= step.number ? 'primary' : 'grey-5'"
                          text-color="white"
                          size="40px"
                          class="q-mb-sm"
                        >
                          {{ step.number }}
                        </q-avatar>
                        <div class="text-subtitle2 q-mb-xs">{{ step.title }}</div>
                        <p class="text-caption text-grey-7 q-ma-none">{{ step.description }}</p>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-slide-transition>

          <!-- Step 1: Content Type Selection -->
          <q-card v-if="!selectedContentType" :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-numeric-1-circle" class="q-mr-sm text-primary" />
                Choose Your Content Type
              </div>
              <p class="text-body2 text-grey-7 q-mb-lg">
                Select the type of content you want to share. Each type has specific guidelines to help you create the best submission.
              </p>

              <div class="row">
                <div
                  v-for="contentType in contentTypes"
                  :key="contentType.id"
                  class="col-12 col-md-6 col-lg-4 q-pa-sm"
                >
                  <q-card
                    flat
                    bordered
                    class="content-type-card cursor-pointer full-height"
                    @click="selectContentType(contentType.id)"
                  >
                    <q-card-section class="column full-height">
                      <div class="text-center q-mb-md">
                        <q-icon
                          :name="contentType.icon"
                          :color="contentType.color"
                          size="3em"
                        />
                      </div>
                      <div class="text-h6 text-center q-mb-sm">{{ contentType.title }}</div>
                      <p class="text-body2 text-grey-7 flex-grow-1 q-mb-md">{{ contentType.description }}</p>

                      <div class="content-type-meta q-mt-auto">
                        <div class="row q-gutter-xs q-mb-sm">
                          <q-chip size="sm" color="grey-3" text-color="grey-8">
                            <q-icon name="mdi-clock" size="xs" class="q-mr-xs" />
                            {{ contentType.timeEstimate }}
                          </q-chip>
                          <q-chip size="sm" color="positive" text-color="white">
                            {{ contentType.difficulty }}
                          </q-chip>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Step 2: Selected Content Type Details -->
          <q-card v-if="selectedContentType" :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-numeric-2-circle" class="q-mr-sm text-primary" />
                {{ getContentTypeById(selectedContentType)?.title }} - Preparation Guide
              </div>

              <div class="row">
                <div class="col-12 col-md-8">
                  <p class="text-body2 q-mb-md">{{ getContentTypeById(selectedContentType)?.description }}</p>

                  <div class="q-mb-md">
                    <div class="text-subtitle2 q-mb-sm">Examples of great {{ getContentTypeById(selectedContentType)?.title.toLowerCase() }}:</div>
                    <ul class="text-body2">
                      <li v-for="example in getContentTypeById(selectedContentType)?.examples" :key="example">
                        {{ example }}
                      </li>
                    </ul>
                  </div>

                  <div class="q-mb-lg">
                    <div class="text-subtitle2 q-mb-sm">Requirements:</div>
                    <ul class="text-body2">
                      <li v-for="requirement in getContentTypeById(selectedContentType)?.requirements" :key="requirement">
                        {{ requirement }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <q-card flat bordered class="preparation-checklist">
                    <q-card-section>
                      <div class="text-subtitle2 q-mb-md">
                        <q-icon name="mdi-clipboard-check" class="q-mr-sm" />
                        Preparation Checklist
                      </div>
                      <q-list>
                        <q-item>
                          <q-item-section side>
                            <q-checkbox v-model="checklist.content" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label caption>Content prepared</q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            <q-checkbox v-model="checklist.images" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label caption>Images ready (if any)</q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            <q-checkbox v-model="checklist.details" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label caption>All details gathered</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  icon="mdi-arrow-right"
                  label="Proceed to Submission Form"
                  @click="proceedToSubmission"
                  size="md"
                />
                <q-btn
                  color="grey-7"
                  outline
                  icon="mdi-arrow-left"
                  label="Choose Different Type"
                  @click="resetSelection"
                  size="md"
                  class="q-ml-sm"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Quick Actions Section (always visible) -->
          <q-card :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-flash" class="q-mr-sm" />
                Quick Actions
              </div>
              <p class="text-body2 text-grey-7 q-mb-md">
                For experienced contributors: jump directly to common submission types.
              </p>
              <div class="row">
                <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
                  <q-btn
                    color="secondary"
                    icon="mdi-camera-plus"
                    label="Quick Photo"
                    @click="quickSubmit('photo')"
                    class="full-width"
                    size="md"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
                  <q-btn
                    color="accent"
                    icon="mdi-calendar-plus"
                    label="Quick Event"
                    @click="quickSubmit('event')"
                    class="full-width"
                    size="md"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
                  <q-btn
                    color="positive"
                    icon="mdi-bullhorn"
                    label="Quick News"
                    @click="quickSubmit('announcement')"
                    class="full-width"
                    size="md"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
                  <q-btn
                    color="orange"
                    icon="mdi-tag"
                    label="Quick Classified"
                    @click="quickSubmit('classified')"
                    class="full-width"
                    size="md"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Help & Resources Section -->
          <q-card :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-help-circle" class="q-mr-sm" />
                Help & Resources
              </div>
              <div class="row">
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-card flat bordered class="help-resource-card full-height">
                    <q-card-section class="text-center">
                      <q-icon name="mdi-book-open" color="info" size="2em" class="q-mb-sm" />
                      <div class="text-subtitle1 q-mb-sm">Complete Guide</div>
                      <p class="text-caption text-grey-7 q-mb-md">
                        Comprehensive documentation covering all aspects of content submission.
                      </p>
                      <q-btn
                        color="info"
                        outline
                        size="sm"
                        label="View Guide"
                        to="/contribute/guide"
                        class="full-width"
                      />
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-4 q-pa-sm">
                  <q-card flat bordered class="help-resource-card full-height">
                    <q-card-section class="text-center">
                      <q-icon name="mdi-email" color="primary" size="2em" class="q-mb-sm" />
                      <div class="text-subtitle1 q-mb-sm">Contact Editor</div>
                      <p class="text-caption text-grey-7 q-mb-md">
                        Get direct help from our editorial team for complex submissions.
                      </p>
                      <q-btn
                        color="primary"
                        outline
                        size="sm"
                        label="Send Email"
                        href="mailto:editor@conashaughlakes.com"
                        class="full-width"
                      />
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-4 q-pa-sm">
                  <q-card flat bordered class="help-resource-card full-height">
                    <q-card-section class="text-center">
                      <q-icon name="mdi-clock" color="positive" size="2em" class="q-mb-sm" />
                      <div class="text-subtitle1 q-mb-sm">Quick Tips</div>
                      <p class="text-caption text-grey-7 q-mb-md">
                        Review timeline: 3-5 business days. Check your email for updates.
                      </p>
                      <q-btn
                        color="positive"
                        outline
                        size="sm"
                        label="View FAQ"
                        to="/contribute/guide#faq"
                        class="full-width"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Community Guidelines -->
          <q-card :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-information" class="q-mr-sm" />
                Community Guidelines
              </div>
              <div class="row">
                <div class="col-12 col-md-6">
                  <q-list>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Keep content family-friendly and community-appropriate</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Focus on topics relevant to CLCA residents</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Use high-resolution images (300 DPI+ preferred)</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
                <div class="col-12 col-md-6">
                  <q-list>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-clock" color="info" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Review process: 3-5 business days</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-email" color="info" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>You'll receive feedback via email</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-publish" color="info" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Approved content appears in next newsletter</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useSiteTheme } from '../composables/useSiteTheme'

const router = useRouter()
const { cardClasses } = useTheme()
const { getContentIcon } = useSiteTheme()

// Helper function to match old API
const getContentTypeIcon = (type: string) => {
  return getContentIcon(type);
};

// State for content selection and process guidance
const selectedContentType = ref<string | null>(null)
const currentStep = ref(1)
const showProcessGuide = ref(false)

// Checklist state for preparation guide
const checklist = ref({
  content: false,
  images: false,
  details: false
})

// Content type definitions with detailed guidance - using centralized icon system
const contentTypes = [
  {
    id: 'article',
    title: getContentTypeIcon('article').label,
    icon: getContentTypeIcon('article').icon,
    color: getContentTypeIcon('article').color,
    description: 'Share detailed stories, community insights, resident spotlights, or local history.',
    examples: ['Community member profiles', 'Local history articles', 'Seasonal activities', 'HOA updates'],
    timeEstimate: '15-30 minutes',
    difficulty: 'Easy',
    requirements: ['200-800 words preferred', 'Community-relevant topic', 'Clear, engaging writing']
  },
  {
    id: 'photo',
    title: getContentTypeIcon('photo').label,
    icon: getContentTypeIcon('photo').icon,
    color: getContentTypeIcon('photo').color,
    description: 'Submit curated photo collections with detailed descriptions, captions, and context.',
    examples: ['Event coverage', 'Seasonal highlights', 'Community projects', 'Wildlife spotting'],
    timeEstimate: '10-20 minutes',
    difficulty: 'Easy',
    requirements: ['High resolution (300 DPI+)', 'Descriptive captions', 'Community-appropriate content']
  },
  {
    id: 'event',
    title: getContentTypeIcon('event').label,
    icon: getContentTypeIcon('event').icon,
    color: getContentTypeIcon('event').color,
    description: 'Promote community events, meetings, or activities to keep everyone informed.',
    examples: ['Community meetings', 'Social events', 'Workshops', 'Volunteer opportunities'],
    timeEstimate: '5-15 minutes',
    difficulty: 'Easy',
    requirements: ['Event details', 'Date and time', 'Location or contact info']
  },
  {
    id: 'announcement',
    title: getContentTypeIcon('announcement').label,
    icon: getContentTypeIcon('announcement').icon,
    color: getContentTypeIcon('announcement').color,
    description: 'Share important community announcements, updates, or general news.',
    examples: ['Board updates', 'Policy changes', 'Community achievements', 'General announcements'],
    timeEstimate: '5-20 minutes',
    difficulty: 'Easy',
    requirements: ['Clear subject', 'Factual information', 'Appropriate for all residents']
  },
  {
    id: 'classified',
    title: getContentTypeIcon('classified').label,
    icon: getContentTypeIcon('classified').icon,
    color: getContentTypeIcon('classified').color,
    description: 'Post items for sale, services offered, wanted items, or free giveaways.',
    examples: ['Items for sale', 'Services offered', 'Items wanted', 'Free items'],
    timeEstimate: '5-10 minutes',
    difficulty: 'Easy',
    requirements: ['Clear description', 'Price (if selling)', 'Contact information']
  }
]// Process steps for guidance
const processSteps = [
  {
    number: 1,
    title: 'Choose Content Type',
    description: 'Select the type of content you want to share with the community',
    icon: 'mdi-format-list-bulleted-type'
  },
  {
    number: 2,
    title: 'Prepare Your Content',
    description: 'Gather your text, images, and any other materials needed',
    icon: 'mdi-file-document-edit'
  },
  {
    number: 3,
    title: 'Submit for Review',
    description: 'Fill out the submission form with your content and details',
    icon: 'mdi-send'
  },
  {
    number: 4,
    title: 'Editorial Review',
    description: 'Our team reviews your submission for quality and appropriateness',
    icon: 'mdi-account-check'
  },
  {
    number: 5,
    title: 'Publication',
    description: 'Approved content is included in the next newsletter issue',
    icon: 'mdi-publish'
  }
]

// Navigation functions with enhanced guidance
function selectContentType(typeId: string) {
  selectedContentType.value = typeId
  currentStep.value = 2
}

function proceedToSubmission() {
  if (selectedContentType.value) {
    void router.push({
      path: '/contribute/submit',
      query: { type: selectedContentType.value, guided: 'true' }
    })
  }
}

function quickSubmit(typeId: string) {
  void router.push({
    path: '/contribute/submit',
    query: { type: typeId, mode: 'quick' }
  })
}

function resetSelection() {
  selectedContentType.value = null
  currentStep.value = 1
}

function getContentTypeById(id: string) {
  return contentTypes.find(type => type.id === id)
}
</script>

<style scoped>
.full-height {
  height: 100%;
}

.flex-grow-1 {
  flex-grow: 1;
}

/* Process Guide Styles */
.process-step-card {
  transition: all 0.3s ease;
  height: 100%;
}

.active-step {
  border-color: var(--q-primary);
  background: rgba(var(--q-primary-rgb), 0.05);
}

.inactive-step {
  opacity: 0.7;
}

/* Content Type Selection Styles */
.content-type-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.content-type-card:hover {
  border-color: var(--q-primary);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.content-type-meta {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 12px;
}

/* Preparation Checklist */
.preparation-checklist {
  background: rgba(var(--q-primary-rgb), 0.03);
  border: 1px solid rgba(var(--q-primary-rgb), 0.2);
}

/* Help Resource Cards */
.help-resource-card {
  transition: all 0.3s ease;
}

.help-resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Dark mode support */
.body--dark .content-type-meta {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.body--dark .active-step {
  background: rgba(var(--q-primary-rgb), 0.1);
}

.body--dark .preparation-checklist {
  background: rgba(var(--q-primary-rgb), 0.05);
  border-color: rgba(var(--q-primary-rgb), 0.3);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .content-type-card {
    margin-bottom: 1rem;
  }

  .process-step-card {
    margin-bottom: 0.5rem;
  }
}

/* Animation for step transitions */
.step-transition-enter-active, .step-transition-leave-active {
  transition: all 0.5s ease;
}

.step-transition-enter-from, .step-transition-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
