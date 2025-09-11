<template>
  <div class="location-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="location_on" class="q-mr-sm" />
      {{ $t('content.features.location.label') }}
    </div>

    <div class="q-gutter-md">
      <!-- Location Name (Optional) -->
      <q-input
        v-model="localLocationFeature.name"
        :label="$t('content.features.location.name')"
        :hint="$t('content.features.location.nameHint')"
        filled
        maxlength="100"
        counter
      />

      <!-- Address (Required) -->
      <q-input
        v-model="localLocationFeature.address"
        :label="$t('content.features.location.address')"
        :hint="$t('content.features.location.addressHint')"
        filled
        :rules="[required]"
        maxlength="200"
        counter
      />

      <!-- Coordinate Input (Optional) -->
      <q-expansion-item
        :label="$t('content.features.location.coordinates')"
        icon="my_location"
        class="coordinate-expansion"
      >
        <div class="q-pa-md bg-grey-1">
          <div class="text-body2 q-mb-md">{{ $t('content.features.location.coordinatesHelp') }}</div>

          <div class="row q-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="latitude"
                :label="$t('content.features.location.latitude')"
                type="number"
                filled
                step="0.000001"
                :rules="[validateLatitude]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="longitude"
                :label="$t('content.features.location.longitude')"
                type="number"
                filled
                step="0.000001"
                :rules="[validateLongitude]"
              />
            </div>
          </div>

          <div class="q-mt-md">
            <q-btn
              :label="$t('content.features.location.getCurrentLocation')"
              color="primary"
              outline
              icon="my_location"
              @click="getCurrentLocation"
              :loading="loadingLocation"
              size="sm"
            />
          </div>
        </div>
      </q-expansion-item>

      <!-- Preview -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.preview') }}</div>
          <div class="text-body2">
            <q-icon name="location_on" class="q-mr-sm" />
            {{ formatLocationPreview() }}
          </div>
          <div v-if="hasCoordinates" class="text-caption text-grey-7 q-mt-sm">
            {{ $t('content.features.location.coordinatesDisplay', { lat: latitude, lng: longitude }) }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { GeoPoint } from 'firebase/firestore';
import { logger } from '../../../utils/logger';

interface LocationFeature {
  name?: string;
  address: string;
  geo?: GeoPoint;
}

interface Props {
  locationFeature?: LocationFeature;
}

interface Emits {
  (e: 'update:locationFeature', value: LocationFeature): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();

// Local state
const loadingLocation = ref(false);
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);

// Local location feature with defaults
const localLocationFeature = ref<LocationFeature>({
  name: '',
  address: '',
  ...(props.locationFeature || {})
});

// Computed
const required = (val: string) => !!val || t('forms.required');
const hasCoordinates = computed(() => latitude.value !== null && longitude.value !== null);

// Validation
const validateLatitude = (val: number | null) => {
  if (val === null || val === undefined) return true;
  return (val >= -90 && val <= 90) || t('features.location.invalidLatitude');
};

const validateLongitude = (val: number | null) => {
  if (val === null || val === undefined) return true;
  return (val >= -180 && val <= 180) || t('features.location.invalidLongitude');
};

// Methods
const formatLocationPreview = (): string => {
  if (!localLocationFeature.value.address) {
    return t('features.location.incompleteLocation');
  }

  let preview = '';
  if (localLocationFeature.value.name) {
    preview += localLocationFeature.value.name + ' - ';
  }
  preview += localLocationFeature.value.address;

  return preview;
};

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    $q.notify({
      type: 'negative',
      message: t('features.location.geolocationNotSupported')
    });
    return;
  }

  loadingLocation.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latitude.value = position.coords.latitude;
      longitude.value = position.coords.longitude;
      loadingLocation.value = false;

      $q.notify({
        type: 'positive',
        message: t('features.location.locationObtained')
      });

      logger.debug('Current location obtained', {
        lat: latitude.value,
        lng: longitude.value
      });
    },
    (error) => {
      loadingLocation.value = false;
      logger.error('Failed to get current location', error);

      $q.notify({
        type: 'negative',
        message: t('features.location.locationError')
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  );
};

const updateLocationFeature = () => {
  const updatedFeature: LocationFeature = {
    address: localLocationFeature.value.address
  };

  if (localLocationFeature.value.name) {
    updatedFeature.name = localLocationFeature.value.name;
  }

  if (hasCoordinates.value && latitude.value !== null && longitude.value !== null) {
    updatedFeature.geo = new GeoPoint(latitude.value, longitude.value);
  }

  if (updatedFeature.address) {
    emit('update:locationFeature', updatedFeature);
    logger.debug('Location feature updated', updatedFeature);
  }
};

// Watch for changes and emit updates
watch(
  [
    () => localLocationFeature.value.name,
    () => localLocationFeature.value.address,
    latitude,
    longitude
  ],
  updateLocationFeature,
  { deep: true }
);

// Initialize from prop
watch(
  () => props.locationFeature,
  (newFeature) => {
    if (newFeature) {
      localLocationFeature.value = { ...newFeature };
      if (newFeature.geo) {
        latitude.value = newFeature.geo.latitude;
        longitude.value = newFeature.geo.longitude;
      }
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.location-feature-form {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--q-grey-1);
}

.coordinate-expansion {
  border: 1px solid var(--q-grey-4);
  border-radius: 8px;
}
</style>
