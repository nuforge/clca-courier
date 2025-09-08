<!--
  Simplified Firebase-First Admin Page
  MVP approach for rapid development
-->
<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12">
                    <!-- Header -->
                    <q-card flat class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h4 text-center q-mb-md">
                                <q-icon name="mdi-firebase" class="q-mr-sm text-orange" />
                                Firebase-First Newsletter Management
                            </div>
                            <p class="text-center text-body1">
                                Simplified admin interface - direct Firebase operations only
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Statistics -->
                    <div class="row  q-mb-lg">
                        <div class="col-12 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ totalNewsletters }}</div>
                                    <div class="text-caption">Total Newsletters</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ publishedNewsletters.length }}</div>
                                    <div class="text-caption">Published</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ unpublishedNewsletters.length }}</div>
                                    <div class="text-caption">Unpublished</div>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-md-3">
                            <q-card class="text-center">
                                <q-card-section>
                                    <div class="text-h6">{{ featuredNewsletters.length }}</div>
                                    <div class="text-caption">Featured</div>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="row ">
                                <q-btn color="primary" icon="mdi-reload" label="Load from Firebase"
                                    @click="loadNewsletters" :loading="isLoading" unelevated />
                                <q-btn color="positive" icon="mdi-upload" label="Process Local PDFs → Firebase"
                                    @click="showProcessDialog" :loading="isProcessing" unelevated />
                                <q-btn color="orange" icon="mdi-delete-sweep" label="Clear All Caches"
                                    @click="clearAllCaches" outline />
                                <q-btn color="info" icon="mdi-bug" label="Debug Info" @click="showDebugInfo" outline />
                            </div>

                            <!-- Processing Progress -->
                            <div v-if="processingStatus" class="q-mt-md">
                                <q-linear-progress :value="processingStatus.percentage / 100" color="positive"
                                    size="20px" class="q-mb-sm">
                                    <div class="absolute-full flex flex-center">
                                        <q-badge color="white" text-color="positive"
                                            :label="`${processingStatus.percentage}%`" />
                                    </div>
                                </q-linear-progress>
                                <div class="text-caption">{{ processingStatus.message }}</div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Newsletters Table -->
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">
                                <q-icon name="mdi-newspaper" class="q-mr-sm" />
                                Newsletters in Firebase
                            </div>

                            <q-table :rows="newsletters" :columns="tableColumns" row-key="id" :loading="isLoading"
                                :pagination="{ rowsPerPage: 20 }" binary-state-sort>
                                <!-- Publication Status -->
                                <template v-slot:body-cell-isPublished="props">
                                    <q-td :props="props">
                                        <q-toggle v-model="props.row.isPublished"
                                            @update:model-value="togglePublished(props.row)" color="positive" />
                                        <q-tooltip>{{ props.row.isPublished ? 'Published' : 'Unpublished' }}</q-tooltip>
                                    </q-td>
                                </template>

                                <!-- Featured Status -->
                                <template v-slot:body-cell-featured="props">
                                    <q-td :props="props">
                                        <q-toggle v-model="props.row.featured"
                                            @update:model-value="toggleFeatured(props.row)" color="orange" />
                                        <q-tooltip>{{ props.row.featured ? 'Featured' : 'Normal' }}</q-tooltip>
                                    </q-td>
                                </template>

                                <!-- Actions -->
                                <template v-slot:body-cell-actions="props">
                                    <q-td :props="props">
                                        <q-btn flat dense icon="mdi-pencil" @click="editNewsletter(props.row)"
                                            color="primary">
                                            <q-tooltip>Edit</q-tooltip>
                                        </q-btn>
                                        <q-btn flat dense icon="mdi-delete" @click="confirmDelete(props.row)"
                                            color="negative">
                                            <q-tooltip>Delete</q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Process Local PDFs Dialog -->
        <q-dialog v-model="showProcessingDialog" persistent>
            <q-card style="min-width: 400px">
                <q-card-section>
                    <div class="text-h6">Process Local PDFs to Firebase</div>
                </q-card-section>

                <q-card-section>
                    <div v-if="localPdfFiles.length === 0">
                        <q-banner class="bg-orange-1 text-orange-8">
                            <template v-slot:avatar>
                                <q-icon name="mdi-alert" />
                            </template>
                            No local PDF files found. Make sure PDFs are in <code>public/issues/</code> directory.
                        </q-banner>
                    </div>
                    <div v-else>
                        <p>Found {{ localPdfFiles.length }} local PDF files:</p>
                        <q-list dense>
                            <q-item v-for="file in localPdfFiles.slice(0, 5)" :key="file">
                                <q-item-section>
                                    <q-item-label>{{ file }}</q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-item v-if="localPdfFiles.length > 5">
                                <q-item-section>
                                    <q-item-label class="text-caption">
                                        ... and {{ localPdfFiles.length - 5 }} more
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" @click="showProcessingDialog = false" />
                    <q-btn color="positive" label="Process All" @click="processLocalPdfs"
                        :disable="localPdfFiles.length === 0" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Edit Newsletter Dialog -->
        <q-dialog v-model="showEditDialog" persistent>
            <q-card style="min-width: 500px" v-if="editingNewsletter">
                <q-card-section>
                    <div class="text-h6">Edit Newsletter</div>
                </q-card-section>

                <q-card-section>
                    <q-input v-model="editingNewsletter.title" label="Title" outlined class="q-mb-md" />
                    <q-input v-model="editingNewsletter.description" label="Description" outlined type="textarea"
                        rows="3" class="q-mb-md" />
                    <div class="row ">
                        <q-toggle v-model="editingNewsletter.isPublished" label="Published" color="positive" />
                        <q-toggle v-model="editingNewsletter.featured" label="Featured" color="orange" />
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" @click="cancelEdit" />
                    <q-btn color="primary" label="Save" @click="saveEdit" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseAuthService } from '../services/firebase-auth.service';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';

