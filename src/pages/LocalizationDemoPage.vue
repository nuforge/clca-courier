<!--
Localization Demo Page

Demonstrates the comprehensive bilingual localization system
with all translation categories and language switching capabilities.

@author CLCA Courier Development Team
@version 1.0.0
-->

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocale } from 'src/composables/useLocale';
import { TRANSLATION_KEYS } from 'src/i18n/utils/translation-keys';
import LanguageSelector from 'src/components/LanguageSelector.vue';

const { t } = useI18n();
const {
  currentLocale,
  currentLocaleInfo,
  formatDate,
  formatNumber
} = useLocale();// Demo data
const demoDate = new Date('2025-01-15');
const demoNumber = 1234.56;

// Type-safe computed properties for translation key access
const navigationKeys = computed(() =>
  (Object.keys(TRANSLATION_KEYS.NAVIGATION) as Array<keyof typeof TRANSLATION_KEYS.NAVIGATION>)
);

const commonActionKeys = computed(() =>
  ['SAVE', 'CANCEL', 'DELETE', 'EDIT', 'REFRESH', 'DOWNLOAD', 'UPLOAD'] as Array<keyof typeof TRANSLATION_KEYS.COMMON>
);

const statusKeys = computed(() =>
  ['PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED'] as Array<keyof typeof TRANSLATION_KEYS.CONTENT.STATUS>
);

const typeKeys = computed(() =>
  ['NEWS', 'EVENT', 'ANNOUNCEMENT', 'CLASSIFIED'] as Array<keyof typeof TRANSLATION_KEYS.CONTENT.TYPES>
);

const categoryKeys = computed(() =>
  ['GENERAL', 'COMMUNITY', 'EVENTS', 'FOR_SALE'] as Array<keyof typeof TRANSLATION_KEYS.CONTENT.CATEGORIES>
);

// Demo statistics
const demoStats = computed(() => ({
  currentLanguage: currentLocaleInfo.value.nativeName,
  translationKeys: Object.keys(TRANSLATION_KEYS).length,
  supportedLocales: 2,
  implementationProgress: '85%'
}));
</script>

