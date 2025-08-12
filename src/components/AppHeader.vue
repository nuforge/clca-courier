<template>
    <q-header>
        <q-toolbar class="bg-clcablue">
            <q-btn v-if="showMenuButton" flat round dense icon="menu" @click="toggleDrawer" class="lt-lg" />

            <q-toolbar-title>
                <router-link to="/" class="logo-link">
                    <q-img src="/courier-logo.svg" style="height: 40px; max-width: 200px" fit="contain"
                        alt="The Courier" />
                </router-link>
            </q-toolbar-title>

            <q-btn flat round dense :icon="isDarkMode ? 'mdi-brightness-7' : 'mdi-brightness-4'" @click="toggleDarkMode"
                :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />

            <SearchInput v-model="searchValue" dark dense standout input-class="text-right" container-class="q-ml-md"
                @update:model-value="updateSearch" />
        </q-toolbar>
    </q-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
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

const siteStore = useSiteStore();

// Computed properties for reactive store values
const isDarkMode = computed(() => siteStore.isDarkMode);

// Local search state with sync to parent
const searchValue = ref(props.modelValue);

const toggleDarkMode = () => {
    siteStore.toggleDarkMode();
};

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
