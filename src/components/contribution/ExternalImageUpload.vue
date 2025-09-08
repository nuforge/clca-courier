<template>
    <div class="external-image-upload">
        <!-- Hosting Instructions -->
        <q-expansion-item icon="info" label="Image Hosting Instructions" class="q-mb-md" header-class="text-info">
            <q-card flat bordered>
                <q-card-section>
                    <q-tabs v-model="instructionTab" dense class="text-grey-6" active-color="primary"
                        indicator-color="primary" align="justify" narrow-indicator>
                        <q-tab name="google_photos" label="Google Photos" />
                        <q-tab name="google_drive" label="Google Drive" />
                        <q-tab name="general" label="Other Services" />
                    </q-tabs>

                    <q-separator class="q-my-md" />

                    <q-tab-panels v-model="instructionTab" animated>
                        <q-tab-panel name="google_photos">
                            <div class="text-caption">
                                <div class="text-weight-medium q-mb-sm">Recommended: Free & Easy</div>
                                <ol class="q-pl-md">
                                    <li>Upload your photos to Google Photos</li>
                                    <li>Create a shared album or make individual photos public</li>
                                    <li>Right-click the photo and select "Copy image address"</li>
                                    <li>Paste the URL below</li>
                                </ol>
                            </div>
                        </q-tab-panel>

                        <q-tab-panel name="google_drive">
                            <div class="text-caption">
                                <ol class="q-pl-md">
                                    <li>Upload your image to Google Drive</li>
                                    <li>Right-click the file and select "Get link"</li>
                                    <li>Change permissions to "Anyone with the link can view"</li>
                                    <li>Paste the sharing URL below</li>
                                </ol>
                            </div>
                        </q-tab-panel>

                        <q-tab-panel name="general">
                            <div class="text-caption">
                                <ol class="q-pl-md">
                                    <li>Upload your image to any public hosting service</li>
                                    <li>Make sure the image is publicly accessible</li>
                                    <li>Copy the direct image URL</li>
                                    <li>Test the URL in a new browser tab to ensure it works</li>
                                </ol>
                            </div>
                        </q-tab-panel>
                    </q-tab-panels>
                </q-card-section>
            </q-card>
        </q-expansion-item>

        <!-- URL Input -->
        <div class="row q-mb-md">
            <div class="col-12 col-md-8 q-pa-md">
                <q-input v-model="newImageUrl" label="Image URL" outlined
                    placeholder="https://photos.google.com/... or https://drive.google.com/..." :loading="validating"
                    :error="!!urlError" :error-message="urlError" @update:model-value="onUrlChange"
                    @keyup.enter="addImageFromUrl">
                    <template v-slot:prepend>
                        <q-icon name="link" />
                    </template>
                    <template v-slot:append>
                        <q-btn round dense flat icon="add" color="primary"
                            :disable="!newImageUrl || !!urlError || validating" @click="addImageFromUrl" />
                    </template>
                </q-input>
            </div>
            <div class="col-12 col-md-4">
                <q-input v-model="newImageCaption" label="Caption (Optional)" outlined
                    placeholder="Describe your image..." />
            </div>
        </div>

        <!-- URL Suggestions -->
        <div v-if="urlSuggestions.length > 0" class="q-mb-md">
            <q-banner class="bg-orange-1 text-orange-8" dense>
                <template v-slot:avatar>
                    <q-icon name="lightbulb" />
                </template>
                <div class="text-caption">
                    <div class="text-weight-medium q-mb-xs">Suggestions:</div>
                    <ul class="q-ma-none q-pl-md">
                        <li v-for="suggestion in urlSuggestions" :key="suggestion">
                            {{ suggestion }}
                        </li>
                    </ul>
                </div>
            </q-banner>
        </div>

        <!-- Current Attachments -->
        <div v-if="attachments.length > 0" class="q-mb-md">
            <h6 class="q-mt-none q-mb-md">Added Images ({{ attachments.length }}/{{ maxAttachments }})</h6>

            <div class="row">
                <div v-for="(attachment, index) in attachments" :key="attachment.id"
                    class="col-12 col-sm-6 col-md-4 q-pa-md">
                    <q-card flat bordered class="attachment-card">
                        <!-- Image Preview -->
                        <div class="image-preview-container">
                            <q-img :src="getImageUrl(attachment)"
                                :alt="attachment.alt || attachment.caption || 'User image'" class="image-preview"
                                loading="lazy" @error="onImageError(attachment)">
                                <template v-slot:loading>
                                    <div class="absolute-full flex flex-center">
                                        <q-spinner color="primary" size="2em" />
                                    </div>
                                </template>
                                <template v-slot:error>
                                    <div class="absolute-full flex flex-center bg-grey">
                                        <div class="text-center text-grey-6">
                                            <q-icon name="broken_image" size="2em" class="q-mb-sm" />
                                            <div class="text-caption">Failed to load</div>
                                        </div>
                                    </div>
                                </template>
                            </q-img>

                            <!-- Remove button -->
                            <q-btn round dense flat icon="close" color="negative" class="absolute-top-right q-ma-sm"
                                @click="removeAttachment(index)" />
                        </div>

                        <!-- Image Details -->
                        <q-card-section class="q-pa-sm">
                            <div class="text-caption text-grey-7 q-mb-xs">
                                <q-icon :name="getProviderIcon(attachment)" size="xs" class="q-mr-xs" />
                                {{ getProviderName(attachment) }}
                            </div>

                            <q-input v-model="attachment.caption" label="Caption" dense outlined class="q-mb-xs" />

                            <q-input v-model="attachment.alt" label="Alt text (for accessibility)" dense outlined />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="attachments.length === 0" class="empty-state text-center q-pa-lg">
            <q-icon name="photo_library" size="3em" color="grey-5" class="q-mb-md" />
            <div class="text-h6 text-grey-6 q-mb-sm">No images added yet</div>
            <div class="text-caption text-grey-5">
                Add external image URLs to include photos in your content
            </div>
        </div>

        <!-- Validation Status -->
        <div v-if="validationStatus" class="q-mt-md">
            <q-linear-progress v-if="validationStatus === 'validating'" indeterminate color="primary" class="q-mb-sm" />
            <div class="text-caption text-grey-6">
                {{ validationMessage }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { externalMediaService } from '../../services/external-media.service';
import type { ContentAttachment } from '../../types/core/content.types';

interface Props {
    modelValue: ContentAttachment[];
    maxAttachments?: number;
}

const props = withDefaults(defineProps<Props>(), {
    maxAttachments: 10,
});

const emit = defineEmits<{
    'update:modelValue': [attachments: ContentAttachment[]];
}>();

const $q = useQuasar();

// Reactive state
const attachments = ref<ContentAttachment[]>([...props.modelValue]);
const newImageUrl = ref('');
const newImageCaption = ref('');
const urlError = ref('');
const validating = ref(false);
const validationStatus = ref<'idle' | 'validating' | 'success' | 'error'>('idle');
const validationMessage = ref('');
const instructionTab = ref('google_photos');

// URL validation debounce
let validationTimeout: NodeJS.Timeout | null = null;

// Computed properties
const urlSuggestions = computed(() => {
    if (!newImageUrl.value) return [];
    return externalMediaService.getUrlSuggestions(newImageUrl.value);
});

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
    attachments.value = [...newValue];
});

