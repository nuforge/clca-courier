# Site Store Simple - Data Migration Summary

## Overview

Updated the `site-store-simple.ts` to include all issues from the `public/issues` directory and migrated from hard-coded data to JSON-based data loading that simulates API calls.

## Changes Made

### 1. Created New Data Files

#### `src/data/issues.json`

- Contains all 7 issues from the `public/issues` directory
- Includes metadata: id, title, date, pages, url, filename
- Issues include:
  - July 2025 (7.2025.pdf)
  - June 2025 (Courier - 2025.06 - June.pdf)
  - Winter 2022 (Conashaugh Winter 2022 Web.pdf)
  - Summer 2022 (CONASHAUGH SUMMER 2022 Web.pdf)
  - Winter 2021 (CONASHAUGH WINTER 2021.pdf)
  - Winter 2019 (CL WINTER 2019 WEB.pdf)
  - Winter 2018 (CL WINTER 2018 web.pdf)

#### `src/data/community-stats.json`

- Extracted community statistics from hard-coded data
- Contains: households, lakes, yearsPublished, issuesPerYear

### 2. Created Data Service

#### `src/services/data-service.ts`

- New service to simulate API calls by loading JSON files
- Includes artificial delay to simulate network requests
- Functions:
  - `getNewsItems()` - loads from news.json
  - `getClassifieds()` - loads from classifieds.json
  - `getEvents()` - loads from events.json
  - `getArchivedIssues()` - loads from issues.json
  - `getCommunityStats()` - loads from community-stats.json

### 3. Updated Site Store

#### Modified `src/stores/site-store-simple.ts`

- **Removed**: All hard-coded sample data
- **Added**: Import and usage of data service
- **Added**: Loading state management (`isLoading`)
- **Added**: Async data loading functions
- **Added**: Error handling for data loading
- **Added**: Automatic data initialization on store creation

#### New Store Features:

- `isLoading` - tracks data loading state
- `loadAllData()` - loads all data in parallel
- Individual loading functions for each data type
- Proper error handling and logging

### 4. Data Flow Changes

#### Before:

```typescript
// Hard-coded arrays
const newsItems = ref<NewsItem[]>([
  { id: 'news-001', title: '...', ... },
  // ... more items
]);
```

#### After:

```typescript
// Empty arrays, populated via API simulation
const newsItems = ref<NewsItem[]>([]);

// Async loading
async function loadAllData() {
  const [news, ...] = await Promise.all([
    dataService.getNewsItems(),
    // ... other data
  ]);
  newsItems.value = news;
}
```

## Benefits

1. **Scalability**: Easy to switch from JSON files to real API endpoints
2. **Completeness**: All issues from public directory are now included
3. **Maintainability**: Data separated from logic, easier to update
4. **Performance**: Parallel loading of all data
5. **Error Handling**: Proper error handling and loading states
6. **Development**: Simulates real-world API usage patterns

## Migration Path to Real API

When ready to use real APIs, simply update the data service functions:

```typescript
// Current (JSON files)
async getNewsItems(): Promise<NewsItem[]> {
  return newsData as NewsItem[];
}

// Future (Real API)
async getNewsItems(): Promise<NewsItem[]> {
  const response = await fetch('/api/news');
  return response.json();
}
```

## Testing

Created `src/test-store-data-loading.html` to verify:

- All data loads correctly
- All 7 issues are included
- Error handling works
- Loading states function properly

## Compatibility

- Maintains same interface as before
- All existing computed properties work unchanged
- No breaking changes to components using the store
- Separated from existing `api-service.ts` to avoid conflicts
