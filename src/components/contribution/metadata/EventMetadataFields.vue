<template>
    <div class="event-metadata-fields">
        <!-- Calendar Integration Section -->
        <q-card flat bordered class="q-mb-md">
            <q-card-section>
                <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-calendar-plus" class="q-mr-sm" />
                    Calendar Settings
                </div>

                <div class="row q-gutter-md">
                    <!-- Show on Calendar Toggle -->
                    <div class="col-12">
                        <q-toggle
                            v-model="localMetadata.onCalendar"
                            label="Show this event on the community calendar"
                            color="primary"
                            @update:model-value="updateMetadata"
                        />
                        <div class="text-caption text-grey-6 q-mt-xs">
                            When enabled, this event will appear on the community calendar page
                        </div>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Event Date & Time Section -->
        <q-card flat bordered class="q-mb-md">
            <q-card-section>
                <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-clock-outline" class="q-mr-sm" />
                    Date & Time
                </div>

                <div class="row q-gutter-md">
                    <!-- Event Date -->
                    <div class="col-12 col-md-6">
                        <q-input
                            v-model="startDateStr"
                            label="Event Date"
                            type="date"
                            outlined
                            :rules="[val => !!val || 'Event date is required']"
                            @update:model-value="updateStartDate"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-calendar" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Event End Date (Optional) -->
                    <div class="col-12 col-md-6">
                        <q-input
                            v-model="endDateStr"
                            label="End Date (Optional)"
                            type="date"
                            outlined
                            :min="startDateStr"
                            @update:model-value="updateEndDate"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-calendar-end" />
                            </template>
                            <template v-slot:hint>
                                Leave blank for single-day events
                            </template>
                        </q-input>
                    </div>

                    <!-- All Day Toggle -->
                    <div class="col-12">
                        <q-toggle
                            v-model="localMetadata.allDay"
                            label="All-day event"
                            color="primary"
                            @update:model-value="updateMetadata"
                        />
                    </div>

                    <!-- Event Start Time -->
                    <div class="col-12 col-md-6" v-if="!localMetadata.allDay">
                        <q-input
                            v-model="localMetadata.eventTime"
                            label="Start Time"
                            type="time"
                            outlined
                            @update:model-value="updateMetadata"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-clock-start" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Event End Time -->
                    <div class="col-12 col-md-6" v-if="!localMetadata.allDay">
                        <q-input
                            v-model="localMetadata.eventEndTime"
                            label="End Time (Optional)"
                            type="time"
                            outlined
                            @update:model-value="updateMetadata"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-clock-end" />
                            </template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Location Section -->
        <q-card flat bordered class="q-mb-md">
            <q-card-section>
                <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-map-marker" class="q-mr-sm" />
                    Location
                </div>

                <div class="row q-gutter-md">
                    <div class="col-12">
                        <q-input
                            v-model="localMetadata.location"
                            label="Event Location"
                            outlined
                            placeholder="e.g., Community Center, Lake House, 123 Main Street"
                            :rules="[val => !!val || 'Location is required']"
                            @update:model-value="updateMetadata"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-map-marker-outline" />
                            </template>
                            <template v-slot:hint>
                                Provide a specific location to help attendees find the event
                            </template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Event Details Section -->
        <q-card flat bordered>
            <q-card-section>
                <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-information" class="q-mr-sm" />
                    Event Details
                </div>

                <div class="row q-gutter-md">
                    <!-- Registration Required -->
                    <div class="col-12 col-md-6">
                        <q-toggle
                            v-model="localMetadata.registrationRequired"
                            label="Registration Required"
                            color="primary"
                            @update:model-value="updateMetadata"
                        />
                    </div>

                    <!-- Contact Info -->
                    <div class="col-12">
                        <q-input
                            v-model="localMetadata.contactInfo"
                            label="Contact Information"
                            outlined
                            placeholder="Email, phone, or contact person for questions"
                            @update:model-value="updateMetadata"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-account-circle" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Max Attendees -->
                    <div class="col-12 col-md-6" v-if="localMetadata.registrationRequired">
                        <q-input
                            v-model.number="localMetadata.maxAttendees"
                            label="Maximum Attendees"
                            type="number"
                            outlined
                            min="1"
                            placeholder="No limit"
                            @update:model-value="updateMetadata"
                        >
                            <template v-slot:prepend>
                                <q-icon name="mdi-account-group" />
                            </template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>
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

const localMetadata = ref<EventMetadata & {
    onCalendar?: boolean;
    eventTime?: string;
    eventEndTime?: string;
    allDay?: boolean;
}>({
    startDate: Date.now(),
    location: '',
    registrationRequired: false,
    contactInfo: '',
    onCalendar: false,
    allDay: false,
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
            onCalendar: props.modelValue.onCalendar || false,
            allDay: props.modelValue.allDay || false,
            ...(props.modelValue.endDate && { endDate: props.modelValue.endDate }),
            ...(props.modelValue.contactInfo && { contactInfo: props.modelValue.contactInfo }),
            ...(props.modelValue.maxAttendees !== undefined && { maxAttendees: props.modelValue.maxAttendees }),
            ...(props.modelValue.currentAttendees !== undefined && { currentAttendees: props.modelValue.currentAttendees }),
            ...(props.modelValue.eventRecurrence && { eventRecurrence: props.modelValue.eventRecurrence }),
        };

        // Handle optional time fields
        if (props.modelValue.eventTime !== undefined) {
            localMetadata.value.eventTime = props.modelValue.eventTime;
        }
        if (props.modelValue.eventEndTime !== undefined) {
            localMetadata.value.eventEndTime = props.modelValue.eventEndTime;
        }

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
