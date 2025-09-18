<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../composables/useTheme'
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys'

// Import Base Components for Maximum Reuse
import BaseTabbedContent from '../components/BaseTabbedContent.vue'
import BaseStatsGrid from '../components/BaseStatsGrid.vue'
import BaseContentList from '../components/BaseContentList.vue'
import BaseActionToolbar from '../components/BaseActionToolbar.vue'

// Base component interfaces
import type { TabConfig } from '../components/BaseTabbedContent.vue'

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  style?: 'outline' | 'flat';
  size?: 'sm' | 'md';
  to?: string;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionSection {
  title: string;
  titleIcon: string;
  description: string;
  primaryAction: ActionButton;
  secondaryActions: ActionButton[];
}

interface AboutListItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'coverage' | 'team' | 'contact';
  role?: string;
  avatar?: string;
}

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

// Active tab for BaseTabbedContent
const activeAboutTab = ref('about');

// Computed properties for Base Components

// 1. About Page Tabs Configuration for BaseTabbedContent
const aboutTabs = computed<TabConfig[]>(() => [
  {
    name: 'about',
    label: t(TRANSLATION_KEYS.ABOUT.TITLE),
    icon: 'mdi-help-circle',
    description: 'About our community and mission'
  },
  {
    name: 'team',
    label: 'Editorial Team',
    icon: 'mdi-account-group',
    description: 'Meet our editorial team'
  },
  {
    name: 'contact',
    label: t(TRANSLATION_KEYS.ABOUT.CONTACT_SECTION),
    icon: 'mdi-message',
    description: 'Contact information and form'
  }
]);

// 2. Community Statistics for BaseStatsGrid
const communityStats = computed<StatItem[]>(() => [
  {
    label: t(TRANSLATION_KEYS.ABOUT.COMMUNITY_STATS.HOUSEHOLDS),
    value: '450+',
    icon: 'mdi-home-group',
    color: 'primary',
    description: 'Active households in our community'
  },
  {
    label: t(TRANSLATION_KEYS.ABOUT.COMMUNITY_STATS.BEAUTIFUL_LAKES),
    value: '3',
    icon: 'mdi-water',
    color: 'blue',
    description: 'Beautiful lakes in our area'
  },
  {
    label: t(TRANSLATION_KEYS.ABOUT.COMMUNITY_STATS.ISSUES_PER_YEAR),
    value: '12',
    icon: 'mdi-calendar-multiple',
    color: 'green',
    description: 'Newsletter issues published annually'
  },
  {
    label: t(TRANSLATION_KEYS.ABOUT.COMMUNITY_STATS.YEARS_PUBLISHING),
    value: '29',
    icon: 'mdi-clock',
    color: 'orange',
    description: 'Years of continuous publishing'
  }
]);

// 3. Coverage Areas for BaseContentList
const coverageAreas = computed<AboutListItem[]>(() => [
  {
    id: 'community-events',
    title: t(TRANSLATION_KEYS.ABOUT.COVERAGE.COMMUNITY_EVENTS.TITLE),
    description: t(TRANSLATION_KEYS.ABOUT.COVERAGE.COMMUNITY_EVENTS.DESCRIPTION),
    icon: 'mdi-calendar',
    color: 'primary',
    type: 'coverage'
  },
  {
    id: 'local-news',
    title: t(TRANSLATION_KEYS.ABOUT.COVERAGE.LOCAL_NEWS.TITLE),
    description: t(TRANSLATION_KEYS.ABOUT.COVERAGE.LOCAL_NEWS.DESCRIPTION),
    icon: 'mdi-newspaper',
    color: 'primary',
    type: 'coverage'
  },
  {
    id: 'lake-activities',
    title: t(TRANSLATION_KEYS.ABOUT.COVERAGE.LAKE_ACTIVITIES.TITLE),
    description: t(TRANSLATION_KEYS.ABOUT.COVERAGE.LAKE_ACTIVITIES.DESCRIPTION),
    icon: 'mdi-nature',
    color: 'primary',
    type: 'coverage'
  },
  {
    id: 'resident-spotlights',
    title: t(TRANSLATION_KEYS.ABOUT.COVERAGE.RESIDENT_SPOTLIGHTS.TITLE),
    description: t(TRANSLATION_KEYS.ABOUT.COVERAGE.RESIDENT_SPOTLIGHTS.DESCRIPTION),
    icon: 'mdi-account-group',
    color: 'primary',
    type: 'coverage'
  }
]);

