<script setup lang="ts">
import { onMounted } from 'vue';


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


});
</script>
<template>
  <router-view />
</template>
