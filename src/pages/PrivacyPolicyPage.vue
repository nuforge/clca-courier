<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { cardClasses } = useTheme()
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

          <!-- Introduction -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Introduction</div>
              <p class="text-body1 q-mb-md">
                The Courier at Conashaugh Lakes ("we," "our," or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you visit our website and use our services.
              </p>
              <p class="text-body1">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy
                policy, please do not access our website or services.
              </p>
            </q-card-section>
          </q-card>

          <!-- Information We Collect -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Information We Collect</div>

              <div class="text-subtitle1 q-mb-sm">Personal Information</div>
              <p class="text-body1 q-mb-md">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul class="text-body1 q-mb-md">
                <li>Subscribe to our newsletter</li>
                <li>Submit articles, photos, or other content</li>
                <li>Contact us via email or contact forms</li>
                <li>Participate in community events or surveys</li>
              </ul>

              <div class="text-subtitle1 q-mb-sm">Non-Personal Information</div>
              <p class="text-body1 q-mb-md">
                We may automatically collect certain non-personal information, including:
              </p>
              <ul class="text-body1">
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>IP address (anonymized)</li>
                <li>Pages visited and time spent on our website</li>
                <li>Referral sources</li>
              </ul>
            </q-card-section>
          </q-card>

          <!-- How We Use Your Information -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">How We Use Your Information</div>
              <p class="text-body1 q-mb-md">
                We use the information we collect to:
              </p>
              <ul class="text-body1">
                <li>Deliver our newsletter and community updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Process and publish submitted content (with your permission)</li>
                <li>Improve our website and services</li>
                <li>Communicate about community events and activities</li>
                <li>Ensure website security and prevent abuse</li>
              </ul>
            </q-card-section>
          </q-card>

          <!-- Information Sharing -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Information Sharing and Disclosure</div>
              <p class="text-body1 q-mb-md">
                We do not sell, trade, or otherwise transfer your personal information to third parties without
                your consent, except in the following circumstances:
              </p>
              <ul class="text-body1">
                <li>When required by law or legal process</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>With your explicit consent for specific purposes</li>
                <li>With trusted service providers who assist in operating our website (under strict confidentiality
                  agreements)</li>
              </ul>
            </q-card-section>
          </q-card>

          <!-- Data Security -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Data Security</div>
              <p class="text-body1">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. However, no method
                of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </q-card-section>
          </q-card>

          <!-- Cookies and Tracking -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Cookies and Tracking Technologies</div>
              <p class="text-body1 q-mb-md">
                Our website may use cookies and similar tracking technologies to enhance your browsing experience.
                These technologies help us:
              </p>
              <ul class="text-body1">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content</li>
                <li>Improve website functionality</li>
              </ul>
              <p class="text-body1 q-mt-md">
                You can control cookie settings through your browser preferences.
              </p>
            </q-card-section>
          </q-card>

          <!-- Your Rights -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Your Rights and Choices</div>
              <p class="text-body1 q-mb-md">
                You have the right to:
              </p>
              <ul class="text-body1">
                <li>Access, update, or delete your personal information</li>
                <li>Unsubscribe from our newsletter at any time</li>
                <li>Request information about how we use your data</li>
                <li>Object to certain uses of your information</li>
                <li>Request data portability where applicable</li>
              </ul>
              <p class="text-body1 q-mt-md">
                To exercise these rights, please contact us at info@conashaughlakes.com.
              </p>
            </q-card-section>
          </q-card>

          <!-- Children's Privacy -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Children's Privacy</div>
              <p class="text-body1">
                Our website is not intended for children under 13 years of age. We do not knowingly collect
                personal information from children under 13. If we become aware that we have collected personal
                information from a child under 13, we will take steps to delete such information.
              </p>
            </q-card-section>
          </q-card>

          <!-- Updates -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Updates to This Policy</div>
              <p class="text-body1">
                We may update this Privacy Policy from time to time. When we do, we will post the updated policy
                on this page and update the "Last updated" date. We encourage you to review this policy periodically
                to stay informed about how we protect your information.
              </p>
            </q-card-section>
          </q-card>

          <!-- Contact Information -->
          <q-card flat :class="cardClasses" class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Contact Us</div>
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
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
ul {
  margin-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}
</style>
