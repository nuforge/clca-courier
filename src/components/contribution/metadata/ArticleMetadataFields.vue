<template>
  <div class="article-metadata-fields">
    <div class="row q-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="localMetadata.subtitle"
          label="Subtitle (Optional)"
          outlined
          placeholder="A brief subtitle for your article"
          @update:model-value="updateMetadata"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          v-model.number="localMetadata.readTime"
          label="Estimated Read Time (minutes)"
          outlined
          type="number"
          min="1"
          max="60"
          placeholder="5"
          @update:model-value="updateMetadata"
        />
      </div>
    </div>

    <div class="row q-gutter-md q-mt-md">
      <div class="col-12">
        <q-select
          v-model="localMetadata.tags"
          label="Tags (Optional)"
          outlined
          multiple
          use-chips
          use-input
          input-debounce="300"
          new-value-mode="add-unique"
          :options="tagOptions"
          @update:model-value="updateMetadata"
        >
          <template v-slot:hint>
            Add relevant tags to help readers find your article
          </template>
        </q-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { ArticleMetadata } from '../../../types/core/content.types';

interface Props {
  modelValue: Partial<ArticleMetadata>;
  contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [metadata: Partial<ArticleMetadata>];
}>();

const localMetadata = ref<ArticleMetadata>({
  subtitle: '',
  readTime: 5,
  tags: [],
});

const tagOptions = ref<string[]>([
  'Community',
  'Lake Life',
  'Events',
  'Recreation',
  'Environment',
  'Safety',
  'History',
  'Maintenance',
  'Wildlife',
  'Seasonal',
]);

onMounted(() => {
  // Initialize with existing values if any
  if (props.modelValue) {
    localMetadata.value = {
      subtitle: props.modelValue.subtitle || '',
      readTime: props.modelValue.readTime || 5,
      tags: props.modelValue.tags || [],
    };
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localMetadata.value = {
      subtitle: newValue.subtitle || '',
      readTime: newValue.readTime || 5,
      tags: newValue.tags || [],
    };
  }
}, { deep: true });

function updateMetadata() {
  emit('update:modelValue', { ...localMetadata.value });
}
</script>

<style scoped>
.article-metadata-fields {
  width: 100%;
}
</style>
