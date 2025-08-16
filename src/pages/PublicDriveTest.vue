<template>
  <q-page padding>
    <div class="q-pa-md">
      <h4>Public Google Drive Test</h4>
      <p>Testing direct access to public Google Drive folder - NO OAUTH!</p>
      <p><strong>Testing Folder:</strong> {{ folderId }}</p>
      <p><strong>Folder URL:</strong> <a :href="folderUrl" target="_blank">{{ folderUrl }}</a></p>

      <q-btn @click="testPublicAccess" color="primary" label="Test Public Access" :loading="loading" />

      <div v-if="error" class="q-mt-md">
        <q-banner class="bg-negative text-white">
          <strong>Error:</strong> {{ error }}
        </q-banner>
      </div>

      <div v-if="files.length > 0" class="q-mt-md">
        <h5>Found {{ files.length }} files:</h5>
        <q-list>
          <q-item v-for="file in files" :key="file.id">
            <q-item-section>
              <q-item-label>{{ file.name }}</q-item-label>
              <q-item-label caption>{{ file.size }} bytes</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn size="sm" color="primary" label="View" :href="file.webViewLink" target="_blank" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGoogleDrivePublic } from '../composables/useGoogleDrivePublic';

const { files, loading, error, loadPublicFiles } = useGoogleDrivePublic();

const folderId = ref(import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID);
const folderUrl = computed(() => `https://drive.google.com/drive/folders/${folderId.value}`);

async function testPublicAccess() {
  await loadPublicFiles();
}
</script>
