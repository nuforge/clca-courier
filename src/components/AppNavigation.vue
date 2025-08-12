<template>
    <q-drawer v-model="isOpen" show-if-above class="bg-dark">
        <q-list class="q-mt-md">
            <NavigationItem v-for="item in navigationItems" :key="item.title" :item="item" />
        </q-list>
    </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NavigationItem from './NavigationItem.vue';
import { useNavigation } from '../composables/useNavigation';

interface Props {
    modelValue: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use the navigation composable
const { navigationItems } = useNavigation();

// Create a computed property for two-way binding
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});
</script>
