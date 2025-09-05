<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'

const router = useRouter()
const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

// Navigation functions - all go to unified submission page with content type pre-selected
function submitArticle() {
  void router.push({ path: '/contribute/submit', query: { type: 'article' } })
}

function submitPhotos() {
  void router.push({ path: '/contribute/submit', query: { type: 'photo' } })
}

function postEvent() {
  void router.push({ path: '/contribute/submit', query: { type: 'event' } })
}

function shareIdeas() {
  void router.push({ path: '/contribute/submit', query: { type: 'suggestion' } })
}

function quickPhotoUpload() {
  void router.push({ path: '/contribute/submit', query: { type: 'photo', mode: 'quick' } })
}
</script>

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
                Choose from our streamlined submission options below.
              </p>
            </q-card-section>
          </q-card>

          <!-- Quick Actions Section -->
          <q-card :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-flash" class="q-mr-sm" />
                Quick Actions
              </div>
              <div class="row">
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="secondary" icon="mdi-camera-plus" label="Quick Photo Upload" @click="quickPhotoUpload"
                    class="full-width" size="md" />
                </div>
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="accent" icon="mdi-calendar-plus" label="Post Event" @click="postEvent"
                    class="full-width" size="md" />
                </div>
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="positive" icon="mdi-lightbulb" label="Share Idea" @click="shareIdeas" class="full-width"
                    size="md" />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Main Contribution Types -->
          <div class="row">
            <div class="col-12 col-md-6 q-pa-md">
              <q-card :class="cardClasses" class="full-height">
                <q-card-section class="column full-height">
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
                    Articles & Stories
                  </div>
                  <p class="text-body2 q-mb-md flex-grow-1">
                    Share detailed stories, community insights, resident spotlights, or local history.
                    Perfect for longer-form content that tells a story or provides valuable information.
                  </p>
                  <q-btn color="primary" icon="mdi-file-document-edit" label="Write Article" @click="submitArticle"
                    class="full-width" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6 q-pa-md">
              <q-card :class="cardClasses" class="full-height">
                <q-card-section class="column full-height">
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-camera" class="q-mr-sm" />
                    Photo Collections
                  </div>
                  <p class="text-body2 q-mb-md flex-grow-1">
                    Submit curated photo collections with detailed descriptions, captions, and context.
                    Great for event coverage, seasonal highlights, or thematic galleries.
                  </p>
                  <q-btn color="secondary" icon="mdi-image-multiple" label="Submit Collection" @click="submitPhotos"
                    class="full-width" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Guidelines Section -->
          <q-card :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-information" class="q-mr-sm" />
                Submission Guidelines
              </div>
              <q-list>
                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-check-circle" color="positive" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Articles: 200-800 words preferred</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-check-circle" color="positive" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Photos: High resolution (300 DPI+)</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-check-circle" color="positive" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Community-appropriate content</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-check-circle" color="positive" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>All submissions reviewed before publishing</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.full-height {
  height: 100%;
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