// 4. Editorial Team for BaseContentList
const editorialTeam = computed<AboutListItem[]>(() => [
  {
    id: 'sarah-johnson',
    title: 'Sarah Johnson',
    description: t(TRANSLATION_KEYS.ABOUT.EDITORIAL_TEAM.EDITOR_IN_CHIEF),
    icon: 'mdi-account-edit',
    color: 'primary',
    type: 'team',
    role: 'editor',
    avatar: 'mdi-account-edit'
  },
  {
    id: 'mike-roberts',
    title: 'Mike Roberts',
    description: t(TRANSLATION_KEYS.ABOUT.EDITORIAL_TEAM.PHOTOGRAPHY_EDITOR),
    icon: 'mdi-camera',
    color: 'secondary',
    type: 'team',
    role: 'photographer',
    avatar: 'mdi-camera'
  },
  {
    id: 'lisa-chen',
    title: 'Lisa Chen',
    description: t(TRANSLATION_KEYS.ABOUT.EDITORIAL_TEAM.COMMUNITY_REPORTER),
    icon: 'mdi-newspaper',
    color: 'accent',
    type: 'team',
    role: 'reporter',
    avatar: 'mdi-newspaper'
  }
]);

// 5. Contact Information for BaseContentList
const contactInfo = computed<AboutListItem[]>(() => [
  {
    id: 'email',
    title: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.EMAIL),
    description: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.EMAIL_VALUE),
    icon: 'mdi-email',
    color: 'primary',
    type: 'contact'
  },
  {
    id: 'phone',
    title: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.PHONE),
    description: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.PHONE_VALUE),
    icon: 'mdi-phone',
    color: 'primary',
    type: 'contact'
  },
  {
    id: 'address',
    title: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.ADDRESS),
    description: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.ADDRESS_VALUE),
    icon: 'mdi-map-marker',
    color: 'primary',
    type: 'contact'
  },
  {
    id: 'hours',
    title: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.OFFICE_HOURS),
    description: t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO_DETAILS.OFFICE_HOURS_VALUE),
    icon: 'mdi-clock',
    color: 'primary',
    type: 'contact'
  }
]);

// 6. Action Sections for BaseActionToolbar
const aboutActions = computed<ActionSection[]>(() => [
  {
    title: t(TRANSLATION_KEYS.ABOUT.GET_INVOLVED.TITLE),
    titleIcon: 'mdi-hand-heart',
    description: t(TRANSLATION_KEYS.ABOUT.GET_INVOLVED.DESCRIPTION),
    primaryAction: {
      label: t(TRANSLATION_KEYS.ABOUT.GET_INVOLVED.VOLUNTEER_BUTTON),
      icon: 'mdi-hand-heart',
      color: 'primary',
      action: 'volunteer'
    },
    secondaryActions: [
      {
        label: t(TRANSLATION_KEYS.ABOUT.GET_INVOLVED.CONTRIBUTE_BUTTON),
        icon: 'mdi-pencil',
        color: 'secondary',
        action: 'contribute'
      },
      {
        label: t(TRANSLATION_KEYS.ABOUT.QUICK_CONTACT),
        icon: 'mdi-message',
        color: 'primary',
        action: 'scroll-to-contact',
        style: 'outline'
      }
    ]
  }
]);

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
    caption: t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DESCRIPTION),
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

// Base Component Event Handlers

// Handle tab changes
const handleTabChange = (tabName: string) => {
  activeAboutTab.value = tabName;

  // If switching to contact tab, scroll to contact section
  if (tabName === 'contact') {
    setTimeout(() => scrollToContact(), 100);
  }
};

// Handle action clicks from BaseActionToolbar
const handleActionClick = (action: ActionButton) => {
  switch (action.action) {
    case 'volunteer':
      volunteer();
      break;
    case 'contribute':
      contribute();
      break;
    case 'scroll-to-contact':
      activeAboutTab.value = 'contact';
      setTimeout(() => scrollToContact(), 100);
      break;
    default:
      console.warn('Unknown action:', action.action);
  }
};

