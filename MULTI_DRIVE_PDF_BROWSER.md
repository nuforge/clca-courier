# Multi-Drive PDF Browser

## Overview

The Multi-Drive PDF Browser is a new feature that allows users to browse PDF files from multiple Google Drive folders simultaneously using the same no-authentication approach as the Publication Hub.

## Features

### ✅ Implemented

- **Multi-folder PDF loading**: Automatically loads PDFs from all configured Google Drive folders
- **No authentication required**: Uses API key only for public folder access
- **Folder organization**: Groups PDFs by source folder with folder tabs
- **PDF preview**: Full-screen PDF viewing with Google Drive's built-in viewer
- **Thumbnail support**: Attempts to load PDF thumbnails when available
- **Error handling**: Graceful handling of folder access errors
- **Loading states**: Clear loading indicators and status feedback

### 📋 Folder Configuration

The system automatically detects PDFs from these configured environment variables:

- `VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID` - Main PDFs folder
- `VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID` - Newsletter issues folder
- `VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID` - General content folder

### 🎯 Usage

1. Navigate to `/multi-drive-pdfs`
2. Click "Load All PDFs" button
3. View folder summary showing PDFs found in each drive
4. Browse by folder using tabs or view all PDFs together
5. Click any PDF to preview or open in Google Drive

## Technical Implementation

### Key Components

- **`useMultiDriveGoogleDrive.ts`**: Composable handling multi-folder PDF loading
- **`MultiDrivePdfBrowser.vue`**: Main UI component with folder tabs and PDF grid
- **`MultiDrivePdfBrowserPage.vue`**: Page wrapper for routing

### API Approach

Based on the working `usePublicGoogleDrive` composable:

```typescript
// Direct Google Drive API call with API key only
const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`;
```

### Error Handling

- Individual folder failures don't break the entire loading process
- Clear error messages per folder in the status summary
- Graceful fallbacks for missing thumbnails

## Benefits

1. **Centralized PDF access**: Single interface for all PDF collections
2. **No authentication hassles**: Works immediately without user login
3. **Scalable**: Automatically includes any new configured drive folders
4. **Organized**: Clear folder-based organization with visual indicators
5. **Fast**: Parallel loading of multiple folders

## Navigation

Added to the main navigation menu as "Multi-Drive PDFs" with folder icon.

## Future Enhancements

- Search across all PDFs
- Advanced filtering options
- Bulk download capabilities
- PDF metadata extraction
- Improved thumbnail generation
