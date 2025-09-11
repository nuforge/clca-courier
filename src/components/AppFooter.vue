<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTheme } from '../composables/useTheme';

const { textClasses } = useTheme();
const emailSubscription = ref('');
const currentYear = new Date().getFullYear();

const footerClasses = computed(() =>
  textClasses.value.primary === 'text-white' ? 'bg-dark text-white' : 'bg-grey text-white'
);

const quickLinks = [
  { label: 'Community Content', to: '/community' },
  { label: 'Issue Archive', to: '/archive' },
  { label: 'Interactive Map', to: '/map' },
  { label: 'Classifieds', to: '/community?type=classifieds' }
];

const communityLinks = [
  { label: 'About & Contact', to: '/about' },
  { label: 'Contribute', to: '/contribute' }
];

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Accessibility', to: '/accessibility' }
];

const socialLinks = [
  { icon: 'mdi-facebook', url: '#', label: 'Facebook' },
  { icon: 'mdi-twitter', url: '#', label: 'Twitter' },
  { icon: 'mdi-instagram', url: '#', label: 'Instagram' },
  { icon: 'mdi-email', url: 'mailto:info@conashaughlakes.com', label: 'Email' }
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
            The Courier
          </div>
          <p class="text-body2 q-mb-md">
            Connecting the Conashaugh Lakes community through local news, events, and shared stories since our founding.
          </p>
          <div class="text-caption">
            <q-icon name="mdi-map-marker" size="xs" class="q-mr-xs" />
            Conashaugh Lakes Community
          </div>
        </div>

        <!-- Quick Links -->
        <div class="col-12 col-sm-6 col-md-2">
          <div class="text-subtitle1 q-mb-md">Quick Links</div>
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
          <div class="text-subtitle1 q-mb-md">Community</div>
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
          <div class="text-subtitle1 q-mb-md">Stay Connected</div>
          <p class="text-body2 q-mb-md">
            Subscribe to receive the latest issues and community updates.
          </p>
          <div class="row ">
            <div class="col">
              <q-input v-model="emailSubscription" dense outlined placeholder="Enter your email" bg-color="white" dark
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
          <div class="text-subtitle1 q-mb-md">Contact</div>
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
            Published Seasonally
          </div>
        </div>
      </div>

      <q-separator class="q-my-lg" dark />

      <!-- Bottom Footer -->
      <div class="row items-center justify-between">
        <!-- Copyright -->
        <div class="col-12 col-md-6">
          <div class="text-body2">
            © {{ currentYear }} The Courier @ Conashaugh Lakes. All rights reserved.
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
          <div class="text-body2 q-mb-sm">Follow Us</div>
          <div class="">
            <q-btn v-for="social in socialLinks" :key="social.label" :icon="social.icon" :href="social.url"
              target="_blank" flat round size="sm" color="white" :aria-label="social.label" />
          </div>
        </div>
      </div>

      <!-- Additional Footer Note -->
      <div class="text-center q-mt-lg">
        <div class="text-caption text-grey-4">
          The Courier is a community-driven publication serving the residents of Conashaugh Lakes.
          <br>
          We welcome submissions, feedback, and community involvement.
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
