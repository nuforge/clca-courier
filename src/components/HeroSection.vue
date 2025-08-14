<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useExternalImage, type UseExternalImageOptions } from '../composables/useExternalImage';

export interface HeroAction {
  label: string;
  icon?: string;
  color?: string;
  outline?: boolean;
  flat?: boolean;
  to?: string;
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: string;
  onClick?: () => void;
}

export interface HeroProps {
  // Content
  title?: string;
  subtitle?: string;

  // Background
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;

  // Overlay
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;

  // Layout
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  variant?: 'default' | 'centered' | 'left' | 'right';
  textAlign?: 'left' | 'center' | 'right';

  // Styling
  titleClasses?: string | string[];
  subtitleClasses?: string | string[];

  // Actions
  actions?: HeroAction[];

  // Image options
  imageOptions?: UseExternalImageOptions;

  // Loading behavior
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<HeroProps>(), {
  variant: 'centered',
  textAlign: 'center',
  height: '60vh',
  minHeight: '400px',
  maxHeight: '800px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  overlay: true,
  overlayColor: 'rgba(0, 0, 0, 0.4)',
  overlayOpacity: 0.4,
  backgroundColor: '#f5f5f5',
  actions: () => [],
  autoLoad: true,
  imageOptions: () => ({
    lazy: false,
    maxWidth: 2048,
    maxHeight: 1152,
    quality: 0.9
  })
});

// External image handling
const backgroundImageRef = computed(() => props.backgroundImage || null);

const {
  imageUrl,
  isLoading,
  hasError,
  error,
  loadProgress,
  load: loadImage,
  reload: reloadImage
} = useExternalImage(
  backgroundImageRef,
  {
    ...props.imageOptions,
    lazy: !props.autoLoad,
    fallback: '/images/clca-lake-3.jpg' // Local fallback image
  }
);

// Computed styles
const heroStyles = computed(() => ({
  height: props.height,
  minHeight: props.minHeight,
  maxHeight: props.maxHeight,
  backgroundColor: props.backgroundColor,
  backgroundImage: imageUrl.value ? `url(${imageUrl.value})` : undefined,
  backgroundSize: props.backgroundSize,
  backgroundPosition: props.backgroundPosition,
  backgroundRepeat: 'no-repeat',
  textAlign: props.textAlign
}));

const overlayStyles = computed(() => ({
  backgroundColor: props.overlayColor,
  opacity: props.overlayOpacity
}));

const titleClasses = computed(() => [
  'text-h2',
  'text-weight-bold',
  'q-mb-md',
  ...(Array.isArray(props.titleClasses) ? props.titleClasses : [props.titleClasses].filter(Boolean))
]);

const subtitleClasses = computed(() => [
  'text-h5',
  'text-weight-light',
  'q-mb-lg',
  ...(Array.isArray(props.subtitleClasses) ? props.subtitleClasses : [props.subtitleClasses].filter(Boolean))
]);

// Auto-load image on mount if enabled
onMounted(() => {
  if (props.autoLoad && props.backgroundImage) {
    void loadImage();
  }
});

// Watch for background image changes
watch(() => props.backgroundImage, (newImage) => {
  if (newImage && props.autoLoad) {
    void loadImage();
  }
});

// Expose methods for manual control
defineExpose({
  loadImage,
  reloadImage,
  imageUrl,
  isLoading,
  hasError,
  error,
  loadProgress
});
</script>

<template>
  <section :class="[
    'hero-section',
    `hero-${variant}`,
    { 'hero-loading': isLoading }
  ]" :style="heroStyles">
    <!-- Background overlay for better text contrast -->
    <div v-if="overlay" class="hero-overlay" :style="overlayStyles" />

    <!-- Content container -->
    <div class="hero-content">
      <div class="hero-content-inner">
        <!-- Title -->
        <h1 v-if="title" class="hero-title" :class="titleClasses">
          {{ title }}
        </h1>

        <!-- Subtitle -->
        <p v-if="subtitle" class="hero-subtitle" :class="subtitleClasses">
          {{ subtitle }}
        </p>

        <!-- Slot for custom content -->
        <div v-if="$slots.default" class="hero-custom-content">
          <slot />
        </div>

        <!-- Action buttons -->
        <div v-if="actions && actions.length > 0" class="hero-actions">
          <q-btn v-for="(action, index) in actions" :key="index" :label="action.label" :icon="action.icon"
            :color="action.color || 'primary'" :outline="action.outline" :flat="action.flat" :to="action.to"
            :href="action.href" :loading="action.loading" :disable="action.disabled" :size="action.size || 'lg'"
            class="hero-action-btn q-mr-md q-mb-md" @click="action.onClick" />
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="hero-loading-indicator">
      <q-circular-progress :value="loadProgress" size="50px" :thickness="0.2" color="white"
        center-color="transparent" />
      <p class="text-white q-mt-md">Loading image...</p>
    </div>

    <!-- Error state -->
    <div v-if="hasError && !isLoading" class="hero-error">
      <q-icon name="mdi-image-broken" size="3rem" color="grey-5" />
      <p class="text-grey-5 q-mt-md">Failed to load background image</p>
      <q-btn label="Retry" icon="mdi-refresh" color="primary" outline @click="reloadImage" />
    </div>
  </section>
</template>


<style scoped lang="scss">
.hero-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;

  &.hero-loading {
    .hero-content {
      opacity: 0.3;
    }
  }

  // Variants
  &.hero-left {
    justify-content: flex-start;
    text-align: left;

    .hero-content-inner {
      margin-left: 2rem;
    }
  }

  &.hero-right {
    justify-content: flex-end;
    text-align: right;

    .hero-content-inner {
      margin-right: 2rem;
    }
  }

  &.hero-centered {
    justify-content: center;
    text-align: center;
  }
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  transition: opacity 0.3s ease;
}

.hero-content-inner {
  width: 100%;
}

.hero-title {
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.hero-actions {
  margin-top: 2rem;
}

.hero-action-btn {
  min-width: 140px;
}

.hero-loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
}

.hero-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
}

.hero-custom-content {
  margin: 1.5rem 0;
}

// Responsive design
@media (max-width: 768px) {
  .hero-content {
    padding: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-actions {
    margin-top: 1.5rem;
  }

  .hero-action-btn {
    width: 100%;
    margin-right: 0 !important;
    min-width: auto;
  }

  .hero-section {
    &.hero-left .hero-content-inner {
      margin-left: 0;
    }

    &.hero-right .hero-content-inner {
      margin-right: 0;
    }
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
