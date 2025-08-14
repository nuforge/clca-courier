// Composable for using external images with caching
import { ref, computed, watch, onUnmounted, type Ref } from 'vue';
import { externalImageService, type ImageCacheOptions } from '../services/external-image-service';
import { getBestFallback } from '../utils/imageValidation';

export interface UseExternalImageOptions extends ImageCacheOptions {
  lazy?: boolean; // Enable lazy loading (default: true)
  placeholder?: string; // Placeholder image URL
  fallback?: string; // Fallback image URL if loading fails
  retryAttempts?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
}

export interface ExternalImageState {
  imageUrl: Ref<string | null>;
  isLoading: Ref<boolean>;
  hasError: Ref<boolean>;
  error: Ref<Error | null>;
  loadProgress: Ref<number>; // 0-100
}

export function useExternalImage(
  sourceUrl: Ref<string | null> | string | null,
  options: UseExternalImageOptions = {},
): ExternalImageState & {
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
} {
  const defaultOptions: Required<UseExternalImageOptions> = {
    lazy: true,
    placeholder: '',
    fallback: '',
    retryAttempts: 3,
    retryDelay: 1000,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    quality: 0.9,
    maxWidth: 2048,
    maxHeight: 2048,
    forceRefresh: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Reactive state
  const imageUrl = ref<string | null>(mergedOptions.placeholder || null);
  const isLoading = ref(false);
  const hasError = ref(false);
  const error = ref<Error | null>(null);
  const loadProgress = ref(0);

  // Internal state
  const currentAttempt = ref(0);
  const loadAbortController = ref<AbortController | null>(null);

  // Computed source URL
  const sourceUrlRef = computed(() => {
    return typeof sourceUrl === 'string' ? sourceUrl : sourceUrl?.value;
  });

  /**
   * Load image with retry logic
   */
  async function loadImageWithRetry(url: string): Promise<string | null> {
    currentAttempt.value = 0;

    while (currentAttempt.value < mergedOptions.retryAttempts) {
      try {
        currentAttempt.value++;
        loadProgress.value = (currentAttempt.value / mergedOptions.retryAttempts) * 50; // First 50% for attempts

        const result = await externalImageService.getImage(url, {
          maxAge: mergedOptions.maxAge,
          quality: mergedOptions.quality,
          maxWidth: mergedOptions.maxWidth,
          maxHeight: mergedOptions.maxHeight,
          forceRefresh: mergedOptions.forceRefresh,
        });

        if (result) {
          loadProgress.value = 100;
          return result;
        }

        throw new Error('Failed to load image');
      } catch (err) {
        const isLastAttempt = currentAttempt.value >= mergedOptions.retryAttempts;

        if (isLastAttempt) {
          throw err;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, mergedOptions.retryDelay));
      }
    }

    return null;
  }

  /**
   * Load the image
   */
  async function load(): Promise<void> {
    const url = sourceUrlRef.value;

    if (!url) {
      clear();
      return;
    }

    // Abort any existing load
    if (loadAbortController.value) {
      loadAbortController.value.abort();
    }

    loadAbortController.value = new AbortController();

    try {
      isLoading.value = true;
      hasError.value = false;
      error.value = null;
      loadProgress.value = 0;

      const result = await loadImageWithRetry(url);

      if (loadAbortController.value?.signal.aborted) {
        return; // Load was cancelled
      }

      if (result) {
        imageUrl.value = result;
        hasError.value = false;
      } else {
        throw new Error('Failed to load image after all retry attempts');
      }
    } catch (err) {
      if (loadAbortController.value?.signal.aborted) {
        return; // Load was cancelled
      }

      console.error('External image load failed:', err);
      hasError.value = true;
      error.value = err instanceof Error ? err : new Error('Unknown error');

      // Use enhanced fallback system
      try {
        const bestFallback = await getBestFallback(mergedOptions.fallback);
        imageUrl.value = bestFallback;
        // Reset error state since fallback loaded successfully
        hasError.value = false;
        error.value = null;
      } catch (fallbackError) {
        console.warn('Fallback image loading failed:', fallbackError);
        imageUrl.value = mergedOptions.placeholder || null;
        // Keep error state since both primary and fallback failed
      }
    } finally {
      if (!loadAbortController.value?.signal.aborted) {
        isLoading.value = false;
        loadProgress.value = hasError.value ? 0 : 100;
      }
    }
  }

  /**
   * Reload the image (bypass cache)
   */
  async function reload(): Promise<void> {
    // Force reload by temporarily modifying cache options
    const originalMaxAge = mergedOptions.maxAge;
    mergedOptions.maxAge = 0; // Force fetch

    try {
      await load();
    } finally {
      mergedOptions.maxAge = originalMaxAge;
    }
  }

  /**
   * Clear the current image
   */
  function clear(): void {
    if (loadAbortController.value) {
      loadAbortController.value.abort();
      loadAbortController.value = null;
    }

    imageUrl.value = mergedOptions.placeholder || null;
    isLoading.value = false;
    hasError.value = false;
    error.value = null;
    loadProgress.value = 0;
    currentAttempt.value = 0;
  }

  // Watch for source URL changes
  watch(
    sourceUrlRef,
    (newUrl) => {
      if (newUrl && !mergedOptions.lazy) {
        void load();
      } else if (!newUrl) {
        clear();
      }
    },
    { immediate: !mergedOptions.lazy },
  );

  // Cleanup on unmount
  onUnmounted(() => {
    if (loadAbortController.value) {
      loadAbortController.value.abort();
    }

    // Clean up object URLs to prevent memory leaks
    if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl.value);
    }
  });

  return {
    imageUrl,
    isLoading,
    hasError,
    error,
    loadProgress,
    load,
    reload,
    clear,
  };
}

/**
 * Simplified version for direct URL usage
 */
export function useExternalImageUrl(
  url: string,
  options: UseExternalImageOptions = {},
): Promise<string | null> {
  return externalImageService.getImage(url, options);
}

/**
 * Preload multiple images
 */
export function useExternalImagePreloader() {
  const preloadedUrls = ref<Set<string>>(new Set());
  const isPreloading = ref(false);
  const preloadProgress = ref(0);

  async function preloadImages(
    urls: string[],
    options: ImageCacheOptions = {},
  ): Promise<(string | null)[]> {
    if (urls.length === 0) return [];

    isPreloading.value = true;
    preloadProgress.value = 0;

    const results: (string | null)[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      if (!url) {
        results.push(null);
        continue;
      }

      try {
        const result = await externalImageService.getImage(url, options);
        results.push(result);

        if (result) {
          preloadedUrls.value.add(url);
        }
      } catch (error) {
        console.error(`Failed to preload image: ${url}`, error);
        results.push(null);
      }

      preloadProgress.value = ((i + 1) / urls.length) * 100;
    }

    isPreloading.value = false;
    return results;
  }

  function isPreloaded(url: string): boolean {
    return preloadedUrls.value.has(url);
  }

  function clearPreloadCache(): void {
    preloadedUrls.value.clear();
  }

  return {
    preloadedUrls: computed(() => Array.from(preloadedUrls.value)),
    isPreloading,
    preloadProgress,
    preloadImages,
    isPreloaded,
    clearPreloadCache,
  };
}
