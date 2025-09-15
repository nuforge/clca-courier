<!--
  Create Issue Dialog
  Component for creating new newsletter issues
-->
<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Create New Newsletter Issue</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="createIssue" class="q-gutter-md">
          <q-input
            v-model="newIssue.title"
            label="Issue Title"
            hint="e.g., 'Summer 2025 Newsletter'"
            :rules="[val => !!val || 'Title is required']"
            filled
          />

          <q-input
            v-model="newIssue.issueNumber"
            label="Issue Number"
            hint="e.g., '2025-03' or 'Summer-2025'"
            :rules="[val => !!val || 'Issue number is required']"
            filled
          />

          <q-input
            v-model="newIssue.publicationDate"
            type="date"
            label="Publication Date"
            :rules="[val => !!val || 'Publication date is required']"
            filled
          />

          <div class="row q-gutter-sm">
            <q-btn
              label="Cancel"
              color="grey"
              flat
              v-close-popup
            />
            <q-btn
              label="Create Issue"
              color="primary"
              type="submit"
              :loading="isCreating"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { newsletterGenerationService } from '../../services/newsletter-generation.service';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'issue-created'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const isCreating = ref(false);
const newIssue = ref({
  title: '',
  issueNumber: '',
  publicationDate: ''
});

const createIssue = async () => {
  if (!newIssue.value.title || !newIssue.value.issueNumber || !newIssue.value.publicationDate) {
    return;
  }

  isCreating.value = true;
  try {
    await newsletterGenerationService.createIssue(
      newIssue.value.title,
      newIssue.value.issueNumber,
      new Date(newIssue.value.publicationDate)
    );

    $q.notify({
      type: 'positive',
      message: 'Newsletter issue created successfully!'
    });

    // Reset form and close dialog
    newIssue.value = { title: '', issueNumber: '', publicationDate: '' };
    showDialog.value = false;

    emit('issue-created');
  } catch (error) {
    logger.error('Failed to create newsletter issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create newsletter issue'
    });
  } finally {
    isCreating.value = false;
  }
};
</script>
