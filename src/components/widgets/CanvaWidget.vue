<template>
  <div class="canva-widget q-pa-sm bg-green-1 rounded-borders">
    <div class="row items-center justify-between">
      <div class="row items-center q-gutter-sm">
        <q-icon name="design_services" color="positive" size="sm" />
        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ $t('content.features.canva.label') }}
          </div>
          <div class="text-caption text-grey-7">
            {{ $t('content.features.canva.previewFormat', { designId: canvaFeature.designId }) }}
          </div>
        </div>
      </div>

      <div class="row q-gutter-xs">
        <q-btn
          dense
          outline
          color="positive"
          size="sm"
          icon="edit"
          :label="$t('content.features.canva.editInCanva')"
          @click="openEditor"
          :aria-label="$t('common.accessibility.editCanvaDesign')"
        />

        <q-btn
          v-if="canvaFeature.exportUrl"
          dense
          outline
          color="positive"
          size="sm"
          icon="download"
          :label="$t('content.features.canva.openExport')"
          @click="downloadExport"
          :aria-label="$t('common.accessibility.downloadCanvaExport')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logger } from '../../utils/logger';
import type { ContentFeatures } from '../../types/core/content.types';

interface Props {
  canvaFeature: NonNullable<ContentFeatures['integ:canva']>;
}

const props = defineProps<Props>();

const openEditor = () => {
  window.open(props.canvaFeature.editUrl, '_blank');
  logger.debug('Canva editor opened', { designId: props.canvaFeature.designId });
};

const downloadExport = () => {
  if (props.canvaFeature.exportUrl) {
    window.open(props.canvaFeature.exportUrl, '_blank');
    logger.debug('Canva export downloaded', { designId: props.canvaFeature.designId });
  }
};
</script>

<style lang="scss" scoped>
.canva-widget {
  border-left: 3px solid var(--q-positive);
}
</style>
