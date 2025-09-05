<template>
    <div class="firebase-debug-panel q-pa-md">
        <div class="row q-gutter-md">
            <div class="col-12">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">🔍 Firebase Debug Panel</div>
                        <div class="text-subtitle2 text-grey-7">Check your submitted content</div>
                    </q-card-section>

                    <q-card-section>
                        <div class="row q-gutter-md">
                            <div class="col-12 col-md-6">
                                <q-btn color="primary" icon="refresh" label="Check My Content" @click="checkUserContent"
                                    :loading="loading" class="full-width" />
                            </div>
                            <div class="col-12 col-md-6">
                                <q-btn color="secondary" icon="bug_report" label="Test Submission"
                                    @click="testSubmission" :loading="testing" class="full-width" />
                            </div>
                        </div>
                    </q-card-section>

                    <q-card-section v-if="authStatus">
                        <q-banner :class="authStatus.authenticated ? 'bg-positive' : 'bg-negative'" text-color="white">
                            <template v-slot:avatar>
                                <q-icon :name="authStatus.authenticated ? 'check_circle' : 'error'" />
                            </template>
                            <div v-if="authStatus.authenticated">
                                <strong>✅ Authenticated</strong><br>
                                UID: {{ authStatus.user?.uid }}<br>
                                Email: {{ authStatus.user?.email }}
                            </div>
                            <div v-else>
                                <strong>❌ Not Authenticated</strong><br>
                                Please log in to check your content
                            </div>
                        </q-banner>
                    </q-card-section>

                    <q-card-section v-if="content.length > 0">
                        <div class="text-h6 q-mb-md">📝 Your Submitted Content ({{ content.length }})</div>
                        <q-list bordered separator>
                            <q-item v-for="item in content" :key="item.id" clickable v-ripple>
                                <q-item-section avatar>
                                    <q-icon :name="getContentIcon(item.type)" />
                                </q-item-section>

                                <q-item-section>
                                    <q-item-label>{{ item.title }}</q-item-label>
                                    <q-item-label caption>
                                        Type: {{ item.type }} | Status: {{ item.status }} | Category: {{ item.category
                                        }}
                                    </q-item-label>
                                    <q-item-label caption>
                                        Created: {{ formatDate(item.createdAt) }}
                                    </q-item-label>
                                </q-item-section>

                                <q-item-section side>
                                    <q-badge :color="getStatusColor(item.status)" :label="item.status" />
                                </q-item-section>

                                <q-item-section side>
                                    <q-btn flat round dense icon="visibility" @click="showContentDetails(item)" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-card-section>

                    <q-card-section v-else-if="checked && content.length === 0">
                        <q-banner class="bg-info text-white">
                            <template v-slot:avatar>
                                <q-icon name="info" />
                            </template>
                            <strong>No content found</strong><br>
                            No submitted content found in the userContent collection.
                            <br><br>
                            This could mean:
                            <ul class="q-mt-md">
                                <li>You haven't submitted any content yet</li>
                                <li>There might be an authentication issue</li>
                                <li>Firebase security rules might be blocking access</li>
                                <li>The content is being stored in a different location</li>
                            </ul>
                        </q-banner>
                    </q-card-section>

                    <q-card-section v-if="error">
                        <q-banner class="bg-negative text-white">
                            <template v-slot:avatar>
                                <q-icon name="error" />
                            </template>
                            <strong>Error occurred:</strong><br>
                            {{ error }}
                        </q-banner>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Content Details Dialog -->
        <q-dialog v-model="showDetails" maximized>
            <q-card>
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Content Details</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section>
                    <pre class="text-body2">{{ JSON.stringify(selectedContent, null, 2) }}</pre>
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../../config/firebase.config';
import { firebaseAuthService } from '../../services/firebase-auth.service';
import type { BaseContentItem, ContentType } from '../../types/core/content.types';

const $q = useQuasar();

