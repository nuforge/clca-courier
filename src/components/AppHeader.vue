<template>
  <q-header reveal>
    <q-toolbar class="bg-clcablue" style="height:80px">
      <q-btn v-if="showMenuButton" flat round dense icon="menu" @click="toggleDrawer" class="lt-lg" />

      <q-toolbar-title>
        <router-link to="/" class="logo-link">
          <q-img :src="logoSrc" style="height: 50px; max-width: 200px" fit="contain" alt="The Courier" />
        </router-link>
      </q-toolbar-title>

      <SearchInput v-model="searchValue" dark dense standout input-class="text-right" container-class="q-ml-md"
        @update:model-value="updateSearch" />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SearchInput from './SearchInput.vue';
import { getPublicPath } from '../utils/path-utils';

interface Props {
  showMenuButton?: boolean;
  modelValue?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'toggle-drawer'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showMenuButton: false,
  modelValue: ''
});

const emit = defineEmits<Emits>();

// Logo path with correct base path for production
const logoSrc = computed(() => getPublicPath('courier-logo.svg'));

// Local search state with sync to parent
const searchValue = ref(props.modelValue);

const toggleDrawer = () => {
  emit('toggle-drawer');
};

const updateSearch = (value: string) => {
  searchValue.value = value;
  emit('update:modelValue', value);
};
</script>

<style lang="scss" scoped>
.logo-link {
  text-decoration: none;

  &:hover {
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }
}
</style>
