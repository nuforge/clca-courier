import { ref, computed } from 'vue';
import WebViewer, { type WebViewerInstance } from '@pdftron/webviewer';

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

  const generateFallbackThumbnail = (url: string): string => {
    // Create a nice-looking PDF placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, '#f8f9fa');
      gradient.addColorStop(1, '#e9ecef');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 280);

      // Add border
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 198, 278);

      // Add document icon area
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(30, 50, 140, 100);
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 50, 140, 100);

      // Add folded corner effect
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath();
      ctx.moveTo(150, 50);
      ctx.lineTo(170, 50);
      ctx.lineTo(170, 70);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#dee2e6';
      ctx.stroke();

      // Add PDF text
      ctx.fillStyle = '#dc3545';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PDF', 100, 110);

      // Add filename
      ctx.fillStyle = '#6c757d';
      ctx.font = '11px Arial, sans-serif';
      const filename = url.split('/').pop() || 'Document';
      const displayName = filename.length > 25 ? filename.substring(0, 22) + '...' : filename;
      ctx.fillText(displayName, 100, 180);

      ctx.font = '9px Arial, sans-serif';
      ctx.fillText('Click to view full document', 100, 210);

      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

      // Cache the fallback
      localStorage.setItem(`pdf-thumb-${url}`, thumbnail);
      thumbnailCache.value[url] = thumbnail;

      return thumbnail;
    }

    console.error('Failed to get canvas context');
    return '';
  };

  const generateActualThumbnail = async (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create a hidden container for WebViewer
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-2000px';
      container.style.top = '0';
      container.style.width = '600px'; // Increased size for better rendering
      container.style.height = '800px';
      container.style.zIndex = '-9999';
      container.style.visibility = 'hidden';
      document.body.appendChild(container);

      let instance: WebViewerInstance | null = null;
      const cleanup = () => {
        try {
          if (container.parentNode) {
            document.body.removeChild(container);
          }
          if (instance) {
            void instance.UI.dispose();
          }
        } catch (e) {
          console.warn('Error during WebViewer cleanup:', e);
        }
      };

      // Set timeout to prevent hanging - increased for demo mode
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 20000); // Increased timeout for demo mode

      // Create a more sophisticated console suppression
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      const suppressMessages = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (
          message.includes('WebAssembly threads') ||
          message.includes('Content-Encoding') ||
          message.includes('linearized') ||
          message.includes('demo mode') ||
          message.includes('PDFNet is running') ||
          message.includes('Permission:') ||
          message.includes('Thank you for downloading WebViewer') ||
          message.includes('trial') ||
          message.includes('license')
        ) {
          return; // Suppress these messages
        }
        originalConsoleWarn.apply(console, args);
      };

      console.warn = suppressMessages;
      console.log = suppressMessages;
      console.error = suppressMessages;

      // Enhanced WebViewer configuration optimized for thumbnails
      WebViewer(
        {
          path: '/webviewer',
          initialDoc: url,
          enableRedaction: false,
          enableMeasurement: false,
          enableFilePicker: false,
          ui: 'legacy',
          // Optimize for demo mode and non-linearized PDFs
          streaming: false,
          useDownloader: false,
          // License key from environment
          licenseKey: import.meta.env.VITE_PDFTRON_LICENSE_KEY || '',
          // Disable all UI elements for clean rendering
          disabledElements: [
            'header',
            'toolsHeader',
            'leftPanel',
            'leftPanelButton',
            'searchButton',
            'menuButton',
            'toolsButton',
            'pageNavOverlay',
            'downloadButton',
            'printButton',
            'openFileButton',
            'saveAsButton',
            'fullscreenButton',
            'viewControlsButton',
            'crossStampButton',
            'checkStampButton',
            'dotStampButton',
            'rubberStampButton',
            'eraserButton',
          ],
        },
        container,
      )
        .then((webViewerInstance) => {
          instance = webViewerInstance;
          const { documentViewer } = instance.Core;

          documentViewer.addEventListener('documentLoadError', (err) => {
            console.warn('Document load error:', err);
            console.warn = originalConsoleWarn;
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            clearTimeout(timeoutId);
            cleanup();
            resolve(null);
          });

          documentViewer.addEventListener('documentLoaded', async () => {
            try {
              // Wait for document to be fully loaded
              await documentViewer.getDocument().getDocumentCompletePromise();

              // Set to first page
              documentViewer.setCurrentPage(1, true);

              // Set fit mode for optimal rendering
              documentViewer.setFitMode(documentViewer.FitMode.FitPage);

              // Force a refresh
              documentViewer.refreshAll();
              documentViewer.updateView();

              // Wait longer for rendering - demo mode is slower
              await new Promise((resolve) => setTimeout(resolve, 5000));

              // Multiple attempts to find canvas with different strategies
              let bestCanvas: HTMLCanvasElement | null = null;

              // Strategy 1: Look for canvas elements
              const canvasElements = container.querySelectorAll('canvas');
              console.log(`Found ${canvasElements.length} canvas elements`);

              for (const canvas of canvasElements) {
                console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

                if (canvas.width > 100 && canvas.height > 100) {
                  if (
                    !bestCanvas ||
                    canvas.width * canvas.height > bestCanvas.width * bestCanvas.height
                  ) {
                    bestCanvas = canvas;
                  }
                }
              }

              // Strategy 2: If no good canvas found, try a different approach
              if (!bestCanvas) {
                console.log('No suitable canvas found, trying alternative approach...');

                // Try to get canvas via the document viewer API
                try {
                  const pageContainer = container.querySelector(
                    '.DocumentContainer, .pageContainer, [data-element="documentContainer"]',
                  );
                  if (pageContainer) {
                    const canvasInContainer = pageContainer.querySelectorAll('canvas');
                    for (const canvas of canvasInContainer) {
                      if (canvas.width > 50 && canvas.height > 50) {
                        bestCanvas = canvas;
                        break;
                      }
                    }
                  }
                } catch (apiError) {
                  console.log('API approach failed:', apiError);
                }
              }

              if (bestCanvas) {
                console.log(`Using canvas: ${bestCanvas.width}x${bestCanvas.height}`);

                // Create thumbnail from the PDF canvas
                const thumbnailCanvas = document.createElement('canvas');
                const ctx = thumbnailCanvas.getContext('2d');

                if (ctx) {
                  // Set thumbnail dimensions
                  thumbnailCanvas.width = 200;
                  thumbnailCanvas.height = 280;

                  // Calculate scaling to fit within thumbnail while maintaining aspect ratio
                  const scale = Math.min(200 / bestCanvas.width, 280 / bestCanvas.height);
                  const scaledWidth = bestCanvas.width * scale;
                  const scaledHeight = bestCanvas.height * scale;

                  // Center the image in the thumbnail
                  const x = (200 - scaledWidth) / 2;
                  const y = (280 - scaledHeight) / 2;

                  // Fill background with white
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, 200, 280);

                  try {
                    // Draw the PDF content
                    ctx.drawImage(bestCanvas, x, y, scaledWidth, scaledHeight);

                    const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.8);

                    console.warn = originalConsoleWarn;
                    console.log = originalConsoleLog;
                    console.error = originalConsoleError;
                    clearTimeout(timeoutId);
                    cleanup();
                    resolve(thumbnail);
                    return;
                  } catch (drawError) {
                    console.log('Canvas drawing failed:', drawError);
                  }
                }
              } else {
                console.log('No suitable canvas found for thumbnail generation');
              }

              // If we get here, thumbnail generation failed
              console.warn = originalConsoleWarn;
              console.log = originalConsoleLog;
              console.error = originalConsoleError;
              clearTimeout(timeoutId);
              cleanup();
              resolve(null);
            } catch (err) {
              console.error('Error in thumbnail generation:', err);
              console.warn = originalConsoleWarn;
              console.log = originalConsoleLog;
              console.error = originalConsoleError;
              clearTimeout(timeoutId);
              cleanup();
              resolve(null);
            }
          });
        })
        .catch((err) => {
          console.error('WebViewer initialization failed:', err);
          console.warn = originalConsoleWarn;
          console.log = originalConsoleLog;
          console.error = originalConsoleError;
          clearTimeout(timeoutId);
          cleanup();
          resolve(null);
        });
    });
  };

  const getThumbnail = async (url: string): Promise<string | null> => {
    const cached = loadThumbnailFromCache(url);
    if (cached) {
      return cached;
    }

    // Try to generate actual PDF thumbnail first
    try {
      const actualThumbnail = await generateActualThumbnail(url);
      if (actualThumbnail) {
        // Cache the actual thumbnail
        localStorage.setItem(`pdf-thumb-${url}`, actualThumbnail);
        thumbnailCache.value[url] = actualThumbnail;
        return actualThumbnail;
      }
    } catch {
      console.warn('Failed to generate actual PDF thumbnail for', url, '- using fallback');
    }

    // Fall back to styled placeholder
    const fallback = generateFallbackThumbnail(url);
    return fallback;
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

  const clearSingleCache = (url: string) => {
    // Clear from memory
    delete thumbnailCache.value[url];

    // Clear from localStorage
    localStorage.removeItem(`pdf-thumb-${url}`);
  };

  const regenerateThumbnail = async (url: string): Promise<string | null> => {
    clearSingleCache(url);
    return await getThumbnail(url);
  };

  return {
    getThumbnail,
    clearCache,
    clearSingleCache,
    regenerateThumbnail,
    thumbnailCache: computed(() => thumbnailCache.value),
  };
}
