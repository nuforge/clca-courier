<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const { textClasses } = useTheme();
const { t } = useI18n();
const emailSubscription = ref('');

const footerClasses = computed(() =>
  textClasses.value.primary === 'text-white' ? 'bg-dark text-white' : 'bg-grey text-white'
);

const quickLinks = [
  { label: t(TRANSLATION_KEYS.FOOTER.COMMUNITY_CONTENT), to: '/community' },
  { label: t(TRANSLATION_KEYS.FOOTER.ISSUE_ARCHIVE), to: '/archive' },
  { label: t(TRANSLATION_KEYS.FOOTER.INTERACTIVE_MAP), to: '/map' },
  { label: t(TRANSLATION_KEYS.FOOTER.CLASSIFIEDS), to: '/community?type=classifieds' }
];

const communityLinks = [
  { label: t(TRANSLATION_KEYS.FOOTER.ABOUT_CONTACT), to: '/about' },
  { label: t(TRANSLATION_KEYS.FOOTER.CONTRIBUTE), to: '/contribute' }
];

const legalLinks = [
  { label: t(TRANSLATION_KEYS.FOOTER.PRIVACY_POLICY), to: '/privacy' },
  { label: t(TRANSLATION_KEYS.FOOTER.TERMS_OF_SERVICE), to: '/terms' },
  { label: t(TRANSLATION_KEYS.FOOTER.ACCESSIBILITY), to: '/accessibility' }
];

const socialLinks = [
  { icon: 'mdi-facebook', url: '#', label: t(TRANSLATION_KEYS.FOOTER.FACEBOOK) },
  { icon: 'mdi-twitter', url: '#', label: t(TRANSLATION_KEYS.FOOTER.TWITTER) },
  { icon: 'mdi-instagram', url: '#', label: t(TRANSLATION_KEYS.FOOTER.INSTAGRAM) },
  { icon: 'mdi-email', url: 'mailto:info@conashaughlakes.com', label: t(TRANSLATION_KEYS.FOOTER.EMAIL) }
];
</script>

<template>
  <footer :class="footerClasses" class="footer-container">
    <div class="q-pa-lg">
      <!-- Main Footer Content -->
      <div class="row  q-col-gutter-lg">
        <!-- Brand Section -->
        <div class="col-12 col-md-3">
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-newspaper" size="sm" class="q-mr-sm" />
            {{ t(TRANSLATION_KEYS.FOOTER.BRAND_NAME) }}
          </div>
          <p class="text-body2 q-mb-md">
            {{ t(TRANSLATION_KEYS.FOOTER.DESCRIPTION) }}
          </p>
          <div class="text-caption">
            <q-icon name="mdi-map-marker" size="xs" class="q-mr-xs" />
            {{ t(TRANSLATION_KEYS.FOOTER.LOCATION) }}
          </div>
        </div>

        <!-- Quick Links -->
        <div class="col-12 col-sm-6 col-md-2">
          <div class="text-subtitle1 q-mb-md">{{ t(TRANSLATION_KEYS.FOOTER.QUICK_LINKS) }}</div>
          <q-list dense class="no-padding">
            <q-item v-for="link in quickLinks" :key="link.label" :to="link.to" clickable v-ripple class="q-pa-xs">
              <q-item-section>
                <q-item-label class="text-body2">{{ link.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Community -->
        <div class="col-12 col-sm-6 col-md-2">
          <div class="text-subtitle1 q-mb-md">{{ t(TRANSLATION_KEYS.FOOTER.COMMUNITY) }}</div>
          <q-list dense class="no-padding">
            <q-item v-for="link in communityLinks" :key="link.label" :to="link.to" clickable v-ripple class="q-pa-xs">
              <q-item-section>
                <q-item-label class="text-body2">{{ link.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Newsletter Subscription -->
        <div class="col-12 col-md-3">
          <div class="text-subtitle1 q-mb-md">{{ t(TRANSLATION_KEYS.FOOTER.STAY_CONNECTED) }}</div>
          <p class="text-body2 q-mb-md">
            {{ t(TRANSLATION_KEYS.FOOTER.NEWSLETTER_DESCRIPTION) }}
          </p>
          <div class="row ">
            <div class="col">
              <q-input v-model="emailSubscription" dense outlined :placeholder="t(TRANSLATION_KEYS.FOOTER.EMAIL_PLACEHOLDER)" bg-color="white" dark
                class="text-dark">
                <template v-slot:append>
                  <q-btn icon="mdi-send" color="primary" flat dense @click="() => { }" />
                </template>
              </q-input>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="col-12 col-md-2">
          <div class="text-subtitle1 q-mb-md">{{ t(TRANSLATION_KEYS.FOOTER.CONTACT) }}</div>
          <div class="text-body2 q-mb-sm">
            <q-icon name="mdi-email" size="xs" class="q-mr-xs" />
            info@conashaughlakes.com
          </div>
          <div class="text-body2 q-mb-sm">
            <q-icon name="mdi-phone" size="xs" class="q-mr-xs" />
            (570) 555-0123
          </div>
          <div class="text-body2">
            <q-icon name="mdi-clock" size="xs" class="q-mr-xs" />
            {{ t(TRANSLATION_KEYS.FOOTER.PUBLISHED_SEASONALLY) }}
          </div>
        </div>
      </div>

      <q-separator class="q-my-lg" dark />

      <!-- Bottom Footer -->
      <div class="row items-center justify-between">
        <!-- Copyright -->
        <div class="col-12 col-md-6">
          <div class="text-body2">
            {{ t(TRANSLATION_KEYS.FOOTER.COPYRIGHT) }}
          </div>
          <div class="text-caption q-mt-xs">
            <template v-for="(link, index) in legalLinks" :key="link.label">
              <router-link :to="link.to" class="text-grey-4 text-decoration-none">
                {{ link.label }}
              </router-link>
              <span v-if="index < legalLinks.length - 1" class="text-grey-4"> • </span>
            </template>
          </div>
        </div>

        <!-- Social Media -->
        <div class="col-12 col-md-6 text-right">
          <div class="text-body2 q-mb-sm">{{ t(TRANSLATION_KEYS.FOOTER.FOLLOW_US) }}</div>
          <div class="">
            <q-btn v-for="social in socialLinks" :key="social.label" :icon="social.icon" :href="social.url"
              target="_blank" flat round size="sm" color="white" :aria-label="social.label" />
          </div>
        </div>
      </div>

      <!-- Additional Footer Note -->
      <div class="text-center q-mt-lg">
        <div class="text-caption text-grey-4">
          {{ t(TRANSLATION_KEYS.FOOTER.COMMUNITY_NOTE) }}
          <br>
          {{ t(TRANSLATION_KEYS.FOOTER.WELCOME_MESSAGE) }}
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer-container {
  width: 100%;

  .q-item {
    border-radius: 4px;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .q-list {
    .q-item-label {
      font-weight: 400;
    }
  }

  .text-decoration-none {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .q-btn {
    &.q-btn--round {
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
    }
  }
}

@media (max-width: 768px) {
  .text-right {
    text-align: center !important;
  }
}
</style>
