<template>
  <q-header>
    <q-toolbar class="bg-clcablue" style="height:80px">
      <q-btn v-if="showMenuButton" flat round dense icon="menu" @click="toggleDrawer" class="lt-lg" />

      <q-toolbar-title>
        <router-link to="/" class="logo-link">
          <q-img src="/courier-logo.svg" style="height: 50px; max-width: 200px" fit="contain" alt="The Courier" />
        </router-link>
      </q-toolbar-title>

      <SearchInput v-model="searchValue" dark dense standout input-class="text-right" container-class="q-ml-md"
        @update:model-value="updateSearch" />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SearchInput from './SearchInput.vue';

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
