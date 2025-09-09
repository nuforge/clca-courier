<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFirebase } from '../composables/useFirebase';
import { logger } from '../utils/logger';

const router = useRouter();
const { auth } = useFirebase();

// State
const isLoading = ref(false);
const userSubmissions = ref<Array<{ id: string; title: string; status: string;[key: string]: unknown }>>([]);

// Computed
const isAuthenticated = computed(() => auth.isAuthenticated.value);
const currentUser = computed(() => auth.currentUser.value);

// Load user submissions when mounted
onMounted(() => {
    if (isAuthenticated.value) {
        void loadUserSubmissions();
    }
});

// Methods
const loadUserSubmissions = async () => {
    // Placeholder - will implement when we have user-specific content queries
    isLoading.value = true;
    try {
        // TODO: Implement getUserSubmissions in Firebase service
        logger.debug('Loading user submissions...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        userSubmissions.value = [];
    } catch (error) {
        logger.error('Error loading user submissions:', error);
    } finally {
        isLoading.value = false;
    }
};

const goToSubmit = () => {
    void router.push('/contribute/submit?type=article');
}; const goToHome = () => {
    void router.push('/');
};
</script>

<template>
    <q-page padding>
        <div class="row justify-center">
            <div class="col-12 col-md-10 col-lg-8">
                <!-- Header -->
                <div class="q-mb-lg">
                    <q-btn flat round icon="arrow_back" @click="goToHome" class="q-mr-md" />
                    <span class="text-h4">Dashboard</span>
                </div>

                <!-- Authentication Check -->
                <div v-if="!isAuthenticated">
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">
                                <q-icon name="lock" class="q-mr-sm" />
                                Sign In Required
                            </div>
                            <p>Please sign in to view your dashboard and manage your submissions.</p>
                            <q-btn color="primary" label="Sign In" @click="$router.push('/settings')" />
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Dashboard Content -->
                <div v-else>
                    <!-- Welcome Card -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-sm">
                                Welcome back, {{ currentUser?.displayName || 'Community Member' }}!
                            </div>
                            <p class="text-body2">
                                Manage your content submissions and track their status here.
                            </p>
                        </q-card-section>
                    </q-card>

                    <!-- Quick Actions -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Quick Actions</div>
                            <div class="row q-gutter-md">
                                <q-btn color="primary" icon="create" label="Submit New Article" @click="goToSubmit" />
                                <q-btn flat color="secondary" icon="refresh" label="Refresh"
                                    @click="loadUserSubmissions" :loading="isLoading" />
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Submissions List -->
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Your Submissions</div>

                            <div v-if="isLoading" class="text-center q-pa-lg">
                                <q-spinner size="40px" color="primary" />
                                <div class="q-mt-md">Loading your submissions...</div>
                            </div>

                            <div v-else-if="userSubmissions.length === 0" class="text-center q-pa-lg">
                                <q-icon name="article" size="64px" color="grey-5" />
                                <div class="text-h6 q-mt-md text-grey-6">No submissions yet</div>
                                <p class="text-body2 text-grey-6 q-mb-md">
                                    You haven't submitted any content yet. Share your stories with the community!
                                </p>
                                <q-btn color="primary" label="Submit Your First Article" @click="goToSubmit" />
                            </div>

                            <div v-else>
                                <!-- TODO: Display user submissions when backend is ready -->
                                <q-list separator>
                                    <q-item v-for="submission in userSubmissions" :key="submission.id">
                                        <q-item-section>
                                            <q-item-label>{{ submission.title }}</q-item-label>
                                            <q-item-label caption>{{ submission.status }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<style scoped>
.q-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
</style>
