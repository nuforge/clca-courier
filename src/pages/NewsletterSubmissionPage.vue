<!--
  Newsletter Submission Page
  Specialized form for submitting content specifically for newsletter inclusion
-->
<template>
  <q-page padding>
    <div class="q-pa-md max-width-800">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <h4 class="q-my-none">
          <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
          Submit Content for Newsletter
        </h4>
        <p class="text-body2 text-grey-6 q-my-none">
          Share your community news, events, or stories for the next newsletter
        </p>
      </div>

      <!-- Submission Form -->
      <q-card>
        <q-card-section>
          <q-form @submit="submitContent" class="q-gutter-md">
            <!-- Title -->
            <q-input
              v-model="submission.title"
              label="Article Title"
              hint="A clear, engaging title for your submission"
              :rules="[val => !!val || 'Title is required', val => val.length >= 5 || 'Title must be at least 5 characters']"
              filled
              counter
              maxlength="100"
            />

            <!-- Content Type -->
            <q-select
              v-model="submission.contentType"
              :options="contentTypeOptions"
              label="Content Type"
              hint="What type of content is this?"
              :rules="[val => !!val || 'Content type is required']"
              filled
              emit-value
              map-options
            />

            <!-- Rich Text Content -->
            <div>
              <label class="text-subtitle2 q-mb-sm block">Article Content</label>
              <RichTextEditor
                v-model="submission.content"
                :min-height="300"
                placeholder="Write your article content here. You can use formatting, lists, and more..."
                @update:model-value="updateContent"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ wordCount }} words • {{ characterCount }} characters
                <span v-if="estimatedReadTime > 0">• ~{{ estimatedReadTime }} min read</span>
              </div>
            </div>

            <!-- Featured Image Upload -->
            <div>
              <label class="text-subtitle2 q-mb-sm block">Featured Image (Optional)</label>
              <q-file
                v-model="featuredImage"
                label="Choose an image"
                accept="image/*"
                max-file-size="5242880"
                @rejected="onFileRejected"
                filled
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-image" />
                </template>
                <template v-slot:hint>
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </template>
              </q-file>

              <!-- Image Preview -->
              <div v-if="imagePreview" class="q-mt-md">
                <q-img
                  :src="imagePreview"
                  style="max-width: 300px; max-height: 200px"
                  class="rounded-borders"
                />
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="negative"
                  icon="mdi-delete"
                  label="Remove Image"
                  @click="removeImage"
                  class="q-mt-sm"
                />
              </div>
            </div>

            <!-- Author Information -->
            <q-input
              v-model="submission.author"
              label="Author Name"
              hint="How you'd like your name to appear in the newsletter"
              :rules="[val => !!val || 'Author name is required']"
              filled
            />

            <!-- Contact Information -->
            <q-input
              v-model="submission.contact"
              label="Contact Information (Optional)"
              hint="Email or phone number for follow-up questions"
              filled
            />

            <!-- Newsletter-Specific Options -->
            <q-card flat bordered class="q-pa-md">
              <div class="text-subtitle2 q-mb-md">
                <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
                Newsletter Options
              </div>

              <q-checkbox
                v-model="submission.newsletterReady"
                label="Ready for newsletter inclusion"
                hint="Check this if your content is ready to be included in the next newsletter"
              />

              <q-checkbox
                v-model="submission.featured"
                label="Featured content"
                hint="Request this content to be featured prominently in the newsletter"
              />
            </q-card>

            <!-- Submission Guidelines -->
            <q-card flat bordered class="q-pa-md bg-blue-1">
              <div class="text-subtitle2 q-mb-md">
                <q-icon name="mdi-information" class="q-mr-sm" />
                Submission Guidelines
              </div>
              <ul class="text-body2 q-mb-none">
                <li>Content should be relevant to the CLCA community</li>
                <li>Keep articles concise and engaging (500-1000 words recommended)</li>
                <li>Include proper attribution for any quotes or references</li>
                <li>Images should be high quality and relevant to the content</li>
                <li>All submissions are subject to review and approval</li>
              </ul>
            </q-card>

            <!-- Submit Button -->
            <div class="row q-gutter-sm justify-end">
              <q-btn
                label="Save Draft"
                color="grey"
                outline
                @click="saveDraft"
                :loading="isSavingDraft"
              />
              <q-btn
                label="Submit for Review"
                color="primary"
                type="submit"
                :loading="isSubmitting"
                :disable="!isFormValid"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Recent Submissions -->
      <q-card class="q-mt-lg" v-if="recentSubmissions.length > 0">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-history" class="q-mr-sm" />
            Your Recent Submissions
          </div>

          <q-list separator>
            <q-item
              v-for="submission in recentSubmissions"
              :key="submission.id"
              clickable
              @click="viewSubmission(submission)"
            >
              <q-item-section avatar>
                <q-avatar :color="getStatusColor(submission.status)" text-color="white">
                  {{ submission.title.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ submission.title }}</q-item-label>
                <q-item-label caption>
                  {{ submission.contentType }} • {{ formatDate(submission.createdAt) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge :color="getStatusColor(submission.status)" :label="submission.status" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
import { contentSubmissionService } from '../services/content-submission.service';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import RichTextEditor from '../components/contribution/RichTextEditor.vue';
import type { ContentDoc } from '../types/core/content.types';

const $q = useQuasar();

// State
const isSubmitting = ref(false);
const isSavingDraft = ref(false);
const featuredImage = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const recentSubmissions = ref<ContentDoc[]>([]);

const submission = ref({
  title: '',
  contentType: '',
  content: '',
  author: '',
  contact: '',
  newsletterReady: true,
  featured: false
});

// Content type options
const contentTypeOptions = [
  { label: 'Community News', value: 'news' },
  { label: 'Event Announcement', value: 'event' },
  { label: 'Community Story', value: 'story' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Opinion/Editorial', value: 'opinion' },
  { label: 'Other', value: 'other' }
];

// Computed
const wordCount = computed(() => {
  if (!submission.value.content) return 0;
  return submission.value.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
});

const characterCount = computed(() => {
  return submission.value.content ? submission.value.content.replace(/<[^>]*>/g, '').length : 0;
});

const estimatedReadTime = computed(() => {
  const words = wordCount.value;
  const wordsPerMinute = 200;
  return Math.ceil(words / wordsPerMinute);
});

const isFormValid = computed(() => {
  return submission.value.title.length >= 5 &&
         submission.value.contentType &&
         submission.value.content.length >= 50 &&
         submission.value.author.length >= 2;
});

// Methods
const updateContent = (content: string) => {
  submission.value.content = content;
};

const onFileRejected = (rejectedEntries: any[]) => {
  const reasons = rejectedEntries.map(entry => entry.failedPropValidation).join(', ');
  $q.notify({
    type: 'negative',
    message: 'File rejected',
    caption: reasons
  });
};

const removeImage = () => {
  featuredImage.value = null;
  imagePreview.value = null;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'orange';
    case 'approved': return 'positive';
    case 'rejected': return 'negative';
    case 'published': return 'info';
    default: return 'grey';
  }
};

const formatDate = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString();
};

const loadRecentSubmissions = async () => {
  try {
    // This would need to be implemented in your content service
    // For now, we'll leave it empty
    recentSubmissions.value = [];
  } catch (error) {
    logger.error('Failed to load recent submissions:', error);
  }
};

const saveDraft = async () => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'warning',
      message: 'Please fill in all required fields before saving'
    });
    return;
  }

  isSavingDraft.value = true;
  try {
    // Save as draft (status: draft)
    const contentId = await contentSubmissionService.createContent(
      submission.value.title,
      submission.value.content,
      submission.value.contentType,
      {}, // features
      ['status:draft', 'newsletter:ready'] // tags
    );

    $q.notify({
      type: 'positive',
      message: 'Draft saved successfully!'
    });

    // Reset form
    resetForm();
    await loadRecentSubmissions();
  } catch (error) {
    logger.error('Failed to save draft:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save draft'
    });
  } finally {
    isSavingDraft.value = false;
  }
};