const loading = ref(false);
const testing = ref(false);
const checked = ref(false);
const content = ref<BaseContentItem[]>([]);
const error = ref<string>('');
const authStatus = ref<{
    authenticated: boolean;
    user: { uid: string; email: string | null; displayName: string | null } | null
} | null>(null);
const showDetails = ref(false);
const selectedContent = ref<BaseContentItem | null>(null);

onMounted(() => {
    checkAuthStatus();
});

function checkAuthStatus() {
    const user = firebaseAuthService.getCurrentUser();
    authStatus.value = {
        authenticated: !!user,
        user: user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        } : null
    };
}

async function checkUserContent() {
    loading.value = true;
    error.value = '';
    checked.value = true;

    try {
        const user = firebaseAuthService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        console.log('🔍 Checking content for user:', user.uid);

        const q = query(
            collection(firestore, 'userContent'),
            where('author.uid', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        console.log('📊 Query result:', querySnapshot.size, 'documents found');

        const contentList: BaseContentItem[] = [];
        querySnapshot.forEach((doc) => {
            console.log('📄 Document:', doc.id, doc.data());
            contentList.push({
                id: doc.id,
                ...doc.data()
            } as BaseContentItem);
        });

        content.value = contentList;

        $q.notify({
            type: 'positive',
            message: `Found ${contentList.length} submitted content items`,
        });

    } catch (err: unknown) {
        console.error('💥 Error checking content:', err);
        error.value = err instanceof Error ? err.message : String(err);
        $q.notify({
            type: 'negative',
            message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
    } finally {
        loading.value = false;
    }
}

async function testSubmission() {
    testing.value = true;
    error.value = '';

    try {
        const user = firebaseAuthService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        console.log('🧪 Creating test submission...');

        const testData = {
            type: 'article',
            title: `Debug Test Article - ${new Date().toISOString()}`,
            author: {
                uid: user.uid,
                displayName: user.displayName || 'Anonymous',
                email: user.email || '',
            },
            content: 'This is a test article created for debugging purposes.',
            status: 'submitted',
            metadata: {
                subtitle: 'Debug Test',
                readTime: 1,
                tags: ['debug', 'test']
            },
            attachments: [],
            reviewHistory: [{
                id: `initial_${Date.now()}`,
                reviewerId: user.uid,
                reviewerName: user.displayName || 'Author',
                timestamp: Date.now(),
                status: 'submitted',
                feedback: 'Initial submission'
            }],
            submittedAt: Date.now(),
            priority: 'medium',
            category: 'debug',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const docRef = await addDoc(collection(firestore, 'userContent'), {
            ...testData,
            submittedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log('✅ Test submission successful! ID:', docRef.id);

        $q.notify({
            type: 'positive',
            message: `Test submission successful! Document ID: ${docRef.id}`,
            actions: [
                {
                    label: 'Copy ID',
                    color: 'white',
                    handler: () => void navigator.clipboard.writeText(docRef.id)
                }
            ]
        });

        // Refresh content list
        await checkUserContent();

    } catch (err: unknown) {
        console.error('💥 Test submission failed:', err);
        error.value = err instanceof Error ? err.message : String(err);
        $q.notify({
            type: 'negative',
            message: `Test failed: ${err instanceof Error ? err.message : String(err)}`,
        });
    } finally {
        testing.value = false;
    }
}

function getContentIcon(type: ContentType): string {
    const icons = {
        article: 'article',
        event: 'event',
        project: 'engineering',
        announcement: 'campaign',
        classified: 'local_offer',
        photo_story: 'photo_library'
    };
    return icons[type] || 'description';
}

function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        submitted: 'blue',
        pending: 'orange',
        approved: 'green',
        rejected: 'red',
        draft: 'grey'
    };
    return colors[status] || 'grey';
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

function showContentDetails(item: BaseContentItem) {
    selectedContent.value = item;
    showDetails.value = true;
}
</script>

<style scoped>
pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 70vh;
    overflow-y: auto;
}
</style>
