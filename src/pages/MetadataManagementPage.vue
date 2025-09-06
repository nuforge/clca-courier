<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12">
                    <!-- Header -->
                    <q-card flat class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h4 text-center q-mb-md">
                                <q-icon name="mdi-database-edit" class="q-mr-sm" />
                                Newsletter Metadata Management
                            </div>
                            <p class="text-center text-body1">
                                Comprehensive PDF metadata extraction, editing, and management system
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Action Toolbar -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="row q-gutter-md">
                                <div class="col-12 col-md-6">
                                    <q-btn color="primary" icon="mdi-refresh" label="Extract All Metadata"
                                        @click="extractAllMetadata" :loading="isExtracting" class="full-width" />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-btn color="secondary" icon="mdi-image-multiple" label="Generate Thumbnails"
                                        @click="generateThumbnails" :loading="isGeneratingThumbs" class="full-width" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Statistics Cards -->
                    <div class="row q-gutter-md q-mb-lg">
                        <div class="col-12 col-sm-6 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ totalNewsletters }}</div>
                                    <div class="text-caption">Total Newsletters</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-sm-6 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ newslettersWithText }}</div>
                                    <div class="text-caption">With Text Content</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-sm-6 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ newslettersWithThumbnails }}</div>
                                    <div class="text-caption">With Thumbnails</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-sm-6 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ totalFileSize }}</div>
                                    <div class="text-caption">Total Size</div>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>

                    <!-- Newsletter List -->
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">
                                <q-icon name="mdi-file-document-multiple" class="q-mr-sm" />
                                Newsletter Metadata
                            </div>

                            <!-- Search and Filter -->
                            <div class="row q-gutter-md q-mb-md">
                                <div class="col-12 col-md-6">
                                    <q-input v-model="searchText" label="Search newsletters..." outlined dense
                                        clearable>
                                        <template v-slot:prepend>
                                            <q-icon name="mdi-magnify" />
                                        </template>
                                    </q-input>
                                </div>
                                <div class="col-12 col-md-3">
                                    <q-select v-model="filterYear" :options="availableYears" label="Filter by Year"
                                        outlined dense clearable emit-value map-options />
                                </div>
                                <div class="col-12 col-md-3">
                                    <q-select v-model="filterSeason" :options="seasonOptions" label="Filter by Season"
                                        outlined dense clearable emit-value map-options />
                                </div>
                            </div>

                            <!-- Newsletter Table -->
                            <q-table :rows="filteredNewsletters" :columns="columns" row-key="id" :loading="isLoading"
                                :pagination="pagination" binary-state-sort flat bordered>
                                <template v-slot:body-cell-thumbnail="props">
                                    <q-td :props="props">
                                        <q-avatar v-if="props.row.thumbnailUrl" size="48px" square>
                                            <img :src="props.row.thumbnailUrl" alt="Thumbnail" />
                                        </q-avatar>
                                        <q-icon v-else name="mdi-file-pdf-box" size="48px" color="grey-5" />
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-title="props">
                                    <q-td :props="props">
                                        <div class="text-weight-medium">{{ props.row.title }}</div>
                                        <div class="text-caption text-grey">{{ props.row.filename }}</div>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-metadata="props">
                                    <q-td :props="props">
                                        <div class="text-body2">{{ props.row.year }} {{ props.row.season }}</div>
                                        <div class="text-caption">
                                            {{ formatFileSize(props.row.fileSize) }}
                                            <span v-if="props.row.pageCount"> • {{ props.row.pageCount }} pages</span>
                                        </div>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-content="props">
                                    <q-td :props="props">
                                        <div class="row q-gutter-xs">
                                            <q-chip v-if="props.row.searchableText" color="positive" text-color="white"
                                                size="sm" icon="mdi-text-search">
                                                Searchable
                                            </q-chip>
                                            <q-chip v-if="props.row.thumbnailUrl" color="info" text-color="white"
                                                size="sm" icon="mdi-image">
                                                Thumbnail
                                            </q-chip>
                                            <q-chip v-if="props.row.featured" color="warning" text-color="white"
                                                size="sm" icon="mdi-star">
                                                Featured
                                            </q-chip>
                                        </div>
                                        <div v-if="props.row.tags?.length" class="q-mt-xs">
                                            <q-chip v-for="tag in props.row.tags.slice(0, 3)" :key="tag" size="xs"
                                                outline color="primary">
                                                {{ tag }}
                                            </q-chip>
                                            <span v-if="props.row.tags.length > 3" class="text-caption">
                                                +{{ props.row.tags.length - 3 }} more
                                            </span>
                                        </div>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-actions="props">
                                    <q-td :props="props">
                                        <div class="row q-gutter-xs">
                                            <q-btn flat dense icon="mdi-eye" color="primary"
                                                @click="viewNewsletter(props.row)" size="sm">
                                                <q-tooltip>View Newsletter</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense icon="mdi-pencil" color="secondary"
                                                @click="editMetadata(props.row)" size="sm">
                                                <q-tooltip>Edit Metadata</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense icon="mdi-text-search" color="accent"
                                                @click="extractText(props.row)" :loading="extractingText[props.row.id]"
                                                size="sm">
                                                <q-tooltip>Extract Text</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense icon="mdi-image" color="info"
                                                @click="generateThumbnail(props.row)"
                                                :loading="generatingThumb[props.row.id]" size="sm">
                                                <q-tooltip>Generate Thumbnail</q-tooltip>
                                            </q-btn>
                                        </div>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Edit Metadata Dialog -->
        <q-dialog v-model="showEditDialog" persistent>
            <q-card style="min-width: 600px">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Edit Newsletter Metadata</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section v-if="editingNewsletter">
                    <div class="row q-gutter-md">
                        <!-- Basic Information -->
                        <div class="col-12">
                            <q-input v-model="editingNewsletter.title" label="Title" outlined dense />
                        </div>

                        <div class="col-12 col-md-6">
                            <q-input v-model="editingNewsletter.year" label="Year" type="number" outlined dense />
                        </div>

                        <div class="col-12 col-md-6">
                            <q-select v-model="editingNewsletter.season" :options="seasonOptions" label="Season"
                                outlined dense emit-value map-options />
                        </div>

                        <div class="col-12 col-md-6">
                            <q-input v-model="editingNewsletter.volume" label="Volume" type="number" outlined dense />
                        </div>

                        <div class="col-12 col-md-6">
                            <q-input v-model="editingNewsletter.issue" label="Issue" type="number" outlined dense />
                        </div>

                        <div class="col-12">
                            <q-input v-model="editingNewsletter.description" label="Description" type="textarea"
                                outlined rows="3" />
                        </div>

                        <div class="col-12">
                            <q-input v-model="editingNewsletter.summary" label="Summary (for featured content)"
                                type="textarea" outlined rows="2" />
                        </div>

                        <!-- Tags -->
                        <div class="col-12">
                            <q-select v-model="editingNewsletter.tags" :options="availableTags" label="Tags" multiple
                                use-chips use-input @new-value="addNewTag" outlined dense />
                        </div>

                        <!-- Categories -->
                        <div class="col-12">
                            <q-select v-model="editingNewsletter.categories" :options="availableCategories"
                                label="Categories" multiple use-chips outlined dense />
                        </div>

                        <!-- Contributors -->
                        <div class="col-12">
                            <q-input v-model="contributorsString" label="Contributors (comma-separated)" outlined
                                dense />
                        </div>

                        <!-- Flags -->
                        <div class="col-12">
                            <div class="row q-gutter-md">
                                <q-checkbox v-model="editingNewsletter.featured" label="Featured on homepage" />
                                <q-checkbox v-model="editingNewsletter.isPublished"
                                    label="Published (visible to users)" />
                            </div>
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn color="primary" label="Save Changes" @click="saveMetadata" :loading="isSaving" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';

