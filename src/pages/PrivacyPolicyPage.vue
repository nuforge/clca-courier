<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import BaseContentList from '../components/BaseContentList.vue';
import BaseActionToolbar from '../components/BaseActionToolbar.vue';

const { cardClasses } = useTheme();

// Local type for privacy content items that extends BaseItem
interface PrivacyContentItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  content?: string | string[] | Record<string, unknown> | null;
  contact?: string;
}

// Local interfaces for ActionToolbar data
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

// Transform privacy content into structured data for BaseContentList
const privacyContentSections = computed(() => [
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'The Courier at Conashaugh Lakes ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.',
    icon: 'mdi-information',
    type: 'privacy-section',
    content: 'Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access our website or services.'
  },
  {
    id: 'information-collection',
    title: 'Information We Collect',
    description: 'We collect different types of information to provide and improve our services to you.',
    icon: 'mdi-database',
    type: 'privacy-section',
    content: {
      personal: {
        title: 'Personal Information',
        description: 'We may collect personal information that you voluntarily provide to us when you:',
        items: [
          'Subscribe to our newsletter',
          'Submit articles, photos, or other content',
          'Contact us via email or contact forms',
          'Participate in community events or surveys'
        ]
      },
      nonPersonal: {
        title: 'Non-Personal Information',
        description: 'We may automatically collect certain non-personal information, including:',
        items: [
          'Browser type and version',
          'Operating system',
          'IP address (anonymized)',
          'Pages visited and time spent on our website',
          'Referral sources'
        ]
      }
    }
  },
  {
    id: 'information-use',
    title: 'How We Use Your Information',
    description: 'We use the information we collect to:',
    icon: 'mdi-account-cog',
    type: 'privacy-section',
    content: [
      'Deliver our newsletter and community updates',
      'Respond to your inquiries and provide customer support',
      'Process and publish submitted content (with your permission)',
      'Improve our website and services',
      'Communicate about community events and activities',
      'Ensure website security and prevent abuse'
    ]
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing and Disclosure',
    description: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:',
    icon: 'mdi-share-variant',
    type: 'privacy-section',
    content: [
      'When required by law or legal process',
      'To protect our rights, property, or safety, or that of our users',
      'With your explicit consent for specific purposes',
      'With trusted service providers who assist in operating our website (under strict confidentiality agreements)'
    ]
  },
  {
    id: 'data-security',
    title: 'Data Security',
    description: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
    icon: 'mdi-shield-check',
    type: 'privacy-section',
    content: 'However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.'
  },
  {
    id: 'cookies-tracking',
    title: 'Cookies and Tracking Technologies',
    description: 'Our website may use cookies and similar tracking technologies to enhance your browsing experience.',
    icon: 'mdi-cookie',
    type: 'privacy-section',
    content: {
      purposes: [
        'Remember your preferences and settings',
        'Analyze website traffic and usage patterns',
        'Provide personalized content',
        'Improve website functionality'
      ],
      note: 'You can control cookie settings through your browser preferences.'
    }
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    description: 'You have the right to:',
    icon: 'mdi-account-check',
    type: 'privacy-section',
    content: [
      'Access, update, or delete your personal information',
      'Unsubscribe from our newsletter at any time',
      'Request information about how we use your data',
      'Object to certain uses of your information',
      'Request data portability where applicable'
    ],
    contact: 'To exercise these rights, please contact us at info@conashaughlakes.com.'
  },
  {
    id: 'childrens-privacy',
    title: 'Children\'s Privacy',
    description: 'Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.',
    icon: 'mdi-account-child',
    type: 'privacy-section',
    content: 'If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.'
  },
  {
    id: 'policy-updates',
    title: 'Updates to This Policy',
    description: 'We may update this Privacy Policy from time to time. When we do, we will post the updated policy on this page and update the "Last updated" date.',
    icon: 'mdi-update',
    type: 'privacy-section',
    content: 'We encourage you to review this policy periodically to stay informed about how we protect your information.'
  }
]);

