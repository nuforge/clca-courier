# Newsletter Metadata Management System

## Overview

This document outlines the comprehensive metadata management system for CLCA Courier newsletters, covering automatic extraction, manual editing, and content processing capabilities.

## What Can Be Automatically Extracted

### From PDF Filename

- **Year**: Extracted from patterns like `2024.summer-conashaugh-courier.pdf` or `2024.08-conashaugh-courier.pdf`
- **Month**: 1-12 for monthly newsletters (e.g., `2024.08` → August 2024)
- **Season**: spring, summer, fall, winter for seasonal newsletters (normalized and validated)
- **Display Date**: Human-readable format ("August 2024", "Winter 2023")
- **Sort Value**: Numeric YYYYMM format for chronological sorting
- **Title**: Formatted from filename components
- **Issue Number**: Generated from parsed date information
- **Volume/Issue Numbers**: If present in filename (e.g., `vol1`, `issue2`)

### From PDF File Properties

- **File Size**: Exact byte count for storage optimization
- **Page Count**: Number of pages (requires PDF processing library)
- **Dimensions**: PDF page dimensions (width x height)
- **Creation Date**: Original PDF creation timestamp
- **Modification Date**: Last PDF modification
- **Content Type**: MIME type verification

### From PDF Content (Text Extraction)

- **Full Text Content**: Complete searchable text for indexing
- **Word Count**: Total words for content metrics
- **Key Terms**: Frequency analysis of significant terms
- **Topics**: Auto-categorized based on content patterns:
  - Community Events
  - Lake Activities
  - Wildlife & Nature
  - Property Matters
  - Recreation
  - Weather Updates
  - Local Business
  - Community News

### Auto-Generated Content

- **Description**: Standard format based on year/season
- **Tags**: Combination of:
  - Base tags: newsletter, conashaugh, courier
  - Temporal: season, year, decade (e.g., "2020s")
  - Content-derived: significant words from title/text
- **Publication Date**: Estimated based on season
- **Search Keywords**: Processed from extracted text
- **Thumbnails**: Generated placeholder SVGs (upgradeable to PDF screenshots)

## What Requires Manual Entry/Admin Input

### Editorial Content

- **Summary**: Featured content description for homepage
- **Featured Flag**: Homepage prominence indicator
- **Custom Description**: Override auto-generated description
- **Contributors**: List of writers, photographers, editors
- **Categories**: Fine-tuned content categorization

### Publication Details

- **Volume Number**: If not in filename
- **Issue Number**: If different from auto-generated
- **Custom Title**: Override extracted title
- **Publication Status**: Published/draft/archived

### Content Management

- **Custom Tags**: Additional searchable keywords
- **Priority Level**: Display ordering preference
- **Access Controls**: Public/member-only flags
- **Related Issues**: Cross-references to other newsletters

## Current Metadata Schema

```typescript
interface Newsletter {
  // Core identification (auto-extracted)
  id: string; // newsletter-YYYY-season or newsletter-YYYY-MM
  filename: string; // Original filename
  title: string; // Extracted/formatted title

  // Publication details (auto + manual)
  publicationDate: string; // ISO date (auto-estimated)
  issueNumber: string; // Human-readable format
  season?: 'spring' | 'summer' | 'fall' | 'winter'; // For seasonal newsletters
  month?: number; // 1-12 for monthly newsletters
  year: number; // Extracted year
  volume?: number; // Manual entry
  issue?: number; // Manual entry

  // Enhanced date fields for better sorting and display
  displayDate?: string; // Human-readable date (e.g., "August 2025", "Winter 2023")
  sortValue?: number; // Numeric value for sorting (YYYYMM format)

  // Content description (manual)
  description: string; // Auto-generated, editable
  summary?: string; // Manual for featured content
  featured: boolean; // Manual flag

  // File properties (auto-extracted)
  fileSize: number; // Bytes
  pageCount?: number; // PDF pages
  dimensions?: { width: number; height: number };
  contentType: string; // MIME type

  // Storage references (auto-generated)
  downloadUrl: string; // Firebase Storage URL or local path
  storageRef: string; // Storage path
  thumbnailUrl?: string; // Generated thumbnail

  // Text content (auto-extracted)
  searchableText?: string; // Full PDF text
  keyTerms: string[]; // Frequency analysis
  topics: string[]; // Auto-categorized
  wordCount: number; // Text metrics

  // Categorization (auto + manual)
  tags: string[]; // Auto + manual tags
  categories?: string[]; // Manual categorization
  contributors?: string[]; // Manual entry

  // Admin metadata (auto-managed)
  isPublished: boolean; // Visibility
  createdAt: string; // Upload timestamp
  updatedAt: string; // Last edit
  createdBy: string; // Who uploaded
  updatedBy: string; // Last editor

  // Sync status and data source tracking
  syncStatus?: 'synced' | 'local' | 'firebase' | 'unknown';
  dataSource?: {
    source: 'draft' | 'saved' | 'remote';
    color: string;
    icon: string;
  };
}
```

