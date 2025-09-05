<template>
    <div class="project-metadata-fields">
        <div class="row">
            <div class="col-12 col-md-6 q-pa-md">
                <q-select v-model="localMetadata.projectStatus" :options="statusOptions" option-value="value"
                    option-label="label" label="Project Status" outlined emit-value map-options
                    @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model.number="localMetadata.progressPercentage" label="Progress Percentage" outlined
                    type="number" min="0" max="100" suffix="%" @update:model-value="updateMetadata" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model.number="localMetadata.budget" label="Budget (Optional)" outlined type="number" min="0"
                    prefix="$" placeholder="0" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6">
                <q-input v-model="completionDateStr" label="Target Completion Date (Optional)" outlined type="date"
                    @update:model-value="updateCompletionDate" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ProjectMetadata } from '../../../types/core/content.types';

interface Props {
    modelValue: Partial<ProjectMetadata>;
    contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [metadata: Partial<ProjectMetadata>];
}>();

const localMetadata = ref<ProjectMetadata>({
    projectStatus: 'planning',
    progressPercentage: 0,
});

const completionDateStr = ref('');

const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
];

onMounted(() => {
    if (props.modelValue) {
        localMetadata.value = {
            projectStatus: props.modelValue.projectStatus || 'planning',
            ...(props.modelValue.progressPercentage !== undefined && { progressPercentage: props.modelValue.progressPercentage }),
            ...(props.modelValue.budget !== undefined && { budget: props.modelValue.budget }),
            ...(props.modelValue.completionDate && { completionDate: props.modelValue.completionDate }),
            ...(props.modelValue.startDate && { startDate: props.modelValue.startDate }),
            ...(props.modelValue.involvedResidents && { involvedResidents: props.modelValue.involvedResidents }),
        };

        if (localMetadata.value.completionDate) {
            const dateStr = new Date(localMetadata.value.completionDate).toISOString().split('T')[0];
            completionDateStr.value = dateStr || '';
        }
    }
});

function updateCompletionDate(value: string | number | null) {
    const dateStr = String(value || '');
    if (dateStr) {
        localMetadata.value.completionDate = new Date(dateStr).getTime();
    } else {
        delete localMetadata.value.completionDate;
    }
    updateMetadata();
}

function updateMetadata() {
    emit('update:modelValue', { ...localMetadata.value });
}
</script>
