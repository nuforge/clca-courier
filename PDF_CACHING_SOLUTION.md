# PDF Caching Solution

## Overview

To solve the Google Drive CORS issues with PDFs and thumbnails, we've implemented a comprehensive PDF caching system that downloads Google Drive PDFs locally and enables full-text search and thumbnail generation.

## Components

### 1. `usePdfCache` Composable

**Location**: `src/composables/usePdfCache.ts`

**Features**:

- Downloads Google Drive PDFs directly to browser cache
- Converts Google Drive view URLs to download URLs automatically
- Smart cache management with size limits (50MB default) and expiration (3 days)
- Prevents duplicate downloads with queue management
- Provides cache statistics and cleanup utilities

**Key Functions**:

```typescript
// Download and cache a PDF
const cachedUrl = await pdfCache.downloadAndCache(googleDriveUrl, fileName);

// Check if PDF is already cached
if (pdfCache.isCached(url)) {
  const cachedUrl = pdfCache.getCachedUrl(url);
}
```

### 2. `usePdfThumbnailGenerator` Composable

**Location**: `src/composables/usePdfThumbnailGenerator.ts`

**Features**:

- Generates PDF thumbnails using PDF.js and HTML Canvas
- Works with both cached Google Drive PDFs and local files
- Configurable thumbnail dimensions (200x260 default)
- Thumbnail caching with expiration (1 week default)
- JPEG compression with quality control

**Key Functions**:

```typescript
// Generate thumbnail for any PDF URL
const thumbnailUrl = await generateThumbnail(pdfUrl, fileName);

// Generate thumbnail for an issue object
const thumbnailUrl = await generateIssueThumbnail(issue);
```

### 3. Enhanced `useAdvancedSearch` Composable

**Location**: `src/composables/useAdvancedSearch.ts`

**New Features**:

- Integrates PDF caching for Google Drive files
- Full-text search now works on Google Drive PDFs
- Improved user feedback about caching progress
- Exposes PDF cache utilities for external use

## How It Works

### Google Drive PDF Processing Flow

1. **URL Conversion**: `drive.google.com/file/d/ID/view` → `drive.google.com/uc?export=download&id=ID`
2. **Download**: Fetch PDF directly using download URL (bypasses view page CORS)
3. **Cache**: Store PDF blob in memory with object URL for local access
4. **Text Extraction**: Use PDF.js to extract text from cached blob
5. **Thumbnail Generation**: Render first page to canvas and create image

### Search Enhancement

- **Local PDFs**: Direct text extraction (as before)
- **Google Drive PDFs**: Download → Cache → Extract text
- **Mixed Results**: Search covers both local and Google Drive content
- **Progress Feedback**: Console logs show caching and extraction progress

### Benefits

✅ **Solves CORS Issues**: No more browser security blocks
✅ **Full-Text Search**: Google Drive PDFs are now searchable
✅ **Thumbnail Generation**: Works for all PDF sources
✅ **Performance**: Cached files enable instant re-access
✅ **Smart Management**: Automatic cache cleanup and size limits
✅ **User Friendly**: Clear progress indicators and error handling

## Configuration

### PDF Cache Settings

```typescript
const pdfCache = usePdfCache({
  maxCacheSizeMB: 50, // Maximum cache size
  maxAgeHours: 24 * 3, // 3 days cache lifetime
  enableCompression: false, // Future feature
});
```

### Thumbnail Settings

```typescript
const thumbnailGenerator = usePdfThumbnailGenerator({
  width: 200, // Thumbnail width
  height: 260, // Thumbnail height
  quality: 0.8, // JPEG quality
  maxAgeHours: 24 * 7, // 1 week cache lifetime
});
```

## UI Updates

- **Advanced Search**: Updated help text explains Google Drive caching
- **Progress Feedback**: Console logs show download and processing status
- **Error Handling**: Graceful fallbacks when PDFs can't be cached

## Usage in Components

### Trigger PDF Caching

```vue
<script setup>
import { useAdvancedSearch } from '../composables/useAdvancedSearch';

const { pdfCache } = useAdvancedSearch();

// Manually cache a PDF
const cachedUrl = await pdfCache.downloadAndCache(issue.url, issue.filename);
</script>
```

### Generate Thumbnails

```vue
<script setup>
import { usePdfThumbnailGenerator } from '../composables/usePdfThumbnailGenerator';

const thumbnailGen = usePdfThumbnailGenerator();

// Generate thumbnail
const thumbnailUrl = await thumbnailGen.generateIssueThumbnail(issue);
</script>
```

## Development Notes

### Cache Storage

- PDFs stored as Blob objects with `URL.createObjectURL()`
- Thumbnails cached as JPEG blobs
- Automatic cleanup prevents memory leaks
- Cache persists only during browser session

### Error Handling

- Network failures: Graceful fallback to metadata search only
- Invalid PDFs: Warning logs but continues processing
- Cache full: Automatic cleanup of oldest entries
- CORS still blocked: Clear error messages to user

### Performance

- Downloads happen in background during search
- Duplicate downloads prevented with queue system
- Text extraction parallelized for multiple PDFs
- Thumbnail generation on-demand only

## Future Enhancements

1. **Persistent Caching**: Use IndexedDB for cache persistence
2. **Compression**: Enable PDF compression before caching
3. **Bulk Operations**: Batch download multiple PDFs
4. **Progress UI**: Visual progress bars for downloads
5. **Smart Prefetch**: Cache frequently accessed PDFs automatically

This solution completely eliminates the Google Drive CORS limitations while providing a better user experience with faster subsequent access to cached content.
