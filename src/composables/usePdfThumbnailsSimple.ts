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

  const generateThumbnailUsingCanvas = async (url: string): Promise<string | null> => {
    try {
      // Try using PDF.js to render first page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        console.warn('PDF.js not available, falling back to placeholder');
        return generatePlaceholderThumbnail(url);
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;

      // Get the first page
      const page = await pdf.getPage(1);

      // Calculate viewport
      const viewport = page.getViewport({ scale: 0.5 });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Create thumbnail canvas with proper dimensions
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');

      if (!thumbnailCtx) {
        return generatePlaceholderThumbnail(url);
      }

      // Set thumbnail dimensions maintaining aspect ratio
      const maxWidth = 200;
      const maxHeight = 280;
      const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);

      thumbnailCanvas.width = canvas.width * scale;
      thumbnailCanvas.height = canvas.height * scale;

      // Draw scaled image
      thumbnailCtx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

      const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.85);

      // Cache the result
      localStorage.setItem(`pdf-thumb-${url}`, thumbnail);
      thumbnailCache.value[url] = thumbnail;

      console.log('Thumbnail generated successfully using PDF.js for:', url);
      return thumbnail;
    } catch (error) {
      console.error('Error generating PDF.js thumbnail:', error);
      return generatePlaceholderThumbnail(url);
    }
  };

  const generatePlaceholderThumbnail = (url: string): string => {
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

      // Add PDF icon area
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 40, 160, 120);

      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 40, 160, 120);

      // Add PDF icon and text
      ctx.fillStyle = '#dc3545';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PDF', 100, 110);

      // Add filename or generic text
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial, sans-serif';
      const filename = url.split('/').pop() || 'Document';
      const displayName = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
      ctx.fillText(displayName, 100, 200);

      ctx.fillStyle = '#6c757d';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('Click to view', 100, 220);

      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

      // Cache the placeholder
      localStorage.setItem(`pdf-thumb-${url}`, thumbnail);
      thumbnailCache.value[url] = thumbnail;

      console.log('Generated placeholder thumbnail for:', url);
      return thumbnail;
    }

    return '';
  };

  const getThumbnail = async (url: string): Promise<string | null> => {
    const cached = loadThumbnailFromCache(url);
    if (cached) return cached;

    return await generateThumbnailUsingCanvas(url);
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
    return await generateThumbnailUsingCanvas(url);
  };

  return {
    getThumbnail,
    clearCache,
    clearSingleCache,
    regenerateThumbnail,
    thumbnailCache: computed(() => thumbnailCache.value),
  };
}
