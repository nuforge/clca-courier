<template>
    <q-page class="q-pa-md">
        <div class="q-mb-lg">
            <h1 class="text-h3 q-mb-sm">Google Drive Integration Demo</h1>
            <p class="text-subtitle1 text-grey-7">
                This page demonstrates the Google Drive integration setup and configuration status.
            </p>
        </div>

        <!-- Configuration Status -->
        <div class="row q-gutter-lg">
            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">Configuration Status</div>
                        <div class="q-mt-md">
                            <div class="row items-center q-mb-sm">
                                <q-icon :name="hasApiKey ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="hasApiKey ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Google API Key: {{ hasApiKey ? 'Configured' : 'Missing' }}</span>
                            </div>

                            <div class="row items-center q-mb-sm">
                                <q-icon :name="hasClientId ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="hasClientId ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Client ID: {{ hasClientId ? 'Configured' : 'Missing' }}</span>
                            </div>

                            <div class="row items-center q-mb-sm">
                                <q-icon :name="hasProject ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="hasProject ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Project ID: {{ hasProject ? 'Configured' : 'Missing' }}</span>
                            </div>

                            <div class="row items-center q-mb-sm">
                                <q-icon name="mdi-alert-circle" color="orange" class="q-mr-sm" />
                                <span>Implementation: Partially Disabled</span>
                            </div>

                            <div v-if="!hasApiKey || !hasClientId" class="q-mt-md">
                                <q-banner class="bg-orange-1 text-orange-8" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mdi-information" color="orange" />
                                    </template>
                                    Configure your Google Drive credentials in the <code>.env</code> file to enable full
                                    functionality.
                                </q-banner>
                            </div>

                            <div class="q-mt-md">
                                <q-banner class="bg-blue-1 text-blue-8" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mdi-information" color="blue" />
                                    </template>
                                    Google Drive integration is currently in development. Core composables and
                                    components are temporarily disabled
                                    pending full implementation.
                                </q-banner>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">Environment Details</div>
                        <div class="q-mt-md">
                            <div class="text-body2 q-mb-sm">
                                <strong>API Key:</strong> {{ maskedApiKey }}
                            </div>
                            <div class="text-body2 q-mb-sm">
                                <strong>Client ID:</strong> {{ maskedClientId }}
                            </div>
                            <div class="text-body2 q-mb-sm">
                                <strong>Project ID:</strong> {{ projectId || 'Not set' }}
                            </div>
                            <div class="text-body2 q-mb-sm">
                                <strong>Development Server:</strong> {{ devServerUrl }}
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Google Drive Folder Configuration -->
        <div class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Google Drive Folder Configuration</div>
                    <div class="text-subtitle2 text-grey-7 q-mb-md">
                        Configured Google Drive folders for content management
                    </div>

                    <div class="row q-gutter-md">
                        <div v-for="(folder, key) in googleDriveFolders" :key="key" class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="row items-center q-mb-sm">
                                        <q-icon name="mdi-folder" color="primary" class="q-mr-sm" />
                                        <span class="text-weight-medium">{{ folder.name }}</span>
                                    </div>
                                    <div class="text-caption text-grey-7">
                                        ID: {{ folder.id }}
                                    </div>
                                    <div v-if="folder.description" class="text-body2 q-mt-sm">
                                        {{ folder.description }}
                                    </div>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Working Google Drive Components -->
        <div class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Available Google Drive Content</div>
                    <div class="text-subtitle2 text-grey-7 q-mb-md">
                        Access working Google Drive content management
                    </div>

                    <div class="q-gutter-sm">
                        <q-btn color="primary" label="Google Drive Content Dashboard"
                            @click="$router.push('/google-drive-content')" />
                        <q-btn color="secondary" outline label="View Documentation" @click="openDoc" />
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Next Steps -->
        <div class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Implementation Status & Next Steps</div>
                    <div class="q-mt-md">
                        <p class="text-body1">
                            The Google Drive integration environment is properly configured, but core functionality
                            needs to be
                            restored:
                        </p>

                        <div class="q-mt-md">
                            <div class="text-weight-medium q-mb-sm">To Complete:</div>
                            <ul class="q-pl-md">
                                <li>Restore <code>useGoogleDrive.ts</code> composable</li>
                                <li>Implement <code>GoogleDriveImageBrowser.vue</code> component</li>
                                <li>Complete <code>useExternalImageWithGoogleDrive.ts</code> composable</li>
                                <li>Test authentication and file access</li>
                                <li>Enable full demo functionality</li>
                            </ul>
                        </div>

                        <div class="q-mt-md">
                            <div class="text-weight-medium q-mb-sm">Environment Configured:</div>
                            <ul class="q-pl-md">
                                <li>✅ Google Cloud Console project setup</li>
                                <li>✅ Google Drive API enabled</li>
                                <li>✅ OAuth 2.0 credentials configured</li>
                                <li>✅ Environment variables in .env file</li>
                                <li>✅ Google Drive folder IDs configured</li>
                            </ul>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Configuration status
const hasApiKey = ref(false);
const hasClientId = ref(false);
const hasProject = ref(false);
const apiKey = ref('');
const clientId = ref('');
const projectId = ref('');

// Google Drive folder configuration
const googleDriveFolders = ref({
    content: { name: 'Content', id: '', description: 'Main content folder' },
    issues: { name: 'Issues', id: '', description: 'Newsletter issues' },
    pdfs: { name: 'PDFs', id: '', description: 'PDF documents' },
    images: { name: 'Images', id: '', description: 'Image assets' },
    templates: { name: 'Templates', id: '', description: 'Document templates' },
});

// Computed properties
const maskedApiKey = computed(() => {
    if (!apiKey.value) return 'Not configured';
    return apiKey.value.substring(0, 8) + '...' + apiKey.value.substring(apiKey.value.length - 4);
});

const maskedClientId = computed(() => {
    if (!clientId.value) return 'Not configured';
    return clientId.value.substring(0, 12) + '...' + clientId.value.substring(clientId.value.length - 20);
});

const devServerUrl = computed(() => {
    return window.location.origin;
});

// Check configuration on mount
onMounted(() => {
    // Check environment variables
    apiKey.value = import.meta.env.VITE_GOOGLE_API_KEY || '';
    clientId.value = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    projectId.value = import.meta.env.VITE_GOOGLE_PROJECT_ID || '';

    hasApiKey.value = !!(apiKey.value && apiKey.value !== 'your_api_key_here');
    hasClientId.value = !!(clientId.value && clientId.value !== 'your_client_id_here.apps.googleusercontent.com');
    hasProject.value = !!(projectId.value && projectId.value !== 'your_project_id_here');

    // Load folder IDs from environment
    googleDriveFolders.value.content.id = import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID || 'Not configured';
    googleDriveFolders.value.issues.id = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID || 'Not configured';
    googleDriveFolders.value.pdfs.id = import.meta.env.VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID || 'Not configured';
    googleDriveFolders.value.images.id = import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID || 'Not configured';
    googleDriveFolders.value.templates.id = import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID || 'Not configured';
});

// Open documentation
const openDoc = () => {
    window.open('/GOOGLE_DRIVE_INTEGRATION.md', '_blank');
};
</script>