// Navigation actions for BaseActionToolbar
const navigationActions = computed<ActionSection[]>(() => [
  {
    title: 'Page Navigation',
    titleIcon: 'mdi-navigation',
    description: 'Navigate to related pages and contact information',
    primaryAction: {
      label: 'Back to Home',
      icon: 'mdi-home',
      color: 'primary',
      to: '/'
    },
    secondaryActions: [
      {
        label: 'Terms of Service',
        icon: 'mdi-file-document-outline',
        color: 'secondary',
        to: '/terms'
      },
      {
        label: 'Contact Us',
        icon: 'mdi-email',
        color: 'info',
        to: '/about'
      }
    ]
  }
]);
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-shield-account" class="q-mr-sm" />
                Privacy Policy
              </div>
              <p class="text-body2 text-grey-6">
                Last updated: August 14, 2025
              </p>
            </q-card-section>
          </q-card>

          <!-- Privacy Content Sections -->
          <BaseContentList
            :items="privacyContentSections"
            variant="list"
            :loading="false"
            empty-message="No privacy content available"
          >
            <template #item="{ item }">
              <q-card flat :class="cardClasses" class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon :name="(item as PrivacyContentItem).icon" class="q-mr-sm" />
                    {{ item.title }}
                  </div>
                  <p class="text-body1 q-mb-md">
                    {{ (item as PrivacyContentItem).description }}
                  </p>

                  <!-- Handle different content types -->
                  <div v-if="typeof (item as PrivacyContentItem).content === 'string'" class="text-body1">
                    {{ (item as PrivacyContentItem).content }}
                  </div>
                  <div v-else-if="Array.isArray((item as PrivacyContentItem).content)" class="text-body1">
                    <ul class="q-ml-lg">
                      <li v-for="contentItem in (item as PrivacyContentItem).content as string[]" :key="contentItem" class="q-mb-sm">
                        {{ contentItem }}
                      </li>
                    </ul>
                  </div>
                  <div v-else-if="typeof (item as PrivacyContentItem).content === 'object' && (item as PrivacyContentItem).content">
                    <!-- Handle complex content objects like information collection -->
                    <div v-if="((item as PrivacyContentItem).content as Record<string, any>)?.personal" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as PrivacyContentItem).content as Record<string, any>).personal.title }}</div>
                      <p class="text-body1 q-mb-md">{{ ((item as PrivacyContentItem).content as Record<string, any>).personal.description }}</p>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="personalItem in ((item as PrivacyContentItem).content as Record<string, any>).personal.items" :key="personalItem" class="q-mb-sm">
                          {{ personalItem }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as PrivacyContentItem).content as Record<string, any>)?.nonPersonal" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as PrivacyContentItem).content as Record<string, any>).nonPersonal.title }}</div>
                      <p class="text-body1 q-mb-md">{{ ((item as PrivacyContentItem).content as Record<string, any>).nonPersonal.description }}</p>
                      <ul class="text-body1 q-ml-lg">
                        <li v-for="nonPersonalItem in ((item as PrivacyContentItem).content as Record<string, any>).nonPersonal.items" :key="nonPersonalItem" class="q-mb-sm">
                          {{ nonPersonalItem }}
                        </li>
                      </ul>
                    </div>
                    <!-- Handle cookies content -->
                    <div v-if="((item as PrivacyContentItem).content as Record<string, any>)?.purposes" class="q-mb-md">
                      <p class="text-body1 q-mb-md">These technologies help us:</p>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="purpose in ((item as PrivacyContentItem).content as Record<string, any>).purposes" :key="purpose" class="q-mb-sm">
                          {{ purpose }}
                        </li>
                      </ul>
                      <p class="text-body1">{{ ((item as PrivacyContentItem).content as Record<string, any>).note }}</p>
                    </div>
                  </div>

                  <!-- Contact information for rights section -->
                  <div v-if="(item as PrivacyContentItem).contact" class="text-body1 q-mt-md">
                    {{ (item as PrivacyContentItem).contact }}
                  </div>
                </q-card-section>
              </q-card>
            </template>
          </BaseContentList>

          <!-- Contact Information -->
          <q-card flat :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-phone" class="q-mr-sm" />
                Contact Us
              </div>
              <p class="text-body1 q-mb-md">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div class="text-body1">
                <div class="q-mb-sm">
                  <q-icon name="mdi-email" class="q-mr-sm" />
                  Email: info@conashaughlakes.com
                </div>
                <div class="q-mb-sm">
                  <q-icon name="mdi-map-marker" class="q-mr-sm" />
                  The Courier @ Conashaugh Lakes Community
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Navigation Actions -->
          <BaseActionToolbar
            :sections="navigationActions"
            :columns="1"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