// Watch for attachment changes
watch(attachments, (newAttachments) => {
    emit('update:modelValue', newAttachments);
}, { deep: true });

// Methods
function onUrlChange(value: string | number | null) {
    const url = String(value || '');
    newImageUrl.value = url;
    urlError.value = '';

    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }

    if (!url.trim()) {
        validationStatus.value = 'idle';
        return;
    }

    validationTimeout = setTimeout(() => {
        void validateUrl(url);
    }, 500);
}

async function validateUrl(url: string) {
    if (!url.trim()) return;

    validating.value = true;
    validationStatus.value = 'validating';
    validationMessage.value = 'Checking image URL...';

    try {
        const validation = await externalMediaService.validateMediaUrl(url);

        if (validation.isValid) {
            urlError.value = '';
            validationStatus.value = 'success';
            validationMessage.value = `✓ Valid ${validation.type} from ${validation.provider || 'external source'}`;
        } else {
            urlError.value = validation.error || 'Invalid URL';
            validationStatus.value = 'error';
            validationMessage.value = validation.error || 'URL validation failed';
        }
    } catch {
        urlError.value = 'Failed to validate URL';
        validationStatus.value = 'error';
        validationMessage.value = 'Could not validate URL';
    } finally {
        validating.value = false;
    }
}

async function addImageFromUrl() {
    if (!newImageUrl.value.trim()) return;

    if (attachments.value.length >= props.maxAttachments) {
        $q.notify({
            type: 'warning',
            message: `Maximum ${props.maxAttachments} images allowed`,
        });
        return;
    }

    validating.value = true;

    try {
        const attachment = await externalMediaService.createAttachmentFromUrl(
            newImageUrl.value,
            newImageCaption.value || undefined
        );

        if (attachment) {
            attachments.value.push(attachment);

            // Reset form
            newImageUrl.value = '';
            newImageCaption.value = '';
            urlError.value = '';
            validationStatus.value = 'idle';
            validationMessage.value = '';

            $q.notify({
                type: 'positive',
                message: 'Image added successfully',
            });
        } else {
            throw new Error('Failed to create attachment');
        }
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: error instanceof Error ? error.message : 'Failed to add image',
        });
    } finally {
        validating.value = false;
    }
}

function removeAttachment(index: number) {
    attachments.value.splice(index, 1);

    $q.notify({
        type: 'info',
        message: 'Image removed',
    });
}

function getImageUrl(attachment: ContentAttachment): string {
    return externalMediaService.getOptimalImageUrl(attachment, 300, 200);
}

function getProviderIcon(attachment: ContentAttachment): string {
    switch (attachment.hostingProvider) {
        case 'google_photos':
            return 'photo_library';
        case 'google_drive':
            return 'cloud';
        case 'instagram':
            return 'camera_alt';
        case 'facebook':
            return 'share';
        default:
            return 'link';
    }
}

function getProviderName(attachment: ContentAttachment): string {
    switch (attachment.hostingProvider) {
        case 'google_photos':
            return 'Google Photos';
        case 'google_drive':
            return 'Google Drive';
        case 'instagram':
            return 'Instagram';
        case 'facebook':
            return 'Facebook';
        default:
            return 'External';
    }
}

function onImageError(attachment: ContentAttachment) {
    console.warn('Failed to load image:', attachment.externalUrl);
}
</script>

<style scoped>
.external-image-upload {
    width: 100%;
}

.attachment-card {
    height: 100%;
}

.image-preview-container {
    position: relative;
    height: 200px;
}

.image-preview {
    height: 100%;
    width: 100%;
    object-fit: cover;
}

.empty-state {
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

h6 {
    color: var(--q-primary);
    font-weight: 600;
}

/* Dark theme support */
.body--dark .empty-state {
    border-color: #424242;
}
</style>
