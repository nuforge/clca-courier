# WebViewer Configuration Guide

This document outlines the configuration changes made to address WebViewer warnings and improve performance.

## Changes Made

### 1. Updated Quasar Configuration

Added necessary headers to `quasar.config.ts` to support WebAssembly threads:

```typescript
devServer: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
},
```

### 2. Enhanced PDF Thumbnail Generation

Updated `usePdfThumbnails.ts` with:

- Warning suppression for common PDFTron messages
- Increased timeout for non-linearized PDFs (15 seconds)
- Support for license key from environment variables
- Better error handling and cleanup

### 3. Environment Variables

Created `.env.example` for license key configuration:

```bash
VITE_PDFTRON_LICENSE_KEY=your_license_key_here
```

## Addressing Specific Warnings

### WebAssembly Threads Warning

**Warning:** "Your server has not been configured to serve WebAssembly threads"
**Solution:** Added COOP and COEP headers in Quasar config

### Content-Encoding Warning

**Warning:** "Your server has not been configured to serve .gz. and .br. files"
**Solution:** This is handled by the production server. For development, Vite handles compression automatically.

### Non-linearized PDF Warning

**Warning:** "The file is not linearized"
**Solution:**

- Increased timeout to handle slower loading
- Added streaming: false option
- Consider linearizing PDFs for better performance

### Demo Mode Messages

**Warning:** "PDFNet is running in demo mode"
**Solution:** Add a valid license key to `.env` file

## Additional Recommendations

### 1. Linearize PDFs

For better performance, linearize your PDF files:

```bash
# Using qpdf
qpdf --linearize input.pdf output.pdf

# Or use Adobe Acrobat Pro: Save As > Optimized PDF > Fast Web View
```

### 2. Production Server Configuration

For production deployment, ensure your server supports:

- Gzip/Brotli compression for .js and .wasm files
- Proper MIME types for WebAssembly files
- COOP/COEP headers

### 3. License Key

To remove demo mode warnings:

1. Get a license key from https://dev.apryse.com/
2. Add it to your `.env` file:

```bash
VITE_PDFTRON_LICENSE_KEY=your_actual_license_key
```

### 4. Alternative: PDF.js-only Approach

Consider using `usePdfThumbnailsSimple.ts` instead, which uses native PDF.js and avoids WebViewer overhead for thumbnails only.

## Testing the Changes

1. Restart your development server
2. Clear browser cache
3. Check browser console - warnings should be suppressed
4. Test PDF thumbnail generation

## Performance Notes

- Non-linearized PDFs will always load slower
- WebAssembly threads provide significant performance improvements
- Proper compression reduces load times by 60-80%
- License key removes demo mode overhead
