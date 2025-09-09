<!--
  Icon Picker Component
  Provides searchable icon selection with autocomplete and preview
-->
<template>
  <div class="icon-picker-wrapper">
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
    >
      <!-- Icon preview in prepend slot -->
      <template v-slot:prepend>
        <q-icon
          :name="modelValue || 'mdi-help-circle-outline'"
          :color="modelValue ? 'primary' : 'grey-5'"
          size="sm"
        />
      </template>

      <!-- Picker toggle button in append slot -->
      <template v-slot:append>
        <q-btn
          icon="mdi-format-list-bulleted"
          flat
          round
          dense
          size="sm"
          @click="showPicker = !showPicker"
          :aria-label="`Open icon picker for ${label}`"
        />
      </template>
    </q-input>

    <!-- Icon Picker Dialog -->
    <q-dialog v-model="showPicker" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="mdi-format-list-bulleted" class="q-mr-sm" />
            Choose Icon
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
          <!-- Search and Filters -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="searchQuery"
                label="Search Icons"
                outlined
                dense
                clearable
                debounce="300"
                placeholder="e.g., calendar, document, user..."
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-magnify" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="selectedCategory"
                :options="categoryOptions"
                label="Category"
                outlined
                dense
                clearable
                option-value="value"
                option-label="label"
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="iconSet"
                :options="iconSetOptions"
                label="Icon Set"
                outlined
                dense
                option-value="value"
                option-label="label"
                emit-value
                map-options
              />
            </div>
          </div>

          <!-- Current Selection Preview -->
          <div v-if="tempIcon" class="q-mb-md">
            <q-card outlined>
              <q-card-section class="row items-center">
                <q-icon :name="tempIcon" size="lg" class="q-mr-md" />
                <div>
                  <div class="text-subtitle2">{{ tempIcon }}</div>
                  <div class="text-caption text-grey-6">Current Selection</div>
                </div>
                <q-space />
                <q-btn
                  label="Clear"
                  color="grey"
                  flat
                  size="sm"
                  @click="tempIcon = ''"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Popular Icons -->
          <div v-if="!searchQuery && !selectedCategory" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-sm">Popular Icons</div>
            <div class="row q-gutter-xs">
              <div
                v-for="icon in popularIcons"
                :key="icon"
                class="col-auto"
              >
                <q-btn
                  :icon="icon"
                  flat
                  class="icon-btn"
                  :class="{ 'icon-btn--selected': tempIcon === icon }"
                  @click="selectIcon(icon)"
                  :aria-label="`Select ${icon}`"
                >
                  <q-tooltip>{{ icon }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Icon Grid -->
          <div class="text-subtitle1 q-mb-sm">
            Available Icons
            <span class="text-caption text-grey-6">({{ filteredIcons.length }} found)</span>
          </div>

          <q-scroll-area style="height: 400px" class="rounded-borders">
            <div class="q-pa-md">
              <div v-if="isLoading" class="text-center q-py-lg">
                <q-spinner color="primary" size="2em" />
                <div class="text-body2 q-mt-sm">Loading icons...</div>
              </div>

              <div v-else-if="filteredIcons.length === 0" class="text-center q-py-lg">
                <q-icon name="mdi-magnify-close" size="3em" color="grey-5" />
                <div class="text-body1 q-mt-sm">No icons found</div>
                <div class="text-caption text-grey-6">Try adjusting your search criteria</div>
              </div>

              <div v-else class="icon-grid">
                <div
                  v-for="icon in paginatedIcons"
                  :key="icon"
                  class="icon-grid-item"
                >
                  <q-btn
                    :icon="icon"
                    flat
                    class="icon-btn"
                    :class="{ 'icon-btn--selected': tempIcon === icon }"
                    @click="selectIcon(icon)"
                    :aria-label="`Select ${icon}`"
                  >
                    <q-tooltip>{{ icon }}</q-tooltip>
                  </q-btn>
                  <div class="icon-name">{{ icon.replace('mdi-', '') }}</div>
                </div>
              </div>

              <!-- Load More Button -->
              <div v-if="hasMoreIcons" class="text-center q-mt-md">
                <q-btn
                  label="Load More"
                  color="primary"
                  outline
                  @click="loadMoreIcons"
                />
              </div>
            </div>
          </q-scroll-area>
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
            @click="applyIcon"
            :disable="!tempIcon"
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
  iconSet?: 'mdi' | 'fa' | 'eva' | 'themify' | 'line-awesome' | 'bootstrap';
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  outlined: true,
  dense: false,
  readonly: false,
  disable: false,
  iconSet: 'mdi',
});

