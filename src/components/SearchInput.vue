<template>
    <q-input :dark="dark" :dense="dense" :standout="standout" v-model="searchValue" :input-class="inputClass"
        :class="containerClass" :placeholder="placeholder" @update:model-value="updateSearch">
        <template v-slot:prepend v-if="prependIcon">
            <q-icon :name="prependIcon" />
        </template>

        <template v-slot:append>
            <q-icon v-if="searchValue === ''" :name="searchIcon" />
            <q-icon v-else :name="clearIcon" class="cursor-pointer" @click="clearSearch" />
        </template>
    </q-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    modelValue?: string;
    dark?: boolean;
    dense?: boolean;
    standout?: boolean;
    inputClass?: string;
    containerClass?: string;
    placeholder?: string;
    prependIcon?: string;
    searchIcon?: string;
    clearIcon?: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'search', value: string): void;
    (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    dark: false,
    dense: false,
    standout: false,
    inputClass: '',
    containerClass: '',
    placeholder: 'Search...',
    searchIcon: 'search',
    clearIcon: 'clear'
});

const emit = defineEmits<Emits>();

const searchValue = ref(props.modelValue);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    searchValue.value = newValue;
});

const updateSearch = (value: string | number | null) => {
    const stringValue = value?.toString() || '';
    searchValue.value = stringValue;
    emit('update:modelValue', stringValue);
    emit('search', stringValue);
};

const clearSearch = () => {
    searchValue.value = '';
    emit('update:modelValue', '');
    emit('clear');
};
</script>

<style lang="scss" scoped>
// Search component specific styles can go here</style>