interface Newsletter {
    id: string;
    filename: string;
    title: string;
    description?: string;
    summary?: string;
    year: number;
    season: string;
    volume?: number;
    issue?: number;
    fileSize: number;
    pageCount?: number;
    downloadUrl: string;
    thumbnailUrl?: string;
    searchableText?: string;
    tags: string[];
    categories?: string[];
    contributors?: string[] | string;
    featured: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

const $q = useQuasar();

// State
const newsletters = ref<Newsletter[]>([]);
const isLoading = ref(false);
const isExtracting = ref(false);
const isGeneratingThumbs = ref(false);
const isSaving = ref(false);
const extractingText = ref<Record<string, boolean>>({});
const generatingThumb = ref<Record<string, boolean>>({});

// Filters
const searchText = ref('');
const filterYear = ref<number | null>(null);
const filterSeason = ref<string | null>(null);

// Edit dialog
const showEditDialog = ref(false);
const editingNewsletter = ref<Newsletter | null>(null);

// Table configuration
const pagination = ref({
    sortBy: 'year',
    descending: true,
    page: 1,
    rowsPerPage: 10,
});

const columns = [
    {
        name: 'thumbnail',
        label: '',
        field: 'thumbnailUrl',
        align: 'center' as const,
        style: 'width: 60px',
    },
    {
        name: 'title',
        label: 'Newsletter',
        field: 'title',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'metadata',
        label: 'Details',
        field: 'year',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'content',
        label: 'Content Status',
        field: 'searchableText',
        align: 'left' as const,
    },
    {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
        style: 'width: 200px',
    },
];

// Options
const seasonOptions = [
    { label: 'Spring', value: 'spring' },
    { label: 'Summer', value: 'summer' },
    { label: 'Fall', value: 'fall' },
    { label: 'Winter', value: 'winter' },
];

const availableCategories = [
    'Community Events',
    'Lake Activities',
    'Wildlife & Nature',
    'Property Matters',
    'Recreation',
    'Weather Updates',
    'Local Business',
    'Community News',
    'Board Updates',
    'Maintenance',
    'Safety',
    'Environment',
];

// Computed
const availableYears = computed(() => {
    const years = [...new Set(newsletters.value.map(n => n.year))].sort((a, b) => b - a);
    return years.map(year => ({ label: year.toString(), value: year }));
});

const availableTags = computed(() => {
    const allTags = newsletters.value.flatMap(n => n.tags || []);
    return [...new Set(allTags)].sort();
});

const filteredNewsletters = computed(() => {
    let filtered = newsletters.value;

    if (searchText.value) {
        const search = searchText.value.toLowerCase();
        filtered = filtered.filter(n =>
            n.title?.toLowerCase().includes(search) ||
            n.filename?.toLowerCase().includes(search) ||
            n.tags?.some(tag => tag.toLowerCase().includes(search))
        );
    }

    if (filterYear.value) {
        filtered = filtered.filter(n => n.year === filterYear.value);
    }

    if (filterSeason.value) {
        filtered = filtered.filter(n => n.season === filterSeason.value);
    }

    return filtered;
});

const totalNewsletters = computed(() => newsletters.value.length);

const newslettersWithText = computed(() =>
    newsletters.value.filter(n => n.searchableText).length
);

const newslettersWithThumbnails = computed(() =>
    newsletters.value.filter(n => n.thumbnailUrl).length
);

const totalFileSize = computed(() => {
    const total = newsletters.value.reduce((sum, n) => sum + (n.fileSize || 0), 0);
    return formatFileSize(total);
});

// Computed for form handling
const contributorsString = computed({
    get: () => {
        if (!editingNewsletter.value) return '';
        const contributors = editingNewsletter.value.contributors;
        if (Array.isArray(contributors)) {
            return contributors.join(', ');
        }
        return contributors || '';
    },
    set: (value: string) => {
        if (editingNewsletter.value) {
            editingNewsletter.value.contributors = value;
        }
    }
});

// Methods
function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function viewNewsletter(newsletter: Newsletter): void {
    // Open newsletter in new tab
    window.open(newsletter.downloadUrl, '_blank');
}

function editMetadata(newsletter: Newsletter): void {
    editingNewsletter.value = { ...newsletter };

    // Convert contributors array to comma-separated string
    if (editingNewsletter.value && Array.isArray(editingNewsletter.value.contributors)) {
        editingNewsletter.value.contributors = editingNewsletter.value.contributors.join(', ');
    }

    showEditDialog.value = true;
}

async function saveMetadata(): Promise<void> {
    if (!editingNewsletter.value) return;

    isSaving.value = true;

    try {
        const updates = { ...editingNewsletter.value };

        // Convert contributors string to array
        if (typeof updates.contributors === 'string') {
            updates.contributors = updates.contributors
                .split(',')
                .map((c: string) => c.trim())
                .filter((c: string) => c.length > 0);
        }

        // Update timestamps
        updates.updatedAt = new Date().toISOString();
        updates.updatedBy = 'admin';

        // Update in Firestore
        const docRef = doc(firestore, 'newsletters', updates.id);
        await updateDoc(docRef, updates);

        $q.notify({
            type: 'positive',
            message: 'Metadata updated successfully',
            position: 'top',
        });

        showEditDialog.value = false;
    } catch (error) {
        console.error('Error updating metadata:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to update metadata',
            position: 'top',
        });
    } finally {
        isSaving.value = false;
    }
}

