<!--
  Theme Editor Page - Dedicated page for comprehensive theme management
  Features live previews of changes as you edit
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h4 class="q-my-none">
            <q-icon :name="UI_ICONS.palette" class="q-mr-sm" />
            Site Theme Editor
          </h4>
          <p class="text-body2 text-grey-6 q-my-none">
            Customize your site's appearance with live preview
          </p>
        </div>
        <div class="col-auto">
          <div class="q-gutter-sm">
            <q-chip
              v-if="hasUnsavedChanges"
              color="warning"
              text-color="black"
              :icon="UI_ICONS.saveAlert"
            >
              Unsaved Changes
            </q-chip>
            <q-btn
              color="grey"
              :icon="UI_ICONS.restore"
              label="Reset to Defaults"
              @click="confirmReset"
              flat
            />
            <q-btn
              color="primary"
              :icon="UI_ICONS.save"
              label="Save Theme"
              @click="saveTheme"
              :loading="isSaving"
              :disable="!hasUnsavedChanges"
            />
          </div>
        </div>
      </div>

      <!-- Debug Panel -->
      <div class="q-mb-md">
        <q-expansion-item icon="mdi-bug" label="Debug Info" class="bg-grey-1">
          <q-card flat>
            <q-card-section>
              <div class="text-caption text-grey-6 q-mb-sm">Theme Store Debug Info:</div>
              <pre class="text-caption">{{ debugInfo ? JSON.stringify(debugInfo, null, 2) : 'Debug info not available' }}</pre>
              <div class="q-mt-md">
                <q-btn
                  size="sm"
                  icon="mdi-content-copy"
                  label="Copy to Clipboard"
                  @click="copyDebugInfo"
                  outline
                />
                <q-btn
                  size="sm"
                  icon="mdi-delete"
                  label="Clear localStorage"
                  @click="clearLocalStorage"
                  color="negative"
                  outline
                  class="q-ml-sm"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>

      <!-- Main Editor Layout -->
      <div class="row q-col-gutter-lg">
        <!-- Left Panel - Editor -->
        <div class="col-12 col-lg-6">
          <q-card>
            <q-tabs v-model="activeTab" class="text-grey-6" dense>
              <q-tab name="contentTypes" label="Content Types" :icon="UI_ICONS.fileMultiple" />
              <q-tab name="categories" label="Categories" :icon="UI_ICONS.tagMultiple" />
              <q-tab name="colors" label="Colors" :icon="UI_ICONS.paletteOutline" />
              <q-tab name="status" label="Status" :icon="UI_ICONS.circleOutline" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="activeTab" animated>
              <!-- Content Types Tab -->
              <q-tab-panel name="contentTypes" class="q-pa-md">
                <div class="text-subtitle1 q-mb-md">Content Types</div>

                <q-expansion-item
                  v-for="(config, type) in editableTheme.contentTypes"
                  :key="type"
                  :label="config.label"
                  :icon="config.icon"
                  class="q-mb-sm"
                >
                  <q-card flat bordered class="q-pa-md">
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model="config.label"
                          label="Display Label"
                          outlined
                          dense
                        />
                      </div>
                      <div class="col-12 col-md-6">
                        <IconPicker
                          v-model="config.icon"
                          label="Icon"
                          hint="Click to open icon picker"
                        />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-select
                          v-model="config.color"
                          :options="getColorOptionsForField()"
                          label="Color"
                          outlined
                          dense
                          option-value="value"
                          option-label="label"
                          emit-value
                          map-options
                        >
                          <template v-slot:append>
                            <ColorPreview
                              :color-value="config.color"
                              size="sm"
                              shape="circle"
                            />
                          </template>
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                              <q-item-section avatar>
                                <ColorPreview
                                  :color-value="scope.opt.preview || scope.opt.value"
                                  size="xs"
                                  shape="circle"
                                />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label>{{ scope.opt.label }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>
                      <div class="col-12">
                        <q-input
                          v-model="config.description"
                          label="Description"
                          type="textarea"
                          outlined
                          dense
                          rows="2"
                        />
                      </div>
                    </div>
                  </q-card>
                </q-expansion-item>
              </q-tab-panel>

              <!-- Categories Tab -->
              <q-tab-panel name="categories" class="q-pa-md">
                <div class="text-subtitle1 q-mb-md">Category Mappings</div>

                <q-expansion-item
                  v-for="(mappings, contentType) in editableTheme.categoryMappings"
                  :key="contentType"
                  :icon="editableTheme.contentTypes[contentType]?.icon || 'mdi-folder'"
                  class="q-mb-sm"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon
                        :name="editableTheme.contentTypes[contentType]?.icon || 'mdi-folder'"
                        :color="editableTheme.contentTypes[contentType]?.color || 'grey'"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ formatLabel(String(contentType)) }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ Object.keys(mappings).length }} categories
                      </q-item-label>
                    </q-item-section>
                  </template>

                  <q-card flat bordered class="q-pa-md">
                    <div class="row q-col-gutter-md">
                      <div
                        v-for="(config, category) in mappings"
                        :key="category"
                        class="col-12 col-md-6"
                      >
                        <q-expansion-item
                          :icon="config.icon"
                          class="category-item"
                        >
                          <template v-slot:header>
                            <q-item-section avatar>
                              <ColorPreview
                                :color-value="resolvePreviewColor(config.color)"

                                size="sm"
                                shape="circle"
                              />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label class="text-weight-medium">
                                <q-icon :name="config.icon" class="q-mr-xs" />
                                {{ config.label }}
                              </q-item-label>
                              <q-item-label caption>
                                {{ category }}
                              </q-item-label>
                            </q-item-section>
                          </template>

                          <q-card flat class="q-pa-sm">
                            <q-input
                              v-model="config.label"
                              label="Label"
                              outlined
                              dense
                              class="q-mb-sm"
                            />

                            <IconPicker
                              v-model="config.icon"
                              label="Icon"
                              dense
                              class="q-mb-sm"
                            />

                            <q-select
                              v-model="config.color"
                              :options="getColorOptionsForField()"
                              label="Color"
                              outlined
                              dense
                              option-value="value"
                              option-label="label"
                              emit-value
                              map-options
                            >
                              <template v-slot:append>
                                <ColorPreview
                                  :color-value="config.color"
                                  size="sm"
                                  shape="circle"
                                />
                              </template>
                              <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps">
                                  <q-item-section avatar>
                                    <ColorPreview
                                      :color-value="scope.opt.preview || scope.opt.value"
                                      size="xs"
                                      shape="circle"
                                    />
                                  </q-item-section>
                                  <q-item-section>
                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                  </q-item-section>
                                </q-item>
                              </template>
                            </q-select>
                          </q-card>
                        </q-expansion-item>
                      </div>
                    </div>
                  </q-card>
                </q-expansion-item>
              </q-tab-panel>

              <!-- Colors Tab -->
              <q-tab-panel name="colors" class="q-pa-md">
                <div class="text-subtitle1 q-mb-md">Color Palette</div>

                <!-- Primary Colors -->
                <q-card class="q-mb-md">
                  <q-card-section>
                    <div class="text-subtitle2 q-mb-md">Primary Colors</div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-md-4">
                        <ColorPicker
                          v-model="editableTheme.colors.primary"
                          label="Primary"
                          :default-value="DEFAULT_SITE_THEME.colors.primary"
                        />
                      </div>
                      <div class="col-12 col-md-4">
                        <ColorPicker
                          v-model="editableTheme.colors.secondary"
                          label="Secondary"
                          :default-value="DEFAULT_SITE_THEME.colors.secondary"
                        />
                      </div>
                      <div class="col-12 col-md-4">
                        <ColorPicker
                          v-model="editableTheme.colors.accent"
                          label="Accent"
                          :default-value="DEFAULT_SITE_THEME.colors.accent"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Content Type Colors -->
                <q-card>
                  <q-card-section>
                    <div class="text-subtitle2 q-mb-md">Content Type Colors</div>
                    <div class="row q-col-gutter-sm">
                      <div
                        v-for="(color, type) in editableTheme.colors.contentTypes"
                        :key="type"
                        class="col-12 col-md-6"
                      >
                        <ColorPicker
                          v-model="editableTheme.colors.contentTypes[type]"
                          :label="formatLabel(String(type))"
                          :default-value="getDefaultColorForContentType(String(type))"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-tab-panel>

              <!-- Status Tab -->
              <q-tab-panel name="status" class="q-pa-md">
                <div class="text-subtitle1 q-mb-md">Status Icons</div>

                <div class="row q-col-gutter-md">
                  <div
                    v-for="(config, status) in editableTheme.statusMappings"
                    :key="status"
                    class="col-12 col-md-6"
                  >
                    <q-expansion-item
                      class="status-item"
                    >
                      <template v-slot:header>
                        <q-item-section avatar>
                          <ColorPreview
                            :color-value="resolvePreviewColor(config.color)"
                            size="sm"
                            shape="circle"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">
                            <q-icon :name="config.icon" class="q-mr-xs" />
                            {{ config.label }}
                          </q-item-label>
                          <q-item-label caption>
                            {{ status }}
                          </q-item-label>
                        </q-item-section>
                      </template>

                      <q-card flat class="q-pa-md">
                        <q-input
                          v-model="config.label"
                          label="Label"
                          outlined
                          dense
                          class="q-mb-sm"
                        />

                        <IconPicker
                          v-model="config.icon"
                          label="Icon"
                          dense
                          class="q-mb-sm"
                        />

                        <q-select
                          v-model="config.color"
                          :options="getColorOptionsForField()"
                          label="Color"
                          outlined
                          dense
                          class="q-mb-sm"
                          option-value="value"
                          option-label="label"
                          emit-value
                          map-options
                        >
                          <template v-slot:append>
                            <ColorPreview
                              :color-value="config.color"
                              size="sm"
                              shape="circle"
                            />
                          </template>
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                              <q-item-section avatar>
                                <ColorPreview
                                  :color-value="scope.opt.preview || scope.opt.value"
                                  size="xs"
                                  shape="circle"
                                />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label>{{ scope.opt.label }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>

                        <q-input
                          v-model="config.description"
                          label="Description"
                          outlined
                          dense
                        />
                      </q-card>
                    </q-expansion-item>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </div>

        <!-- Right Panel - Live Preview -->
        <div class="col-12 col-lg-6">
          <q-card class="sticky-top">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon :name="UI_ICONS.eye" class="q-mr-sm" />
                Live Preview
              </div>

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
                          :color-value="resolvePreviewColor(editableTheme.colors.primary)"
                          label="Primary"
                          size="md"
                          shape="rounded"
                          show-label
                        />
                      </div>
                      <div class="col-auto">
                        <ColorPreview
                          :color-value="resolvePreviewColor(editableTheme.colors.secondary)"
                          label="Secondary"
                          size="md"
                          shape="rounded"
                          show-label
                        />
                      </div>
                      <div class="col-auto">
                        <ColorPreview
                          :color-value="resolvePreviewColor(editableTheme.colors.accent)"
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
                        v-for="(color, type) in editableTheme.colors.contentTypes"
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
                    v-for="(config, type) in editableTheme.contentTypes"
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
                  v-for="(mappings, contentType) in editableTheme.categoryMappings"
                  :key="contentType"
                  :label="formatLabel(String(contentType))"
                  :icon="editableTheme.contentTypes[contentType]?.icon"
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
                    v-for="(config, status) in editableTheme.statusMappings"
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

              <!-- Sample Content Card -->
              <div class="q-mb-lg">
                <div class="text-subtitle1 q-mb-sm">Sample Content Card</div>
                <q-card bordered>
                  <q-card-section>
                    <div class="row items-center">
                      <q-icon
                        :name="getPreviewCategoryIcon('event', 'meeting')"
                        :color="resolvePreviewColor(editableTheme.categoryMappings.event?.meeting?.color || 'primary')"
                        size="md"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="text-h6">Sample Meeting</div>
                        <div class="text-body2 text-grey-6">This shows how meeting events will appear</div>
                      </div>
                      <q-badge
                        :icon="editableTheme.statusMappings.published?.icon || 'mdi-earth'"
                        :color="resolvePreviewColor(editableTheme.statusMappings.published?.color || 'positive')"
                        text-color="white"
                      >
                        {{ editableTheme.statusMappings.published?.label || 'Published' }}
                      </q-badge>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Additional sample showing social event -->
                <q-card bordered class="q-mt-md">
                  <q-card-section>
                    <div class="row items-center">
                      <q-icon
                        :name="getPreviewCategoryIcon('event', 'social')"
                        :color="resolvePreviewColor(getCategoryTheme('event', 'social', editableTheme).color)"
                        size="md"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="text-h6">Sample Social Event</div>
                        <div class="text-body2 text-grey-6">This shows how social events will appear</div>
                      </div>
                      <q-badge
                        :icon="getStatusTheme('published', editableTheme).icon"
                        :color="resolvePreviewColor(getStatusTheme('published', editableTheme).color)"
                        text-color="white"
                      >
                        {{ getStatusTheme('published', editableTheme).label }}
                      </q-badge>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSiteTheme } from '../composables/useSiteTheme';
