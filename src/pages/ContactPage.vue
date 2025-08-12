<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'

const $q = useQuasar()
const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
  // Use specific classes that ensure proper theming for all child components
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
}); const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const submitting = ref(false)

const subjectOptions = [
  'General Inquiry',
  'Article Submission',
  'Photo Submission',
  'Event Announcement',
  'Advertising',
  'Technical Issue',
  'Feedback',
  'Other'
]

async function onSubmit() {
  submitting.value = true

  // Simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1000))

  $q.notify({
    message: 'Message sent successfully!',
    caption: 'We\'ll get back to you soon.',
    color: 'positive',
    icon: 'mdi-check-circle'
  })

  // Reset form
  form.value = {
    name: '',
    email: '',
    subject: '',
    message: ''
  }

  submitting.value = false
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
                <q-icon name="mdi-phone" class="q-mr-sm" />
                Contact Us
              </div>
              <p class="text-body1">
                Get in touch with The Courier team. We're here to help with questions, submissions,
                and community inquiries.
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Contact Information</div>

                  <q-list>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-email" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Email</q-item-label>
                        <q-item-label caption>courier@conashaughlakes.com</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-phone" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Phone</q-item-label>
                        <q-item-label caption>(570) 555-0100</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-map-marker" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Address</q-item-label>
                        <q-item-label caption>
                          Conashaugh Lakes Community Center<br>
                          123 Lake Drive<br>
                          Milford, PA 18337
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-clock" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Office Hours</q-item-label>
                        <q-item-label caption>
                          Monday - Friday: 9:00 AM - 5:00 PM<br>
                          Saturday: 10:00 AM - 2:00 PM<br>
                          Sunday: Closed
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Send us a Message</div>

                  <q-form @submit="onSubmit" class="q-col-gutter-md">
                    <q-input v-model="form.name" label="Your Name" filled :rules="[val => !!val || 'Name is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-account" />
                      </template>
                    </q-input>

                    <q-input v-model="form.email" label="Email Address" type="email" filled
                      :rules="[val => !!val || 'Email is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-email" />
                      </template>
                    </q-input>

                    <q-select v-model="form.subject" :options="subjectOptions" label="Subject" filled
                      :rules="[val => !!val || 'Subject is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-tag" />
                      </template>
                    </q-select>

                    <q-input v-model="form.message" label="Message" type="textarea" rows="4" filled
                      :rules="[val => !!val || 'Message is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-message-text" />
                      </template>
                    </q-input>

                    <div class="text-center">
                      <q-btn type="submit" color="primary" icon="mdi-send" label="Send Message" :loading="submitting" />
                    </div>
                  </q-form>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-card :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Editorial Team</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-item>
                    <q-item-section side>
                      <q-avatar color="primary" text-color="white" icon="mdi-account-edit" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">Sarah Johnson</q-item-label>
                      <q-item-label caption>Editor-in-Chief</q-item-label>
                    </q-item-section>
                  </q-item>
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-item>
                    <q-item-section side>
                      <q-avatar color="secondary" text-color="white" icon="mdi-camera" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">Mike Roberts</q-item-label>
                      <q-item-label caption>Photography Editor</q-item-label>
                    </q-item-section>
                  </q-item>
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-item>
                    <q-item-section side>
                      <q-avatar color="accent" text-color="white" icon="mdi-newspaper" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">Lisa Chen</q-item-label>
                      <q-item-label caption>Community Reporter</q-item-label>
                    </q-item-section>
                  </q-item>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>
