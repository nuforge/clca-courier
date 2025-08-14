<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'
import { DiscordIcon } from '../components/BrandIcons'

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
    photoTitle: '',
    location: '',
    date: '',
    description: '',
    category: '',
    additionalInfo: ''
})

const submitting = ref(false)

const categoryOptions = [
    'Lake Views',
    'Community Events',
    'Wildlife',
    'Seasonal/Weather',
    'Recreation Activities',
    'Local Business',
    'Architecture/Buildings',
    'People & Portraits',
    'Historical',
    'Other'
]

async function onSubmit() {
    submitting.value = true

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    $q.notify({
        message: 'Photo submission received!',
        caption: 'Please send your high-resolution photos via email or Google Drive.',
        color: 'positive',
        icon: 'mdi-check-circle'
    })

    // Reset form
    form.value = {
        name: '',
        email: '',
        phone: '',
        photoTitle: '',
        location: '',
        date: '',
        description: '',
        category: '',
        additionalInfo: ''
    }

    submitting.value = false
}

function openGoogleDrive() {
    window.open('https://drive.google.com/drive/folders/sample-courier-photos', '_blank')
}

function openEmail() {
    window.open('mailto:photos@conashaughlakes.com?subject=Photo Submission', '_blank')
}

function openCanva() {
    window.open('https://www.canva.com/brand/join?token=courier-templates', '_blank')
}

function openDiscord() {
    window.open('https://discord.gg/EB8uRwhyp4', '_blank')
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
                                <q-icon name="mdi-camera" class="q-mr-sm" />
                                Photo Submission
                            </div>
                            <p class="text-body1">
                                Share your beautiful photos of the lakes, community events, wildlife, or seasonal
                                scenes.
                                Help capture the essence of our community through your lens!
                            </p>
                        </q-card-section>
                    </q-card>

                    <div class="row q-col-gutter-md">
                        <!-- Submission Methods -->
                        <div class="col-12 col-md-4">
                            <q-card :class="cardClasses" class="q-mb-md">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-upload" class="q-mr-sm" />
                                        Photo Upload Options
                                    </div>

                                    <q-list>
                                        <q-item clickable @click="openGoogleDrive" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-google-drive" color="primary" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Google Drive</q-item-label>
                                                <q-item-label caption>Upload high-res photos directly</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openEmail" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-email" color="secondary" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Email</q-item-label>
                                                <q-item-label caption>photos@conashaughlakes.com</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openCanva" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <q-icon name="mdi-palette" color="orange" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Canva Templates</q-item-label>
                                                <q-item-label caption>Use our design templates</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                        <q-item clickable @click="openDiscord" class="q-mb-sm rounded-borders">
                                            <q-item-section side>
                                                <DiscordIcon :size="24" color="var(--q-accent)" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">Discord</q-item-label>
                                                <q-item-label caption>Share in our community</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>

                            <q-card :class="cardClasses">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">
                                        <q-icon name="mdi-camera-iris" class="q-mr-sm" />
                                        Photo Guidelines
                                    </div>
                                    <q-list>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>High resolution (300 DPI preferred)</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>JPEG or PNG format</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Include photo details & location</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Get permission for people in photos</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section side>
                                                <q-icon name="mdi-check-circle" color="positive" size="sm" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label caption>Original photos only (no
                                                    watermarks)</q-item-label>
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
                                    <div class="text-h6 q-mb-md">Photo Submission Details</div>
                                    <p class="text-body2 q-mb-md text-grey-6">
                                        Fill out this form with details about your photo(s). You'll need to send the
                                        actual
                                        high-resolution images via email or Google Drive.
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

                                        <q-input v-model="form.phone" label="Phone Number (Optional)" filled>
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-phone" />
                                            </template>
                                        </q-input>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.photoTitle" label="Photo Title/Caption" filled
                                                    :rules="[val => !!val || 'Photo title is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-format-title" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-select v-model="form.category" :options="categoryOptions"
                                                    label="Photo Category" filled
                                                    :rules="[val => !!val || 'Category is required']">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-tag" />
                                                    </template>
                                                </q-select>
                                            </div>
                                        </div>

                                        <div class="row q-col-gutter-md">
                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.location" label="Photo Location" filled
                                                    hint="Where was this photo taken?">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-map-marker" />
                                                    </template>
                                                </q-input>
                                            </div>

                                            <div class="col-12 col-sm-6">
                                                <q-input v-model="form.date" label="Date Taken" filled
                                                    hint="When was this photo taken?">
                                                    <template v-slot:prepend>
                                                        <q-icon name="mdi-calendar" />
                                                    </template>
                                                </q-input>
                                            </div>
                                        </div>

                                        <q-input v-model="form.description" label="Photo Description" type="textarea"
                                            rows="4" filled
                                            hint="Describe what's happening in the photo, any interesting details, or the story behind it"
                                            :rules="[val => !!val || 'Description is required']">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-text" />
                                            </template>
                                        </q-input>

                                        <q-input v-model="form.additionalInfo" label="Additional Information (Optional)"
                                            type="textarea" rows="3" filled
                                            hint="Camera settings, special circumstances, or other relevant information">
                                            <template v-slot:prepend>
                                                <q-icon name="mdi-information" />
                                            </template>
                                        </q-input>

                                        <div class="text-center q-mt-md">
                                            <q-btn type="submit" color="secondary" icon="mdi-send"
                                                label="Submit Photo Details" :loading="submitting" size="lg" />
                                        </div>

                                        <div class="text-center q-mt-sm">
                                            <p class="text-caption text-grey-6">
                                                After submitting this form, please send your high-resolution photos via
                                                <strong>email</strong> or <strong>Google Drive</strong> using the links
                                                above.
                                            </p>
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
