<!--
  Theme Configuration Dialog
  Allows editing of site-wide theme settings
-->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    maximized
  >
    <q-card class="full-width">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="mdi-palette" class="q-mr-sm" />
          Site Theme Configuration
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="activeTab" class="q-mb-md">
          <q-tab name="contentTypes" label="Content Types" icon="mdi-file-document-multiple" />
          <q-tab name="categories" label="Categories" icon="mdi-tag-multiple" />
          <q-tab name="colors" label="Colors" icon="mdi-palette-outline" />
          <q-tab name="status" label="Status Icons" icon="mdi-circle-outline" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
          <!-- Content Types Tab -->
          <q-tab-panel name="contentTypes">
            <div class="text-h6 q-mb-md">Content Types</div>
            <p class="text-body2 text-grey-6 q-mb-md">
              Configure the main content types available for submission
            </p>

            <div class="row q-gutter-md">
              <div
                v-for="(config, type) in editableTheme.contentTypes"
                :key="type"
                class="col-12 col-md-6"
              >
                <q-card bordered>
                  <q-card-section>
                    <div class="row items-center q-mb-md">
                      <q-icon
                        :name="config.icon"
                        :color="resolveColor(config.color)"
                        size="2rem"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="text-h6">{{ config.label }}</div>
                        <div class="text-caption text-grey-6">{{ type }}</div>
                      </div>
                    </div>

                    <q-input
                      v-model="config.label"
                      label="Display Label"
                      outlined
                      dense
                      class="q-mb-sm"
                    />

                    <q-input
                      v-model="config.icon"
                      label="Icon (Material Design Icons)"
                      outlined
                      dense
                      class="q-mb-sm"
                      hint="e.g. mdi-newspaper-variant"
                    />

                    <q-select
                      v-model="config.color"
                      :options="colorOptions"
                      label="Color"
                      outlined
                      dense
                      class="q-mb-sm"
                    />

                    <q-input
                      v-model="config.description"
                      label="Description"
                      type="textarea"
                      outlined
                      dense
                      rows="2"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- Categories Tab -->
          <q-tab-panel name="categories">
            <div class="text-h6 q-mb-md">Category Mappings</div>
            <p class="text-body2 text-grey-6 q-mb-md">
              Configure subcategories for each content type
            </p>

            <q-expansion-item
              v-for="(mappings, contentType) in editableTheme.categoryMappings"
              :key="contentType"
              :label="formatLabel(String(contentType))"
              :icon="editableTheme.contentTypes[contentType]?.icon || 'mdi-folder'"
              class="q-mb-md"
            >
              <q-card>
                <q-card-section>
                  <div class="row q-gutter-md">
                    <div
                      v-for="(config, category) in mappings"
                      :key="category"
                      class="col-12 col-md-4"
                    >
                      <q-card outlined>
                        <q-card-section class="q-pa-sm">
                          <div class="row items-center q-mb-sm">
                            <q-icon
                              :name="config.icon"
                              :color="resolveColor(config.color)"
                              class="q-mr-sm"
                            />
                            <div class="text-subtitle2">{{ config.label }}</div>
                          </div>

                          <q-input
                            v-model="config.label"
                            label="Label"
                            outlined
                            dense
                            class="q-mb-xs"
                          />

                          <q-input
                            v-model="config.icon"
                            label="Icon"
                            outlined
                            dense
                            class="q-mb-xs"
                          />

                          <q-select
                            v-model="config.color"
                            :options="colorOptions"
                            label="Color"
                            outlined
                            dense
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-tab-panel>

          <!-- Colors Tab -->
          <q-tab-panel name="colors">
            <div class="text-h6 q-mb-md">Color Scheme</div>
            <p class="text-body2 text-grey-6 q-mb-md">
              Configure the site's color palette
            </p>

            <div class="row q-gutter-md">
              <!-- Primary Colors -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-subtitle1 q-mb-md">Primary Colors</div>
                    <q-input
                      v-model="editableTheme.colors.primary"
                      label="Primary"
                      outlined
                      dense
                      class="q-mb-sm"
                    >
                      <template v-slot:append>
                        <q-icon name="mdi-circle" :style="`color: ${editableTheme.colors.primary}`" />
                      </template>
                    </q-input>

                    <q-input
                      v-model="editableTheme.colors.secondary"
                      label="Secondary"
                      outlined
                      dense
                      class="q-mb-sm"
                    >
                      <template v-slot:append>
                        <q-icon name="mdi-circle" :style="`color: ${editableTheme.colors.secondary}`" />
                      </template>
                    </q-input>

                    <q-input
                      v-model="editableTheme.colors.accent"
                      label="Accent"
                      outlined
                      dense
                    >
                      <template v-slot:append>
                        <q-icon name="mdi-circle" :style="`color: ${editableTheme.colors.accent}`" />
                      </template>
                    </q-input>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Content Type Colors -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-subtitle1 q-mb-md">Content Type Colors</div>
                    <q-input
                      v-for="(color, type) in editableTheme.colors.contentTypes"
                      :key="type"
                      v-model="editableTheme.colors.contentTypes[type]"
                      :label="formatLabel(String(type))"
                      outlined
                      dense
                      class="q-mb-sm"
                    >
                      <template v-slot:append>
                        <q-icon name="mdi-circle" :style="`color: ${color}`" />
                      </template>
                    </q-input>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- Status Tab -->
          <q-tab-panel name="status">
            <div class="text-h6 q-mb-md">Status Icons</div>
            <p class="text-body2 text-grey-6 q-mb-md">
              Configure status indicators for content workflow
            </p>

            <div class="row q-gutter-md">
              <div
                v-for="(config, status) in editableTheme.statusMappings"
                :key="status"
                class="col-12 col-md-4"
              >
                <q-card outlined>
                  <q-card-section>
                    <div class="row items-center q-mb-md">
                      <q-icon
                        :name="config.icon"
                        :color="resolveColor(config.color)"
                        size="1.5rem"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="text-subtitle1">{{ config.label }}</div>
                        <div class="text-caption text-grey-6">{{ config.description }}</div>
                      </div>
                    </div>

                    <q-input
                      v-model="config.label"
                      label="Label"
                      outlined
                      dense
                      class="q-mb-sm"
                    />

                    <q-input
                      v-model="config.icon"
                      label="Icon"
                      outlined
                      dense
                      class="q-mb-sm"
                    />

                    <q-select
                      v-model="config.color"
                      :options="colorOptions"
                      label="Color"
                      outlined
                      dense
                      class="q-mb-sm"
                    />

                    <q-input
                      v-model="config.description"
                      label="Description"
                      outlined
                      dense
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="emit('update:modelValue', false)" />
        <q-btn
          flat
          label="Reset to Defaults"
          color="warning"
          @click="resetTheme"
        />
        <q-btn
          label="Save Changes"
          color="primary"
          @click="saveTheme"
          :loading="isSaving"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { resolveColor } from '../../config/site-theme.config';
