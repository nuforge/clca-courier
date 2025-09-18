<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import BaseContentList from '../components/BaseContentList.vue';
import BaseActionToolbar from '../components/BaseActionToolbar.vue';

const { cardClasses } = useTheme();

// Local type for terms content items that extends BaseItem
interface TermsContentItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  content: string | string[] | Record<string, unknown> | null;
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

// Transform terms content into structured data for BaseContentList
const termsContentSections = computed(() => [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    description: 'Welcome to The Courier at Conashaugh Lakes. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our website, you agree to be bound by these Terms.',
    icon: 'mdi-check-circle',
    type: 'terms-section',
    content: 'If you do not agree to these Terms, please do not use our website or services.'
  },
  {
    id: 'service-description',
    title: 'Description of Service',
    description: 'The Courier is a community newsletter service that provides:',
    icon: 'mdi-newspaper',
    type: 'terms-section',
    content: [
      'Digital and print newsletter distribution',
      'Community news and updates',
      'Event announcements and calendar',
      'Classified advertisements',
      'Interactive community map',
      'Submission platforms for community content'
    ]
  },
  {
    id: 'user-accounts',
    title: 'User Accounts and Registration',
    description: 'While most of our content is available without registration, some features may require you to create an account. When creating an account, you agree to:',
    icon: 'mdi-account-plus',
    type: 'terms-section',
    content: [
      'Provide accurate, current, and complete information',
      'Maintain and update your account information',
      'Keep your login credentials secure',
      'Accept responsibility for all activities under your account',
      'Notify us immediately of any unauthorized use'
    ]
  },
  {
    id: 'user-content',
    title: 'User Content and Submissions',
    description: 'When submitting content (articles, photos, comments, etc.), you agree that your content meets our guidelines.',
    icon: 'mdi-file-document-edit',
    type: 'terms-section',
    content: {
      guidelines: [
        'Is accurate and truthful to the best of your knowledge',
        'Does not violate any laws or regulations',
        'Does not infringe on others\' intellectual property rights',
        'Is appropriate for a family-friendly community publication',
        'Does not contain offensive, harmful, or discriminatory language',
        'Does not include personal attacks or harassment'
      ],
      license: 'By submitting content, you grant The Courier a non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in our newsletter and related materials. You retain ownership of your original content.',
      moderation: 'We reserve the right to review, edit, or remove any submitted content at our discretion. We may refuse to publish content that violates these Terms or our community standards.'
    }
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    description: 'You may not use our website or services to:',
    icon: 'mdi-cancel',
    type: 'terms-section',
    content: [
      'Violate any applicable laws or regulations',
      'Transmit harmful, offensive, or inappropriate content',
      'Impersonate others or provide false information',
      'Interfere with or disrupt our services',
      'Attempt to gain unauthorized access to our systems',
      'Use our services for commercial purposes without permission',
      'Distribute spam or unsolicited communications',
      'Collect user information without consent'
    ]
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Rights',
    description: 'The Courier website and its contents, including but not limited to text, graphics, logos, images, and software, are owned by The Courier or its licensors and are protected by copyright and other intellectual property laws.',
    icon: 'mdi-copyright',
    type: 'terms-section',
    content: 'You may view, download, and print content for personal, non-commercial use only. Any other use requires our written permission.'
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description: 'Your privacy is important to us. Please review our Privacy Policy, which describes how we collect, use, and protect your information.',
    icon: 'mdi-shield-account',
    type: 'terms-section',
    content: 'By using our services, you consent to our privacy practices as described in our Privacy Policy.'
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers and Limitation of Liability',
    description: 'Important disclaimers regarding our service availability and content accuracy.',
    icon: 'mdi-alert-circle',
    type: 'terms-section',
    content: {
      availability: 'Our services are provided "as is" and "as available." We do not guarantee that our services will be uninterrupted, error-free, or completely secure.',
      accuracy: 'While we strive for accuracy, we do not warrant the completeness, accuracy, or reliability of any content published in The Courier. Community-submitted content reflects the views of individual contributors, not necessarily those of The Courier.',
      liability: 'To the fullest extent permitted by law, The Courier shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.'
    }
  },
  {
    id: 'community-standards',
    title: 'Community Standards',
    description: 'The Courier serves the Conashaugh Lakes community, and we expect all users to maintain the respectful, neighborly spirit that defines our community. This includes:',
    icon: 'mdi-heart',
    type: 'terms-section',
    content: [
      'Treating all community members with respect and courtesy',
      'Contributing constructively to community discussions',
      'Respecting diverse opinions and backgrounds',
      'Focusing on community-relevant topics',
      'Supporting local businesses and initiatives'
    ]
  },
  {
    id: 'termination',
    title: 'Termination',
    description: 'We reserve the right to suspend or terminate your access to our services at any time, with or without notice, for violation of these Terms or for any other reason we deem appropriate.',
    icon: 'mdi-account-off',
    type: 'terms-section',
    content: 'You may also discontinue using our services at any time.'
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    description: 'We may update these Terms from time to time. When we do, we will post the updated Terms on this page and update the "Last updated" date.',
    icon: 'mdi-update',
    type: 'terms-section',
    content: 'Your continued use of our services after any changes constitutes acceptance of the new Terms.'
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    description: 'These Terms are governed by and construed in accordance with the laws of Pennsylvania, without regard to conflict of law principles.',
    icon: 'mdi-gavel',
    type: 'terms-section',
    content: null
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
        label: 'Privacy Policy',
        icon: 'mdi-shield-account',
        color: 'secondary',
        to: '/privacy'
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
                <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                Terms of Service
              </div>
              <p class="text-body2 text-grey-6">
                Last updated: August 14, 2025
              </p>
            </q-card-section>
          </q-card>

          <!-- Terms Content Sections -->
          <BaseContentList
            :items="termsContentSections"
            variant="list"
            :loading="false"
            empty-message="No terms content available"
          >
            <template #item="{ item }">
              <q-card flat :class="cardClasses" class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon :name="(item as TermsContentItem).icon" class="q-mr-sm" />
                    {{ item.title }}
                  </div>
                  <p class="text-body1 q-mb-md">
                    {{ (item as TermsContentItem).description }}
                  </p>

                  <!-- Handle different content types -->
                  <div v-if="typeof (item as TermsContentItem).content === 'string'" class="text-body1">
                    {{ (item as TermsContentItem).content }}
                  </div>
                  <div v-else-if="Array.isArray((item as TermsContentItem).content)" class="text-body1">
                    <ul class="q-ml-lg">
                      <li v-for="contentItem in (item as TermsContentItem).content as string[]" :key="contentItem" class="q-mb-sm">
                        {{ contentItem }}
                      </li>
                    </ul>
                  </div>
                  <div v-else-if="typeof (item as TermsContentItem).content === 'object' && (item as TermsContentItem).content">
                    <!-- Handle complex content objects like disclaimers and user content -->
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.guidelines" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">Content Guidelines</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="guideline in ((item as TermsContentItem).content as Record<string, any>).guidelines" :key="guideline" class="q-mb-sm">
                          {{ guideline }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.license" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">License Grant</div>
                      <p class="text-body1">{{ ((item as TermsContentItem).content as Record<string, any>).license }}</p>
                    </div>
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.moderation" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">Content Moderation</div>
                      <p class="text-body1">{{ ((item as TermsContentItem).content as Record<string, any>).moderation }}</p>
                    </div>
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.availability" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">Service Availability</div>
                      <p class="text-body1">{{ ((item as TermsContentItem).content as Record<string, any>).availability }}</p>
                    </div>
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.accuracy" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">Content Accuracy</div>
                      <p class="text-body1">{{ ((item as TermsContentItem).content as Record<string, any>).accuracy }}</p>
                    </div>
                    <div v-if="((item as TermsContentItem).content as Record<string, any>)?.liability" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">Limitation of Liability</div>
                      <p class="text-body1">{{ ((item as TermsContentItem).content as Record<string, any>).liability }}</p>
                    </div>
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
                If you have questions about these Terms of Service, please contact us:
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

