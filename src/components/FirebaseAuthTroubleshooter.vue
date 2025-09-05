<!-- Firebase Auth Troubleshooter -->
<template>
  <q-card class="q-ma-md">
    <q-card-section>
      <div class="text-h6">🔧 Firebase Auth Troubleshooter</div>
    </q-card-section>

    <q-card-section>
      <div class="q-gutter-md">
        <!-- Environment Info -->
        <q-expansion-item label="Environment Information" icon="info">
          <div class="q-pa-md">
            <div><strong>Current Domain:</strong> {{ currentDomain }}</div>
            <div><strong>Current Origin:</strong> {{ currentOrigin }}</div>
            <div><strong>Firebase Auth Domain:</strong> {{ authDomain }}</div>
            <div><strong>Firebase Project ID:</strong> {{ projectId }}</div>
          </div>
        </q-expansion-item>

        <!-- Test Buttons -->
        <div class="q-gutter-sm">
          <q-btn
            color="primary"
            label="Test Popup Auth"
            @click="testPopupAuth"
            :loading="isTestingPopup"
          />
          <q-btn
            color="secondary"
            label="Test Redirect Auth"
            @click="testRedirectAuth"
            :loading="isTestingRedirect"
          />
          <q-btn
            color="info"
            label="Check Console Config"
            @click="openFirebaseConsole"
          />
        </div>

        <!-- Results -->
        <q-card v-if="testResults.length" flat bordered>
          <q-card-section>
            <div class="text-subtitle2">Test Results:</div>
            <div v-for="(result, index) in testResults" :key="index" class="q-mt-xs">
              <q-icon
                :name="result.success ? 'check_circle' : 'error'"
                :color="result.success ? 'positive' : 'negative'"
              />
              {{ result.message }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { firebaseAuth } from '../config/firebase.config';
import { firebaseAuthService } from '../services/firebase-auth.service';

const isTestingPopup = ref(false);
const isTestingRedirect = ref(false);
const testResults = ref<Array<{success: boolean, message: string}>>([]);

const currentDomain = computed(() => window.location.hostname);
const currentOrigin = computed(() => window.location.origin);
const authDomain = computed(() => firebaseAuth.app.options.authDomain);
const projectId = computed(() => firebaseAuth.app.options.projectId);

const addResult = (success: boolean, message: string) => {
  testResults.value.push({ success, message });
};

const testPopupAuth = async () => {
  isTestingPopup.value = true;
  testResults.value = [];

  try {
    addResult(true, 'Starting popup authentication test...');
    await firebaseAuthService.signInWithPopup('google');
    addResult(true, 'Popup authentication successful!');
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    addResult(false, `Popup authentication failed: ${firebaseError.message || 'Unknown error'}`);

    if (firebaseError.code === 'auth/popup-closed-by-user') {
      addResult(false, 'Popup was closed - check for blank popup or browser blocking');
    }
    if (firebaseError.code === 'auth/popup-blocked') {
      addResult(false, 'Popup blocked by browser - check popup blocker settings');
    }
    if (firebaseError.code === 'auth/unauthorized-domain') {
      addResult(false, 'Domain not authorized - add your domain to Firebase Console');
    }
  } finally {
    isTestingPopup.value = false;
  }
};const testRedirectAuth = async () => {
  isTestingRedirect.value = true;
  testResults.value = [];

  try {
    addResult(true, 'Starting redirect authentication test...');
    await firebaseAuthService.signInWithRedirect('google');
    addResult(true, 'Redirect initiated - you should be redirected to Google...');
  } catch (error: unknown) {
    const firebaseError = error as { message?: string };
    addResult(false, `Redirect authentication failed: ${firebaseError.message || 'Unknown error'}`);
  } finally {
    isTestingRedirect.value = false;
  }
};

const openFirebaseConsole = () => {
  const projectId = firebaseAuth.app.options.projectId;
  const url = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  window.open(url, '_blank');
};
</script>
