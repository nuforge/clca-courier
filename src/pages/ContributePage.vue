<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()

function submitArticle() {
    $q.notify({
        message: 'Article submission form',
        caption: 'Feature coming soon!',
        icon: 'mdi-file-document-edit',
        color: 'primary'
    })
}

function submitPhotos() {
    $q.notify({
        message: 'Photo upload feature',
        caption: 'Feature coming soon!',
        icon: 'mdi-camera',
        color: 'secondary'
    })
}

function postEvent() {
    $q.notify({
        message: 'Event posting form',
        caption: 'Feature coming soon!',
        icon: 'mdi-calendar-plus',
        color: 'accent'
    })
}

function shareIdeas() {
    $q.notify({
        message: 'Ideas submission form',
        caption: 'Feature coming soon!',
        icon: 'mdi-lightbulb',
        color: 'positive'
    })
}
</script>

<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <q-card flat bordered class="q-mb-md">
                        <q-card-section>
                            <div class="text-h4 q-mb-md">
                                <q-icon name="mdi-pencil" class="q-mr-sm" />
                                Contribute
                            </div>
                            <p class="text-body1">
                                We welcome contributions from community members! Share your stories, announcements,
                                photos, and ideas to make The Courier a true reflection of our community.
                            </p>
                        </q-card-section>
                    </q-card>

                    <div class="row q-gutter-md">
                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
                                        Article Submissions
                                    </div>
                                    <p class="text-body2 q-mb-md">
                                        Share your stories, experiences, or community insights. We accept articles on
                                        various topics
                                        including community events, local history, and resident spotlights.
                                    </p>
                                    <q-btn color="primary" icon="mdi-file-document-edit" label="Submit Article"
                                        @click="submitArticle" class="full-width" />
                                </q-card-section>
                            </q-card>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-camera" class="q-mr-sm" />
                                        Photo Submissions
                                    </div>
                                    <p class="text-body2 q-mb-md">
                                        Share your beautiful photos of the lakes, community events, wildlife, or
                                        seasonal
                                        scenes. High-quality images are preferred.
                                    </p>
                                    <q-btn color="secondary" icon="mdi-image-plus" label="Submit Photos"
                                        @click="submitPhotos" class="full-width" />
                                </q-card-section>
                            </q-card>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-calendar" class="q-mr-sm" />
                                        Event Announcements
                                    </div>
                                    <p class="text-body2 q-mb-md">
                                        Promote your community events, meetings, or activities. Help keep everyone
                                        informed about what's happening in our neighborhood.
                                    </p>
                                    <q-btn color="accent" icon="mdi-calendar-plus" label="Post Event" @click="postEvent"
                                        class="full-width" />
                                </q-card-section>
                            </q-card>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-lightbulb" class="q-mr-sm" />
                                        Ideas & Suggestions
                                    </div>
                                    <p class="text-body2 q-mb-md">
                                        Have ideas for improving The Courier or our community? We'd love to hear
                                        your suggestions and feedback.
                                    </p>
                                    <q-btn color="positive" icon="mdi-message-text" label="Share Ideas"
                                        @click="shareIdeas" class="full-width" />
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>

                    <q-card flat bordered class="q-mt-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Submission Guidelines</div>
                            <q-list>
                                <q-item>
                                    <q-item-section side>
                                        <q-icon name="mdi-check-circle" color="positive" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>Articles should be between 200-800 words</q-item-label>
                                    </q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section side>
                                        <q-icon name="mdi-check-circle" color="positive" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>Photos should be high resolution (300 DPI
                                            preferred)</q-item-label>
                                    </q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section side>
                                        <q-icon name="mdi-check-circle" color="positive" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>Include your name and contact information</q-item-label>
                                    </q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section side>
                                        <q-icon name="mdi-check-circle" color="positive" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>Content should be community-appropriate and
                                            relevant</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>
