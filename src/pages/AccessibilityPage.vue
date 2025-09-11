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
                                <q-icon name="mdi-account-check" class="q-mr-sm" />
                                Accessibility Statement
                            </div>
                            <p class="text-body2 text-grey-6">
                                Last updated: August 14, 2025
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Commitment -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Our Commitment to Accessibility</div>
                            <p class="text-body1 q-mb-md">
                                The Courier at Conashaugh Lakes is committed to ensuring digital accessibility for all
                                community
                                members, including people with disabilities. We strive to provide an inclusive
                                experience that
                                allows everyone to access our content and participate in our community.
                            </p>
                            <p class="text-body1">
                                We are continually improving the user experience for everyone and applying relevant
                                accessibility
                                standards to ensure we provide equal access to all of our users.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Accessibility Standards -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Accessibility Standards</div>
                            <p class="text-body1 q-mb-md">
                                Our website aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level
                                AA.
                                These guidelines explain how to make web content more accessible for people with
                                disabilities and
                                more usable for everyone.
                            </p>
                            <p class="text-body1">
                                We are working to ensure our website meets or exceeds these standards across all areas
                                of
                                our digital presence.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Accessibility Features -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Accessibility Features</div>
                            <p class="text-body1 q-mb-md">
                                Our website includes the following accessibility features:
                            </p>

                            <div class="text-subtitle1 q-mb-sm">Visual Accessibility</div>
                            <ul class="text-body1 q-mb-md">
                                <li>High contrast color schemes with sufficient color contrast ratios</li>
                                <li>Dark mode support for reduced eye strain</li>
                                <li>Scalable text that remains readable when enlarged up to 200%</li>
                                <li>Alternative text descriptions for images and graphics</li>
                                <li>Clear, readable fonts and typography</li>
                                <li>Descriptive link text and button labels</li>
                            </ul>

                            <div class="text-subtitle1 q-mb-sm">Navigation and Interaction</div>
                            <ul class="text-body1 q-mb-md">
                                <li>Full keyboard navigation support</li>
                                <li>Clear focus indicators for interactive elements</li>
                                <li>Logical tab order throughout the website</li>
                                <li>Skip links to main content areas</li>
                                <li>Consistent navigation structure across all pages</li>
                                <li>Responsive design that works on various devices and screen sizes</li>
                            </ul>

                            <div class="text-subtitle1 q-mb-sm">Content Structure</div>
                            <ul class="text-body1">
                                <li>Proper heading hierarchy (H1, H2, H3, etc.)</li>
                                <li>Semantic HTML markup for screen readers</li>
                                <li>Clear page titles and section headings</li>
                                <li>Organized content with logical reading order</li>
                                <li>Lists and tables with proper markup</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Assistive Technology -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Assistive Technology Compatibility</div>
                            <p class="text-body1 q-mb-md">
                                Our website is designed to be compatible with:
                            </p>
                            <ul class="text-body1">
                                <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
                                <li>Voice recognition software</li>
                                <li>Keyboard-only navigation</li>
                                <li>Switch navigation devices</li>
                                <li>Magnification software</li>
                                <li>Alternative input devices</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Browser Support -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Supported Browsers and Devices</div>
                            <p class="text-body1 q-mb-md">
                                Our website is optimized for accessibility across modern browsers and devices:
                            </p>

                            <div class="text-subtitle1 q-mb-sm">Desktop Browsers</div>
                            <ul class="text-body1 q-mb-md">
                                <li>Chrome (latest version)</li>
                                <li>Firefox (latest version)</li>
                                <li>Safari (latest version)</li>
                                <li>Microsoft Edge (latest version)</li>
                            </ul>

                            <div class="text-subtitle1 q-mb-sm">Mobile Devices</div>
                            <ul class="text-body1">
                                <li>iOS Safari and Chrome</li>
                                <li>Android Chrome and Samsung Internet</li>
                                <li>Mobile screen readers and accessibility features</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- PDF Accessibility -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">PDF and Document Accessibility</div>
                            <p class="text-body1 q-mb-md">
                                We strive to make our newsletter PDFs and other documents accessible by:
                            </p>
                            <ul class="text-body1">
                                <li>Creating PDFs with proper structure and tagging</li>
                                <li>Including alternative text for images in documents</li>
                                <li>Using readable fonts and sufficient contrast</li>
                                <li>Providing HTML versions of important content when possible</li>
                                <li>Ensuring logical reading order in all documents</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Known Issues -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Known Issues and Ongoing Improvements</div>
                            <p class="text-body1 q-mb-md">
                                We are continuously working to improve accessibility. Current areas of focus include:
                            </p>
                            <ul class="text-body1">
                                <li>Enhancing interactive map accessibility features</li>
                                <li>Improving form validation and error messaging</li>
                                <li>Expanding keyboard navigation for complex components</li>
                                <li>Adding more comprehensive alt text for historical content</li>
                            </ul>
                            <p class="text-body1 q-mt-md">
                                We welcome feedback on any accessibility barriers you may encounter and are committed
                                to addressing issues promptly.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- User Instructions -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Accessibility Instructions</div>

                            <div class="text-subtitle1 q-mb-sm">Keyboard Navigation</div>
                            <ul class="text-body1 q-mb-md">
                                <li><strong>Tab:</strong> Move forward through interactive elements</li>
                                <li><strong>Shift + Tab:</strong> Move backward through interactive elements</li>
                                <li><strong>Enter or Space:</strong> Activate buttons and links</li>
                                <li><strong>Arrow keys:</strong> Navigate within menus and components</li>
                                <li><strong>Escape:</strong> Close modals and dropdown menus</li>
                            </ul>

                            <div class="text-subtitle1 q-mb-sm">Text Size and Zoom</div>
                            <p class="text-body1 q-mb-md">
                                You can increase text size by using your browser's zoom function:
                            </p>
                            <ul class="text-body1">
                                <li><strong>Ctrl +</strong> (Windows) or <strong>Cmd +</strong> (Mac) to zoom in</li>
                                <li><strong>Ctrl -</strong> (Windows) or <strong>Cmd -</strong> (Mac) to zoom out</li>
                                <li><strong>Ctrl 0</strong> (Windows) or <strong>Cmd 0</strong> (Mac) to reset zoom</li>
                            </ul>
                        </q-card-section>
                    </q-card>

                    <!-- Third-Party Content -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Third-Party Content</div>
                            <p class="text-body1">
                                Some content on our website may be provided by third-party services or embedded from
                                external sources. While we strive to ensure all content meets accessibility standards,
                                we cannot guarantee the accessibility of third-party content. If you encounter
                                accessibility issues with embedded content, please contact us for assistance.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Feedback and Support -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Feedback and Support</div>
                            <p class="text-body1 q-mb-md">
                                We welcome your feedback on the accessibility of The Courier website. If you encounter
                                any accessibility barriers or have suggestions for improvement, please let us know:
                            </p>

                            <div class="text-subtitle1 q-mb-sm">How to Report Issues</div>
                            <ul class="text-body1 q-mb-md">
                                <li>Describe the specific page or feature you had difficulty accessing</li>
                                <li>Tell us what assistive technology you were using (if any)</li>
                                <li>Describe what you were trying to do and what went wrong</li>
                                <li>Include your browser and operating system information</li>
                            </ul>

                            <p class="text-body1">
                                We aim to respond to accessibility feedback within 2 business days and will work to
                                resolve issues as quickly as possible.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Legal Information -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Legal and Compliance Information</div>
                            <p class="text-body1">
                                This accessibility statement applies to the website of The Courier at Conashaugh Lakes.
                                As a community organization, we are committed to providing equal access to all community
                                members and visitors, regardless of ability. We view accessibility as an ongoing effort
                                and are committed to continuous improvement.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Contact Information -->
                    <q-card flat :class="cardClasses" class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Contact Us</div>
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

strong {
    font-weight: 600;
}
</style>