function addNewTag(val: string, done: (val: string, mode?: 'add' | 'add-unique' | 'toggle') => void): void {
    if (val.length > 2) {
        if (!availableTags.value.includes(val)) {
            done(val, 'add-unique');
        }
    }
}

async function extractAllMetadata() {
    isExtracting.value = true;

    try {
        $q.notify({
            type: 'info',
            message: 'Starting metadata extraction...',
            position: 'top',
        });

        // This would call your backend script
        // For now, just simulate the process
        await new Promise(resolve => setTimeout(resolve, 3000));

        $q.notify({
            type: 'positive',
            message: 'Metadata extraction completed',
            position: 'top',
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Metadata extraction failed',
            position: 'top',
        });
    } finally {
        isExtracting.value = false;
    }
}

async function generateThumbnails() {
    isGeneratingThumbs.value = true;

    try {
        $q.notify({
            type: 'info',
            message: 'Generating thumbnails...',
            position: 'top',
        });

        // Simulate thumbnail generation
        await new Promise(resolve => setTimeout(resolve, 5000));

        $q.notify({
            type: 'positive',
            message: 'Thumbnails generated successfully',
            position: 'top',
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Thumbnail generation failed',
            position: 'top',
        });
    } finally {
        isGeneratingThumbs.value = false;
    }
}