import { resolveColor, DEFAULT_SITE_THEME, getCategoryTheme, getStatusTheme } from '../config/site-theme.config';
import { logger } from '../utils/logger';
import { UI_ICONS } from '../constants/ui-icons';
import ColorPicker from '../components/theme/ColorPicker.vue';
import IconPicker from '../components/theme/IconPicker.vue';
import ColorPreview from '../components/theme/ColorPreview.vue';

const $q = useQuasar();
const {
  theme,
  getThemeForEditing,
  updateTheme,
  resetTheme,
  saveTheme: saveThemeToStore,
  debugInfo
} = useSiteTheme();

// State
const activeTab = ref('contentTypes');
const isSaving = ref(false);

// Use a local editable copy that syncs with the store
const editableTheme = ref(getThemeForEditing());

// Check if editable theme has changes
const hasUnsavedChanges = computed(() => {
  return JSON.stringify(editableTheme.value) !== JSON.stringify(theme);
});

// Computed
const colorOptions = computed(() => [
  // Direct Quasar colors with proper previews
  { label: 'Primary', value: 'primary', preview: editableTheme.value.colors.primary },
  { label: 'Secondary', value: 'secondary', preview: editableTheme.value.colors.secondary },
  { label: 'Accent', value: 'accent', preview: editableTheme.value.colors.accent },
  { label: 'Positive', value: 'positive', preview: editableTheme.value.colors.positive },
  { label: 'Negative', value: 'negative', preview: editableTheme.value.colors.negative },
  { label: 'Warning', value: 'warning', preview: editableTheme.value.colors.warning },
  { label: 'Info', value: 'info', preview: editableTheme.value.colors.info },

  // Content type color references (these are now direct colors, but keeping for flexibility)
  { label: 'Article Color', value: editableTheme.value.contentTypes.article?.color || '#1976d2', preview: editableTheme.value.contentTypes.article?.color || '#1976d2' },
  { label: 'Event Color', value: editableTheme.value.contentTypes.event?.color || '#9c27b0', preview: editableTheme.value.contentTypes.event?.color || '#9c27b0' },
  { label: 'Announcement Color', value: editableTheme.value.contentTypes.announcement?.color || '#21ba45', preview: editableTheme.value.contentTypes.announcement?.color || '#21ba45' },
  { label: 'Classified Color', value: editableTheme.value.contentTypes.classified?.color || '#ff9800', preview: editableTheme.value.contentTypes.classified?.color || '#ff9800' },
  { label: 'Photo Color', value: editableTheme.value.contentTypes.photo?.color || '#26a69a', preview: editableTheme.value.contentTypes.photo?.color || '#26a69a' },
  { label: 'Newsletter Color', value: editableTheme.value.contentTypes.newsletter?.color || '#1976d2', preview: editableTheme.value.contentTypes.newsletter?.color || '#1976d2' },

  // Status color references (these are now direct colors, but keeping for flexibility)
  { label: 'Draft Color', value: editableTheme.value.statusMappings.draft?.color || '#9e9e9e', preview: editableTheme.value.statusMappings.draft?.color || '#9e9e9e' },
  { label: 'Pending Color', value: editableTheme.value.statusMappings.pending?.color || '#2196f3', preview: editableTheme.value.statusMappings.pending?.color || '#2196f3' },
  { label: 'Approved Color', value: editableTheme.value.statusMappings.approved?.color || '#4caf50', preview: editableTheme.value.statusMappings.approved?.color || '#4caf50' },
  { label: 'Published Color', value: editableTheme.value.statusMappings.published?.color || '#21ba45', preview: editableTheme.value.statusMappings.published?.color || '#21ba45' },
  { label: 'Featured Color', value: editableTheme.value.statusMappings.featured?.color || '#ffc107', preview: editableTheme.value.statusMappings.featured?.color || '#ffc107' },
]);

