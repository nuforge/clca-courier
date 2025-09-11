<template>
  <div class="location-widget q-pa-sm bg-purple-1 rounded-borders">
    <div class="row items-center q-gutter-sm">
      <q-icon name="place" color="secondary" size="sm" />
      <div class="col">
        <div v-if="locationFeature.name" class="text-body2 text-weight-medium">
          {{ locationFeature.name }}
        </div>
        <div class="text-caption text-grey-7">
          {{ locationFeature.address }}
        </div>
        <div v-if="locationFeature.geo" class="text-caption text-grey-6">
          {{ $t('features.location.coordinates', {
            lat: locationFeature.geo.latitude.toFixed(4),
            lng: locationFeature.geo.longitude.toFixed(4)
          }) }}
        </div>
      </div>

      <q-btn
        v-if="locationFeature.geo"
        flat
        round
        dense
        icon="map"
        color="secondary"
        size="sm"
        @click="openMap"
        :aria-label="$t('accessibility.openMap')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { logger } from '../../utils/logger';
import type { ContentFeatures } from '../../types/core/content.types';

interface Props {
  locationFeature: NonNullable<ContentFeatures['feat:location']>;
}

const props = defineProps<Props>();

const openMap = () => {
  if (props.locationFeature.geo) {
    const { latitude, longitude } = props.locationFeature.geo;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
    logger.debug('Map opened for location', {
      address: props.locationFeature.address,
      coordinates: { latitude, longitude }
    });
  }
};
</script>

<style lang="scss" scoped>
.location-widget {
  border-left: 3px solid var(--q-secondary);
}
</style>
