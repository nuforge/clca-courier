<!--
  Color Picker Component
  Provides a comprehensive color picker with presets, HEX input, and visual feedback
-->
<template>
  <div class="color-picker-wrapper">
    <q-input
      :model-value="modelValue"
      :label="label"
      :hint="hint"
      :outlined="outlined"
      :dense="dense"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      @update:model-value="updateValue"
      @focus="showPicker = true"
    >
      <!-- Color preview in append slot -->
      <template v-slot:append>
        <div class="row items-center no-wrap q-gutter-xs">
          <!-- Color preview circle -->
          <div
            class="color-preview-circle cursor-pointer"
            :style="{ backgroundColor: resolvedColor }"
            @click="showPicker = !showPicker"
          />
          <!-- Picker toggle button -->
          <q-btn
            icon="mdi-palette"
            flat
            round
            dense
            size="sm"
            @click="showPicker = !showPicker"
            :aria-label="`Open color picker for ${label}`"
          />
        </div>
      </template>
    </q-input>

    <!-- Color Picker Dialog -->
    <q-dialog v-model="showPicker" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="mdi-palette" class="q-mr-sm" />
            Choose Color
          </div>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="showPicker = false"
          />
        </q-card-section>

        <q-card-section>
          <!-- Current Color Preview -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Current Color</div>
            <div class="row items-center q-gutter-sm">
              <div
                class="color-preview-large"
                :style="{ backgroundColor: tempColor }"
              />
              <div class="text-body2">{{ tempColor }}</div>
            </div>
          </div>

          <!-- HEX Input -->
          <q-input
            v-model="tempColor"
            label="HEX Color Code"
            outlined
            dense
            placeholder="#000000"
            :rules="[validateHexColor]"
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-pound" />
            </template>
          </q-input>

          <!-- Color Presets -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Quick Colors</div>
            <div class="row q-gutter-xs">
              <div
                v-for="preset in colorPresets"
                :key="preset.value"
                class="col-auto"
              >
                <q-btn
                  :style="{ backgroundColor: preset.value }"
                  class="color-preset-btn"
                  size="sm"
                  flat
                  :aria-label="`Select ${preset.name}`"
                  @click="selectPreset(preset.value)"
                >
                  <q-tooltip>{{ preset.name }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Theme Colors -->
          <div v-if="showThemeColors" class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Theme Colors</div>
            <div class="row q-gutter-xs">
              <div
                v-for="themeColor in themeColorOptions"
                :key="themeColor.value"
                class="col-auto"
              >
                <q-btn
                  :color="themeColor.value"
                  :label="themeColor.label"
                  size="sm"
                  outline
                  no-caps
                  @click="selectThemeColor(themeColor.value)"
                />
              </div>
            </div>
          </div>

          <!-- Native Color Picker (if supported) -->
          <div v-if="supportsNativeColorPicker">
            <div class="text-subtitle2 q-mb-sm">Color Picker</div>
            <input
              ref="nativeColorPicker"
              type="color"
              :value="tempColor"
              @input="onNativeColorChange"
              class="native-color-picker"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="Cancel"
            color="grey"
            flat
            @click="cancelPicker"
          />
          <q-btn
            label="Apply"
            color="primary"
            @click="applyColor"
            :disable="!isValidHexColor(tempColor)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Props {
  modelValue: string;
  label?: string;
  hint?: string;
  outlined?: boolean;
  dense?: boolean;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: string) => boolean | string>;
  showThemeColors?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  outlined: true,
  dense: false,
  readonly: false,
  disable: false,
  showThemeColors: true,
});

const emit = defineEmits<Emits>();

// Local state
const showPicker = ref(false);
const tempColor = ref(props.modelValue);
const nativeColorPicker = ref<HTMLInputElement | null>(null);
const supportsNativeColorPicker = ref(false);

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  tempColor.value = newValue;
});

// Computed
const resolvedColor = computed(() => {
  return isValidHexColor(props.modelValue) ? props.modelValue : '#cccccc';
});

const themeColorOptions = computed(() => [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Accent', value: 'accent' },
  { label: 'Positive', value: 'positive' },
  { label: 'Negative', value: 'negative' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
]);

// Color presets for quick selection
const colorPresets = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#f44336' },
  { name: 'Pink', value: '#e91e63' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Deep Purple', value: '#673ab7' },
  { name: 'Indigo', value: '#3f51b5' },
  { name: 'Blue', value: '#2196f3' },
  { name: 'Light Blue', value: '#03a9f4' },
  { name: 'Cyan', value: '#00bcd4' },
  { name: 'Teal', value: '#009688' },
  { name: 'Green', value: '#4caf50' },
  { name: 'Light Green', value: '#8bc34a' },
  { name: 'Lime', value: '#cddc39' },
  { name: 'Yellow', value: '#ffeb3b' },
  { name: 'Amber', value: '#ffc107' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Deep Orange', value: '#ff5722' },
  { name: 'Brown', value: '#795548' },
  { name: 'Grey', value: '#9e9e9e' },
  { name: 'Blue Grey', value: '#607d8b' },
];

// Methods
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const validateHexColor = (val: string): boolean | string => {
  if (!val) return 'Color is required';
  if (!isValidHexColor(val)) return 'Please enter a valid HEX color (e.g., #FF0000)';
  return true;
};

const updateValue = (value: string | number | null) => {
  const stringValue = String(value || '');
  tempColor.value = stringValue;
  if (isValidHexColor(stringValue)) {
    emit('update:modelValue', stringValue);
  }
};

const selectPreset = (color: string) => {
  tempColor.value = color;
};

const selectThemeColor = (colorRef: string) => {
  tempColor.value = colorRef;
};

const onNativeColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  tempColor.value = target.value;
};

const applyColor = () => {
  if (isValidHexColor(tempColor.value) || tempColor.value.startsWith('#') === false) {
    emit('update:modelValue', tempColor.value);
    showPicker.value = false;
  }
};

const cancelPicker = () => {
  tempColor.value = props.modelValue;
  showPicker.value = false;
};

// Lifecycle
onMounted(() => {
  // Check if native color picker is supported
  const input = document.createElement('input');
  input.type = 'color';
  supportsNativeColorPicker.value = input.type === 'color';
});
</script>

<style scoped>
.color-picker-wrapper {
  position: relative;
}

.color-preview-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  transition: border-color 0.2s ease;
}

.color-preview-circle:hover {
  border-color: #bdbdbd;
}

.color-preview-large {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.color-preset-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid #e0e0e0;
  margin: 2px;
  transition: transform 0.1s ease, border-color 0.2s ease;
}

.color-preset-btn:hover {
  transform: scale(1.1);
  border-color: #999;
}

.native-color-picker {
  width: 100%;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

/* Dark theme support */
.body--dark .color-preview-circle,
.body--dark .color-preview-large,
.body--dark .color-preset-btn {
  border-color: #555;
}

.body--dark .color-preset-btn:hover {
  border-color: #888;
}

.body--dark .native-color-picker {
  border-color: #555;
  background-color: #2d2d2d;
}
</style>
