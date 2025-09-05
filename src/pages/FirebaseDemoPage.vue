<template>
  <q-page class="firebase-demo-page q-pa-md">
    <div class="row q-gutter-md">
      <!-- Authentication Section -->
      <div class="col-12 col-md-6">
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">🔐 Firebase Authentication</div>

            <div v-if="!auth.isAuthenticated.value" class="q-gutter-sm">
              <q-btn
                @click="signInWithGoogle"
                color="primary"
                icon="mdi-google"
                label="Sign in with Google (Popup)"
                :loading="auth.isLoading.value"
                class="full-width"
              />

              <q-separator class="q-my-sm" />
              <div class="text-caption text-grey-6 q-mb-sm">If popup fails, try these alternatives:</div>

              <q-btn
                @click="signInWithGoogleRedirect"
                color="secondary"
                icon="mdi-google"
                label="Sign in with Google (Redirect)"
                :loading="auth.isLoading.value"
                class="full-width"
                outline
              />

              <q-btn
                @click="testPopupBlocking"
                color="orange"
                icon="mdi-alert-circle"
                label="Test Popup Blocking"
                size="sm"
                class="full-width"
                flat
              />

              <q-separator class="q-my-sm" />

              <q-btn
                @click="signInWithProvider('facebook')"
                color="blue-8"
                icon="mdi-facebook"
                label="Sign in with Facebook"
                :loading="auth.isLoading.value"
                class="full-width"
              />
            </div>

            <div v-else class="q-gutter-sm">
              <q-card flat bordered class="q-pa-sm">
                <q-item>
                  <q-item-section avatar>
                    <q-avatar>
                      <img :src="auth.currentUser.value?.photoURL || ''" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ auth.currentUser.value?.displayName }}</q-item-label>
                    <q-item-label caption>{{ auth.currentUser.value?.email }}</q-item-label>
                    <q-item-label caption class="text-orange">UID: {{ auth.currentUser.value?.uid }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>

              <q-btn
                @click="copyUID"
                color="amber"
                icon="mdi-content-copy"
                label="Copy UID for Admin Setup"
                size="sm"
                class="full-width"
                flat
              />

              <q-btn
                @click="signOut"
                color="negative"
                icon="mdi-logout"
                label="Sign Out"
                class="full-width"
              />
            </div>

            <q-banner v-if="auth.error.value" class="bg-negative text-white q-mt-md">
              {{ auth.error.value }}
            </q-banner>
          </q-card-section>
        </q-card>

        <!-- Auth Troubleshooter -->
        <FirebaseAuthTroubleshooter v-if="showTroubleshooter" class="q-mt-md" />

        <q-btn
          @click="showTroubleshooter = !showTroubleshooter"
          flat
          :label="showTroubleshooter ? 'Hide Troubleshooter' : 'Show Auth Troubleshooter'"
          class="q-mt-sm"
        />
      </div>

      <!-- File Upload Section -->
      <div class="col-12 col-md-6">
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">📁 Firebase Storage</div>

            <q-file
              v-model="selectedFile"
              accept=".pdf"
              label="Select PDF file"
              filled
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="mdi-file-pdf-box" />
              </template>
            </q-file>

            <q-input
              v-model="uploadMetadata.title"
              label="Newsletter Title"
              filled
              class="q-mb-md"
            />

            <q-input
              v-model="uploadMetadata.publicationDate"
              label="Publication Date"
              type="date"
              filled
              class="q-mb-md"
            />

            <q-btn
              @click="uploadPdf"
              color="primary"
              icon="mdi-upload"
              label="Upload PDF"
              :disabled="!selectedFile || !auth.isAuthenticated.value || !uploadMetadata.title"
              :loading="storage.isUploading.value"
              class="full-width"
            />

            <q-linear-progress
              v-if="storage.uploadProgress.value"
              :value="storage.uploadProgress.value.percentage / 100"
              color="primary"
              class="q-mt-md"
            />

            <q-banner v-if="storage.error.value" class="bg-negative text-white q-mt-md">
              {{ storage.error.value }}
            </q-banner>
          </q-card-section>
        </q-card>
      </div>

      <!-- Newsletters List Section -->
      <div class="col-12">
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">📰 Newsletter Database</div>

            <q-btn
              @click="loadNewsletters"
              color="primary"
              icon="mdi-refresh"
              label="Load Newsletters"
              :loading="newsletters.isLoading.value"
              class="q-mb-md"
            />

            <q-list v-if="newsletters.newsletters.value.length > 0" bordered separator>
              <q-item
                v-for="newsletter in newsletters.newsletters.value"
                :key="newsletter.id"
                clickable
                @click="openNewsletter(newsletter)"
              >
                <q-item-section avatar>
                  <q-icon name="mdi-file-pdf-box" color="red" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ newsletter.title }}</q-item-label>
                  <q-item-label caption>
                    {{ formatDate(newsletter.publicationDate) }} • {{ formatFileSize(newsletter.fileSize) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    :color="newsletter.isPublished ? 'green' : 'orange'"
                    text-color="white"
                    :label="newsletter.isPublished ? 'Published' : 'Draft'"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else-if="!newsletters.isLoading.value" class="text-center text-grey-6 q-pa-lg">
              No newsletters found. Upload some PDFs to get started!
            </div>

            <q-banner v-if="newsletters.error.value" class="bg-negative text-white q-mt-md">
              {{ newsletters.error.value }}
            </q-banner>
          </q-card-section>
        </q-card>
      </div>

      <!-- User Content Submission Section -->
      <div class="col-12" v-if="auth.isAuthenticated.value">
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">✍️ Submit Content</div>

            <q-select
              v-model="contentSubmission.type"
              :options="contentTypes"
              label="Content Type"
              emit-value
              map-options
              filled
              class="q-mb-md"
            />

            <q-input
              v-model="contentSubmission.title"
              label="Title"
              filled
              class="q-mb-md"
            />

            <q-input
              v-model="contentSubmission.content"
              label="Content"
              type="textarea"
              rows="4"
              filled
              class="q-mb-md"
            />

            <q-input
              v-model="contentSubmission.tags"
              label="Tags (comma-separated)"
              filled
              class="q-mb-md"
            />

            <q-btn
              @click="submitContent"
              color="primary"
              icon="mdi-send"
              label="Submit for Review"
              :disabled="!contentSubmission.title || !contentSubmission.content"
              :loading="userContent.isLoading.value"
              class="full-width"
            />

            <q-banner v-if="userContent.error.value" class="bg-negative text-white q-mt-md">
              {{ userContent.error.value }}
            </q-banner>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useFirebase } from '../composables/useFirebase';
import FirebaseAuthTroubleshooter from '../components/FirebaseAuthTroubleshooter.vue';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';

const $q = useQuasar();

// Initialize Firebase composables
const { auth, newsletters, storage, userContent } = useFirebase();

// UI state
const showTroubleshooter = ref(false);

// Reactive data
const selectedFile = ref<File | null>(null);
const uploadMetadata = ref({
  title: '',
  publicationDate: '',
  year: new Date().getFullYear(),
  season: 'summer' as const,
  tags: [] as string[],
});

const contentSubmission = ref({
  type: 'article' as const,
  title: '',
  content: '',
  tags: '',
});

const contentTypes = [
  { label: 'Article', value: 'article' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Event', value: 'event' },
  { label: 'Classified', value: 'classified' },
  { label: 'Photo', value: 'photo' },
];

// Methods
const signInWithGoogle = async () => {
  try {
    await auth.signIn('google');
    $q.notify({
      type: 'positive',
      message: 'Successfully signed in with Google!',
    });
  } catch (error) {
    console.error('Popup sign in failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to sign in with Google popup. Try the redirect method below.',
    });
  }
};

const signInWithGoogleRedirect = async () => {
  try {
    console.log('Attempting redirect sign in...');
    await auth.signInWithRedirect('google');
    // Note: Page will redirect, so success message will be shown after redirect
  } catch (error) {
    console.error('Redirect sign in failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to sign in with Google redirect',
    });
  }
};

