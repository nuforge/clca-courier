<template>
  <div class="rich-text-editor">
    <q-editor
      v-model="content"
      :toolbar="toolbar"
      :min-height="minHeight"
      :placeholder="placeholder"
      content-class="rich-text-content"
      toolbar-color="grey-2"
      toolbar-text-color="grey-8"
      @update:model-value="updateContent"
    />

    <!-- Character count and helpful tips -->
    <div class="row items-center justify-between q-mt-sm text-caption text-grey-6">
      <div>
        {{ characterCount }} characters
        <span v-if="wordCount > 0">• {{ wordCount }} words</span>
        <span v-if="estimatedReadTime > 0">• ~{{ estimatedReadTime }} min read</span>
      </div>
      <div class="text-right">
        <q-btn
          flat
          dense
          size="sm"
          icon="help_outline"
          color="grey-6"
          @click="showHelp = true"
        >
          Formatting Help
        </q-btn>
      </div>
    </div>

    <!-- Formatting Help Dialog -->
    <q-dialog v-model="showHelp" max-width="600px">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Formatting Guide</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="formatting-help">
            <div class="help-section">
              <h6>Basic Formatting</h6>
              <div class="help-item">
                <code>**Bold Text**</code> → <strong>Bold Text</strong>
              </div>
              <div class="help-item">
                <code>*Italic Text*</code> → <em>Italic Text</em>
              </div>
              <div class="help-item">
                <code>~~Strikethrough~~</code> → <del>Strikethrough</del>
              </div>
            </div>

            <div class="help-section">
              <h6>Headers</h6>
              <div class="help-item">
                <code># Large Header</code>
              </div>
              <div class="help-item">
                <code>## Medium Header</code>
              </div>
              <div class="help-item">
                <code>### Small Header</code>
              </div>
            </div>

            <div class="help-section">
              <h6>Lists</h6>
              <div class="help-item">
                <code>• Bullet point</code> (use bullet button)
              </div>
              <div class="help-item">
                <code>1. Numbered list</code> (use number button)
              </div>
            </div>

            <div class="help-section">
              <h6>Links & Images</h6>
              <div class="help-item">
                Use the link button to add clickable links
              </div>
              <div class="help-item">
                Add external images using the image section below
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: string;
  minHeight?: string;
  placeholder?: string;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  minHeight: '200px',
  placeholder: 'Write your content here...',
  maxLength: 10000,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const content = ref(props.modelValue);
const showHelp = ref(false);

// Reddit-style toolbar - simple and clean
const toolbar = [
  ['bold', 'italic', 'strike'],
  ['hr'],
  [
    {
      label: 'Headers',
      icon: 'format_size',
      list: 'no-icons',
      options: ['h1', 'h2', 'h3'],
    },
  ],
  ['quote', 'unordered', 'ordered'],
  ['link'],
  ['undo', 'redo'],
  ['fullscreen'],
];

// Computed properties
const characterCount = computed(() => {
  // Strip HTML tags for accurate character count
  if (!content.value) return 0;
  const textOnly = content.value.replace(/<[^>]*>/g, '');
  return textOnly.length;
});

const wordCount = computed(() => {
  if (!content.value) return 0;
  const textOnly = content.value.replace(/<[^>]*>/g, '');
  const words = textOnly.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
});

const estimatedReadTime = computed(() => {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount.value / 200);
});

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
  }
});

// Methods
function updateContent(newContent: string) {
  content.value = newContent;
  emit('update:modelValue', newContent);
}

// Custom validation
function validateContent(): string | null {
  if (characterCount.value > props.maxLength) {
    return `Content exceeds maximum length of ${props.maxLength} characters`;
  }
  return null;
}

// Expose validation method
defineExpose({
  validate: validateContent,
  characterCount,
  wordCount,
});
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
}

:deep(.q-editor) {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

:deep(.q-editor__toolbar) {
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

:deep(.q-editor__content) {
  padding: 16px;
  line-height: 1.6;
}

:deep(.rich-text-content) {
  font-family: inherit;
  font-size: 14px;
}

:deep(.rich-text-content h1) {
  font-size: 1.8em;
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  color: var(--q-primary);
}

:deep(.rich-text-content h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  color: var(--q-primary);
}

:deep(.rich-text-content h3) {
  font-size: 1.3em;
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  color: var(--q-primary);
}

:deep(.rich-text-content p) {
  margin: 0.8em 0;
}

:deep(.rich-text-content ul),
:deep(.rich-text-content ol) {
  margin: 0.8em 0;
  padding-left: 2em;
}

:deep(.rich-text-content li) {
  margin: 0.3em 0;
}

:deep(.rich-text-content blockquote) {
  border-left: 4px solid var(--q-primary);
  margin: 1em 0;
  padding: 0.5em 1em;
  background: rgba(0, 0, 0, 0.02);
  font-style: italic;
}

:deep(.rich-text-content a) {
  color: var(--q-primary);
  text-decoration: none;
}

:deep(.rich-text-content a:hover) {
  text-decoration: underline;
}

:deep(.rich-text-content code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.formatting-help {
  max-width: 100%;
}

.help-section {
  margin-bottom: 1.5em;
}

.help-section h6 {
  margin: 0 0 0.8em 0;
  color: var(--q-primary);
  font-weight: 600;
}

.help-item {
  margin: 0.5em 0;
  display: flex;
  align-items: center;
  gap: 1em;
}

.help-item code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  min-width: 120px;
}

/* Dark theme support */
.body--dark :deep(.q-editor) {
  border-color: #424242;
}

.body--dark :deep(.q-editor__toolbar) {
  background: #303030;
  border-bottom-color: #424242;
}

.body--dark :deep(.rich-text-content blockquote) {
  background: rgba(255, 255, 255, 0.05);
}

.body--dark :deep(.rich-text-content code) {
  background: rgba(255, 255, 255, 0.1);
}

.body--dark .help-item code {
  background: rgba(255, 255, 255, 0.1);
}
</style>
