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
  ideaType: '',
  ideaTitle: '',
  description: '',
  benefits: '',
  implementation: '',
  resources: '',
  priority: '',
  additionalInfo: ''
})

const submitting = ref(false)

const ideaTypeOptions = [
  'Newsletter Improvement',
  'Community Event Ideas',
  'Communication Enhancement',
  'Technology Suggestions',
  'Content Ideas',
  'Website Features',
  'Social Media',
  'Community Services',
  'Environmental Initiative',
  'Safety & Security',
  'Recreation & Activities',
  'Business & Economic',
  'Other'
]

const priorityOptions = [
  'Low - Nice to have',
  'Medium - Would be beneficial',
  'High - Really needed',
  'Urgent - Critical issue'
]

async function onSubmit() {
  submitting.value = true

  // Simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1500))

  $q.notify({
    message: 'Ideas submitted successfully!',
    caption: 'Thank you for helping improve our community!',
    color: 'positive',
    icon: 'mdi-check-circle'
  })

  // Reset form
  form.value = {
    name: '',
    email: '',
    phone: '',
    ideaType: '',
    ideaTitle: '',
    description: '',
    benefits: '',
    implementation: '',
    resources: '',
    priority: '',
    additionalInfo: ''
  }

  submitting.value = false
}

function openEmail() {
  window.open('mailto:ideas@conashaughlakes.com?subject=Community Ideas & Suggestions', '_blank')
}

function openFacebook() {
  window.open('https://www.facebook.com/groups/conashaughcommunity', '_blank')
}

function openDiscord() {
  window.open('https://discord.gg/EB8uRwhyp4', '_blank')
}

function openReddit() {
  window.open('https://www.reddit.com/r/conashaughlakes', '_blank')
}

function openSurvey() {
  window.open('https://forms.google.com/courier-community-feedback', '_blank')
}

function openForum() {
  window.open('https://community.conashaughlakes.com/ideas', '_blank')
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
                <q-icon name="mdi-lightbulb" class="q-mr-sm" />
                Share Ideas & Suggestions
              </div>
              <p class="text-body1">
                Have ideas for improving The Courier or our community? We'd love to hear your
                suggestions,
                feedback, and creative solutions. Your input helps make our community better for
                everyone!
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <!-- Submission Methods -->
            <div class="col-12 col-md-4">
              <q-card :class="cardClasses" class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-forum" class="q-mr-sm" />
                    Share Your Ideas
                  </div>

                  <q-list>
                    <q-item clickable @click="openEmail" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-email" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Email</q-item-label>
                        <q-item-label caption>ideas@conashaughlakes.com</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable @click="openDiscord" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-discord" color="secondary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Discord</q-item-label>
                        <q-item-label caption>Join community discussions</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable @click="openSurvey" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-clipboard-list" color="accent" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Community Survey</q-item-label>
                        <q-item-label caption>Annual feedback form</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable @click="openForum" class="q-mb-sm rounded-borders">
                      <q-item-section side>
                        <q-icon name="mdi-forum" color="positive" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Community Forum</q-item-label>
                        <q-item-label caption>Discuss with neighbors</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>

              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-star" class="q-mr-sm" />
                    Idea Categories
                  </div>
                  <q-list>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-newspaper" color="primary" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Newsletter content & format</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-web" color="secondary" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Website features & improvements</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-calendar" color="accent" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Community events & activities</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-message" color="positive" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Communication methods</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="mdi-home-group" color="orange" size="sm" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Community services & amenities</q-item-label>
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
                  <div class="text-h6 q-mb-md">Submit Your Idea</div>
                  <p class="text-body2 q-mb-md text-grey-6">
                    Share your ideas, suggestions, or feedback to help improve our community and
                    newsletter.
                    The more detailed your suggestion, the better we can understand and implement
                    it.
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

                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-sm-6">
                        <q-select v-model="form.ideaType" :options="ideaTypeOptions" label="Idea Category" filled
                          :rules="[val => !!val || 'Category is required']">
                          <template v-slot:prepend>
                            <q-icon name="mdi-tag" />
                          </template>
                        </q-select>
                      </div>

                      <div class="col-12 col-sm-6">
                        <q-select v-model="form.priority" :options="priorityOptions" label="Priority Level" filled>
                          <template v-slot:prepend>
                            <q-icon name="mdi-flag" />
                          </template>
                        </q-select>
                      </div>
                    </div>

                    <q-input v-model="form.ideaTitle" label="Idea Title/Summary" filled
                      hint="Brief title that describes your idea" :rules="[val => !!val || 'Title is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-format-title" />
                      </template>
                    </q-input>

                    <q-input v-model="form.description" label="Detailed Description" type="textarea" rows="6" filled
                      hint="Explain your idea in detail - what is it, how would it work, why is it needed?"
                      :rules="[val => !!val || 'Description is required']">
                      <template v-slot:prepend>
                        <q-icon name="mdi-text" />
                      </template>
                    </q-input>

                    <q-input v-model="form.benefits" label="Benefits & Impact" type="textarea" rows="4" filled
                      hint="How would this idea benefit the community or improve The Courier?">
                      <template v-slot:prepend>
                        <q-icon name="mdi-chart-line" />
                      </template>
                    </q-input>

                    <q-input v-model="form.implementation" label="Implementation Ideas (Optional)" type="textarea"
                      rows="4" filled hint="Do you have thoughts on how this could be implemented or put into action?">
                      <template v-slot:prepend>
                        <q-icon name="mdi-cog" />
                      </template>
                    </q-input>

                    <q-input v-model="form.resources" label="Resources Needed (Optional)" type="textarea" rows="3"
                      filled hint="What resources (time, money, people, tools) might be needed?">
                      <template v-slot:prepend>
                        <q-icon name="mdi-toolbox" />
                      </template>
                    </q-input>

                    <q-input v-model="form.additionalInfo" label="Additional Information (Optional)" type="textarea"
                      rows="3" filled hint="Any other relevant information, examples, or context">
                      <template v-slot:prepend>
                        <q-icon name="mdi-information" />
                      </template>
                    </q-input>

                    <div class="text-center q-mt-md">
                      <q-btn type="submit" color="positive" icon="mdi-send" label="Submit Ideas" :loading="submitting"
                        size="lg" />
                    </div>

                    <div class="text-center q-mt-sm">
                      <p class="text-caption text-grey-6">
                        All ideas are reviewed by our editorial team. We'll follow up if we need
                        more information
                        or have questions about your suggestion.
                      </p>
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
