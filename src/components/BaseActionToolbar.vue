<!--
  BaseActionToolbar Component
  Reusable action sections toolbar for admin interfaces
-->
<template>
  <div class="row q-col-gutter-md">
    <div
      v-for="section in sections"
      :key="section.title"
      :class="getColumnClass"
    >
      <q-card class="full-height">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon :name="section.titleIcon" class="q-mr-sm" />
            {{ section.title }}
          </div>
          <p class="text-body2 text-grey-6">
            {{ section.description }}
          </p>
          <div class="q-col-gutter-sm">
            <!-- Primary Action Button -->
            <q-btn
              :outline="section.primaryAction.style === 'outline'"
              :flat="section.primaryAction.style === 'flat'"
              :color="section.primaryAction.color"
              :icon="section.primaryAction.icon"
              :label="section.primaryAction.label"
              :to="section.primaryAction.to"
              :loading="section.primaryAction.loading"
              :disabled="section.primaryAction.disabled || loading"
              :size="section.primaryAction.size"
              class="full-width"
              @click="handleActionClick(section.primaryAction)"
            />

            <!-- Secondary Action Buttons -->
            <div v-if="section.secondaryActions.length > 0" class="row q-gutter-sm q-px-none">
              <div
                v-for="action in section.secondaryActions"
                :key="action.label"
                class="col"
              >
                <q-btn
                  :outline="action.style === 'outline'"
                  :flat="action.style === 'flat'"
                  :color="action.color"
                  :icon="action.icon"
                  :label="action.label"
                  :to="action.to"
                  :loading="action.loading"
                  :disabled="action.disabled || loading"
                  :size="action.size || 'sm'"
                  class="full-width"
                  @click="handleActionClick(action)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  style?: 'outline' | 'flat';
  size?: 'sm' | 'md';
  to?: string;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionSection {
  title: string;
  titleIcon: string;
  description: string;
  primaryAction: ActionButton;
  secondaryActions: ActionButton[];
}

interface Props {
  sections: ActionSection[];
  columns?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 2,
  loading: false
});

interface Emits {
  (e: 'action-click', action: ActionButton): void;
}

const emit = defineEmits<Emits>();

// Computed properties
const getColumnClass = computed(() => {
  switch (props.columns) {
    case 1: return 'col-12';
    case 2: return 'col-12 col-md-6';
    case 3: return 'col-12 col-md-4';
    case 4: return 'col-12 col-md-3';
    case 6: return 'col-12 col-md-2';
    default: return 'col-12 col-md-6';
  }
});

// Methods
const handleActionClick = (action: ActionButton) => {
  if (action.action && !action.to) {
    emit('action-click', action);
  }
};
</script>

<style scoped>
.full-height {
  height: 100%;
}
</style>
