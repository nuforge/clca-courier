<!--
  ContentDetailDialog Component
  Reusable dialog for displaying content details
  Used throughout the site for content preview and management
-->
<template>
  <q-dialog v-model="showDialog" position="right" full-height>
    <q-card style="width: 600px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ content?.title }}</div>
        <q-space />
        <q-btn :icon="UI_ICONS.close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="content">
        <!-- Status and Type Badges -->
        <div class="q-mb-md">
          <q-badge :color="getStatusIcon(content.status).color" :label="content.status.toUpperCase()" />
          <q-badge
            color="grey"
            :label="contentUtils.getContentType(content)?.toUpperCase() || 'UNKNOWN'"
            class="q-ml-sm"
          />
          <q-badge
            v-if="contentUtils.hasTag(content, 'featured')"
            color="orange"
            label="FEATURED"
            class="q-ml-sm"
          />
        </div>

        <!-- Basic Information -->
        <div class="text-body2 q-mb-md">
          <strong>{{ t(TRANSLATION_KEYS.FORMS.AUTHOR) || 'Author' }}:</strong> {{ content.authorName }}<br>
          <strong>{{ t(TRANSLATION_KEYS.CONTENT.SUBMITTED) || 'Created' }}:</strong> {{ formatDateTime(content.timestamps.created, 'LONG_WITH_TIME') }}<br>
          <strong>{{ t(TRANSLATION_KEYS.FORMS.TAGS) }}:</strong>
          <TagDisplay :tags="content.tags" :max-display="5" :show-more="true" />
        </div>

        <q-separator class="q-my-md" />

        <!-- Content Description -->
        <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.FORMS.CONTENT) }}</div>
        <div class="text-body1 q-mb-md" style="white-space: pre-line;">{{ content.description }}</div>

        <!-- Content Features Section -->
        <div v-if="Object.keys(content.features).length > 0">
          <q-separator class="q-my-md" />
          <div class="text-h6 q-mb-sm">Content Features</div>

          <!-- Date Feature -->
          <div v-if="contentUtils.hasFeature(content, 'feat:date')" class="q-mb-md">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-body2">
                  <strong>Event Date:</strong> {{ formatDateTime(content.features['feat:date']?.start, 'LONG_WITH_TIME') }}
                  <span v-if="content.features['feat:date']?.end">
                    - {{ formatDateTime(content.features['feat:date']?.end, 'LONG_WITH_TIME') }}
                  </span>
                  <span v-if="content.features['feat:date']?.isAllDay" class="text-caption"> (All Day)</span>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Location Feature -->
          <div v-if="contentUtils.hasFeature(content, 'feat:location')" class="q-mb-md">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-body2">
                  <strong>Location:</strong> {{ content.features['feat:location']?.name || 'Unknown' }}
                  <div class="text-caption">{{ content.features['feat:location']?.address }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Task Feature -->
          <div v-if="contentUtils.hasFeature(content, 'feat:task')" class="q-mb-md">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-body2">
                  <strong>Task:</strong> {{ content.features['feat:task']?.category }} -
                  {{ content.features['feat:task']?.qty }} {{ content.features['feat:task']?.unit }}
                  <div class="text-caption">Status: {{ content.features['feat:task']?.status }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Canva Feature -->
          <div v-if="contentUtils.hasFeature(content, 'integ:canva')" class="q-mb-md">
            <q-card flat bordered>
              <q-card-section>
                <div class="row items-center q-gutter-md">
                  <div class="col">
                    <div class="text-body2">
                      <strong>Canva Design:</strong> {{ content.features['integ:canva']?.designId }}
                    </div>
                    <div v-if="content.features['integ:canva']?.exportUrl" class="text-caption">
                      Export Ready: Yes
                    </div>
                  </div>
                  <div class="col-auto">
                    <div class="row q-gutter-xs">
                      <!-- Edit in Canva -->
                      <q-btn
                        v-if="content.features['integ:canva']?.editUrl"
                        flat
                        round
                        icon="edit"
                        color="primary"
                        @click="openCanvaDesign(content.features['integ:canva']?.editUrl || '')"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.EDIT_IN_CANVA) }}</q-tooltip>
                      </q-btn>

                      <!-- Export for Print -->
                      <q-btn
                        flat
                        round
                        icon="print"
                        color="purple"
                        @click="$emit('export-for-print', content)"
                        :loading="isExporting?.(content.id)"
                        :disable="isExporting?.(content.id)"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.EXPORT_FOR_PRINT) }}</q-tooltip>
                      </q-btn>

                      <!-- Download Design -->
                      <q-btn
                        v-if="content.features['integ:canva']?.exportUrl"
                        flat
                        round
                        icon="download"
                        color="green"
                        @click="$emit('download-design', content.features['integ:canva']?.exportUrl || '', `design-${content.features['integ:canva']?.designId}.pdf`)"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.DOWNLOAD_DESIGN) }}</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Action Buttons -->
      <q-card-actions align="right" v-if="showActions">
        <!-- Draft Actions -->
        <template v-if="content?.status === 'draft'">
          <q-btn
            flat
            :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.ARCHIVE)"
            color="negative"
            @click="$emit('archive', content)"
          />
          <q-btn
            :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.PUBLISH)"
            color="positive"
            @click="$emit('publish', content.id)"
          />
        </template>

        <!-- Published Actions -->
        <template v-if="content?.status === 'published'">
          <q-toggle
            :model-value="contentUtils.hasTag(content, 'featured')"
            @update:model-value="(value: boolean) => content && $emit('toggle-featured', content.id, value)"
            color="orange"
            :label="t(TRANSLATION_KEYS.FORMS.FEATURED)"
          />
          <q-space />
          <q-btn
            flat
            :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.UNPUBLISH)"
            color="orange"
            @click="$emit('unpublish', content.id)"
          />
          <q-btn
            flat
            :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.ARCHIVE)"
            color="negative"
            @click="$emit('archive', content)"
          />
        </template>

        <!-- Archived/Rejected/Deleted Actions -->
        <template v-if="['archived', 'rejected', 'deleted'].includes(content?.status || '')">
          <q-btn
            :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.RESTORE)"
            color="positive"
            @click="content && $emit('restore', content.id)"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContentDoc } from '../../types/core/content.types';
import { contentUtils } from '../../types/core/content.types';
import { formatDateTime } from '../../utils/date-formatter';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { UI_ICONS } from '../../constants/ui-icons';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';
import TagDisplay from '../common/TagDisplay.vue';

interface Props {
  content: ContentDoc | null;
  showDialog: boolean;
  showActions?: boolean;
  isExporting?: (contentId: string) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  isExporting: () => false
});

const emit = defineEmits<{
  'update:showDialog': [value: boolean];
  'publish': [contentId: string];
  'unpublish': [contentId: string];
  'archive': [content: ContentDoc];
  'restore': [contentId: string];
  'toggle-featured': [contentId: string, featured: boolean];
  'export-for-print': [content: ContentDoc];
  'download-design': [exportUrl: string, filename: string];
}>();

const { t } = useI18n();
const { getStatusIcon } = useSiteTheme();

// Computed property for v-model
const showDialog = computed({
  get: () => props.showDialog,
  set: (value: boolean) => emit('update:showDialog', value)
});

// Methods
const openCanvaDesign = (editUrl: string) => {
  window.open(editUrl, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
.q-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
</style>
