<template>
    <div class="announcement-metadata-fields">
        <div class="row">
            <div class="col-12 col-md-6 q-pa-md">
                <q-select v-model="localMetadata.urgency" :options="urgencyOptions" option-value="value"
                    option-label="label" label="Urgency Level" outlined emit-value map-options
                    @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="expirationDateStr" label="Expiration Date (Optional)" outlined type="date"
                    @update:model-value="updateExpirationDate" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="localMetadata.contactPerson" label="Contact Person (Optional)" outlined
                    placeholder="Who to contact for questions" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6 q-pa-md">
                <q-toggle v-model="localMetadata.actionRequired" label="Action Required from Residents"
                    @update:model-value="updateMetadata" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 q-pa-md">
                <q-select v-model="localMetadata.affectedAreas" label="Affected Areas (Optional)" outlined multiple
                    use-chips use-input input-debounce="300" new-value-mode="add-unique" :options="areaOptions"
                    @update:model-value="updateMetadata">
                    <template v-slot:hint>
                        Select or type areas that this announcement affects
                    </template>
                </q-select>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AnnouncementMetadata } from '../../../types/core/content.types';

interface Props {
    modelValue: Partial<AnnouncementMetadata>;
    contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [metadata: Partial<AnnouncementMetadata>];
}>();

const localMetadata = ref<AnnouncementMetadata>({
    urgency: 'medium',
    actionRequired: false,
});

const expirationDateStr = ref('');

const urgencyOptions = [
    { value: 'low', label: 'Low - Informational' },
    { value: 'medium', label: 'Medium - Important' },
    { value: 'high', label: 'High - Urgent' },
    { value: 'urgent', label: 'Urgent - Immediate Action' },
];

const areaOptions = ref<string[]>([
    'All Residents',
    'Lake Shore',
    'Main Road',
    'Community Center',
    'Beach Area',
    'Boat Launch',
    'Walking Trails',
    'Private Roads',
    'Common Areas',
]);

onMounted(() => {
    if (props.modelValue) {
        localMetadata.value = {
            urgency: props.modelValue.urgency || 'medium',
            ...(props.modelValue.expirationDate && { expirationDate: props.modelValue.expirationDate }),
            ...(props.modelValue.affectedAreas && { affectedAreas: props.modelValue.affectedAreas }),
            ...(props.modelValue.contactPerson && { contactPerson: props.modelValue.contactPerson }),
            ...(props.modelValue.actionRequired !== undefined && { actionRequired: props.modelValue.actionRequired }),
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