const $q = useQuasar();

// Basic admin state (simplified without PDF processing)
const newsletters = ref<NewsletterMetadata[]>([]);
const isLoading = ref(false);
const isProcessing = ref(false);
const processingStatus = ref({ message: '', percentage: 0 });
const publishedNewsletters = ref<NewsletterMetadata[]>([]);
const unpublishedNewsletters = ref<NewsletterMetadata[]>([]);
const featuredNewsletters = ref<NewsletterMetadata[]>([]);
const totalNewsletters = ref(0);

// Placeholder functions (PDF processing removed)
const loadNewsletters = () => {
    // TODO: Implement newsletter loading from Firebase
    console.log('Loading newsletters...');
};

const processLocalPdfsToFirebase = (files: string[]) => {
    // TODO: Implement PDF processing (removed for now)
    console.log('PDF processing removed for files:', files);
};

const updateNewsletter = (id: string, updates: Partial<NewsletterMetadata>) => {
    // TODO: Implement newsletter update
    console.log('Update newsletter:', id, updates);
};

const togglePublished = (newsletter: NewsletterMetadata) => {
    // TODO: Implement publish toggle
    console.log('Toggle published:', newsletter);
};

const toggleFeatured = (newsletter: NewsletterMetadata) => {
    // TODO: Implement featured toggle
    console.log('Toggle featured:', newsletter);
};

const deleteNewsletter = (newsletter: NewsletterMetadata) => {
    // TODO: Implement newsletter deletion
    console.log('Delete newsletter:', newsletter);
};

const getLocalPdfFilenames = (): Promise<string[]> => {
    // TODO: Implement local PDF discovery
    return Promise.resolve([]);
};// Local state
const showProcessingDialog = ref(false);
const showEditDialog = ref(false);
const localPdfFiles = ref<string[]>([]);
const editingNewsletter = ref<NewsletterMetadata | null>(null);

// Table configuration
const tableColumns = [
    {
        name: 'filename',
        label: 'Filename',
        field: 'filename',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'title',
        label: 'Title',
        field: 'title',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'displayDate',
        label: 'Date',
        field: 'displayDate',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'isPublished',
        label: 'Published',
        field: 'isPublished',
        align: 'center' as const,
    },
    {
        name: 'featured',
        label: 'Featured',
        field: 'featured',
        align: 'center' as const,
    },
    {
        name: 'actions',
        label: 'Actions',
        field: '',
        align: 'center' as const,
    },
];

