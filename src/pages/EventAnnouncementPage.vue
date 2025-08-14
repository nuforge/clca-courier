<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'
import { DiscordIcon } from '../components/BrandIcons'
import { getGoogleDriveFolderUrl } from '../config/google-cloud-config'

const $q = useQuasar()
const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
        return 'bg-dark text-white q-dark';
    } else {
        return 'bg-white text-dark';
    }
});

const form = ref({
    name: '',
    email: '',
    phone: '',
    organization: '',
    eventTitle: '',
    eventDate: '',
    eventTime: '',
    location: '',
    eventType: '',
    description: '',
    contact: '',
    website: '',
    cost: '',
    registration: '',
    additionalInfo: ''
})

const submitting = ref(false)

const eventTypeOptions = [
    'Community Meeting',
    'Social Event',
    'Educational Workshop',
    'Recreation Activity',
    'Fundraiser',
    'Holiday Celebration',
    'Sports & Fitness',
    'Arts & Culture',
    'Business/Professional',
    'Volunteer Opportunity',
    'Other'
]

async function onSubmit() {
    submitting.value = true

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    $q.notify({
        message: 'Event announcement submitted!',
        caption: 'We\'ll review and publish your event details soon.',
        color: 'positive',
        icon: 'mdi-check-circle'
    })

    // Reset form
    form.value = {
        name: '',
        email: '',
        phone: '',
        organization: '',
        eventTitle: '',
        eventDate: '',
        eventTime: '',
        location: '',
        eventType: '',
        description: '',
        contact: '',
        website: '',
        cost: '',
        registration: '',
        additionalInfo: ''
    }

    submitting.value = false
}

function openGoogleDrive() {
    window.open(getGoogleDriveFolderUrl(), '_blank')
}

function openEmail() {
    window.open('mailto:events@conashaughlakes.com?subject=Event Announcement', '_blank')
}

function openDiscord() {
    window.open('https://discord.gg/EB8uRwhyp4', '_blank')
}

function openCanva() {
    window.open('https://www.canva.com/brand/join?token=courier-event-templates', '_blank')
}
</script>

<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h4 q-mb-md">
                                <q-icon name="mdi-calendar-plus" class="q-mr-sm" />
                                Event Announcement
                            </div>
                            <p class="text-body1">
                                Promote your community events, meetings, or activities. Help keep everyone informed
                                about what's happening in our neighborhood and get more people involved!
                            </p>
                        </q-card-section>
                    </q-card>

                    <div class="row q-col-gutter-md">
                        <!-- Submission Methods -->
                        <div class="col-12 col-md-4">
                            <q-card :class="cardClasses" class="q-mb-md">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-bullhorn" class="q-mr-sm" />
                                        Promotion Options
                                    </div>

                                    <q-list>
                                        <q-item clickable @click="openGoogleDrive" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-google-drive" color="primary" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Google Drive</q-item-label>
                                                <q-item-label caption>Upload event flyers & materials</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openEmail" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-email" color="secondary" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Email</q-item-label>
                                                <q-item-label caption>events@conashaughlakes.com</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openCanva" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-palette" color="orange" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Canva Templates</q-item-label>
                                                <q-item-label caption>Create event flyers</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openDiscord" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <DiscordIcon :size="24" color="var(--q-accent)" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Discord</q-item-label>
                                                <q-item-label caption>Announce in community server</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>

                            <q-card :class="cardClasses">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-information" class="q-mr-sm" />
                                        Event Guidelines
                                    </div>
                                    <q-list>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Submit at least 2 weeks in advance</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Include all essential details</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Community-appropriate events</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Provide clear contact information</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>
                        </div>

                        <!-- Submission Form -->
                        <div class="col-12 col-md-8">
                            <q-card :class="cardClasses">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">Event Details</div>
                                    <p class="text-body2 q-mb-md text-grey-6">
                                        Provide detailed information about your event to help community members
                                        understand what to expect and how to participate.
                                    </p>

                                    <q-form @submit="onSubmit" class="q-col-gutter-md">
                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.name" label="Your Name" filled
                                                    :rules="[val => !!val || 'Name is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-account" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.email" label="Email Address" type="email" filled
                                                    :rules="[val => !!val || 'Email is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-email" />
                                                    </template>
                                                </q-input>
                                            </div>
                                        </div>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.phone" label="Phone Number (Optional)" filled>
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-phone" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.organization"
                                                    label="Organization/Group (Optional)" filled>
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-account-group" />
                                                    </template>
                                                </q-input>
                                            </div>
                                        </div>

                                        <q-input v-model="form.eventTitle" label="Event Title" filled
                                            :rules="[val => !!val || 'Event title is required']">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-format-title" />
                                            </template>
                                        </q-input>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-4">
                                                <q-input v-model="form.eventDate" label="Event Date" filled
                                                    hint="MM/DD/YYYY"
                                                    :rules="[val => !!val || 'Event date is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-calendar" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-4">
                                                <q-input v-model="form.eventTime" label="Event Time" filled
                                                    hint="e.g., 7:00 PM"
                                                    :rules="[val => !!val || 'Event time is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-clock" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-4">
                                                <q-select v-model="form.eventType" :options="eventTypeOptions"
                                                    label="Event Type" filled
                                                    :rules="[val => !!val || 'Event type is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-tag" />
                                                    </template>
                                                </q-select>
                                            </div>
                                        </div>

                                        <q-input v-model="form.location" label="Event Location" filled
                                            hint="Include full address or specific location details"
                                            :rules="[val => !!val || 'Location is required']">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-map-marker" />
                                            </template>
                                        </q-input>

                                        <q-input v-model="form.description" label="Event Description" type="textarea"
                                            rows="6" filled
                                            hint="Describe what the event is about, what to expect, who should attend, etc."
                                            :rules="[val => !!val || 'Description is required']">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-text" />
                                            </template>
                                        </q-input>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.cost" label="Cost/Fee (if any)" filled
                                                    hint="Free, $10, $5 suggested donation, etc.">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-currency-usd" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.registration" label="Registration Info" filled
                                                    hint="How to register or sign up">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-clipboard-text" />
                                                    </template>
                                                </q-input>
                                            </div>
                                        </div>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.contact" label="Contact for Questions" filled
                                                    hint="Name, phone, or email for inquiries">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-account-question" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.website" label="Website/Social Media (Optional)"
                                                    filled hint="Link to event page or organization">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-web" />
                                                    </template>
                                                </q-input>
                                            </div>
                                        </div>

                                        <q-input v-model="form.additionalInfo" label="Additional Information (Optional)"
                                            type="textarea" rows="3" filled
                                            hint="Any other important details, special instructions, or requirements">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-information" />
                                            </template>
                                        </q-input>

                                        <div class="text-center q-mt-md">
                                            <q-btn type="submit" color="accent" icon="mdi-send"
                                                label="Submit Event Announcement" :loading="submitting" size="lg" />
                                        </div>
                                    </q-form>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </q-page>
</template>
