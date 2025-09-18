<!--
  Base Tabbed Content Component

  A reusable tabbed interface component that manages tab navigation and content display.
  Built following the Week 2 migration guide with strict TypeScript and Quasar-only styling.

  Features:
  - Configurable tab definitions via props
  - Slot-based content rendering for maximum flexibility
  - Emits activeTab changes to parent component
  - Uses only Quasar components and utility classes (NO custom CSS)
-->
<template>
  <q-card>
    <q-tabs
      v-model="internalActiveTab"
      class="text-grey-6"
      dense
      @update:model-value="handleTabChange"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.label"
        :icon="tab.icon"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="internalActiveTab"
      animated
    >
      <q-tab-panel
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        class="q-pa-md"
      >
        <!-- Dynamic slot for each tab's content -->
        <slot
          :name="tab.name"
          :tab="tab"
        >
          <!-- Fallback content if no slot provided -->
          <div class="text-body1 q-mb-md">{{ tab.label }}</div>
          <div class="text-grey-6">{{ tab.description || 'No content provided for this tab.' }}</div>
        </slot>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * Tab configuration interface
 */
export interface TabConfig {
  name: string;
  label: string;
  icon?: string;
  description?: string;
}

/**
 * Component props interface
 */
interface Props {
  tabs: TabConfig[];
  activeTab: string;
}

/**
 * Component emits interface
 */
interface Emits {
  (e: 'update:activeTab', value: string): void;
}

// Props and emits with strict typing
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Internal state for v-model binding
const internalActiveTab = ref(props.activeTab);

// Watch for external activeTab changes and sync internal state
watch(
  () => props.activeTab,
  (newActiveTab) => {
    internalActiveTab.value = newActiveTab;
  }
);

// Handle tab change and emit to parent
const handleTabChange = (newTab: string) => {
  emit('update:activeTab', newTab);
};
</script>

<!-- NO CUSTOM CSS - Using only Quasar utility classes as per migration guide -->
