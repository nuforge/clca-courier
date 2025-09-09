<!--
  Colors Management Dialog
  Quick access to color configuration
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
          <q-icon name="mdi-format-color-fill" class="q-mr-sm" />
          Color Palette
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <p class="text-body2 text-grey-6">
          Overview of site color scheme. Use the full Theme Configuration for detailed editing.
        </p>

        <!-- Primary Colors -->
        <div class="text-subtitle1 q-mb-sm">Primary Colors</div>
        <div class="row q-gutter-sm q-mb-lg">
          <div class="col-auto">
            <q-card class="text-center" style="min-width: 120px">
              <q-card-section class="q-pa-sm">
                <q-icon
                  name="mdi-circle"
                  size="3rem"
                  :style="`color: ${colors.primary}`"
                />
                <div class="text-caption">Primary</div>
                <div class="text-caption text-grey-6">{{ colors.primary }}</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-auto">
            <q-card class="text-center" style="min-width: 120px">
              <q-card-section class="q-pa-sm">
                <q-icon
                  name="mdi-circle"
                  size="3rem"
                  :style="`color: ${colors.secondary}`"
                />
                <div class="text-caption">Secondary</div>
                <div class="text-caption text-grey-6">{{ colors.secondary }}</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-auto">
            <q-card class="text-center" style="min-width: 120px">
              <q-card-section class="q-pa-sm">
                <q-icon
                  name="mdi-circle"
                  size="3rem"
                  :style="`color: ${colors.accent}`"
                />
                <div class="text-caption">Accent</div>
                <div class="text-caption text-grey-6">{{ colors.accent }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Content Type Colors -->
        <div class="text-subtitle1 q-mb-sm">Content Type Colors</div>
        <div class="row q-gutter-sm q-mb-lg">
          <div
            v-for="(color, type) in colors.contentTypes"
            :key="type"
            class="col-auto"
          >
            <q-card class="text-center" style="min-width: 120px">
              <q-card-section class="q-pa-sm">
                <q-icon
                  :name="getContentTypeIcon(String(type))"
                  size="2rem"
                  :style="`color: ${color}`"
                />
                <div class="text-caption">{{ formatTypeName(String(type)) }}</div>
                <div class="text-caption text-grey-6">{{ color }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Status Colors -->
        <div class="text-subtitle1 q-mb-sm">Status Colors</div>
        <div class="row q-gutter-sm">
          <div
            v-for="(color, status) in colors.status"
            :key="status"
            class="col-auto"
          >
            <q-card class="text-center" style="min-width: 120px">
              <q-card-section class="q-pa-sm">
                <q-icon
                  :name="getStatusIcon(String(status))"
                  size="2rem"
                  :style="`color: ${color}`"
                />
                <div class="text-caption">{{ formatTypeName(String(status)) }}</div>
                <div class="text-caption text-grey-6">{{ color }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" @click="emit('update:modelValue', false)" />
        <q-btn
          label="Edit Colors"
          color="primary"
          @click="openColorEditor"
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

const { colors, getContentIcon, getStatusIcon: getStatusIconConfig } = useSiteTheme();

// Methods
const formatTypeName = (type: string): string => {
  return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const getContentTypeIcon = (type: string): string => {
  return getContentIcon(type).icon;
};

const getStatusIcon = (status: string): string => {
  return getStatusIconConfig(status).icon;
};

const openColorEditor = () => {
  emit('update:modelValue', false);
  emit('openThemeEditor');
};
</script>