// Helper function to get all color options
// Note: Self-references are eliminated at the data level (no circular references in site-theme.config.ts)
const getColorOptionsForField = () => {
  return colorOptions.value;
};

// Methods
const formatLabel = (text: string): string => {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const resolvePreviewColor = (colorRef: string): string => {
  try {
    return resolveColor(colorRef, editableTheme.value);
  } catch {
    return colorRef; // Fallback to original value if resolution fails
  }
};

// Preview icon resolution functions that use editable theme for live preview
const getPreviewCategoryIcon = (contentType: string, category: string): string => {
  const categoryTheme = getCategoryTheme(contentType, category, editableTheme.value);
  return categoryTheme.icon;
};

const getDefaultColorForContentType = (type: string): string => {
  const defaultColors = DEFAULT_SITE_THEME.colors.contentTypes as Record<string, string>;
  return defaultColors[type] || '#1976d2'; // fallback to primary blue
};

const saveTheme = () => {
  isSaving.value = true;
  try {
    // First apply the editable theme to the store
    updateTheme(editableTheme.value);

    // Then save to persistent storage
    saveThemeToStore();

    $q.notify({
      type: 'positive',
      message: 'Theme saved successfully',
      position: 'top',
    });

    logger.success('Theme saved from editor');
  } catch (error) {
    logger.error('Failed to save theme', { error });
    $q.notify({
      type: 'negative',
      message: 'Failed to save theme',
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};

const confirmReset = () => {
  $q.dialog({
    title: 'Reset Theme',
    message: 'Are you sure you want to reset all theme settings to defaults? This will lose all your current changes.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetTheme();
    editableTheme.value = getThemeForEditing();

    $q.notify({
      type: 'info',
      message: 'Theme reset to defaults',
      position: 'top',
    });
  });
};

// Debug functions (development only)
const copyDebugInfo = () => {
  if (debugInfo) {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => {
        $q.notify({
          type: 'positive',
          message: 'Debug info copied to clipboard',
          position: 'top',
        });
      })
      .catch((error) => {
        logger.error('Failed to copy debug info to clipboard', { error });
        $q.notify({
          type: 'negative',
          message: 'Failed to copy to clipboard',
          position: 'top',
        });
      });
  }
};

const clearLocalStorage = () => {
  const STORAGE_KEY = 'clca-courier-site-theme';
  localStorage.removeItem(STORAGE_KEY);
  $q.notify({
    type: 'info',
    message: 'localStorage cleared. Refresh to reload defaults.',
    position: 'top',
  });
};

// Watch for external theme changes and sync with editable theme
watch(
  () => JSON.stringify(theme),
  () => {
    // Only sync if store was updated externally (not from our edits)
    if (!hasUnsavedChanges.value) {
      editableTheme.value = getThemeForEditing();
      logger.debug('Synced editable theme from external store change');
    }
  }
);

// Don't auto-sync to store - only save on explicit save action
// This allows the isDirty flag to work properly
watch(
  editableTheme,
  () => {
    // Just log that changes were made
    logger.debug('Editable theme changed - changes ready to save');
  },
  { deep: true }
);
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 20px;
}

:deep(.q-expansion-item__container) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

:deep(.q-expansion-item__content) {
  padding: 0;
}

.category-item,
.status-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.category-item:hover,
.status-item:hover {
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.category-item .q-expansion-item__container),
:deep(.status-item .q-expansion-item__container) {
  border: none;
  border-radius: inherit;
}

/* Dark theme support */
.body--dark .category-item,
.body--dark .status-item {
  border-color: rgba(255, 255, 255, 0.12);
}

.body--dark .category-item:hover,
.body--dark .status-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}
</style>

