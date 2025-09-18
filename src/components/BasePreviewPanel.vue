<!--
  Base Preview Panel Component

  A reusable live preview component that renders preview content based on data and type.
  Built following the Week 2 migration guide with strict TypeScript and Quasar-only styling.

  Features:
  - Configurable preview rendering based on previewType
  - Theme preview with color palette, content types, and sample content
  - Uses existing ColorPreview components for consistency
  - Uses only Quasar components and utility classes (NO custom CSS)
-->
<template>
  <q-card class="sticky-top">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon :name="previewIcon" class="q-mr-sm" />
        {{ previewTitle }}
      </div>

      <!-- Theme Preview (default type) -->
      <template v-if="previewType === 'theme'">
        <!-- Color Palette Preview -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Color Palette</div>

          <!-- Theme Colors and Content Type Colors in same row -->
          <div class="row q-col-gutter-lg">
            <!-- Theme Colors Column -->
            <div class="col-12 col-md-6">
              <div class="text-body2 text-grey-6 q-mb-sm">Theme Colors</div>
              <div class="row q-gutter-sm">
                <div class="col-auto">
                  <ColorPreview
                    :color-value="resolvePreviewColor(themeData.colors.primary)"
                    label="Primary"
                    size="md"
                    shape="rounded"
                    show-label
                  />
                </div>
                <div class="col-auto">
                  <ColorPreview
                    :color-value="resolvePreviewColor(themeData.colors.secondary)"
                    label="Secondary"
                    size="md"
                    shape="rounded"
                    show-label
                  />
                </div>
                <div class="col-auto">
                  <ColorPreview
                    :color-value="resolvePreviewColor(themeData.colors.accent)"
                    label="Accent"
                    size="md"
                    shape="rounded"
                    show-label
                  />
                </div>
              </div>
            </div>

            <!-- Content Type Colors Column -->
            <div class="col-12 col-md-6">
              <div class="text-body2 text-grey-6 q-mb-sm">Content Type Colors</div>
              <div class="row q-gutter-xs">
                <div
                  v-for="(color, type) in themeData.colors.contentTypes"
                  :key="type"
                  class="col-auto"
                >
                  <ColorPreview
                    :color-value="resolvePreviewColor(color)"
                    :label="formatLabel(String(type))"
                    size="sm"
                    shape="circle"
                    show-label
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Types Preview -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Content Types</div>
          <div class="row q-gutter-sm">
            <div
              v-for="(config, type) in themeData.contentTypes"
              :key="type"
              class="col-auto"
            >
              <q-btn
                :icon="config.icon"
                :label="config.label"
                :color="resolvePreviewColor(config.color)"
                no-caps
                size="sm"
                class="q-pa-sm"
              />
            </div>
          </div>
        </div>

        <!-- Categories Preview -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Sample Categories</div>
          <q-expansion-item
            v-for="(mappings, contentType) in themeData.categoryMappings"
            :key="contentType"
            :label="formatLabel(String(contentType))"
            :icon="themeData.contentTypes[contentType]?.icon"
            class="q-mb-sm"
            dense
          >
            <div class="q-pa-sm">
              <div class="row q-gutter-xs">
                <q-chip
                  v-for="(config, category) in mappings"
                  :key="category"
                  :icon="config.icon"
                  :color="resolvePreviewColor(config.color)"
                  text-color="white"
                  size="sm"
                >
                  {{ config.label }}
                </q-chip>
              </div>
            </div>
          </q-expansion-item>
        </div>

        <!-- Status Preview -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Status Indicators</div>
          <div class="row q-gutter-sm">
            <q-badge
              v-for="(config, status) in themeData.statusMappings"
              :key="status"
              :icon="config.icon"
              :color="resolvePreviewColor(config.color)"
              text-color="white"
              class="q-pa-sm"
            >
              {{ config.label }}
            </q-badge>
          </div>
        </div>

        <!-- Sample Content Cards -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Sample Content Cards</div>

          <!-- Sample Meeting Event -->
          <q-card bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center">
                <q-icon
                  :name="getPreviewCategoryIcon('event', 'meeting')"
                  :color="resolvePreviewColor(themeData.categoryMappings.event?.meeting?.color || 'primary')"
                  size="md"
                  class="q-mr-md"
                />
                <div class="col">
                  <div class="text-h6">Sample Meeting</div>
                  <div class="text-body2 text-grey-6">This shows how meeting events will appear</div>
                </div>
                <q-badge
                  :icon="themeData.statusMappings.published?.icon || 'mdi-earth'"
                  :color="resolvePreviewColor(themeData.statusMappings.published?.color || 'positive')"
                  text-color="white"
                >
                  {{ themeData.statusMappings.published?.label || 'Published' }}
                </q-badge>
              </div>
            </q-card-section>
          </q-card>

          <!-- Sample Social Event -->
          <q-card bordered>
            <q-card-section>
              <div class="row items-center">
                <q-icon
                  :name="getPreviewCategoryIcon('event', 'social')"
                  :color="resolvePreviewColor(getCategoryTheme('event', 'social', themeData).color)"
                  size="md"
                  class="q-mr-md"
                />
                <div class="col">
                  <div class="text-h6">Sample Social Event</div>
                  <div class="text-body2 text-grey-6">This shows how social events will appear</div>
                </div>
                <q-badge
                  :icon="getStatusTheme('published', themeData).icon"
                  :color="resolvePreviewColor(getStatusTheme('published', themeData).color)"
                  text-color="white"
                >
                  {{ getStatusTheme('published', themeData).label }}
                </q-badge>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>

      <!-- Future preview types can be added here -->
      <template v-else>
        <div class="text-body1 text-grey-6">
          Preview type "{{ previewType }}" not yet implemented.
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type ThemeConfig, resolveColor, getCategoryTheme, getStatusTheme } from '../config/site-theme.config';
import ColorPreview from './theme/ColorPreview.vue';

