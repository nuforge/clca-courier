<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import BaseContentList from '../components/BaseContentList.vue';
import BaseActionToolbar from '../components/BaseActionToolbar.vue';

const { cardClasses } = useTheme();

// Local type for accessibility content items that extends BaseItem
interface AccessibilityContentItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  content?: string | string[] | Record<string, unknown> | null;
  note?: string;
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

// Transform accessibility content into structured data for BaseContentList
const accessibilityContentSections = computed(() => [
  {
    id: 'commitment',
    title: 'Our Commitment to Accessibility',
    description: 'The Courier at Conashaugh Lakes is committed to ensuring digital accessibility for all community members, including people with disabilities. We strive to provide an inclusive experience that allows everyone to access our content and participate in our community.',
    icon: 'mdi-heart-handshake',
    type: 'accessibility-section',
    content: 'We are continually improving the user experience for everyone and applying relevant accessibility standards to ensure we provide equal access to all of our users.'
  },
  {
    id: 'standards',
    title: 'Accessibility Standards',
    description: 'Our website aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible for people with disabilities and more usable for everyone.',
    icon: 'mdi-standard-definition',
    type: 'accessibility-section',
    content: 'We are working to ensure our website meets or exceeds these standards across all areas of our digital presence.'
  },
  {
    id: 'features',
    title: 'Accessibility Features',
    description: 'Our website includes comprehensive accessibility features to ensure usability for all visitors.',
    icon: 'mdi-eye-check',
    type: 'accessibility-section',
    content: {
      visual: {
        title: 'Visual Accessibility',
        items: [
          'High contrast color schemes with sufficient color contrast ratios',
          'Dark mode support for reduced eye strain',
          'Scalable text that remains readable when enlarged up to 200%',
          'Alternative text descriptions for images and graphics',
          'Clear, readable fonts and typography',
          'Descriptive link text and button labels'
        ]
      },
      navigation: {
        title: 'Navigation and Interaction',
        items: [
          'Full keyboard navigation support',
          'Clear focus indicators for interactive elements',
          'Logical tab order throughout the website',
          'Skip links to main content areas',
          'Consistent navigation structure across all pages',
          'Responsive design that works on various devices and screen sizes'
        ]
      },
      structure: {
        title: 'Content Structure',
        items: [
          'Proper heading hierarchy (H1, H2, H3, etc.)',
          'Semantic HTML markup for screen readers',
          'Clear page titles and section headings',
          'Organized content with logical reading order',
          'Lists and tables with proper markup'
        ]
      }
    }
  },
  {
    id: 'assistive-technology',
    title: 'Assistive Technology Compatibility',
    description: 'Our website is designed to be compatible with:',
    icon: 'mdi-account-voice',
    type: 'accessibility-section',
    content: [
      'Screen readers (JAWS, NVDA, VoiceOver, TalkBack)',
      'Voice recognition software',
      'Keyboard-only navigation',
      'Switch navigation devices',
      'Magnification software',
      'Alternative input devices'
    ]
  },
  {
    id: 'browser-support',
    title: 'Supported Browsers and Devices',
    description: 'Our website is optimized for accessibility across modern browsers and devices.',
    icon: 'mdi-web',
    type: 'accessibility-section',
    content: {
      desktop: {
        title: 'Desktop Browsers',
        items: [
          'Chrome (latest version)',
          'Firefox (latest version)',
          'Safari (latest version)',
          'Microsoft Edge (latest version)'
        ]
      },
      mobile: {
        title: 'Mobile Devices',
        items: [
          'iOS Safari and Chrome',
          'Android Chrome and Samsung Internet',
          'Mobile screen readers and accessibility features'
        ]
      }
    }
  },
  {
    id: 'pdf-accessibility',
    title: 'PDF and Document Accessibility',
    description: 'We strive to make our newsletter PDFs and other documents accessible by:',
    icon: 'mdi-file-pdf-box',
    type: 'accessibility-section',
    content: [
      'Creating PDFs with proper structure and tagging',
      'Including alternative text for images in documents',
      'Using readable fonts and sufficient contrast',
      'Providing HTML versions of important content when possible',
      'Ensuring logical reading order in all documents'
    ]
  },
  {
    id: 'known-issues',
    title: 'Known Issues and Ongoing Improvements',
    description: 'We are continuously working to improve accessibility. Current areas of focus include:',
    icon: 'mdi-wrench',
    type: 'accessibility-section',
    content: [
      'Enhancing interactive map accessibility features',
      'Improving form validation and error messaging',
      'Expanding keyboard navigation for complex components',
      'Adding more comprehensive alt text for historical content'
    ],
    note: 'We welcome feedback on any accessibility barriers you may encounter and are committed to addressing issues promptly.'
  },
  {
    id: 'user-instructions',
    title: 'Accessibility Instructions',
    description: 'Helpful instructions for navigating our website using accessibility features.',
    icon: 'mdi-keyboard',
    type: 'accessibility-section',
    content: {
      keyboard: {
        title: 'Keyboard Navigation',
        items: [
          'Tab: Move forward through interactive elements',
          'Shift + Tab: Move backward through interactive elements',
          'Enter or Space: Activate buttons and links',
          'Arrow keys: Navigate within menus and components',
          'Escape: Close modals and dropdown menus'
        ]
      },
      zoom: {
        title: 'Text Size and Zoom',
        description: 'You can increase text size by using your browser\'s zoom function:',
        items: [
          'Ctrl + (Windows) or Cmd + (Mac) to zoom in',
          'Ctrl - (Windows) or Cmd - (Mac) to zoom out',
          'Ctrl 0 (Windows) or Cmd 0 (Mac) to reset zoom'
        ]
      }
    }
  },
  {
    id: 'third-party',
    title: 'Third-Party Content',
    description: 'Some content on our website may be provided by third-party services or embedded from external sources. While we strive to ensure all content meets accessibility standards, we cannot guarantee the accessibility of third-party content.',
    icon: 'mdi-web-plus',
    type: 'accessibility-section',
    content: 'If you encounter accessibility issues with embedded content, please contact us for assistance.'
  },
  {
    id: 'feedback',
    title: 'Feedback and Support',
    description: 'We welcome your feedback on the accessibility of The Courier website. If you encounter any accessibility barriers or have suggestions for improvement, please let us know.',
    icon: 'mdi-message-reply',
    type: 'accessibility-section',
    content: {
      reporting: {
        title: 'How to Report Issues',
        items: [
          'Describe the specific page or feature you had difficulty accessing',
          'Tell us what assistive technology you were using (if any)',
          'Describe what you were trying to do and what went wrong',
          'Include your browser and operating system information'
        ]
      },
      response: 'We aim to respond to accessibility feedback within 2 business days and will work to resolve issues as quickly as possible.'
    }
  },
  {
    id: 'legal',
    title: 'Legal and Compliance Information',
    description: 'This accessibility statement applies to the website of The Courier at Conashaugh Lakes. As a community organization, we are committed to providing equal access to all community members and visitors, regardless of ability.',
    icon: 'mdi-gavel',
    type: 'accessibility-section',
    content: 'We view accessibility as an ongoing effort and are committed to continuous improvement.'
  }
]);

