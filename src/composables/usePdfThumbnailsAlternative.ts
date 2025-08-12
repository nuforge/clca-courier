import { ref, computed } from 'vue';

interface ThumbnailCache {
  [url: string]: string; // base64 image data
}

const thumbnailCache = ref<ThumbnailCache>({});

export function usePdfThumbnailsSimple() {
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

  // Alternative approach using PDF.js library
  const generateThumbnailWithPDFJS = async (url: string): Promise<string | null> => {
    try {
      // Check if PDF.js is available (it would need to be added to the project)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjsLib = (window as any).pdfjsLib;

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Set canvas size
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(200 / viewport.width, 280 / viewport.height);
          const scaledViewport = page.getViewport({ scale });

          canvas.width = 200;
          canvas.height = 280;

          // Fill white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 200, 280);

          // Center the PDF page
          const x = (200 - scaledViewport.width) / 2;
          const y = (280 - scaledViewport.height) / 2;

          // Render the page
          const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport,
            transform: [1, 0, 0, 1, x, y],
          };

          await page.render(renderContext).promise;

          return canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      return null;
    } catch (error) {
      console.warn('PDF.js thumbnail generation failed:', error);
      return null;
    }
  };

  const getThumbnail = async (url: string): Promise<string | null> => {
    const cached = loadThumbnailFromCache(url);
    if (cached) {
      return cached;
    }

    // Try PDF.js approach first (if available)
    try {
      const pdfJSThumbnail = await generateThumbnailWithPDFJS(url);
      if (pdfJSThumbnail) {
        localStorage.setItem(`pdf-thumb-${url}`, pdfJSThumbnail);
        thumbnailCache.value[url] = pdfJSThumbnail;
        return pdfJSThumbnail;
      }
    } catch {
      console.log('PDF.js approach not available');
    }

    // For demo mode, we'll primarily use fallback thumbnails
    // but indicate that these are placeholders
    console.log('Using fallback thumbnail due to demo mode limitations');
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
