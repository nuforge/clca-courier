<!--
  Categories Management Dialog
  Quick access to category configuration
-->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="mdi-tag-multiple" class="q-mr-sm" />
          Category Management
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <p class="text-body2 text-grey-6">
          Quick overview of content categories. Use the full Theme Configuration for detailed editing.
        </p>

        <q-list>
          <q-expansion-item
            v-for="(config, contentType) in contentTypes"
            :key="contentType"
            :label="config.label"
            :icon="config.icon"
            :header-class="`text-${resolveColorName(config.color)}`"
          >
            <q-card>
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">Available Categories:</div>
                <div class="row q-gutter-sm">
                  <q-chip
                    v-for="category in config.subcategories || []"
                    :key="category"
                    :color="getCategoryColor(String(contentType), category)"
                    text-color="white"
                    :icon="getCategoryIcon(String(contentType), category)"
                  >
                    {{ formatCategoryName(category) }}
                  </q-chip>

                  <q-chip v-if="!config.subcategories?.length" color="grey" text-color="white">
                    No subcategories defined
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" @click="emit('update:modelValue', false)" />
        <q-btn
          label="Full Theme Editor"
          color="primary"
          @click="openFullThemeEditor"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useSiteTheme } from '../../composables/useSiteTheme';

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [];
  'openThemeEditor': [];
}>();

defineProps<{
  modelValue: boolean;
}>();

const { categoryMappings, contentTypes } = useSiteTheme();

// Methods
const formatCategoryName = (category: string): string => {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const resolveColorName = (colorRef: string): string => {
  // Convert color references to Quasar color names
  if (colorRef.includes('contentTypes.')) {
    return 'primary';
  }
  return colorRef;
};

const getCategoryColor = (contentType: string, category: string): string => {
  const categoryConfig = categoryMappings[contentType]?.[category];
  return resolveColorName(categoryConfig?.color || 'grey');
};

const getCategoryIcon = (contentType: string, category: string): string => {
  const categoryConfig = categoryMappings[contentType]?.[category];
  return categoryConfig?.icon || 'mdi-tag';
};

const openFullThemeEditor = () => {
  emit('update:modelValue', false);
  emit('openThemeEditor');
};
</script>
