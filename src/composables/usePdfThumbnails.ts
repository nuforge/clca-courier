import { ref, computed } from 'vue';
import WebViewer, { type WebViewerInstance } from '@pdftron/webviewer';
import * as pdfjsLib from 'pdfjs-dist';

// Note: PDF.js worker will be configured at runtime to avoid Vite build issues

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

  const generatePDFJSThumbnail = async (url: string): Promise<string | null> => {
    try {
      console.log('🔄 Attempting PDF.js thumbnail generation for:', url);

      // Configure PDF.js worker at runtime to avoid Vite build issues
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        // Use dynamic path construction to avoid Vite processing the import
        const workerPath = new URL('/pdf.worker.min.js', window.location.origin).href;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        console.log('📝 PDF.js worker configured:', workerPath);
      }

      // Load the PDF document using PDF.js
      const loadingTask = pdfjsLib.getDocument({
        url: url,
        // Add CORS settings for better compatibility
        withCredentials: false,
      });
      const pdf = await loadingTask.promise;

      // Get the first page
      const page = await pdf.getPage(1);

      // Set up the canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        console.warn('❌ PDF.js: Could not get canvas context');
        return null;
      }

      // Calculate scale to fit desired thumbnail size
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 200;
      const targetHeight = 280;
      const scale = Math.min(targetWidth / viewport.width, targetHeight / viewport.height);
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;

      // Convert to base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      console.log('✅ PDF.js thumbnail generated successfully');

      return thumbnail;
    } catch (error) {
      console.warn('❌ PDF.js thumbnail generation failed:', error);
      return null;
    }
  };

  const generateActualThumbnail = async (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create a hidden container for WebViewer
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-2000px';
      container.style.top = '0';
      container.style.width = '400px';
      container.style.height = '600px';
      container.style.zIndex = '-9999';
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

      // Set timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);

      WebViewer(
        {
          path: '/webviewer',
          initialDoc: url,
          enableRedaction: false,
          enableMeasurement: false,
          enableFilePicker: false,
          ui: 'legacy',
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
          ],
        },
        container,
      )
        .then((webViewerInstance) => {
          instance = webViewerInstance;
          const { documentViewer } = instance.Core;

          documentViewer.addEventListener('documentLoadError', () => {
            clearTimeout(timeoutId);
            cleanup();
            resolve(null);
          });

          documentViewer.addEventListener('documentLoaded', async () => {
            try {
              // Set to first page and fit
              documentViewer.setCurrentPage(1, true);
              documentViewer.setFitMode(documentViewer.FitMode.FitPage);

              // Wait for rendering
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Get canvas with PDF content
              const canvasElements = container.querySelectorAll('canvas');
              let bestCanvas: HTMLCanvasElement | null = null;

              // Check license type for canvas access restrictions
              const licenseKey = import.meta.env.VITE_PDFTRON_LICENSE_KEY || '';
              const isDemoLicense = licenseKey.startsWith('demo:') || licenseKey === '';
              console.log(`License type: ${isDemoLicense ? 'Demo/Trial' : 'Production'}`);

              // Find the largest canvas (likely the main content)
              for (const canvas of canvasElements) {
                console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

                if (canvas.width > 50 && canvas.height > 50) {
                  // For demo licenses, test canvas data access
                  if (isDemoLicense) {
                    try {
                      const testCtx = canvas.getContext('2d');
                      if (testCtx) {
                        testCtx.getImageData(0, 0, 1, 1); // Test canvas data access
                        console.log('✅ Canvas data access: ALLOWED');
                      }
                    } catch {
                      console.log('❌ Canvas data access: RESTRICTED (demo mode limitation)');
                      continue; // Skip this canvas as it's restricted
                    }
                  }

                  if (
                    !bestCanvas ||
                    canvas.width * canvas.height > bestCanvas.width * bestCanvas.height
                  ) {
                    bestCanvas = canvas;
                  }
                }
              }

              if (bestCanvas) {
                // Create thumbnail from the PDF canvas
                const thumbnailCanvas = document.createElement('canvas');
                const ctx = thumbnailCanvas.getContext('2d');

                if (ctx) {
                  // Set thumbnail dimensions (matching our CSS)
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

                  // Draw the PDF content
                  ctx.drawImage(bestCanvas, x, y, scaledWidth, scaledHeight);

                  const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.8);
                  clearTimeout(timeoutId);
                  cleanup();
                  resolve(thumbnail);
                  return;
                }
              }

              // If we get here, no suitable canvas was found
              clearTimeout(timeoutId);
              cleanup();
              resolve(null);
            } catch (error) {
              console.error('Error generating actual thumbnail:', error);
              clearTimeout(timeoutId);
              cleanup();
              resolve(null);
            }
          });
        })
        .catch(() => {
          clearTimeout(timeoutId);
          cleanup();
          resolve(null);
        });
    });
  };

  const getThumbnail = async (url: string): Promise<string | null> => {
    console.log('🔍 Starting optimized three-tier thumbnail generation for:', url);

    const cached = loadThumbnailFromCache(url);
    if (cached) {
      console.log('✅ Using cached thumbnail');
      return cached;
    }

    // OPTIMIZED THREE-TIER FALLBACK SYSTEM
    // Tier 1: Try PDF.js first (fast, free, no license restrictions)
    console.log('🎯 Tier 1: Attempting PDF.js thumbnail (fastest, most reliable)...');
    try {
      const pdfJSThumbnail = await generatePDFJSThumbnail(url);
      if (pdfJSThumbnail) {
        console.log('✅ Tier 1 SUCCESS: PDF.js thumbnail generated');
        localStorage.setItem(`pdf-thumb-${url}`, pdfJSThumbnail);
        thumbnailCache.value[url] = pdfJSThumbnail;
        return pdfJSThumbnail;
      }
      console.log('⚠️ Tier 1 FAILED: PDF.js could not generate thumbnail');
    } catch (error) {
      console.warn('❌ Tier 1 ERROR: PDF.js thumbnail generation failed:', error);
    }

    // Tier 2: Try WebViewer as fallback (higher quality but demo license limitations)
    console.log('🎯 Tier 2: Attempting WebViewer thumbnail (fallback for quality)...');
    try {
      const webViewerThumbnail = await generateActualThumbnail(url);
      if (webViewerThumbnail) {
        console.log('✅ Tier 2 SUCCESS: WebViewer thumbnail generated');
        localStorage.setItem(`pdf-thumb-${url}`, webViewerThumbnail);
        thumbnailCache.value[url] = webViewerThumbnail;
        return webViewerThumbnail;
      }
      console.log('⚠️ Tier 2 FAILED: WebViewer could not generate thumbnail');
    } catch (error) {
      console.warn('❌ Tier 2 ERROR: WebViewer thumbnail generation failed:', error);
    }

    // Tier 3: Generate styled fallback placeholder (always works)
    console.log('🎯 Tier 3: Generating styled fallback placeholder...');
    try {
      const fallbackThumbnail = generateFallbackThumbnail(url);
      console.log('✅ Tier 3 SUCCESS: Fallback placeholder generated');
      localStorage.setItem(`pdf-thumb-${url}`, fallbackThumbnail);
      thumbnailCache.value[url] = fallbackThumbnail;
      return fallbackThumbnail;
    } catch (error) {
      console.error('❌ Tier 3 ERROR: Even fallback generation failed:', error);
      return null;
    }
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
