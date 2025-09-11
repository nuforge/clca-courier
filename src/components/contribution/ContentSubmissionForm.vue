<template>
  <div>
    <!-- LEGACY COMPONENT DISABLED - NEEDS REFACTOR FOR CONTENTDOC ARCHITECTURE -->
    <q-card>
      <q-card-section>
        <div class="text-h6">Content Submission Form</div>
        <div class="text-body2">This component needs refactoring for ContentDoc architecture.</div>
        <div class="text-caption q-mt-md">
          Original functionality preserved but requires rewrite to use unified ContentDoc interface.
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
// LEGACY COMPONENT STUB - NEEDS FULL REFACTOR
// This component had extensive legacy patterns and needs to be rewritten

// Props preserved for compatibility
interface Props {
  existingContent?: Record<string, unknown>;
  initialType?: string;
  quickMode?: boolean;
}

defineProps<Props>();

// Emits preserved for compatibility
// const emit = defineEmits(['submitted', 'cancelled']); // Preserved for future use
</script>
