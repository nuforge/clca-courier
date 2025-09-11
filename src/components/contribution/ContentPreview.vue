<template>
  <div>
    <!-- LEGACY COMPONENT DISABLED - NEEDS REFACTOR FOR CONTENTDOC ARCHITECTURE -->
    <q-card>
      <q-card-section>
        <div class="text-subtitle2">Content Preview</div>
        <div class="text-body2">This component needs refactoring for ContentDoc architecture.</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
// LEGACY COMPONENT STUB - NEEDS FULL REFACTOR
// This component had extensive legacy type usage and needs to be rewritten

// Props (preserved interface for compatibility)
interface Props {
  content?: Record<string, unknown>;
}

defineProps<Props>();
</script>
