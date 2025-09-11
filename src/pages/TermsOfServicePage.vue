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
                                <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                                Terms of Service
                            </div>
                            <p class="text-body2 text-grey-6">
                                Last updated: August 14, 2025
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Introduction -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Acceptance of Terms</div>
                            <p class="text-body1 q-mb-md">
                                Welcome to The Courier at Conashaugh Lakes. These Terms of Service ("Terms") govern your
                                use of
                                our website and services. By accessing or using our website, you agree to be bound by
                                these Terms.
                            </p>
                            <p class="text-body1">
                                If you do not agree to these Terms, please do not use our website or services.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Description of Service -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Description of Service</div>
                            <p class="text-body1 q-mb-md">
                                The Courier is a community newsletter service that provides:
                            </p>
                            <ul class="text-body1">
                                <li>Digital and print newsletter distribution</li>
                                <li>Community news and updates</li>
                                <li>Event announcements and calendar</li>
                                <li>Classified advertisements</li>
                                <li>Interactive community map</li>
                                <li>Submission platforms for community content</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- User Accounts and Registration -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">User Accounts and Registration</div>
                            <p class="text-body1 q-mb-md">
                                While most of our content is available without registration, some features may require
                                you to
                                create an account. When creating an account, you agree to:
                            </p>
                            <ul class="text-body1">
                                <li>Provide accurate, current, and complete information</li>
                                <li>Maintain and update your account information</li>
                                <li>Keep your login credentials secure</li>
                                <li>Accept responsibility for all activities under your account</li>
                                <li>Notify us immediately of any unauthorized use</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- User Content and Submissions -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">User Content and Submissions</div>

                            <div class="text-subtitle1 q-mb-sm">Content Guidelines</div>
                            <p class="text-body1 q-mb-md">
                                When submitting content (articles, photos, comments, etc.), you agree that your content:
                            </p>
                            <ul class="text-body1 q-mb-md">
                                <li>Is accurate and truthful to the best of your knowledge</li>
                                <li>Does not violate any laws or regulations</li>
                                <li>Does not infringe on others' intellectual property rights</li>
                                <li>Is appropriate for a family-friendly community publication</li>
                                <li>Does not contain offensive, harmful, or discriminatory language</li>
                                <li>Does not include personal attacks or harassment</li>
                            </ul>

                            <div class="text-subtitle1 q-mb-sm">License Grant</div>
                            <p class="text-body1 q-mb-md">
                                By submitting content, you grant The Courier a non-exclusive, royalty-free license to
                                use,
                                reproduce, modify, and distribute your content in our newsletter and related materials.
                                You retain ownership of your original content.
                            </p>

                            <div class="text-subtitle1 q-mb-sm">Content Moderation</div>
                            <p class="text-body1">
                                We reserve the right to review, edit, or remove any submitted content at our discretion.
                                We may refuse to publish content that violates these Terms or our community standards.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Prohibited Uses -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Prohibited Uses</div>
                            <p class="text-body1 q-mb-md">
                                You may not use our website or services to:
                            </p>
                            <ul class="text-body1">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Transmit harmful, offensive, or inappropriate content</li>
                                <li>Impersonate others or provide false information</li>
                                <li>Interfere with or disrupt our services</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Use our services for commercial purposes without permission</li>
                                <li>Distribute spam or unsolicited communications</li>
                                <li>Collect user information without consent</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Intellectual Property -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Intellectual Property Rights</div>
                            <p class="text-body1 q-mb-md">
                                The Courier website and its contents, including but not limited to text, graphics,
                                logos,
                                images, and software, are owned by The Courier or its licensors and are protected by
                                copyright and other intellectual property laws.
                            </p>
                            <p class="text-body1">
                                You may view, download, and print content for personal, non-commercial use only.
                                Any other use requires our written permission.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Privacy -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Privacy</div>
                            <p class="text-body1">
                                Your privacy is important to us. Please review our Privacy Policy, which describes how
                                we
                                collect, use, and protect your information. By using our services, you consent to our
                                privacy practices as described in our Privacy Policy.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Disclaimers -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Disclaimers and Limitation of Liability</div>

                            <div class="text-subtitle1 q-mb-sm">Service Availability</div>
                            <p class="text-body1 q-mb-md">
                                Our services are provided "as is" and "as available." We do not guarantee that our
                                services
                                will be uninterrupted, error-free, or completely secure.
                            </p>

                            <div class="text-subtitle1 q-mb-sm">Content Accuracy</div>
                            <p class="text-body1 q-mb-md">
                                While we strive for accuracy, we do not warrant the completeness, accuracy, or
                                reliability
                                of any content published in The Courier. Community-submitted content reflects the views
                                of individual contributors, not necessarily those of The Courier.
                            </p>

                            <div class="text-subtitle1 q-mb-sm">Limitation of Liability</div>
                            <p class="text-body1">
                                To the fullest extent permitted by law, The Courier shall not be liable for any
                                indirect,
                                incidental, special, or consequential damages arising from your use of our services.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Community Standards -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Community Standards</div>
                            <p class="text-body1 q-mb-md">
                                The Courier serves the Conashaugh Lakes community, and we expect all users to maintain
                                the respectful, neighborly spirit that defines our community. This includes:
                            </p>
                            <ul class="text-body1">
                                <li>Treating all community members with respect and courtesy</li>
                                <li>Contributing constructively to community discussions</li>
                                <li>Respecting diverse opinions and backgrounds</li>
                                <li>Focusing on community-relevant topics</li>
                                <li>Supporting local businesses and initiatives</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Termination -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Termination</div>
                            <p class="text-body1">
                                We reserve the right to suspend or terminate your access to our services at any time,
                                with or without notice, for violation of these Terms or for any other reason we deem
                                appropriate. You may also discontinue using our services at any time.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Changes to Terms -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Changes to Terms</div>
                            <p class="text-body1">
                                We may update these Terms from time to time. When we do, we will post the updated Terms
                                on this page and update the "Last updated" date. Your continued use of our services
                                after
                                any changes constitutes acceptance of the new Terms.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Governing Law -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Governing Law</div>
                            <p class="text-body1">
                                These Terms are governed by and construed in accordance with the laws of Pennsylvania,
                                without regard to conflict of law principles.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Contact Information -->
                    <q-card flat :class="cardClasses" class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Contact Us</div>
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
