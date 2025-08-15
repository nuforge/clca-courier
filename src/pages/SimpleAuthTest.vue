<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h5 q-mb-md">Simple Google Drive Authentication Test</div>
            <p class="text-body2 text-grey-7">
              This is a minimal test to verify Google Identity Services authentication
              without the complexity of the full GAPI client library.
            </p>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-h6 q-mb-sm">Configuration Status</div>
              <q-list bordered>
                <q-item>
                  <q-item-section avatar>
                    <q-icon :name="hasApiKey ? 'check_circle' : 'error'" :color="hasApiKey ? 'green' : 'red'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>API Key</q-item-label>
                    <q-item-label caption>{{ hasApiKey ? 'Configured' : 'Missing' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon :name="hasClientId ? 'check_circle' : 'error'" :color="hasClientId ? 'green' : 'red'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Client ID</q-item-label>
                    <q-item-label caption>{{ hasClientId ? 'Configured' : 'Missing'
                      }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="q-mb-md">
              <div class="text-h6 q-mb-sm">Authentication Status</div>
              <q-list bordered>
                <q-item>
                  <q-item-section avatar>
                    <q-icon :name="authStatus.isAuthenticated ? 'check_circle' : 'radio_button_unchecked'"
                      :color="authStatus.isAuthenticated ? 'green' : 'grey'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Authentication</q-item-label>
                    <q-item-label caption>{{ authStatus.isAuthenticated ? 'Authenticated' : 'Not authenticated'
                    }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon :name="authStatus.hasToken ? 'vpn_key' : 'key_off'"
                      :color="authStatus.hasToken ? 'blue' : 'grey'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Access Token</q-item-label>
                    <q-item-label caption>{{ authStatus.accessToken }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="q-gutter-sm">
              <q-btn color="primary" label="Authenticate with Google" @click="authenticate" :loading="authLoading"
                :disable="!canAuthenticate" />

              <q-btn color="secondary" label="Test API Call" @click="testApi" :loading="apiLoading"
                :disable="!authStatus.isAuthenticated" />

              <q-btn color="negative" label="Clear Status" @click="clearStatus" flat />
            </div>

            <div v-if="error" class="q-mt-md">
              <q-banner class="bg-negative text-white">
                <template v-slot:avatar>
                  <q-icon name="error" />
                </template>
                {{ error }}
              </q-banner>
            </div>

            <div v-if="apiResult" class="q-mt-md">
              <div class="text-h6 q-mb-sm">API Test Result</div>
              <q-card flat bordered>
                <q-card-section>
                  <pre class="text-caption">{{ JSON.stringify(apiResult, null, 2) }}</pre>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { SimpleGoogleDriveAuth } from 'src/services/simple-google-auth-test';

const $q = useQuasar();

// Reactive variables
const authLoading = ref(false);
const apiLoading = ref(false);
const error = ref<string | null>(null);
const apiResult = ref<Record<string, unknown> | null>(null);
const authService = ref<SimpleGoogleDriveAuth | null>(null);
const authStatus = ref({
  isAuthenticated: false,
  hasToken: false,
  accessToken: 'none'
});

// Configuration checks
const hasApiKey = computed(() =>
  Boolean(import.meta.env.VITE_GOOGLE_API_KEY && import.meta.env.VITE_GOOGLE_API_KEY !== 'your_api_key_here')
);

const hasClientId = computed(() =>
  Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_client_id_here.apps.googleusercontent.com')
);

const canAuthenticate = computed(() => hasApiKey.value && hasClientId.value);

// Initialize auth service
onMounted(() => {
  if (canAuthenticate.value) {
    authService.value = new SimpleGoogleDriveAuth(
      import.meta.env.VITE_GOOGLE_CLIENT_ID,
      import.meta.env.VITE_GOOGLE_API_KEY
    );
    updateAuthStatus();
  }
});

// Update auth status
const updateAuthStatus = () => {
  if (authService.value) {
    authStatus.value = authService.value.getStatus();
  }
};

// Authenticate
const authenticate = async () => {
  if (!authService.value) return;

  authLoading.value = true;
  error.value = null;

  try {
    console.log('Starting authentication...');
    await authService.value.authenticate();
    updateAuthStatus();

    $q.notify({
      type: 'positive',
      message: 'Authentication successful!',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = errorMessage;

    $q.notify({
      type: 'negative',
      message: `Authentication failed: ${errorMessage}`,
    });
  } finally {
    authLoading.value = false;
  }
};

// Test API call
const testApi = async () => {
  if (!authService.value) return;

  apiLoading.value = true;
  error.value = null;
  apiResult.value = null;

  try {
    console.log('Testing API call...');
    const result = await authService.value.testApiCall();
    apiResult.value = result;

    $q.notify({
      type: 'positive',
      message: 'API test successful!',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = errorMessage;

    $q.notify({
      type: 'negative',
      message: `API test failed: ${errorMessage}`,
    });
  } finally {
    apiLoading.value = false;
  }
};

// Clear status
const clearStatus = () => {
  error.value = null;
  apiResult.value = null;
  updateAuthStatus();
};
</script>