// Navigation actions for BaseActionToolbar
const navigationActions = computed<ActionSection[]>(() => [
  {
    title: 'Page Navigation',
    titleIcon: 'mdi-navigation',
    description: 'Navigate to related pages and accessibility resources',
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
                <q-icon name="mdi-account-check" class="q-mr-sm" />
                Accessibility Statement
              </div>
              <p class="text-body2 text-grey-6">
                Last updated: August 14, 2025
              </p>
            </q-card-section>
          </q-card>

          <!-- Accessibility Content Sections -->
          <BaseContentList
            :items="accessibilityContentSections"
            variant="list"
            :loading="false"
            empty-message="No accessibility content available"
          >
            <template #item="{ item }">
              <q-card flat :class="cardClasses" class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon :name="(item as AccessibilityContentItem).icon" class="q-mr-sm" />
                    {{ item.title }}
                  </div>
                  <p class="text-body1 q-mb-md">
                    {{ (item as AccessibilityContentItem).description }}
                  </p>

                  <!-- Handle different content types -->
                  <div v-if="typeof (item as AccessibilityContentItem).content === 'string'" class="text-body1">
                    {{ (item as AccessibilityContentItem).content }}
                  </div>
                  <div v-else-if="Array.isArray((item as AccessibilityContentItem).content)" class="text-body1">
                    <ul class="q-ml-lg">
                      <li v-for="contentItem in (item as AccessibilityContentItem).content as string[]" :key="contentItem" class="q-mb-sm">
                        {{ contentItem }}
                      </li>
                    </ul>
                  </div>
                  <div v-else-if="typeof (item as AccessibilityContentItem).content === 'object' && (item as AccessibilityContentItem).content">
                    <!-- Handle complex content objects like features -->
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.visual" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).visual.title }}</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="visualItem in ((item as AccessibilityContentItem).content as Record<string, any>).visual.items" :key="visualItem" class="q-mb-sm">
                          {{ visualItem }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.navigation" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).navigation.title }}</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="navItem in ((item as AccessibilityContentItem).content as Record<string, any>).navigation.items" :key="navItem" class="q-mb-sm">
                          {{ navItem }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.structure" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).structure.title }}</div>
                      <ul class="text-body1 q-ml-lg">
                        <li v-for="structureItem in ((item as AccessibilityContentItem).content as Record<string, any>).structure.items" :key="structureItem" class="q-mb-sm">
                          {{ structureItem }}
                        </li>
                      </ul>
                    </div>
                    <!-- Handle browser support content -->
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.desktop" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).desktop.title }}</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="desktopItem in ((item as AccessibilityContentItem).content as Record<string, any>).desktop.items" :key="desktopItem" class="q-mb-sm">
                          {{ desktopItem }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.mobile" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).mobile.title }}</div>
                      <ul class="text-body1 q-ml-lg">
                        <li v-for="mobileItem in ((item as AccessibilityContentItem).content as Record<string, any>).mobile.items" :key="mobileItem" class="q-mb-sm">
                          {{ mobileItem }}
                        </li>
                      </ul>
                    </div>
                    <!-- Handle user instructions content -->
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.keyboard" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).keyboard.title }}</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="keyboardItem in ((item as AccessibilityContentItem).content as Record<string, any>).keyboard.items" :key="keyboardItem" class="q-mb-sm">
                          <span v-html="keyboardItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></span>
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.zoom" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).zoom.title }}</div>
                      <p v-if="((item as AccessibilityContentItem).content as Record<string, any>).zoom.description" class="text-body1 q-mb-md">{{ ((item as AccessibilityContentItem).content as Record<string, any>).zoom.description }}</p>
                      <ul class="text-body1 q-ml-lg">
                        <li v-for="zoomItem in ((item as AccessibilityContentItem).content as Record<string, any>).zoom.items" :key="zoomItem" class="q-mb-sm">
                          <span v-html="zoomItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></span>
                        </li>
                      </ul>
                    </div>
                    <!-- Handle feedback content -->
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.reporting" class="q-mb-md">
                      <div class="text-subtitle1 q-mb-sm">{{ ((item as AccessibilityContentItem).content as Record<string, any>).reporting.title }}</div>
                      <ul class="text-body1 q-mb-md q-ml-lg">
                        <li v-for="reportingItem in ((item as AccessibilityContentItem).content as Record<string, any>).reporting.items" :key="reportingItem" class="q-mb-sm">
                          {{ reportingItem }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="((item as AccessibilityContentItem).content as Record<string, any>)?.response" class="text-body1">
                      {{ ((item as AccessibilityContentItem).content as Record<string, any>).response }}
                    </div>
                  </div>

                  <!-- Additional note for certain sections -->
                  <div v-if="(item as AccessibilityContentItem).note" class="text-body1 q-mt-md">
                    {{ (item as AccessibilityContentItem).note }}
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
                For accessibility-related questions, feedback, or assistance:
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
                <div class="q-mb-sm">
                  <q-icon name="mdi-clock" class="q-mr-sm" />
                  We respond to accessibility inquiries within 2 business days
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