<template>
  <div class="q-pa-md">
    <!-- Header Section -->
    <div class="row items-center q-mb-xl">
      <div class="col">
        <h1 class="text-h3 q-mb-sm">
          🌐 {{ t(TRANSLATION_KEYS.SETTINGS.LANGUAGE) }} {{ t('common.demo') || 'Demo' }}
        </h1>
        <p class="text-h6 text-grey-7">
          Comprehensive Bilingual Localization System
        </p>
      </div>
      <div class="col-auto">
        <LanguageSelector
          :mini="false"
          :dropdown="false"
          color="primary"
          size="lg"
        />
      </div>
    </div>

    <!-- Current Locale Info -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t('common.info') || 'Current Locale Information' }}</div>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <span class="text-h5">{{ currentLocaleInfo.flag }}</span>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.SETTINGS.LANGUAGE) }}</q-item-label>
                  <q-item-label caption>{{ currentLocaleInfo.displayName }} ({{ currentLocale }})</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-calendar" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.FORMS.DATE) }}</q-item-label>
                  <q-item-label caption>{{ formatDate(demoDate) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-numeric" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('common.number') || 'Number Format' }}</q-item-label>
                  <q-item-label caption>{{ formatNumber(demoNumber) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 col-md-6">
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-check-circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Translation Keys</q-item-label>
                  <q-item-label caption>{{ demoStats.translationKeys }}+ keys available</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-earth" color="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Supported Languages</q-item-label>
                  <q-item-label caption>{{ demoStats.supportedLocales }} languages</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-progress-check" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Implementation</q-item-label>
                  <q-item-label caption>{{ demoStats.implementationProgress }} complete</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Navigation Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.NAVIGATION.HOME) }} - Navigation</div>
        <div class="row q-gutter-sm">
          <q-chip
            v-for="key in navigationKeys"
            :key="key"
            color="primary"
            text-color="white"
            icon="mdi-navigation-variant"
          >
            {{ t(TRANSLATION_KEYS.NAVIGATION[key]) }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Common Actions Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.COMMON.SAVE) }} - Common Actions</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="actionKey in commonActionKeys"
            :key="actionKey"
            :label="t(TRANSLATION_KEYS.COMMON[actionKey])"
            :icon="`mdi-${actionKey === 'SAVE' ? 'content-save' : actionKey === 'CANCEL' ? 'close' : actionKey === 'DELETE' ? 'delete' : actionKey === 'EDIT' ? 'pencil' : actionKey === 'REFRESH' ? 'reload' : actionKey === 'DOWNLOAD' ? 'download' : 'upload'}`"
            outline
            no-caps
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Content Management Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.CONTENT.TYPES.NEWS) }} - Content Management</div>

        <!-- Content Statuses -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ t('content.status') || 'Content Statuses' }}</div>
          <div class="row q-gutter-xs">
            <q-badge
              v-for="statusKey in statusKeys"
              :key="statusKey"
              :color="statusKey === 'PUBLISHED' ? 'positive' : statusKey === 'APPROVED' ? 'info' : statusKey === 'PENDING' ? 'warning' : 'negative'"
              :label="t(TRANSLATION_KEYS.CONTENT.STATUS[statusKey])"
            />
          </div>
        </div>

        <!-- Content Types -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">{{ t('content.types') || 'Content Types' }}</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="typeKey in typeKeys"
              :key="typeKey"
              :label="t(TRANSLATION_KEYS.CONTENT.TYPES[typeKey])"
              color="secondary"
              text-color="white"
            />
          </div>
        </div>

        <!-- Content Categories -->
        <div>
          <div class="text-subtitle2 q-mb-sm">{{ t('content.categories') || 'Content Categories' }}</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="categoryKey in categoryKeys"
              :key="categoryKey"
              :label="t(TRANSLATION_KEYS.CONTENT.CATEGORIES[categoryKey])"
              outline
              color="primary"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- About & Contact Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t('about.title') || 'About & Contact Page' }}</div>
        <div class="row q-gutter-sm">
          <q-chip color="primary" text-color="white">{{ t('about.ourMission') || 'Our Mission' }}</q-chip>
          <q-chip color="secondary" text-color="white">{{ t('about.whatWeDo') || 'What We Do' }}</q-chip>
          <q-chip color="accent" text-color="white">{{ t('about.contactSection') || 'Contact Section' }}</q-chip>
          <q-chip color="positive" text-color="white">{{ t('about.volunteer') || 'Volunteer' }}</q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Contribute Page Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t('contribute.title') || 'Contribute Page' }}</div>
        <div class="row q-gutter-sm">
          <q-chip color="blue" text-color="white">{{ t('contribute.contentTypes.news.title') || 'Community News' }}</q-chip>
          <q-chip color="purple" text-color="white">{{ t('contribute.contentTypes.photos.title') || 'Photos & Media' }}</q-chip>
          <q-chip color="green" text-color="white">{{ t('contribute.contentTypes.events.title') || 'Events' }}</q-chip>
          <q-chip color="orange" text-color="white">{{ t('contribute.contentTypes.announcements.title') || 'Announcements' }}</q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Settings Page Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t('settingsPage.title') || 'Settings Page' }}</div>
        <div class="row q-gutter-sm">
          <q-chip color="indigo" text-color="white">{{ t('settingsPage.themeSettings') || 'Theme Settings' }}</q-chip>
          <q-chip color="pink" text-color="white">{{ t('settingsPage.notificationSettings') || 'Notifications' }}</q-chip>
          <q-chip color="teal" text-color="white">{{ t('settingsPage.pdfSettings') || 'PDF Settings' }}</q-chip>
          <q-chip color="brown" text-color="white">{{ t('settingsPage.resetAll') || 'Reset All' }}</q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Legal Pages Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Legal & Policy Pages</div>
        <div class="row q-gutter-sm">
          <q-chip color="grey" text-color="white">{{ t('privacy.title') || 'Privacy Policy' }}</q-chip>
          <q-chip color="grey-7" text-color="white">{{ t('terms.title') || 'Terms of Service' }}</q-chip>
          <q-chip color="grey-9" text-color="white">{{ t('accessibility.title') || 'Accessibility' }}</q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Newsletter Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.NEWSLETTER.ARCHIVE) }}</div>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-bookshelf" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.NEWSLETTER.ARCHIVE) }}</q-item-label>
                  <q-item-label caption>{{ t(TRANSLATION_KEYS.NEWSLETTER.PREVIOUS_ISSUES) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-file-document" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.NEWSLETTER.ISSUE) }} #123</q-item-label>
                  <q-item-label caption>{{ t(TRANSLATION_KEYS.NEWSLETTER.PUBLICATION_DATE) }}: {{ formatDate(demoDate) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-file-document-multiple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.NEWSLETTER.PAGE_COUNT) }}</q-item-label>
                  <q-item-label caption>{{ formatNumber(12) }} pages</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-text" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(TRANSLATION_KEYS.NEWSLETTER.WORD_COUNT) }}</q-item-label>
                  <q-item-label caption>{{ formatNumber(2543) }} words</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Authentication Demo -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.AUTH.SIGN_IN) }} - Authentication</div>
        <div class="row q-gutter-sm">
          <q-btn
            :label="t(TRANSLATION_KEYS.AUTH.SIGN_IN_WITH_GOOGLE)"
            icon="mdi-google"
            color="red-6"
            outline
            no-caps
          />
          <q-btn
            :label="t(TRANSLATION_KEYS.AUTH.SIGN_IN_WITH_FACEBOOK)"
            icon="mdi-facebook"
            color="blue-7"
            outline
            no-caps
          />
          <q-btn
            :label="t(TRANSLATION_KEYS.AUTH.SIGN_OUT)"
            icon="mdi-logout"
            color="grey-7"
            outline
            no-caps
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Implementation Status -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 q-mb-md">🚀 Implementation Status</div>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-4">
            <q-circular-progress
              :value="85"
              size="100px"
              :thickness="0.15"
              color="primary"
              track-color="grey-3"
              class="q-ma-md"
            >
              <div class="text-h6">85%</div>
            </q-circular-progress>
            <div class="text-center text-weight-medium">Overall Progress</div>
          </div>

          <div class="col-12 col-md-8">
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-check-circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>✅ Translation Infrastructure</q-item-label>
                  <q-item-label caption>Type-safe keys, locale detection, persistence</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-check-circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>✅ Core Components</q-item-label>
                  <q-item-label caption>Navigation, language selector, main layout</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-clock" color="warning" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>🔄 Content Components</q-item-label>
                  <q-item-label caption>Newsletter cards, forms, content management</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="mdi-clock" color="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>⏳ Advanced Features</q-item-label>
                  <q-item-label caption>Dynamic content, search results, error messages</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.q-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.q-chip {
  margin: 2px;
}

.q-btn {
  margin: 2px;
}

// Responsive adjustments
@media (max-width: 600px) {
  .text-h3 {
    font-size: 1.5rem;
  }

  .text-h6 {
    font-size: 1.1rem;
  }
}

// Dark mode support
body.body--dark {
  .q-card {
    &:hover {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