const emit = defineEmits<Emits>();

// Local state
const showPicker = ref(false);
const tempIcon = ref(props.modelValue);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const iconSet = ref(props.iconSet);
const isLoading = ref(false);
const currentPage = ref(1);
const itemsPerPage = 50;

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  tempIcon.value = newValue;
});

// Popular icons for quick access
const popularIcons = [
  'mdi-home',
  'mdi-calendar',
  'mdi-account',
  'mdi-email',
  'mdi-phone',
  'mdi-map-marker',
  'mdi-file-document',
  'mdi-image',
  'mdi-video',
  'mdi-music',
  'mdi-cog',
  'mdi-heart',
  'mdi-star',
  'mdi-plus',
  'mdi-minus',
  'mdi-check',
  'mdi-close',
  'mdi-delete',
  'mdi-edit',
  'mdi-share',
  'mdi-download',
  'mdi-upload',
  'mdi-search',
  'mdi-filter',
  'mdi-menu',
  'mdi-refresh',
  'mdi-alert',
  'mdi-information',
  'mdi-help-circle',
  'mdi-bookmark',
  'mdi-tag',
  'mdi-folder',
  'mdi-clipboard',
  'mdi-printer',
  'mdi-cloud',
  'mdi-wifi',
  'mdi-battery',
  'mdi-weather-sunny',
  'mdi-newspaper',
  'mdi-forum',
  'mdi-bulletin-board',
];

