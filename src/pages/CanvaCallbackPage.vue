<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <div v-if="isLoading" class="column items-center q-gutter-md">
        <q-spinner-orbit
          color="primary"
          size="3em"
        />
        <div class="text-h6">{{ $t(TRANSLATION_KEYS.CANVA.PROCESSING) }}</div>
        <div class="text-subtitle2 text-grey-6">{{ $t('canva.processingCallback') }}</div>
      </div>

      <div v-else-if="hasError" class="column items-center q-gutter-md">
        <q-icon
          name="error"
          color="negative"
          size="3em"
        />
        <div class="text-h6">{{ $t(TRANSLATION_KEYS.CANVA.AUTH_FAILED) }}</div>
        <div class="text-subtitle2 text-grey-6">{{ errorMessage }}</div>
        <q-btn
          :label="$t(TRANSLATION_KEYS.COMMON.BACK)"
          color="primary"
          @click="goBack"
        />
      </div>

      <div v-else class="column items-center q-gutter-md">
        <q-icon
          name="check_circle"
          color="positive"
          size="3em"
        />
        <div class="text-h6">{{ $t(TRANSLATION_KEYS.CANVA.CONNECTED_TO_CANVA) }}</div>
        <div class="text-subtitle2 text-grey-6">{{ $t('canva.redirectingBack') }}</div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCanvaAuth } from '../composables/useCanvaAuth';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import { logger } from '../utils/logger';

const router = useRouter();
const { t } = useI18n();
const { handleOAuthRedirect, isLoading } = useCanvaAuth();

const hasError = ref(false);
const errorMessage = ref('');

/**
 * Go back to the content submission page
 */
function goBack(): void {
  void router.push('/contribute/submit');
}

/**
 * Handle the OAuth callback when component mounts
 */
onMounted(async () => {
  try {
    logger.info('Canva OAuth callback page mounted');

    // Check if there's an error parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      hasError.value = true;
      errorMessage.value = `OAuth error: ${error}`;
      logger.error('OAuth error in callback:', error);
      return;
    }

    // Handle the OAuth redirect
    await handleOAuthRedirect();

    // If successful and not loading, redirect after a brief moment
    if (!isLoading.value && !hasError.value) {
      setTimeout(() => {
        void router.push('/contribute/submit');
      }, 2000);
    }

  } catch (error) {
    hasError.value = true;
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in OAuth callback page:', error);
  }
});
</script>
