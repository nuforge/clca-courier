<template>
    <q-page class="q-pa-md">
        <div class="row justify-center">
            <div class="col-md-6 col-xs-12">
                <q-card class="q-pa-lg">
                    <q-card-section>
                        <div class="text-h4 q-mb-md">Admin Setup</div>
                        <div class="text-subtitle1 q-mb-lg">
                            Create your admin profile to access management features
                        </div>

                        <div v-if="!isAuthenticated" class="q-mb-md">
                            <div class="text-body1 q-mb-md">First, sign in with OAuth:</div>
                            <q-btn @click="signInWithGoogle" color="primary" icon="mdi-google"
                                label="Sign in with Google" class="q-mr-sm q-mb-sm" />
                            <q-btn @click="signInWithGithub" color="dark" icon="mdi-github" label="Sign in with GitHub"
                                class="q-mr-sm q-mb-sm" />
                        </div>

                        <div v-else>
                            <q-banner class="bg-positive text-white q-mb-md" rounded>
                                <template v-slot:avatar>
                                    <q-icon name="mdi-check-circle" />
                                </template>
                                Signed in as: {{ currentUser?.email }}
                            </q-banner>

                            <div v-if="!hasAdminProfile">
                                <div class="text-body1 q-mb-md">
                                    Now create your admin profile to access management features:
                                </div>
                                <q-btn @click="createAdminProfile" color="primary" icon="mdi-shield-crown"
                                    label="Create Admin Profile" :loading="isCreatingProfile" />
                            </div>

                            <div v-else>
                                <q-banner class="bg-positive text-white q-mb-md" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mdi-shield-check" />
                                    </template>
                                    Admin profile exists! You have full access.
                                </q-banner>

                                <q-btn @click="goToAdmin" color="primary" icon="mdi-cog"
                                    label="Go to Admin Dashboard" />
                            </div>
                        </div>

                        <div v-if="error" class="q-mt-md">
                            <q-banner class="bg-negative text-white" rounded>
                                <template v-slot:avatar>
                                    <q-icon name="mdi-alert" />
                                </template>
                                {{ error }}
                            </q-banner>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFirebaseAuth } from '../composables/useFirebase';
import { firestoreService } from '../services/firebase-firestore.service';
import { useNavigation } from '../composables/useNavigation';

const router = useRouter();
const { currentUser, isAuthenticated, signIn } = useFirebaseAuth();
const { refreshNavigation } = useNavigation();

const hasAdminProfile = ref(false);
const isCreatingProfile = ref(false);
const error = ref('');

const checkAdminProfile = async () => {
    if (!currentUser.value?.uid) return;

    try {
        const profile = await firestoreService.getUserProfile(currentUser.value.uid);
        hasAdminProfile.value = !!(profile && profile.role === 'admin');
    } catch {
        console.log('No admin profile found yet');
        hasAdminProfile.value = false;
    }
};

const signInWithGoogle = async () => {
    try {
        await signIn('google');
        await checkAdminProfile();
        await refreshNavigation();
    } catch {
        error.value = 'Failed to sign in with Google';
    }
};

const signInWithGithub = async () => {
    try {
        await signIn('github');
        await checkAdminProfile();
        await refreshNavigation();
    } catch {
        error.value = 'Failed to sign in with GitHub';
    }
};

const createAdminProfile = async () => {
    if (!currentUser.value) return;

    isCreatingProfile.value = true;
    error.value = '';

    try {
        const userProfile = {
            uid: currentUser.value.uid,
            email: currentUser.value.email || '',
            displayName: currentUser.value.displayName || 'Admin User',
            ...(currentUser.value.photoURL && { photoURL: currentUser.value.photoURL }),
            role: 'admin' as const,
            permissions: ['read', 'write', 'delete', 'admin', 'editor'],
            isApproved: true,
            approvedBy: 'self',
            approvalDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            preferences: {
                emailNotifications: true,
                pushNotifications: true,
                preferredCategories: [],
            },
        };

        await firestoreService.createUserProfile(userProfile);
        hasAdminProfile.value = true;

        // Refresh navigation to show admin link
        await refreshNavigation();

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        error.value = `Failed to create admin profile: ${message}`;
    } finally {
        isCreatingProfile.value = false;
    }
};

const goToAdmin = async () => {
    await router.push('/admin');
};

onMounted(async () => {
    if (isAuthenticated.value) {
        await checkAdminProfile();
    }
});
</script>
