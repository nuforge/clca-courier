import { ref, computed } from 'vue';
import WebViewer from '@pdftron/webviewer';

interface ThumbnailCache {
  [url: string]: string; // base64 image data
}

const thumbnailCache = ref<ThumbnailCache>({});

export function usePdfThumbnails() {
  const loadThumbnailFromCache = (url: string): string | null => {
    // Check localStorage first
    const cached = localStorage.getItem(`pdf-thumb-${url}`);
    if (cached) {
      thumbnailCache.value[url] = cached;
      return cached;
    }
    return thumbnailCache.value[url] || null;
  };

  const generateThumbnail = async (url: string): Promise<string | null> => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '300px';
      container.style.height = '400px';
      document.body.appendChild(container);

      const instance = await WebViewer(
        {
          path: '/webviewer',
          initialDoc: url,
          disabledElements: [
            'header',
            'toolsHeader',
            'searchPanel',
            'leftPanel',
            'leftPanelButton',
            'viewControlsButton',
            'selectToolButton',
            'freeHandToolButton',
            'freeTextToolButton',
            'stickyToolButton',
            'shapeToolButton',
            'freeHandHighlightToolButton',
            'highlightToolButton',
            'underlineToolButton',
            'strikeoutToolButton',
            'squigglyToolButton',
            'redactionToolButton',
            'textSelectButton',
            'panToolButton',
            'annotationCommentButton',
            'annotationStyleEditButton',
            'annotationDeleteButton',
            'annotationReplyButton',
            'downloadButton',
            'fullscreenButton',
            'printButton',
            'openFileButton',
            'saveAsButton',
            'menuButton',
            'viewControlsOverlay',
            'searchButton',
            'menuOverlay',
            'annotationPopup',
            'contextMenuPopup',
            'toolStylePopup',
            'signatureToolButton',
            'fileAttachmentToolButton',
            'calloutToolButton',
            'undo',
            'redo',
          ],
        },
        container,
      );

      const { documentViewer } = instance.Core;

      return new Promise((resolve) => {
        documentViewer.addEventListener('documentLoaded', async () => {
          try {
            // Wait a bit for the document to fully render
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Get the first page
            const pageCount = documentViewer.getPageCount();
            if (pageCount === 0) {
              document.body.removeChild(container);
              void instance.UI.dispose();
              resolve(null);
              return;
            }

            // Set current page to first page
            documentViewer.setCurrentPage(1, true);

            // Wait for page to render
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Try to get the canvas element from the viewer
            const pageContainer =
              container.querySelector('.PageContainer') ||
              container.querySelector('[data-element="pageContainer"]') ||
              container.querySelector('.page-container');

            let canvas = pageContainer?.querySelector('canvas');

            // If we can't find the canvas in the expected location, search more broadly
            if (!canvas) {
              canvas = container.querySelector('canvas');
            }

            if (canvas) {
              // Create a smaller thumbnail canvas
              const thumbnailCanvas = document.createElement('canvas');
              const ctx = thumbnailCanvas.getContext('2d');

              // Set thumbnail dimensions (maintain aspect ratio)
              const maxWidth = 150;
              const maxHeight = 200;
              const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);

              thumbnailCanvas.width = canvas.width * scale;
              thumbnailCanvas.height = canvas.height * scale;

              // Draw the scaled image
              ctx?.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

              const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.8);

              // Cache in localStorage and memory
              localStorage.setItem(`pdf-thumb-${url}`, thumbnail);
              thumbnailCache.value[url] = thumbnail;

              // Cleanup
              document.body.removeChild(container);
              void instance.UI.dispose();

              resolve(thumbnail);
            } else {
              console.error('Could not find canvas element in PDF viewer');
              // Try alternative method: take a screenshot of the viewer area
              try {
                const viewerElement =
                  container.querySelector('[data-element="viewer"]') || container.firstElementChild;
                if (viewerElement) {
                  // This is a fallback - create a simple placeholder for now
                  console.log('Creating fallback thumbnail for:', url);

                  // Create a simple colored rectangle as placeholder
                  const fallbackCanvas = document.createElement('canvas');
                  fallbackCanvas.width = 150;
                  fallbackCanvas.height = 200;
                  const fallbackCtx = fallbackCanvas.getContext('2d');

                  if (fallbackCtx) {
                    fallbackCtx.fillStyle = '#f5f5f5';
                    fallbackCtx.fillRect(0, 0, 150, 200);
                    fallbackCtx.fillStyle = '#d32f2f';
                    fallbackCtx.font = '16px Arial';
                    fallbackCtx.textAlign = 'center';
                    fallbackCtx.fillText('PDF', 75, 100);

                    const thumbnail = fallbackCanvas.toDataURL('image/jpeg', 0.8);

                    // Cache the fallback
                    localStorage.setItem(`pdf-thumb-${url}`, thumbnail);
                    thumbnailCache.value[url] = thumbnail;

                    document.body.removeChild(container);
                    void instance.UI.dispose();
                    resolve(thumbnail);
                  } else {
                    document.body.removeChild(container);
                    void instance.UI.dispose();
                    resolve(null);
                  }
                } else {
                  document.body.removeChild(container);
                  void instance.UI.dispose();
                  resolve(null);
                }
              } catch (fallbackError) {
                console.error('Fallback thumbnail generation failed:', fallbackError);
                document.body.removeChild(container);
                void instance.UI.dispose();
                resolve(null);
              }
            }
          } catch (error) {
            console.error('Error generating thumbnail:', error);
            document.body.removeChild(container);
            void instance.UI.dispose();
            resolve(null);
          }
        });

        // Handle load errors
        documentViewer.addEventListener('documentLoadError', (error) => {
          console.error('Document load error:', error);
          document.body.removeChild(container);
          void instance.UI.dispose();
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error creating WebViewer instance:', error);
      return null;
    }
  };

  const getThumbnail = async (url: string): Promise<string | null> => {
    const cached = loadThumbnailFromCache(url);
    if (cached) return cached;

    return await generateThumbnail(url);
  };

  const clearCache = () => {
    // Clear memory cache
    thumbnailCache.value = {};

    // Clear localStorage cache
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pdf-thumb-')) {
        localStorage.removeItem(key);
      }
    }
  };

  return {
    getThumbnail,
    clearCache,
    thumbnailCache: computed(() => thumbnailCache.value),
  };
}