// Comprehensive icon list (MDI icons)
const allMdiIcons = [
  'mdi-home', 'mdi-account', 'mdi-cog', 'mdi-calendar', 'mdi-email', 'mdi-phone', 'mdi-map-marker',
  'mdi-file-document', 'mdi-image', 'mdi-video', 'mdi-music', 'mdi-heart', 'mdi-star', 'mdi-plus',
  'mdi-minus', 'mdi-check', 'mdi-close', 'mdi-delete', 'mdi-edit', 'mdi-share', 'mdi-download',
  'mdi-upload', 'mdi-search', 'mdi-filter', 'mdi-menu', 'mdi-refresh', 'mdi-alert', 'mdi-information',
  'mdi-help-circle', 'mdi-bookmark', 'mdi-tag', 'mdi-folder', 'mdi-clipboard', 'mdi-printer',
  'mdi-cloud', 'mdi-wifi', 'mdi-battery', 'mdi-weather-sunny', 'mdi-newspaper', 'mdi-forum',
  'mdi-bulletin-board', 'mdi-car', 'mdi-train', 'mdi-airplane', 'mdi-bicycle', 'mdi-walk',
  'mdi-run', 'mdi-swim', 'mdi-golf', 'mdi-basketball', 'mdi-football', 'mdi-soccer',
  'mdi-baseball', 'mdi-tennis', 'mdi-bowling', 'mdi-pool', 'mdi-fishing', 'mdi-hiking',
  'mdi-camping', 'mdi-fire', 'mdi-tree', 'mdi-flower', 'mdi-leaf', 'mdi-water', 'mdi-mountain',
  'mdi-beach', 'mdi-island', 'mdi-lighthouse', 'mdi-bridge', 'mdi-castle', 'mdi-church',
  'mdi-school', 'mdi-hospital', 'mdi-store', 'mdi-bank', 'mdi-office-building', 'mdi-warehouse',
  'mdi-factory', 'mdi-garage', 'mdi-gate', 'mdi-fence', 'mdi-mailbox', 'mdi-traffic-light',
  'mdi-road', 'mdi-highway', 'mdi-tunnel', 'mdi-bridge-span', 'mdi-ferry', 'mdi-ship',
  'mdi-sailboat', 'mdi-speedboat', 'mdi-submarine', 'mdi-anchor', 'mdi-life-ring',
  'mdi-compass', 'mdi-telescope', 'mdi-binoculars', 'mdi-camera', 'mdi-camcorder',
  'mdi-microphone', 'mdi-speaker', 'mdi-headphones', 'mdi-radio', 'mdi-television',
  'mdi-laptop', 'mdi-desktop-mac', 'mdi-tablet', 'mdi-cellphone', 'mdi-watch',
  'mdi-keyboard', 'mdi-mouse', 'mdi-joystick', 'mdi-gamepad', 'mdi-controller',
  'mdi-book', 'mdi-book-open', 'mdi-library', 'mdi-pencil', 'mdi-pen', 'mdi-marker',
  'mdi-ruler', 'mdi-calculator', 'mdi-abacus', 'mdi-flask', 'mdi-test-tube',
  'mdi-microscope', 'mdi-dna', 'mdi-atom', 'mdi-molecule', 'mdi-pill',
  'mdi-medical-bag', 'mdi-stethoscope', 'mdi-thermometer', 'mdi-bandage',
  'mdi-hospital-box', 'mdi-ambulance', 'mdi-wheelchair', 'mdi-crutch',
  'mdi-shield', 'mdi-security', 'mdi-lock', 'mdi-key', 'mdi-safe',
  'mdi-hammer', 'mdi-wrench', 'mdi-screwdriver', 'mdi-saw', 'mdi-drill',
  'mdi-toolbox', 'mdi-construction', 'mdi-hard-hat', 'mdi-crane',
  'mdi-shopping', 'mdi-cart', 'mdi-basket', 'mdi-bag', 'mdi-wallet',
  'mdi-credit-card', 'mdi-cash', 'mdi-currency-usd', 'mdi-currency-eur',
  'mdi-gift', 'mdi-sale', 'mdi-receipt', 'mdi-barcode', 'mdi-qrcode',
  'mdi-scale', 'mdi-weight', 'mdi-tape-measure', 'mdi-format-size',
  'mdi-format-color-fill', 'mdi-format-color-text', 'mdi-palette',
  'mdi-brush', 'mdi-spray', 'mdi-roller', 'mdi-bucket', 'mdi-dropper',
  'mdi-restaurant', 'mdi-silverware', 'mdi-glass-wine', 'mdi-coffee',
  'mdi-tea', 'mdi-beer', 'mdi-bottle-wine', 'mdi-cake', 'mdi-cupcake',
  'mdi-pizza', 'mdi-hamburger', 'mdi-hot-dog', 'mdi-taco', 'mdi-ice-cream',
  'mdi-fruit-apple', 'mdi-fruit-orange', 'mdi-fruit-grapes', 'mdi-carrot',
  'mdi-corn', 'mdi-pepper', 'mdi-mushroom', 'mdi-bread-slice',
  'mdi-egg', 'mdi-cheese', 'mdi-fish', 'mdi-cow', 'mdi-pig', 'mdi-chicken',
];

