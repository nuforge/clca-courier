# PDF Viewer Integration

Complete documentation for PDF viewing capabilities in CLCA Courier.

## Overview

The CLCA Courier uses a dual PDF viewer system to provide robust document viewing:

1. **Primary:** PDFTron WebViewer (advanced features)
2. **Fallback:** PDF.js (basic viewing)

## Architecture

### Components

- `GlobalPdfViewer.vue` - Main PDF viewer dialog component
- `usePdfViewer.ts` - Composable for PDF viewer state management
- `pdf-metadata-service.ts` - PDF processing and metadata extraction

### File Discovery

- **Local PDFs:** Manifest-based discovery (`public/data/pdf-manifest.json`)
- **Google Drive PDFs:** Real-time API discovery with caching
- **Hybrid Support:** Seamless switching between local and cloud storage

## Features

### Viewing Capabilities

- **In-browser PDF rendering** with full-screen support
- **Document navigation** with page controls
- **Zoom and pan** functionality
- **Text search** within documents
- **Responsive design** for desktop and mobile

### Document Management

- **Automatic thumbnail generation** for PDF previews
- **Metadata extraction** (title, page count, file size)
- **Loading states** with progress indicators
- **Error handling** with graceful fallbacks

### Performance Optimizations

- **Lazy loading** of PDF content
- **Thumbnail caching** in local storage
- **Progressive rendering** for large documents
- **Memory management** to prevent browser crashes

## Configuration

### PDFTron WebViewer Setup

```typescript
// quasar.config.ts
const pdfWorkerConfig = {
  WebViewer: {
    path: '/lib/webviewer',
    licenseKey: process.env.VITE_PDFTRON_LICENSE_KEY,
  },
};
```

### PDF.js Configuration

```typescript
// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

### Environment Variables

```bash
VITE_PDFTRON_LICENSE_KEY=your_license_key_here
```

## Usage Examples

### Opening PDF in Viewer

```typescript
import { usePdfViewer } from '@/composables/usePdfViewer';

const { openPdf } = usePdfViewer();

// Open local PDF
openPdf({
  url: '/issues/2024.01-newsletter.pdf',
  title: 'January 2024 Newsletter',
});

// Open Google Drive PDF (with authentication)
openPdf({
  url: 'https://drive.google.com/file/d/FILE_ID',
  title: 'Cloud Newsletter',
  requiresAuth: true,
});
```

### PDF Metadata Service

```typescript
import { pdfMetadataService } from '@/services/pdf-metadata-service';

// Extract metadata
const metadata = await pdfMetadataService.extractMetadata(pdfUrl);

// Generate thumbnail
const thumbnail = await pdfMetadataService.generateThumbnail(pdfUrl);
```

## CORS Considerations

### Local PDFs ✅

- Full support for all PDF.js features
- Direct file access from `/public/issues/`
- No authentication required

### Google Drive PDFs ⚠️

- **Limited by CORS policies** - cannot directly access Drive URLs
- **Workaround:** Server-side proxy or local caching required
- **Current limitation:** Metadata extraction not available for Drive PDFs

### Solutions for Production

1. **Server-side proxy** to fetch Drive content
2. **Local caching** of frequently accessed PDFs
3. **Hybrid approach** - sync Drive content to local storage

## File Organization

### Local PDF Structure

```
public/
├── issues/                    # Newsletter PDFs
│   ├── 2024.01-newsletter.pdf
│   ├── 2024.02-newsletter.pdf
│   └── ...
├── thumbnails/               # Generated thumbnails
│   ├── 2024.01-newsletter.jpg
│   └── ...
└── data/
    └── pdf-manifest.json    # Build-time generated manifest
```

### Manifest Generation

```bash
# Generate PDF manifest during build
node scripts/generate-pdf-manifest.js
```

## Troubleshooting

### Common Issues

**PDF fails to load**

- Check file path is correct
- Verify PDF is not corrupted
- Check browser console for CORS errors

**Viewer not initializing**

- Confirm PDFTron license key is valid
- Check WebViewer library files are accessible
- Fallback to PDF.js should occur automatically

**Thumbnails not generating**

- Check PDF.js worker is loaded
- Verify sufficient browser memory
- Clear thumbnail cache if outdated

**Google Drive PDFs not accessible**

- Expected due to CORS limitations
- Implement server-side proxy for production
- Use local caching as alternative

### Debug Mode

```typescript
// Enable PDF viewer debugging
const DEBUG_PDF = true;
if (DEBUG_PDF) {
  console.log('PDF viewer state:', pdfViewerState);
}
```

## Performance Tips

1. **Optimize PDF file sizes** - compress images, remove unnecessary content
2. **Use progressive rendering** for large documents
3. **Implement pagination** for very long PDFs
4. **Cache thumbnails** to reduce regeneration
5. **Lazy load** PDF content until needed

## Browser Compatibility

### Supported Browsers

- ✅ **Chrome/Edge:** Full PDFTron + PDF.js support
- ✅ **Firefox:** Full PDF.js support, limited PDFTron features
- ✅ **Safari:** PDF.js support, basic PDFTron functionality
- ⚠️ **Mobile browsers:** PDF.js recommended, limited PDFTron support

### Fallback Strategy

1. Try PDFTron WebViewer (if license available)
2. Fall back to PDF.js (always available)
3. Fall back to browser native PDF viewer (download)

## Future Enhancements

- **Annotation support** for collaborative reviewing
- **Full-text search** across all documents
- **PDF comparison** tools for version control
- **Batch processing** for metadata extraction
- **Advanced caching** with service workers
