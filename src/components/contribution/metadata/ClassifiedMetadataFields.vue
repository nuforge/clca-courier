<template>
    <div class="classified-metadata-fields">
        <div class="row">
            <div class="col-12 col-md-4 q-pa-md">
                <q-input v-model.number="localMetadata.price" label="Price (Optional)" outlined type="number" min="0"
                    prefix="$" placeholder="0" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-4 q-pa-md">
                <q-select v-model="localMetadata.category" :options="categoryOptions" option-value="value"
                    option-label="label" label="Category" outlined emit-value map-options
                    @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-4 q-pa-md">
                <q-select v-model="localMetadata.contactMethod" :options="contactOptions" option-value="value"
                    option-label="label" label="Contact Method" outlined emit-value map-options
                    @update:model-value="updateMetadata" />
            </div>
        </div>

        <div class="row q-mt-md" v-if="showCondition">
            <div class="col-12 col-md-6 q-pa-md">
                <q-select v-model="localMetadata.condition" :options="conditionOptions" option-value="value"
                    option-label="label" label="Condition (Optional)" outlined emit-value map-options
                    @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6">
                <q-input v-model="expirationDateStr" label="Expiration Date (Optional)" outlined type="date"
                    @update:model-value="updateExpirationDate" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ClassifiedMetadata } from '../../../types/core/content.types';

interface Props {
    modelValue: Partial<ClassifiedMetadata>;
    contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [metadata: Partial<ClassifiedMetadata>];
}>();

const localMetadata = ref<ClassifiedMetadata>({
    category: 'for_sale',
    contactMethod: 'email',
});

const expirationDateStr = ref('');

const categoryOptions = [
    { value: 'for_sale', label: 'For Sale' },
    { value: 'wanted', label: 'Wanted' },
    { value: 'services', label: 'Services' },
    { value: 'housing', label: 'Housing' },
];

const contactOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'both', label: 'Email & Phone' },
];

const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
];

const showCondition = computed(() => {
    return localMetadata.value.category === 'for_sale';
});

onMounted(() => {
    if (props.modelValue) {
        localMetadata.value = {
            category: props.modelValue.category || 'for_sale',
            contactMethod: props.modelValue.contactMethod || 'email',
            ...(props.modelValue.price !== undefined && { price: props.modelValue.price }),
            ...(props.modelValue.condition && { condition: props.modelValue.condition }),
            ...(props.modelValue.location && { location: props.modelValue.location }),
            ...(props.modelValue.expirationDate && { expirationDate: props.modelValue.expirationDate }),
        };

        if (localMetadata.value.expirationDate) {
            const dateStr = new Date(localMetadata.value.expirationDate).toISOString().split('T')[0];
            expirationDateStr.value = dateStr || '';
        }
    }
});

function updateExpirationDate(value: string | number | null) {
    const dateStr = String(value || '');
    if (dateStr) {
        localMetadata.value.expirationDate = new Date(dateStr).getTime();
    } else {
        delete localMetadata.value.expirationDate;
    }
    updateMetadata();
}

function updateMetadata() {
    emit('update:modelValue', { ...localMetadata.value });
}
</script>