// Category options
const categoryOptions = [
  { label: 'Navigation', value: 'navigation' },
  { label: 'Actions', value: 'actions' },
  { label: 'Content', value: 'content' },
  { label: 'Communication', value: 'communication' },
  { label: 'Media', value: 'media' },
  { label: 'Technology', value: 'technology' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Sports & Recreation', value: 'sports' },
  { label: 'Nature & Weather', value: 'nature' },
  { label: 'Buildings & Places', value: 'places' },
  { label: 'Food & Drink', value: 'food' },
  { label: 'Shopping & Commerce', value: 'commerce' },
  { label: 'Tools & Hardware', value: 'tools' },
  { label: 'Medical & Health', value: 'medical' },
  { label: 'Security', value: 'security' },
];

// Icon set options
const iconSetOptions = [
  { label: 'Material Design Icons', value: 'mdi' },
  { label: 'Font Awesome', value: 'fa' },
  { label: 'Eva Icons', value: 'eva' },
  { label: 'Themify', value: 'themify' },
  { label: 'Line Awesome', value: 'line-awesome' },
  { label: 'Bootstrap Icons', value: 'bootstrap' },
];

// Computed
const filteredIcons = computed(() => {
  let icons = [...allMdiIcons];

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    icons = icons.filter(icon =>
      icon.toLowerCase().includes(query) ||
      icon.replace('mdi-', '').replace(/-/g, ' ').includes(query)
    );
  }

  // Filter by category (simplified categorization)
  if (selectedCategory.value) {
    const category = selectedCategory.value;
    icons = icons.filter(icon => {
      switch (category) {
        case 'navigation':
          return /home|menu|arrow|chevron|navigate|compass|map/.test(icon);
        case 'actions':
          return /plus|minus|check|close|delete|edit|save|cancel|play|pause|stop/.test(icon);
        case 'content':
          return /file|document|book|image|video|music|text|format/.test(icon);
        case 'communication':
          return /email|phone|chat|message|forum|comment|share/.test(icon);
        case 'media':
          return /camera|video|music|speaker|microphone|headphones|television/.test(icon);
        case 'technology':
          return /laptop|desktop|tablet|cellphone|wifi|cloud|database|server/.test(icon);
        case 'transportation':
          return /car|train|airplane|bicycle|ship|bus|motorcycle/.test(icon);
        case 'sports':
          return /basketball|football|soccer|tennis|golf|swim|run|bike/.test(icon);
        case 'nature':
          return /tree|flower|leaf|water|mountain|weather|sun|rain|snow/.test(icon);
        case 'places':
          return /home|building|school|hospital|store|bank|church|castle/.test(icon);
        case 'food':
          return /restaurant|coffee|tea|beer|wine|cake|pizza|apple|carrot/.test(icon);
        case 'commerce':
          return /shopping|cart|bag|wallet|credit|cash|gift|sale/.test(icon);
        case 'tools':
          return /hammer|wrench|screwdriver|saw|drill|toolbox|construction/.test(icon);
        case 'medical':
          return /medical|hospital|pill|stethoscope|thermometer|ambulance/.test(icon);
        case 'security':
          return /shield|security|lock|key|safe/.test(icon);
        default:
          return true;
      }
    });
  }

  return icons.sort();
});

const paginatedIcons = computed(() => {
  const start = 0;
  const end = currentPage.value * itemsPerPage;
  return filteredIcons.value.slice(start, end);
});

const hasMoreIcons = computed(() => {
  return paginatedIcons.value.length < filteredIcons.value.length;
});

// Methods
const updateValue = (value: string | number | null) => {
  const stringValue = String(value || '');
  tempIcon.value = stringValue;
  emit('update:modelValue', stringValue);
};

const selectIcon = (icon: string) => {
  tempIcon.value = icon;
};

const loadMoreIcons = () => {
  currentPage.value += 1;
};

const applyIcon = () => {
  if (tempIcon.value) {
    emit('update:modelValue', tempIcon.value);
    showPicker.value = false;
  }
};

const cancelPicker = () => {
  tempIcon.value = props.modelValue;
  showPicker.value = false;
  searchQuery.value = '';
  selectedCategory.value = null;
  currentPage.value = 1;
};

// Reset pagination when filters change
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1;
});

// Lifecycle
onMounted(() => {
  tempIcon.value = props.modelValue;
});
</script>

<style scoped>
.icon-picker-wrapper {
  position: relative;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.icon-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.icon-btn--selected {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
}

.icon-name {
  font-size: 10px;
  color: var(--q-color-grey-7);
  word-break: break-word;
  line-height: 1.2;
  max-width: 70px;
}

/* Dark theme support */
.body--dark .icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.body--dark .icon-btn--selected {
  background-color: rgba(144, 202, 249, 0.16);
  color: #90caf9;
}

.body--dark .icon-name {
  color: var(--q-color-grey-4);
}

@media (max-width: 600px) {
  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }

  .icon-btn {
    width: 40px;
    height: 40px;
  }
}
</style>
