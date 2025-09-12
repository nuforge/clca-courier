<!--
  Text Extraction Dialog Component
  Displays extracted text content from newsletters
-->
<template>
    <q-dialog v-model="isOpen" maximized>
        <q-card>
            <q-card-section class="row items-center q-pb-none">
                <div>
                    <div class="text-h6">Extracted Text Content</div>
                    <div v-if="newsletter" class="text-caption text-grey-6">
                        {{ newsletter.filename }} • {{ newsletter.wordCount || 0 }} words
                    </div>
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-none" style="height: calc(100vh - 120px)">
                <div v-if="newsletter" class="full-height">
                    <q-tabs v-model="activeTab" align="left" dense class="text-grey-6 bg-grey" active-color="primary"
                        narrow-indicator>
                        <q-tab name="text" icon="mdi-text-box" label="Extracted Text" />
                        <q-tab name="metadata" icon="mdi-information" label="Metadata" />
                        <q-tab name="analysis" icon="mdi-chart-box" label="Analysis" />
                    </q-tabs>

                    <q-separator />

                    <q-tab-panels v-model="activeTab" animated class="full-height">
                        <!-- Extracted Text Tab -->
                        <q-tab-panel name="text" class="q-pa-md">
                            <div class="row ">
                                <div class="col-12">
                                    <q-input :model-value="newsletter.searchableText || 'No text content available'"
                                        label="Full Text Content" type="textarea" outlined readonly class="full-width"
                                        style="height: calc(100vh - 250px)"
                                        input-style="height: calc(100vh - 320px); resize: none; font-family: monospace; font-size: 14px; line-height: 1.4;" />
                                </div>
                            </div>
                        </q-tab-panel>

                        <!-- Metadata Tab -->
                        <q-tab-panel name="metadata" class="q-pa-md">
                            <div class="row ">
                                <div class="col-12 col-md-6">
                                    <q-card flat bordered>
                                        <q-card-section>
                                            <div class="text-h6 q-mb-md">Content Statistics</div>
                                            <q-list dense>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Word Count</q-item-label>
                                                        <q-item-label caption>{{ newsletter.wordCount || 0 }}
                                                            words</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Character Count</q-item-label>
                                                        <q-item-label caption>{{ newsletter.searchableText?.length || 0
                                                        }} characters</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Reading Time</q-item-label>
                                                        <q-item-label caption>{{ readingTime }} minutes</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Page Count</q-item-label>
                                                        <q-item-label caption>{{ newsletter.pageCount || 0 }}
                                                            pages</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                            </q-list>
                                        </q-card-section>
                                    </q-card>
                                </div>

                                <div class="col-12 col-md-6">
                                    <q-card flat bordered>
                                        <q-card-section>
                                            <div class="text-h6 q-mb-md">Document Information</div>
                                            <q-list dense>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Title</q-item-label>
                                                        <q-item-label caption>{{ newsletter.title }}</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Publication Date</q-item-label>
                                                        <q-item-label caption>{{ formatDate(newsletter.publicationDate)
                                                        }}</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>File Size</q-item-label>
                                                        <q-item-label caption>{{ formatFileSize(newsletter.fileSize)
                                                        }}</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                                <q-item>
                                                    <q-item-section>
                                                        <q-item-label>Last Updated</q-item-label>
                                                        <q-item-label caption>{{ formatDate(newsletter.updatedAt)
                                                        }}</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                            </q-list>
                                        </q-card-section>
                                    </q-card>
                                </div>

                                <div class="col-12">
                                    <q-card flat bordered>
                                        <q-card-section>
                                            <div class="text-h6 q-mb-md">Tags & Categories</div>
                                            <div class="q-mb-md">
                                                <div class="text-subtitle2 q-mb-sm">Tags:</div>
                                                <TagDisplay
                                                    v-if="newsletter.tags?.length"
                                                    :tags="newsletter.tags"
                                                    variant="outline"
                                                    size="sm"
                                                />
                                                <div v-else class="text-grey-6">No tags assigned</div>
                                            </div>
                                            <div>
                                                <div class="text-subtitle2 q-mb-sm">Categories:</div>
                                                <q-chip v-for="category in newsletter.categories" :key="category"
                                                    :label="category" color="secondary" outline size="sm"
                                                    class="q-mr-xs q-mb-xs" />
                                                <div v-if="!newsletter.categories?.length" class="text-grey-6">No
                                                    categories assigned</div>
                                            </div>
                                        </q-card-section>
                                    </q-card>
                                </div>
                            </div>
                        </q-tab-panel>

                        <!-- Analysis Tab -->
                        <q-tab-panel name="analysis" class="q-pa-md">
                            <div class="row ">
                                <div class="col-12">
                                    <q-card flat bordered>
                                        <q-card-section>
                                            <div class="text-h6 q-mb-md">Text Analysis</div>
                                            <div class="row ">
                                                <div class="col-12 col-md-6">
                                                    <div class="text-subtitle2 q-mb-sm">Word Frequency (Top 10)</div>
                                                    <q-list dense bordered class="rounded-borders">
                                                        <q-item v-for="(count, word) in topWords" :key="word"
                                                            class="q-py-xs">
                                                            <q-item-section>
                                                                <q-item-label>{{ word }}</q-item-label>
                                                            </q-item-section>
                                                            <q-item-section side>
                                                                <q-badge :label="count" color="primary" />
                                                            </q-item-section>
                                                        </q-item>
                                                    </q-list>
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <div class="text-subtitle2 q-mb-sm">Content Preview</div>
                                                    <q-card flat bordered class="q-pa-md">
                                                        <div class="text-body2" style="line-height: 1.5;">
                                                            {{ contentPreview }}
                                                        </div>
                                                    </q-card>
                                                </div>
                                            </div>
                                        </q-card-section>
                                    </q-card>
                                </div>
                            </div>
                        </q-tab-panel>
                    </q-tab-panels>
                </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
                <q-btn flat label="Close" v-close-popup />
                <q-btn color="primary" icon="mdi-content-copy" label="Copy Text" @click="copyTextToClipboard" outline />
                <q-btn color="secondary" icon="mdi-download" label="Export Text" @click="exportTextAsFile" outline />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { ContentManagementNewsletter } from '../../types';
