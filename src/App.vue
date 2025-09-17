<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useContentManagement } from './composables/useContentManagement';

const contentManagement = useContentManagement();

// Properly type the window object extensions without using 'any'
interface WindowWithDebugFunctions extends Window {
  debugDataFlow: () => void;
  testSyncWorkflow: (filename: string) => void;
  loadNewsletters: () => Promise<void>;
  uploadNewsletterToFirebase: (filename: string) => Promise<void>;
  downloadNewsletterFromFirebase: (filename: string) => Promise<void>;
  syncNewsletterMetadata: (filename: string, direction?: 'upload' | 'download' | 'auto') => Promise<void>;
  inspectLocalStorage: () => void;
  inspectDrafts: () => Array<unknown> | undefined;
  debugCalendarEvents: () => void;
}

onMounted(() => {
  // Prevent unwanted scrolling on tablet devices
  const preventOverscroll = (e: TouchEvent) => {
    // Allow scrolling within content areas
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.q-page, .q-card, .q-dialog, .q-drawer, .q-scroll-area');

    if (!scrollableParent) {
      // Prevent overscroll on body/html
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch) {
          const startY = touch.clientY;

          const handleTouchMove = (moveEvent: Event) => {
            const touchEvent = moveEvent as TouchEvent;
            if (touchEvent.touches.length === 1) {
              const currentTouch = touchEvent.touches[0];
              if (currentTouch) {
                const currentY = currentTouch.clientY;
                const deltaY = currentY - startY;

                // Prevent overscroll bounce
                if (
                  (window.scrollY <= 0 && deltaY > 0) || // At top, trying to scroll up
                  (window.scrollY >= document.documentElement.scrollHeight - window.innerHeight && deltaY < 0) // At bottom, trying to scroll down
                ) {
                  touchEvent.preventDefault();
                }
              }
            }
          };

          const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
          };

          document.addEventListener('touchmove', handleTouchMove, { passive: false });
          document.addEventListener('touchend', handleTouchEnd);
        }
      }
    }
  };

  // Add touch event listeners for overscroll prevention
  document.addEventListener('touchstart', preventOverscroll, { passive: true });

  // Prevent zoom on double-tap for iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  const windowWithDebug = window as unknown as WindowWithDebugFunctions;

  // Make functions globally available for debugging
  windowWithDebug.debugDataFlow = contentManagement.debugDataFlow;
  windowWithDebug.testSyncWorkflow = contentManagement.testSyncWorkflow;
  windowWithDebug.loadNewsletters = contentManagement.loadNewsletters;
  windowWithDebug.uploadNewsletterToFirebase = contentManagement.uploadNewsletterToFirebase;
  windowWithDebug.downloadNewsletterFromFirebase = contentManagement.downloadNewsletterFromFirebase;
  windowWithDebug.syncNewsletterMetadata = contentManagement.syncNewsletterMetadata;
  windowWithDebug.inspectLocalStorage = function () {
    console.log('📊 LocalStorage inspection:');
    console.log('Total items:', localStorage.length);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value ? value.substring(0, 100) + '...' : value);
      }
    }
  };
  windowWithDebug.inspectDrafts = function () {
    console.log('=== NEWSLETTER DRAFTS INSPECTION ===');
    const draftsData = localStorage.getItem('newsletter-drafts');
    if (draftsData) {
      try {
        const drafts = JSON.parse(draftsData) as Array<unknown>;
        console.log(`Found ${drafts.length} drafts in localStorage:`);
        drafts.forEach((draft: unknown, index: number) => {
          const d = draft as Record<string, unknown>;
          console.log(`Draft ${index + 1}:`, {
            id: d.id,
            filename: d.filename,
            title: d.title,
            hasEnhancedData: !!(d.displayDate || d.month || d.wordCount),
            downloadUrl: d.downloadUrl?.toString().substring(0, 50) + '...',
          });
        });
        return drafts;
      } catch (error) {
        console.error('Failed to parse newsletter-drafts:', error);
      }
    } else {
      console.log('No newsletter-drafts found in localStorage');
    }
    return undefined;
  };

  // Add calendar debugging function
  windowWithDebug.debugCalendarEvents = () => {
    console.log('🔍 DEBUG: Calendar events debugging not available in new architecture');
    console.log('Use the calendar page to view events or check Firebase directly');
  };

  console.log('🧪 ENHANCED SYNC DEBUG FUNCTIONS AVAILABLE:');
  console.log('📊 Data Analysis:');
  console.log('  - debugDataFlow(): Show data source counts and file matching status');
  console.log('  - inspectLocalStorage(): Show localStorage contents');
  console.log('  - inspectDrafts(): Show draft data structure');
  console.log('  - debugCalendarEvents(): Show all calendar events in Firebase');
  console.log('');
  console.log('🔄 Data Management:');
  console.log('  - loadNewsletters(): Reload all newsletter data');
  console.log('');
  console.log('🚀 Sync Operations:');
  console.log('  - testSyncWorkflow(filename): Test sync actions for a specific file');
  console.log('  - uploadNewsletterToFirebase(filename): Upload local file to Firebase');
  console.log('  - downloadNewsletterFromFirebase(filename): Download Firebase file locally');
  console.log('  - syncNewsletterMetadata(filename, direction): Sync metadata (auto/upload/download)');
  console.log('');
  console.log('💡 Example: testSyncWorkflow("2015.summer-conashaugh-courier.pdf")');
});
</script>