import { logger } from '../../utils/logger';

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [];
}>();

defineProps<{
  modelValue: boolean;
}>();

const $q = useQuasar();
const { updateTheme, resetTheme: resetToDefaults, getThemeForEditing } = useSiteTheme();

// State
const activeTab = ref('contentTypes');
const isSaving = ref(false);
const editableTheme = ref(getThemeForEditing());

// Computed
const colorOptions = computed(() => [
  // Direct colors
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Accent', value: 'accent' },
  { label: 'Positive', value: 'positive' },
  { label: 'Negative', value: 'negative' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },

  // Content type color references
  { label: 'Article Color', value: 'contentTypes.article' },
  { label: 'Event Color', value: 'contentTypes.event' },
  { label: 'Announcement Color', value: 'contentTypes.announcement' },
  { label: 'Classified Color', value: 'contentTypes.classified' },
  { label: 'Photo Color', value: 'contentTypes.photo' },

  // Status color references
  { label: 'Draft Color', value: 'status.draft' },
  { label: 'Pending Color', value: 'status.pending' },
  { label: 'Approved Color', value: 'status.approved' },
  { label: 'Published Color', value: 'status.published' },
  { label: 'Featured Color', value: 'status.featured' },
]);

// Methods
const formatLabel = (text: string): string => {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const saveTheme = () => {
  isSaving.value = true;
  try {
    updateTheme(editableTheme.value);

    $q.notify({
      type: 'positive',
      message: 'Theme configuration saved successfully',
      position: 'top',
    });

    logger.success('Theme configuration updated');
    emit('updated');
    emit('update:modelValue', false);
  } catch (error) {
    logger.error('Failed to save theme configuration', { error });
    $q.notify({
      type: 'negative',
      message: 'Failed to save theme configuration',
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};const resetTheme = () => {
  $q.dialog({
    title: 'Reset Theme',
    message: 'Are you sure you want to reset all theme settings to defaults? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetToDefaults();
    editableTheme.value = getThemeForEditing();

    $q.notify({
      type: 'info',
      message: 'Theme reset to defaults',
      position: 'top',
    });
  });
};
</script>
