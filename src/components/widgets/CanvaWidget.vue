<template>
  <div class="canva-widget q-pa-sm bg-green-1 rounded-borders">
    <div class="row items-center justify-between">
      <div class="row items-center q-gutter-sm">
        <q-icon name="design_services" color="positive" size="sm" />
        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ $t('features.canva.label') }}
          </div>
          <div class="text-caption text-grey-7">
            {{ $t('features.canva.designId', { id: canvaFeature.designId }) }}
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
          :label="$t('features.canva.edit')"
          @click="openEditor"
          :aria-label="$t('accessibility.editCanvaDesign')"
        />

        <q-btn
          v-if="canvaFeature.exportUrl"
          dense
          outline
          color="positive"
          size="sm"
          icon="download"
          :label="$t('features.canva.export')"
          @click="downloadExport"
          :aria-label="$t('accessibility.downloadCanvaExport')"
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
