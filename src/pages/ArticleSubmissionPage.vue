<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'

const $q = useQuasar()
const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const form = ref({
  name: '',
  email: '',
  phone: '',
  title: '',
  category: '',
  content: '',
  additionalInfo: ''
})

const submitting = ref(false)

const categoryOptions = [
  'Community News',
  'Local History',
  'Resident Spotlight',
  'Event Coverage',
  'Nature & Wildlife',
  'Lake Activities',
  'Business Feature',
  'Opinion/Editorial',
  'Other'
]

async function onSubmit() {
  submitting.value = true

  // Simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1500))

  $q.notify({
    message: 'Article submitted successfully!',
    caption: 'We\'ll review your submission and get back to you soon.',
    color: 'positive',
    icon: 'mdi-check-circle'
  })

  // Reset form
  form.value = {
    name: '',
    email: '',
    phone: '',
    title: '',
    category: '',
    content: '',
    additionalInfo: ''
  }

  submitting.value = false
}

function openGoogleDrive() {
  window.open('https://drive.google.com/drive/folders/sample-courier-submissions', '_blank')
}

function openEmail() {
  window.open('mailto:articles@conashaughlakes.com?subject=Article Submission', '_blank')
}

function openDiscord() {
  window.open('https://discord.gg/conashaugh-courier', '_blank')
}
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-file-document-edit" class="q-mr-sm" />
                Article Submission
              </div>
              <p class="text-body1">
                Share your stories, experiences, or community insights with The Courier. We welcome articles on
                various topics including community events, local history, resident spotlights, and more.
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <!-- Submission Methods -->
            <div class="col-12 col-md-4">
              <q-card :class="cardClasses" class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-upload" class="q-mr-sm" />
                    Submission Methods
                  </div>

                  <q-list>
                    <q-item clickable @click="openGoogleDrive" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-google-drive" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Google Drive</q-item-label>
                        <q-item-label caption>Upload directly to our shared folder</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable @click="openEmail" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-email" color="secondary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Email</q-item-label>
                        <q-item-label caption>articles@conashaughlakes.com</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable @click="openDiscord" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-discord" color="accent" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Discord</q-item-label>
                        <q-item-label caption>Join our community server</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>

              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-information" class="q-mr-sm" />
                    Guidelines
                  </div>
                  <q-list>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>200-800 words preferred</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Include your contact info</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Community-appropriate content</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-check-circle" color="positive" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Include photos if available</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <!-- Submission Form -->
            <div class="col-12 col-md-8">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Submit Your Article</div>
                  <p class="text-body2 q-mb-md text-grey-6">
                    Use this form for quick submissions. For longer articles or those with images,
                    consider using our Google Drive or email options above.
                  </p>

                  <q-form @submit="onSubmit" class="q-col-gutter-md">
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-sm-6">
                        <q-input v-model="form.name" label="Your Name" filled
                          :rules="[val => !!val || 'Name is required']">
                          <template v-slot:prepend>
                            <q-icon name="mdi-account" />
                          </template>
                        </q-input>
                      </div>

                      <div class="col-12 col-sm-6">
                        <q-input v-model="form.email" label="Email Address" type="email" filled
                          :rules="[val => !!val || 'Email is required']">
                          <template v-slot:prepend>
                            <q-icon name="mdi-email" />
                          </template>
                        </q-input>
                      </div>
                    </div>

                    <q-input v-model="form.phone" label="Phone Number (Optional)" filled>
                      <template v-slot:prepend>
                        <q-icon name="mdi-phone" />
                      </template>
                    </q-input>

                    <q-input v-model="form.title" label="Article Title" filled
                      :rules="[val => !!val || 'Title is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-format-title" />
                      </template>
                    </q-input>

                    <q-select v-model="form.category" :options="categoryOptions" label="Article Category" filled
                      :rules="[val => !!val || 'Category is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-tag" />
                      </template>
                    </q-select>

                    <q-input v-model="form.content" label="Article Content" type="textarea" rows="10" filled
                      hint="Share your story, experience, or community insight here"
                      :rules="[val => !!val || 'Content is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-text" />
                      </template>
                    </q-input>

                    <q-input v-model="form.additionalInfo" label="Additional Information (Optional)" type="textarea"
                      rows="3" filled hint="Any additional context, photo descriptions, or special requests">
                      <template v-slot:prepend>
                        <q-icon name="mdi-information" />
                      </template>
                    </q-input>

                    <div class="text-center q-mt-md">
                      <q-btn type="submit" color="primary" icon="mdi-send" label="Submit Article" :loading="submitting"
                        size="lg" />
                    </div>
                  </q-form>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
