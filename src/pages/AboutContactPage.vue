<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../composables/useTheme'
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys'

const $q = useQuasar()
const router = useRouter()
const { cardClasses } = useTheme()
const { t } = useI18n()

// About section functions
function volunteer() {
  // Open the Google Form in a new tab
  window.open('https://forms.gle/dSVMMUF4Xrf9RBDb8', '_blank')
}

function contribute() {
  void router.push('/contribute')
}

// Scroll to contact section
function scrollToContact() {
  const contactSection = document.getElementById('contact-section')
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Contact form
const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const submitting = ref(false)

const subjectOptions = [
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.GENERAL),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.ARTICLE),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.PHOTO),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.EVENT),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.ADVERTISING),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.TECHNICAL),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.FEEDBACK),
  t(TRANSLATION_KEYS.ABOUT.SUBJECT_OPTIONS.OTHER)
]

async function onSubmit() {
  submitting.value = true

  // Simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1000))

  $q.notify({
    message: t(TRANSLATION_KEYS.SUCCESS.SENT),
    caption: t('about.contactFormDescription'),
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



          <!-- About Header -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section class="row q-col-gutter-md">
              <div class="col">
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-help-circle" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.ABOUT.TITLE) }}
              </div>
              <p class="text-body1">
                {{ t(TRANSLATION_KEYS.ABOUT.DESCRIPTION) }}
              </p>
              </div>

              <!-- Quick Contact Button -->
              <div class="col-auto text-center q-mt-md">
                <q-btn
                  color="primary"
                  icon="mdi-message"
                  :label="t(TRANSLATION_KEYS.ABOUT.QUICK_CONTACT)"
                  @click="scrollToContact"
                  outline
                  class="q-px-lg"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- About Content -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-target" class="q-mr-sm" />
                    {{ t(TRANSLATION_KEYS.ABOUT.OUR_MISSION) }}
                  </div>
                  <p class="text-body2">
                    {{ t(TRANSLATION_KEYS.ABOUT.MISSION_DESCRIPTION) }}
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-history" class="q-mr-sm" />
                    {{ t(TRANSLATION_KEYS.ABOUT.WHAT_WE_DO) }}
                  </div>
                  <p class="text-body2">
                    {{ t(TRANSLATION_KEYS.ABOUT.WHAT_WE_DO_DESCRIPTION) }}
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-eye" class="q-mr-sm" />
                    What We Cover
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-calendar" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Community Events</q-item-label>
                          <q-item-label caption>Meetings, activities, and celebrations</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-newspaper" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Local News</q-item-label>
                          <q-item-label caption>Updates and announcements</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-nature" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Lake Activities</q-item-label>
                          <q-item-label caption>Recreation and conservation</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-account-group" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Resident Spotlights</q-item-label>
                          <q-item-label caption>Community member features</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-card flat :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Community Statistics</div>
              <div class="row q-col-gutter-md text-center">
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card :class="cardClasses" class="q-pa-md">
                    <q-icon name="mdi-home-group" size="2em" color="primary" />
                    <div class="text-h5 text-weight-bold q-mt-sm">450+</div>
                    <div class="text-caption">Households</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card :class="cardClasses" class="q-pa-md">
                    <q-icon name="mdi-water" size="2em" color="blue" />
                    <div class="text-h5 text-weight-bold q-mt-sm">3</div>
                    <div class="text-caption">Beautiful Lakes</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card :class="cardClasses" class="q-pa-md">
                    <q-icon name="mdi-calendar-multiple" size="2em" color="green" />
                    <div class="text-h5 text-weight-bold q-mt-sm">12</div>
                    <div class="text-caption">Issues Per Year</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card :class="cardClasses" class="q-pa-md">
                    <q-icon name="mdi-clock" size="2em" color="orange" />
                    <div class="text-h5 text-weight-bold q-mt-sm">29</div>
                    <div class="text-caption">Years Publishing</div>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card :class="cardClasses" class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Get Involved</div>
              <p class="text-body2 q-mb-md">
                The Courier is made possible by dedicated volunteers from our community.
                We're always looking for new contributors and helpers.
              </p>
              <div class="text-center">
                <q-btn color="primary" icon="mdi-hand-heart" label="Volunteer with Us" @click="volunteer"
                  class="q-mr-sm" />
                <q-btn color="secondary" icon="mdi-pencil" label="Contribute Content" @click="contribute" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Contact Section -->
          <q-card id="contact-section" flat :class="cardClasses" class="q-mt-xl">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-message" class="q-mr-sm" />
                Contact Us
              </div>
              <p class="text-body1">
                Get in touch with The Courier team. We're here to help with questions, submissions,
                and community inquiries.
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md q-mt-md">
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