const testPopupBlocking = () => {
  const popup = window.open('about:blank', '_blank', 'width=500,height=500');
  if (!popup) {
    $q.notify({
      type: 'negative',
      message: 'Popup BLOCKED by browser! This will prevent authentication.',
    });
    return false;
  } else {
    popup.close();
    $q.notify({
      type: 'positive',
      message: 'Popup test passed - browser allows popups',
    });
    return true;
  }
};

const copyUID = async () => {
  const uid = auth.currentUser.value?.uid;
  if (uid) {
    try {
      await navigator.clipboard.writeText(uid);
      $q.notify({
        type: 'positive',
        message: `UID copied to clipboard: ${uid}`,
      });
    } catch (error) {
      console.error('Failed to copy UID:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to copy UID to clipboard',
      });
    }
  }
};

const signInWithProvider = async (provider: 'facebook' | 'twitter' | 'github') => {
  try {
    await auth.signIn(provider);
    $q.notify({
      type: 'positive',
      message: `Successfully signed in with ${provider}!`,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: `Failed to sign in with ${provider}`,
    });
  }
};

const signOut = async () => {
  try {
    await auth.signOut();
    $q.notify({
      type: 'positive',
      message: 'Successfully signed out!',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to sign out',
    });
  }
};

const uploadPdf = async () => {
  if (!selectedFile.value || !uploadMetadata.value.title) return;

  try {
    const result = await storage.uploadPdf(selectedFile.value, {
      title: uploadMetadata.value.title,
      publicationDate: uploadMetadata.value.publicationDate,
      year: uploadMetadata.value.year,
      season: uploadMetadata.value.season,
      tags: uploadMetadata.value.tags,
    });

    // Save metadata to Firestore
    await newsletters.saveNewsletter({
      filename: selectedFile.value.name,
      title: uploadMetadata.value.title,
      description: '',
      publicationDate: uploadMetadata.value.publicationDate,
      year: uploadMetadata.value.year,
      season: uploadMetadata.value.season,
      fileSize: selectedFile.value.size,
      downloadUrl: result.downloadUrl,
      storageRef: result.storagePath,
      tags: uploadMetadata.value.tags,
      featured: false,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: auth.currentUser.value?.uid || '',
      updatedBy: auth.currentUser.value?.uid || '',
    });

    $q.notify({
      type: 'positive',
      message: 'PDF uploaded and saved successfully!',
    });

    // Reset form
    selectedFile.value = null;
    uploadMetadata.value = {
      title: '',
      publicationDate: '',
      year: new Date().getFullYear(),
      season: 'summer',
      tags: [],
    };

    // Reload newsletters
    loadNewsletters().catch(console.error);
  } catch (uploadError) {
    $q.notify({
      type: 'negative',
      message: 'Failed to upload PDF',
    });
    console.error('Upload failed:', uploadError);
  }
};

const loadNewsletters = async () => {
  try {
    await newsletters.loadNewsletters();
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletters',
    });
  }
};

const submitContent = async () => {
  if (!contentSubmission.value.title || !contentSubmission.value.content) return;

  try {
    await userContent.submitContent({
      type: contentSubmission.value.type,
      title: contentSubmission.value.title,
      content: contentSubmission.value.content,
      tags: contentSubmission.value.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      attachments: [],
      metadata: {
        submissionSource: 'web' as const,
      },
    });

    $q.notify({
      type: 'positive',
      message: 'Content submitted for review!',
    });

    // Reset form
    contentSubmission.value = {
      type: 'article',
      title: '',
      content: '',
      tags: '',
    };
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to submit content',
    });
  }
};

const openNewsletter = (newsletter: NewsletterMetadata) => {
  // Open PDF in new tab
  window.open(newsletter.downloadUrl, '_blank');
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Initialize
onMounted(() => {
  loadNewsletters().catch(console.error);
});
</script>

<style scoped>
.firebase-demo-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