// Actions
const showProcessDialog = async (): Promise<void> => {
    localPdfFiles.value = await getLocalPdfFilenames();
    showProcessingDialog.value = true;
};

const processLocalPdfs = (): void => {
    showProcessingDialog.value = false;
    processLocalPdfsToFirebase(localPdfFiles.value);
};

const editNewsletter = (newsletter: NewsletterMetadata): void => {
    editingNewsletter.value = { ...newsletter };
    showEditDialog.value = true;
};

const cancelEdit = (): void => {
    editingNewsletter.value = null;
    showEditDialog.value = false;
};

const saveEdit = (): void => {
    if (!editingNewsletter.value) return;

    const updates: Partial<NewsletterMetadata> = {
        title: editingNewsletter.value.title,
        isPublished: editingNewsletter.value.isPublished,
        featured: editingNewsletter.value.featured,
    };

    // Only include description if it has a value
    if (editingNewsletter.value.description) {
        updates.description = editingNewsletter.value.description;
    }

    updateNewsletter(editingNewsletter.value.id, updates);
    cancelEdit();
};

const confirmDelete = (newsletter: NewsletterMetadata): void => {
    $q.dialog({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${newsletter.title}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
    }).onOk(() => {
        void deleteNewsletter(newsletter);
    });
};

const clearAllCaches = async (): Promise<void> => {
    try {
        // Clear browser caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Clear local storage
        localStorage.clear();

        // Clear session storage
        sessionStorage.clear();

        // Clear avatar cache
        if (firebaseAuthService.clearAvatarCache) {
            firebaseAuthService.clearAvatarCache();
        }

        $q.notify({
            type: 'positive',
            message: 'All caches cleared successfully',
            caption: 'Browser cache, local storage, and avatar cache cleared',
        });
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: 'Failed to clear some caches',
            caption: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

const showDebugInfo = (): void => {
    const debugInfo = {
        firebaseProject: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set',
        currentUser: firebaseAuthService.getCurrentUser()?.email || 'Not authenticated',
        newsletterCount: newsletters.value.length,
        firstFewFilenames: newsletters.value.slice(0, 3).map((n: NewsletterMetadata) => n.filename),
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        // Additional debug info
        browserUrl: window.location.href,
        localStorage: Object.keys(localStorage).filter(key =>
            key.includes('firebase') || key.includes('newsletter') || key.includes('clca')
        ),
        sessionStorage: Object.keys(sessionStorage).filter(key =>
            key.includes('firebase') || key.includes('newsletter') || key.includes('clca')
        ),
        firebaseConfig: {
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        },
        sampleNewsletterData: newsletters.value.slice(0, 2).map((n: NewsletterMetadata) => ({
            id: n.id,
            filename: n.filename,
            createdAt: n.createdAt,
            isPublished: n.isPublished,
        })),
    };

    console.log('🐛 FULL Debug Info:', debugInfo);

    $q.dialog({
        title: 'Debug Information',
        message: `
      <strong>Firebase Project:</strong> ${debugInfo.firebaseProject}<br>
      <strong>Current User:</strong> ${debugInfo.currentUser}<br>
      <strong>Newsletter Count:</strong> ${debugInfo.newsletterCount}<br>
      <strong>Environment:</strong> ${debugInfo.environment}<br>
      <strong>Sample Filenames:</strong> ${debugInfo.firstFewFilenames.join(', ')}<br>
      <strong>Browser URL:</strong> ${debugInfo.browserUrl}<br>
      <strong>Firebase Auth Domain:</strong> ${debugInfo.firebaseConfig.authDomain}<br>
      <strong>Local Storage Keys:</strong> ${debugInfo.localStorage.join(', ') || 'None'}<br>
      <strong>Session Storage Keys:</strong> ${debugInfo.sessionStorage.join(', ') || 'None'}<br>
      <br>
      <em>Check browser console for complete debug information including sample newsletter data.</em>
    `,
        html: true,
    });
};

// Load data on mount
onMounted(() => {
    loadNewsletters();
});
</script>