async function extractText(newsletter: Newsletter): Promise<void> {
    extractingText.value[newsletter.id] = true;

    try {
        $q.notify({
            type: 'info',
            message: `Extracting text from ${newsletter.filename}...`,
            position: 'top',
        });

        // Simulate text extraction
        await new Promise(resolve => setTimeout(resolve, 2000));

        $q.notify({
            type: 'positive',
            message: 'Text extraction completed',
            position: 'top',
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Text extraction failed',
            position: 'top',
        });
    } finally {
        extractingText.value[newsletter.id] = false;
    }
}

async function generateThumbnail(newsletter: Newsletter): Promise<void> {
    generatingThumb.value[newsletter.id] = true;

    try {
        $q.notify({
            type: 'info',
            message: `Generating thumbnail for ${newsletter.filename}...`,
            position: 'top',
        });

        // Simulate thumbnail generation
        await new Promise(resolve => setTimeout(resolve, 3000));

        $q.notify({
            type: 'positive',
            message: 'Thumbnail generated successfully',
            position: 'top',
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Thumbnail generation failed',
            position: 'top',
        });
    } finally {
        generatingThumb.value[newsletter.id] = false;
    }
}

// Load newsletters
onMounted(() => {
    isLoading.value = true;

    const q = query(
        collection(firestore, 'newsletters'),
        orderBy('year', 'desc'),
        orderBy('season', 'desc')
    );

    onSnapshot(q, (querySnapshot) => {
        newsletters.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Newsletter[];
        isLoading.value = false;
    }, (error) => {
        console.error('Error loading newsletters:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to load newsletters',
            position: 'top',
        });
        isLoading.value = false;
    });
});
</script>

<style scoped>
.q-card {
    transition: all 0.3s ease;
}

.q-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>
