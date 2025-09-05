<template>
    <div class="event-metadata-fields">
        <div class="row">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="startDateStr" label="Start Date" outlined type="date"
                    :rules="[val => !!val || 'Start date is required']" @update:model-value="updateStartDate" />
            </div>
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="endDateStr" label="End Date (Optional)" outlined type="date"
                    @update:model-value="updateEndDate" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 col-md-8 q-pa-md">
                <q-input v-model="localMetadata.location" label="Location" outlined
                    placeholder="e.g., Community Center, Lake Shore, Online"
                    :rules="[val => !!val || 'Location is required']" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-4 q-pa-md">
                <q-toggle v-model="localMetadata.registrationRequired" label="Registration Required"
                    @update:model-value="updateMetadata" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="localMetadata.contactInfo" label="Contact Information (Optional)" outlined
                    placeholder="Email or phone for questions" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-3 q-pa-md" v-if="localMetadata.registrationRequired">
                <q-input v-model.number="localMetadata.maxAttendees" label="Max Attendees" outlined type="number"
                    min="1" placeholder="No limit" @update:model-value="updateMetadata" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { EventMetadata } from '../../../types/core/content.types';

interface Props {
    modelValue: Partial<EventMetadata>;
    contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [metadata: Partial<EventMetadata>];
}>();

const localMetadata = ref<EventMetadata>({
    startDate: Date.now(),
    location: '',
    registrationRequired: false,
    contactInfo: '',
});

// Date string representations for inputs
const startDateStr = ref('');
const endDateStr = ref('');

onMounted(() => {
    // Initialize with existing values if any
    if (props.modelValue) {
        localMetadata.value = {
            startDate: props.modelValue.startDate || Date.now(),
            location: props.modelValue.location || '',
            registrationRequired: props.modelValue.registrationRequired || false,
            ...(props.modelValue.endDate && { endDate: props.modelValue.endDate }),
            ...(props.modelValue.contactInfo && { contactInfo: props.modelValue.contactInfo }),
            ...(props.modelValue.maxAttendees !== undefined && { maxAttendees: props.modelValue.maxAttendees }),
            ...(props.modelValue.currentAttendees !== undefined && { currentAttendees: props.modelValue.currentAttendees }),
        };

        // Convert timestamps to date strings
        startDateStr.value = timestampToDateString(localMetadata.value.startDate);
        if (localMetadata.value.endDate) {
            endDateStr.value = timestampToDateString(localMetadata.value.endDate);
        }
    } else {
        // Set default start date to today
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        startDateStr.value = todayStr || '';
        localMetadata.value.startDate = today.getTime();
    }
});

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        localMetadata.value = {
            startDate: newValue.startDate || Date.now(),
            location: newValue.location || '',
            registrationRequired: newValue.registrationRequired || false,
            ...(newValue.endDate && { endDate: newValue.endDate }),
            ...(newValue.contactInfo && { contactInfo: newValue.contactInfo }),
            ...(newValue.maxAttendees !== undefined && { maxAttendees: newValue.maxAttendees }),
            ...(newValue.currentAttendees !== undefined && { currentAttendees: newValue.currentAttendees }),
        };

        startDateStr.value = timestampToDateString(localMetadata.value.startDate);
        if (localMetadata.value.endDate) {
            endDateStr.value = timestampToDateString(localMetadata.value.endDate);
        }
    }
}, { deep: true });

function timestampToDateString(timestamp: number): string {
    const dateStr = new Date(timestamp).toISOString().split('T')[0];
    return dateStr || '';
}

function dateStringToTimestamp(dateStr: string): number {
    return new Date(dateStr).getTime();
}

function updateStartDate(value: string | number | null) {
    const dateStr = String(value || '');
    if (dateStr) {
        localMetadata.value.startDate = dateStringToTimestamp(dateStr);
        updateMetadata();
    }
}

function updateEndDate(value: string | number | null) {
    const dateStr = String(value || '');
    if (dateStr) {
        localMetadata.value.endDate = dateStringToTimestamp(dateStr);
    } else {
        delete localMetadata.value.endDate;
    }
    updateMetadata();
}

function updateMetadata() {
    emit('update:modelValue', { ...localMetadata.value });
}
</script>

<style scoped>
.event-metadata-fields {
    width: 100%;
}
</style>