import TagDisplay from '../common/TagDisplay.vue';

interface Props {
    modelValue: boolean;
    newsletter: ContentManagementNewsletter | null;
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const $q = useQuasar();
const activeTab = ref('text');

// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
});

const readingTime = computed(() => {
    if (!props.newsletter?.wordCount) return 0;
    return Math.ceil(props.newsletter.wordCount / 200); // Average reading speed
});

const topWords = computed(() => {
    if (!props.newsletter?.searchableText) return {};

    // Simple word frequency analysis
    const text = props.newsletter.searchableText.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || []; // Words with 4+ characters
    const frequency: Record<string, number> = {};

    // Common stop words to exclude
    const stopWords = new Set([
        'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want',
        'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here',
        'would', 'there', 'could', 'other', 'after', 'first', 'well', 'year',
        'about', 'community', 'newsletter', 'conashaugh', 'lakes', 'lake'
    ]);

    words.forEach(word => {
        if (!stopWords.has(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    // Get top 10 words
    const sorted = Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    return Object.fromEntries(sorted);
});

const contentPreview = computed(() => {
    if (!props.newsletter?.searchableText) return 'No content available';
    return props.newsletter.searchableText.substring(0, 300) + '...';
});

// Methods
const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const copyTextToClipboard = async (): Promise<void> => {
    if (!props.newsletter?.searchableText) return;

    try {
        await navigator.clipboard.writeText(props.newsletter.searchableText);
        $q.notify({
            type: 'positive',
            message: 'Text copied to clipboard',
            timeout: 2000
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Failed to copy text',
            timeout: 2000
        });
    }
};

const exportTextAsFile = (): void => {
    if (!props.newsletter?.searchableText) return;

    const blob = new Blob([props.newsletter.searchableText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.newsletter.filename.replace('.pdf', '')}_extracted_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    $q.notify({
        type: 'positive',
        message: 'Text file downloaded',
        timeout: 2000
    });
};
</script>