## Processing Workflow

### Phase 1: Initial Upload & Extraction

1. **File Upload**: PDFs uploaded to Firebase Storage (`newsletters/` path) or stored locally
2. **Basic Metadata**: Filename parsing and file property extraction using enhanced date parsing
3. **Date Enhancement**: Parse monthly (YYYY.MM) or seasonal (YYYY.season) formats
4. **Firestore Document**: Create initial document with auto-extracted data
5. **Thumbnail Generation**: Create placeholder SVG thumbnails

### Phase 2: Content Processing

1. **Text Extraction**: PDF text content extraction for search
2. **Topic Analysis**: Content-based categorization
3. **Key Terms**: Frequency analysis for search optimization
4. **Sync Status Detection**: Compare local enhanced metadata with Firebase data
5. **Quality Thumbnails**: Optional PDF-to-image conversion

### Phase 3: Editorial Enhancement

1. **Manual Review**: Admin interface for metadata editing with sync status indicators
2. **Content Curation**: Summary writing and categorization
3. **Feature Selection**: Homepage and priority assignment
4. **Publication Control**: Visibility and access management
5. **Batch Operations**: Date enhancement and database record creation

## New Features in Latest Version

### Enhanced Date Management

- **Monthly Newsletter Support**: Automatic parsing of `YYYY.MM` format filenames
- **Seasonal Newsletter Support**: Continued support for `YYYY.season` format
- **Display Date Generation**: Human-readable dates like "August 2025" or "Winter 2023"
- **Sort Value Calculation**: YYYYMM numeric format for proper chronological sorting
- **Month Filter**: New filtering option for monthly newsletters (1-12)

### Sync Status System

- **Real-time Sync Detection**: Compare enhanced JSON metadata with Firebase data
- **Visual Status Indicators**: Color-coded sync status in admin interface
- **Data Source Visualization**: Icons showing data origin (draft/saved/remote)
- **Comprehensive Hash Comparison**: Deep comparison of all changeable metadata fields

### Admin Interface Improvements

- **Monthly Filter Dropdown**: Filter newsletters by specific month (January-December)
- **Sync Status Column**: Visual indicators of sync state (synced/local/firebase/unknown)
- **Data Source Column**: Color-coded icons showing data source with tooltips
- **Batch Date Enhancement**: One-click date enhancement for all newsletters
- **Missing Record Creation**: Auto-create Firebase records for local PDFs

### Backend Services

- **Date Management Service**: Centralized date parsing and enhancement logic
- **Enhanced Newsletter Service**: Firebase operations with date enhancement capabilities
- **Firestore Extensions**: Support for `deleteField()` operations and enhanced metadata fields

## Available Scripts

### Metadata Extraction

```bash
# Extract all metadata from uploaded PDFs
node scripts/comprehensive-metadata-extraction.js

# Simple metadata extraction (basic version)
node scripts/extract-metadata-simple.js
```

### Content Processing

```bash
# Generate placeholder thumbnails
node scripts/generate-thumbnails.js

# Extract PDF text content (via admin interface)
# Access: /admin/pdf-extraction
```

### Admin Interface

```bash
# Metadata management dashboard
# Access: /admin/metadata

# Firebase demo tools
# Access: /admin/firebase-demo
```

## Admin Interface Features

### Metadata Dashboard (`/admin/metadata`)

- **Overview Statistics**: Total newsletters, processing status
- **Bulk Operations**: Extract all metadata, generate all thumbnails
- **Individual Actions**: Per-newsletter text extraction, thumbnail generation
- **Search & Filter**: By year, season, content status
- **Inline Editing**: Quick metadata updates

### Edit Capabilities

- **Basic Information**: Title, year, season, volume, issue
- **Content**: Description, summary, categories
- **Tags**: Add/remove searchable keywords
- **Flags**: Featured, published status
- **Contributors**: Manual contributor list management

## Future Enhancements

### Advanced Thumbnails

- Real PDF page screenshots using pdf2pic
- Multiple thumbnail sizes (small/medium/large)
- Automatic page selection (cover page detection)

### Enhanced Text Processing

- Named entity recognition (people, places, events)
- Automatic article segmentation
- Image description extraction via OCR

### Content Intelligence

- Duplicate content detection
- Cross-issue reference mapping
- Trending topic analysis

### Storage Optimization

- Web-optimized PDF generation
- Multi-tier storage (Firebase + external archive)
- Automatic compression and format conversion

## Getting Started

1. **Upload PDFs**: Place PDFs in Firebase Storage (`newsletters/` folder)
2. **Extract Metadata**: Run `node scripts/comprehensive-metadata-extraction.js`
3. **Review & Edit**: Use admin dashboard at `/admin/metadata`
4. **Generate Thumbnails**: Use bulk thumbnail generation
5. **Test Archive**: View results in newsletter archive at `/archive`

This system provides a comprehensive foundation for newsletter metadata management while maintaining flexibility for future enhancements and customization.
