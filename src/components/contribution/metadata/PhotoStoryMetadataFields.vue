<template>
    <div class="photo-story-metadata-fields">
        <div class="row">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="localMetadata.photographerName" label="Photographer Name (Optional)" outlined
                    placeholder="Who took these photos?" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="photographyDateStr" label="Photography Date (Optional)" outlined type="date"
                    @update:model-value="updatePhotographyDate" />
            </div>
        </div>

        <div class="row q-mt-md">
            <div class="col-12 col-md-6 q-pa-md">
                <q-input v-model="localMetadata.location" label="Location (Optional)" outlined
                    placeholder="Where were these photos taken?" @update:model-value="updateMetadata" />
            </div>
            <div class="col-12 col-md-6">
                <q-input v-model="localMetadata.cameraInfo" label="Camera Information (Optional)" outlined
                    placeholder="Camera model, settings, etc." @update:model-value="updateMetadata" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { PhotoStoryMetadata } from '../../../types/core/content.types';

interface Props {
    modelValue: Partial<PhotoStoryMetadata>;
    contentType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [metadata: Partial<PhotoStoryMetadata>];
}>();

const localMetadata = ref<PhotoStoryMetadata>({
    photographerName: '',
    location: '',
});

const photographyDateStr = ref('');

onMounted(() => {
    if (props.modelValue) {
        localMetadata.value = {
            ...(props.modelValue.photographerName && { photographerName: props.modelValue.photographerName }),
            ...(props.modelValue.photographyDate && { photographyDate: props.modelValue.photographyDate }),
            ...(props.modelValue.location && { location: props.modelValue.location }),
            ...(props.modelValue.cameraInfo && { cameraInfo: props.modelValue.cameraInfo }),
            ...(props.modelValue.story && { story: props.modelValue.story }),
        };

        if (localMetadata.value.photographyDate) {
            const dateStr = new Date(localMetadata.value.photographyDate).toISOString().split('T')[0];
            photographyDateStr.value = dateStr || '';
        }
    }
});

function updatePhotographyDate(value: string | number | null) {
    const dateStr = String(value || '');
    if (dateStr) {
        localMetadata.value.photographyDate = new Date(dateStr).getTime();
    } else {
        delete localMetadata.value.photographyDate;
    }
    updateMetadata();
}

function updateMetadata() {
    emit('update:modelValue', { ...localMetadata.value });
}
</script>