const submitContent = async () => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'warning',
      message: 'Please fill in all required fields'
    });
    return;
  }

  isSubmitting.value = true;
  try {
    // Create content with newsletter-ready tag
    const tags = ['status:pending', 'newsletter:ready'];
    if (submission.value.featured) {
      tags.push('featured:true');
    }

    const contentId = await contentSubmissionService.createContent(
      submission.value.title,
      submission.value.content,
      submission.value.contentType,
      {}, // features
      tags
    );

    // If newsletter ready, mark it for newsletter inclusion
    if (submission.value.newsletterReady) {
      await newsletterGenerationService.markContentForNewsletter(contentId);
    }

    $q.notify({
      type: 'positive',
      message: 'Content submitted successfully!',
      caption: 'Your submission is now under review and will be considered for the next newsletter.'
    });

    // Reset form
    resetForm();
    await loadRecentSubmissions();
  } catch (error) {
    logger.error('Failed to submit content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to submit content'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  submission.value = {
    title: '',
    contentType: '',
    content: '',
    author: '',
    contact: '',
    newsletterReady: true,
    featured: false
  };
  featuredImage.value = null;
  imagePreview.value = null;
};

const viewSubmission = (submission: ContentDoc) => {
  // TODO: Implement submission viewing
  $q.notify({
    type: 'info',
    message: 'Submission viewing coming soon!'
  });
};

// Watch for image changes
watch(featuredImage, (newFile) => {
  if (newFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(newFile);
  } else {
    imagePreview.value = null;
  }
});

// Lifecycle
onMounted(() => {
  loadRecentSubmissions();
});
</script>

<style scoped>
.max-width-800 {
  max-width: 800px;
  margin: 0 auto;
}

.q-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
