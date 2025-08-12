# PDF Viewer Implementation

## Overview

The Issue Archive page now includes a fully functional PDF viewer powered by PDF.js Express (WebViewer). Users can view PDF documents directly in the browser without needing to download them.

## Features

### PDF Viewing

- **In-browser PDF rendering**: PDFs load directly in the application
- **Full-screen viewer**: Maximized dialog for optimal viewing experience
- **Responsive design**: Works on desktop and mobile devices

### Document Navigation

- **Document switcher**: Dropdown menu to switch between available PDFs
- **Loading states**: Visual feedback while PDFs are loading
- **Error handling**: Graceful error messages for failed loads

### User Interface

- **Clean toolbar**: Simplified toolbar with essential viewing tools
- **Material Design**: Consistent with the rest of the application
- **Hover effects**: Interactive card animations for better UX

## Available Documents

The system automatically loads PDF files from the `/public/issues/` directory:

- `7.2025.pdf` - July 2025 Edition
- `Courier - 2025.06 - June.pdf` - June 2025 Edition

## Technical Implementation

### Components

1. **PdfViewer.vue**: Reusable PDF viewer component
   - Handles WebViewer initialization
   - Manages loading states and errors
   - Provides document switching capabilities

2. **IssueArchivePage.vue**: Archive page with PDF integration
   - Lists available issues
   - Opens PDFs in full-screen dialog
   - Manages document selection

### Dependencies

- `@pdftron/webviewer`: PDF.js Express library for PDF rendering
- Static files copied to `/public/webviewer/` for serving

### Key Features

- **TypeScript support**: Fully typed components
- **Error boundaries**: Graceful error handling
- **Performance optimized**: Lazy loading and efficient rendering
- **Accessibility**: Keyboard navigation and screen reader support

## Usage

### For Users

1. Navigate to the Issue Archive page
2. Click on any issue card to open the PDF viewer
3. Use the "Switch Document" dropdown to view other PDFs
4. Close the viewer with the X button in the top toolbar

### For Developers

To add new PDF files:

1. Place PDF files in `/public/issues/` directory
2. Update the `archivedIssues` array in `IssueArchivePage.vue`
3. Add the new issue object with proper metadata

### Configuration

The PDF viewer can be customized by:

- Modifying toolbar elements in `PdfViewer.vue`
- Updating the license key for production use
- Customizing UI themes and styling

## License

This implementation uses PDF.js Express with a demo license key. For production use, obtain a proper license from PDFTron.