// Handle stats click (optional - could show additional info)
const handleStatClick = (stat: StatItem) => {
  // Optional: Could show detailed community information
  const notifyOptions: Record<string, unknown> = {
    message: `${stat.label}: ${stat.value}`,
    color: 'info',
    icon: stat.icon,
    timeout: 3000
  };

  if (stat.description) {
    notifyOptions.caption = stat.description;
  }

  $q.notify(notifyOptions);
};
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- About Page Header -->
          <div class="text-h4 q-mb-md">
            <q-icon name="mdi-help-circle" class="q-mr-sm" />
            {{ t(TRANSLATION_KEYS.ABOUT.TITLE) }}
          </div>
          <p class="text-body1 q-mb-lg">
            {{ t(TRANSLATION_KEYS.ABOUT.DESCRIPTION) }}
          </p>

          <!-- Community Statistics using BaseStatsGrid -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.ABOUT.COMMUNITY_STATS.TITLE) }}</div>
            <BaseStatsGrid
              :stats="communityStats"
              :columns="4"
              @stat-click="handleStatClick"
            />
          </div>

          <!-- Get Involved Actions using BaseActionToolbar -->
          <BaseActionToolbar
            :sections="aboutActions"
            :columns="1"
            @action-click="handleActionClick"
            class="q-mb-lg"
          />

          <!-- About Content using BaseTabbedContent -->
          <BaseTabbedContent
            :tabs="aboutTabs"
            :active-tab="activeAboutTab"
            @update:active-tab="handleTabChange"
            class="q-mb-lg"
          >
            <!-- About Tab Content -->
            <template #about>
              <div class="q-mb-md">
                <!-- Mission and What We Do -->
                <div class="row q-col-gutter-md q-mb-lg">
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
                </div>

                <!-- Coverage Areas using BaseContentList -->
                <div>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-eye" class="q-mr-sm" />
                    {{ t(TRANSLATION_KEYS.ABOUT.WHAT_WE_COVER) }}
                  </div>
                        <BaseContentList
                          :items="coverageAreas"
                          variant="grid"
                          :loading="false"
                        >
                          <template #item="{ item }">
                            <q-card :class="cardClasses" class="full-height">
                              <q-card-section class="text-center">
                                <q-icon :name="(item as AboutListItem).icon" :color="(item as AboutListItem).color" size="2rem" />
                          <div class="text-subtitle1 q-mt-sm q-mb-xs">{{ item.title }}</div>
                          <div class="text-caption text-grey-6">{{ item.description }}</div>
                        </q-card-section>
                      </q-card>
                    </template>
                  </BaseContentList>
                </div>
              </div>
            </template>

            <!-- Team Tab Content -->
            <template #team>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.ABOUT.EDITORIAL_TEAM.TITLE) }}</div>
                <BaseContentList
                  :items="editorialTeam"
                  variant="grid"
                  :loading="false"
                >
                  <template #item="{ item }">
                    <q-card :class="cardClasses" class="full-height">
                      <q-card-section class="text-center">
                        <q-avatar
                          :color="(item as AboutListItem).color"
                          text-color="white"
                          :icon="(item as AboutListItem).avatar"
                          size="xl"
                          class="q-mb-md"
                        />
                        <div class="text-h6">{{ item.title }}</div>
                        <div class="text-subtitle2 text-grey-6">{{ item.description }}</div>
                      </q-card-section>
                    </q-card>
                  </template>
                </BaseContentList>
              </div>
            </template>

            <!-- Contact Tab Content -->
            <template #contact>
              <div id="contact-section" class="q-mb-md">
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-message" class="q-mr-sm" />
                  {{ t(TRANSLATION_KEYS.ABOUT.CONTACT_SECTION) }}
                </div>
                <p class="text-body1 q-mb-lg">
                  {{ t(TRANSLATION_KEYS.ABOUT.CONTACT_DESCRIPTION) }}
                </p>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <!-- Contact Information using BaseContentList -->
                    <q-card :class="cardClasses">
                      <q-card-section>
                        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.ABOUT.CONTACT_INFO) }}</div>
                        <BaseContentList
                          :items="contactInfo"
                          variant="compact"
                          :loading="false"
                        >
                          <template #item="{ item }">
                            <q-item>
                              <q-item-section side>
                                <q-icon :name="(item as AboutListItem).icon" :color="(item as AboutListItem).color" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="text-weight-medium">{{ item.title }}</q-item-label>
                                <q-item-label caption>
                                  <span v-html="item.description"></span>
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </BaseContentList>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-md-6">
                    <!-- Contact Form -->
                    <q-card :class="cardClasses">
                      <q-card-section>
                        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.TITLE) }}</div>

                        <q-form @submit="onSubmit" class="q-col-gutter-md">
                          <q-input
                            v-model="form.name"
                            :label="t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.NAME_LABEL)"
                            filled
                            :rules="[val => !!val || t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.NAME_REQUIRED)]"
                          >
                            <template v-slot:prepend>
                              <q-icon name="mdi-account" />
                            </template>
                          </q-input>

                          <q-input
                            v-model="form.email"
                            :label="t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.EMAIL_LABEL)"
                            type="email"
                            filled
                            :rules="[val => !!val || t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.EMAIL_REQUIRED)]"
                          >
                            <template v-slot:prepend>
                              <q-icon name="mdi-email" />
                            </template>
                          </q-input>

                          <q-select
                            v-model="form.subject"
                            :options="subjectOptions"
                            :label="t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.SUBJECT_LABEL)"
                            filled
                            :rules="[val => !!val || t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.SUBJECT_REQUIRED)]"
                          >
                            <template v-slot:prepend>
                              <q-icon name="mdi-tag" />
                            </template>
                          </q-select>

                          <q-input
                            v-model="form.message"
                            :label="t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.MESSAGE_LABEL)"
                            type="textarea"
                            rows="4"
                            filled
                            :rules="[val => !!val || t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.MESSAGE_REQUIRED)]"
                          >
                            <template v-slot:prepend>
                              <q-icon name="mdi-message-text" />
                            </template>
                          </q-input>

                          <div class="text-center">
                            <q-btn
                              type="submit"
                              color="primary"
                              icon="mdi-send"
                              :label="t(TRANSLATION_KEYS.ABOUT.CONTACT_FORM_DETAILS.SEND_BUTTON)"
                              :loading="submitting"
                            />
                          </div>
                        </q-form>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </template>
          </BaseTabbedContent>
        </div>
      </div>
    </div>
  </q-page>
</template>
