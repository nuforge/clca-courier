# 🚨 COMPLETE DATE HANDLING STANDARDIZATION PLAN

## STATUS: CRITICAL VIOLATIONS IDENTIFIED (200+ INSTANCES)

### ✅ FIXED (Major Calendar Issues)
- ✅ **CalendarEventCard.vue**: Lines 232, 240, 247 - Using `parseDateOnly()` 
- ✅ **calendar-events.service.ts**: Lines 212-213, 365, 367-368 - Using `parseDateOnly()`
- ✅ **useCalendar.ts**: Lines 26-27 - Using `getCurrentMonth()`, `getCurrentYear()`
- ✅ **CommunityCalendarPage.vue**: Custom `formatSelectedDate` fixed
- ✅ **date-formatter.ts**: Enhanced with `parseDateOnly()`, `getCurrentYear()`, `getCurrentMonth()`, `compareDates()`

### 🚨 REMAINING CRITICAL VIOLATIONS (Must Fix)

#### 1. **Calendar/Event Components**
- [ ] **useCalendar.ts** Lines 40, 83-84, 185-186 - Multiple `new Date()` calls
- [ ] **EventDetailsDialog.vue** Line 275 - Using centralized `formatDate()` ✅ (already good)

#### 2. **Composables with Raw Date Operations**
- [ ] **useHybridNewsletters.ts** Lines 149, 163 - `new Date(b.date).getTime() - new Date(a.date).getTime()`
- [ ] **useFirebaseNewsletterArchive.ts** Lines 197-199, 407, 460 - Raw date comparisons
- [ ] **useLatestNewsletter.ts** Line 39 - `new Date(newsletter.publicationDate)`
- [ ] **useContentManagement.ts** Lines 784, 786 - `.getTime()` comparisons

#### 3. **Services with Date Logic**
- [ ] **firebase-firestore.service.ts** Lines 693, 1219 - Raw date operations
- [ ] **date-management.service.ts** Lines 103, 108, 123, 128, 164 - Custom date creation
- [ ] **external-image-service.ts** Lines 163, 242 - Timestamp handling

#### 4. **Stores with Date Sorting**
- [ ] **site-store-simple.ts** Lines 54, 61-62 - Raw date comparisons for sorting
- [ ] **table-settings.store.ts** Lines 36, 57, 73 - Timestamp generation

#### 5. **Components with Custom Date Functions**
- [ ] **MetadataPreview.vue** Lines 165-166 - Custom `formatDate` function
- [ ] **ProjectMetadataFields.vue** Lines 68, 77 - Manual date conversion
- [ ] **PhotoStoryMetadataFields.vue** Lines 60, 69 - Manual date conversion
- [ ] **EventMetadataFields.vue** Lines 230, 246, 273-276, 289, 323 - Multiple violations
- [ ] **FirebaseNewsletterCard.vue** Lines 227-228 - `new Date(props.newsletter.publicationDate)`

#### 6. **Utility Files**
- [ ] **newsletter-accessors.ts** Lines 89-93 - Multiple fallback date generation
- [ ] **pdfThumbnailGenerator.ts** Lines 65, 129, 144 - `Date.now()` usage
- [ ] **pdfProcessor.ts** Lines 78, 121, 134 - `Date.now()` usage

### 📋 STANDARDIZATION PATTERNS TO APPLY

#### Replace These Patterns:
```javascript
// ❌ FORBIDDEN
new Date(dateString)                    → parseDateOnly(dateString) 
new Date().getFullYear()               → getCurrentYear()
new Date().getMonth() + 1              → getCurrentMonth()
Date.now()                             → getCurrentTimestamp()
new Date(a).getTime() - new Date(b).getTime() → compareDates(a, b)
date.toLocaleDateString()              → formatDate(date, 'LONG')
new Date().toISOString()               → formatDate(new Date(), 'ISO')
```

#### With These Functions:
```javascript
// ✅ REQUIRED
import { 
  parseDateOnly, 
  getCurrentYear, 
  getCurrentMonth, 
  getCurrentTimestamp,
  compareDates,
  formatDate,
  formatDateTime 
} from '../utils/date-formatter';
```

### 🔥 IMMEDIATE ACTIONS NEEDED

1. **Test Current Calendar Fix**: Verify Sept 26 vs Sept 25 issue is resolved
2. **Systematic Replacement**: Replace all 200+ violations with centralized functions
3. **Import Standardization**: Add imports to all affected files
4. **Remove Custom Functions**: Delete all custom `formatDate` functions in components
5. **Update Documentation**: Document the standardized patterns

### 📊 FILES REQUIRING UPDATES (46 Files)

**High Priority (Calendar/Event Related):**
- src/composables/useCalendar.ts
- src/composables/useHybridNewsletters.ts  
- src/composables/useFirebaseNewsletterArchive.ts
- src/services/date-management.service.ts
- src/stores/site-store-simple.ts

**Medium Priority (Components):**
- src/components/contribution/MetadataPreview.vue
- src/components/contribution/metadata/*.vue (4 files)
- src/components/FirebaseNewsletterCard.vue

**Low Priority (Utilities/Misc):**
- src/utils/newsletter-accessors.ts
- src/utils/pdf*.ts (2 files)
- src/stores/table-settings.store.ts

### 🎯 SUCCESS CRITERIA

1. **Zero** `new Date()` calls outside of centralized date-formatter
2. **Zero** `.getTime()`, `.getFullYear()`, `.getMonth()` outside of centralized functions
3. **Zero** custom `formatDate` functions in components
4. **Calendar dates consistent** between selection and event display
5. **All date operations** go through centralized utility

**ESTIMATED EFFORT**: 2-3 hours to systematically replace all violations
**RISK**: High - Timezone issues affecting user experience until completed