/**
 * Preview data can be different types based on previewType
 */
type PreviewData = ThemeConfig | Record<string, unknown>;

/**
 * Component props interface
 */
interface Props {
  previewData: PreviewData;
  previewType: 'theme' | 'content' | 'newsletter';
}

// Props with strict typing
const props = defineProps<Props>();

// Computed properties for preview configuration
const previewIcon = computed(() => {
  switch (props.previewType) {
    case 'theme':
      return 'mdi-eye';
    case 'content':
      return 'mdi-file-document';
    case 'newsletter':
      return 'mdi-book-open-page-variant';
    default:
      return 'mdi-eye';
  }
});

const previewTitle = computed(() => {
  switch (props.previewType) {
    case 'theme':
      return 'Live Preview';
    case 'content':
      return 'Content Preview';
    case 'newsletter':
      return 'Newsletter Preview';
    default:
      return 'Preview';
  }
});

// Theme data accessor (type-safe for theme preview)
const themeData = computed(() => {
  if (props.previewType === 'theme') {
    return props.previewData as ThemeConfig;
  }
  // Return empty theme config for non-theme types
  return {
    colors: { contentTypes: {}, status: {}, categories: {} },
    contentTypes: {},
    categoryMappings: {},
    statusMappings: {}
  } as ThemeConfig;
});

// Helper methods
const formatLabel = (text: string): string => {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const resolvePreviewColor = (colorRef: string): string => {
  try {
    return resolveColor(colorRef, themeData.value);
  } catch {
    return colorRef; // Fallback to original value if resolution fails
  }
};

// Preview icon resolution functions that use theme data for live preview
const getPreviewCategoryIcon = (contentType: string, category: string): string => {
  const categoryTheme = getCategoryTheme(contentType, category, themeData.value);
  return categoryTheme.icon;
};
</script>

<!-- NO CUSTOM CSS - Using only Quasar utility classes as per migration guide -->
<style scoped>
.sticky-top {
  position: sticky;
  top: 20px;
}
</style>
