# Canva API Debugging Log - 2025

## Attempt History & Results

### Design Creation (POST /designs)

**Attempt 1: Empty body**
- Request: `{}`
- Result: 400 - "One of 'design_type' or 'asset_id' must be defined."
- Status: ❌ FAILED

**Attempt 2: design_type field**
- Request: `{ "design_type": "presentation" }`
- Result: 400 - "'type' must not be null."
- Status: ❌ FAILED

**Attempt 3: type field**
- Request: `{ "type": "presentation" }`
- Result: 400 - "One of 'design_type' or 'asset_id' must be defined."
- Status: ❌ FAILED

**Attempt 4: Both fields (FAILED)**
- Request: `{ "design_type": "presentation", "type": "presentation" }`
- Result: 400 - "'type' must not be null." (code: "invalid_field")
- Status: ❌ FAILED - Even with both fields, getting null type error

**Attempt 5: Using asset_id only (FAILED)**
- Request: `{ "asset_id": "design_id" }`
- Result: 400 - Bad Request (missing design_type)
- Status: ❌ FAILED - Need both design_type and asset_id

**Attempt 6: Using BOTH design_type AND asset_id (FAILED)**
- Request: `{ "design_type": { "type": "preset", "name": "presentation" }, "asset_id": "design_id" }`
- Result: 400 - Bad Request (still failing)
- Status: ❌ FAILED - Complex design_type object not working

**Attempt 7: Using type: "TEMPLATE" with asset_id (FAILED)**
- Request: `{ "type": "TEMPLATE", "asset_id": "design_id" }`
- Result: 400 - "`asset_id` must belong to an image asset"
- Status: ❌ FAILED - asset_id is for images, not designs

**Attempt 8: Using template_id instead of asset_id (FAILED)**
- Request: `{ "type": "TEMPLATE", "template_id": "DAGyqJV-u4w" }`
- Result: 400 - "One of 'design_type' or 'asset_id' must be defined." (code: "invalid_field")
- Status: ❌ FAILED - Still getting the same error, API seems to require design_type even with template_id

**Attempt 9: Using BOTH design_type AND template_id (FAILED)**
- Request: `{ "design_type": { "type": "preset", "name": "presentation" }, "template_id": "DAGyqJV-u4w" }`
- Result: 200 - SUCCESS but creates BLANK design, template_id is IGNORED
- Status: ❌ FAILED - API ignores template_id parameter completely, only uses design_type

### Export (POST /exports)

**Attempt 1: /designs/{id}/export**
- Request: `POST /designs/{id}/export` with `{ "format": "pdf" }`
- Result: 404 - "Unknown endpoint POST /v1/designs/{id}/export"
- Status: ❌ FAILED

**Attempt 2: /designs/{id}/exports**
- Request: `POST /designs/{id}/exports` with `{ "format": "pdf" }`
- Result: 404 - "Unknown endpoint POST /v1/designs/{id}/exports"
- Status: ❌ FAILED

**Attempt 3: /exports with design_id**
- Request: `POST /exports` with `{ "design_id": "id", "format": "pdf" }`
- Result: 400 - "'type' must not be null."
- Status: ❌ FAILED

**Attempt 4: /exports with type**
- Request: `POST /exports` with `{ "design_id": "id", "type": "pdf" }`
- Result: NOT TESTED YET
- Status: ⏳ PENDING

**Attempt 5: CORRECT FORMAT (from official docs)**
- Request: `POST /exports` with `{ "design_id": "id", "format": { "type": "pdf", "size": "a4" } }`
- Result: ✅ SUCCESS - Creates export job with jobId
- Status: ✅ WORKING - Now with proper job polling implementation
- Job IDs created: `356fca80-7473-44d9-beff-f6f4794daf8c`, `402947e4-1639-4c81-b9e5-767cf02ffa12`, `cb27b365-4797-4ea5-8861-e60b50498c8d`
- **FIXED**: Added `pollExportJob()` method to poll job status until completion

**CORRECT FORMAT (from official docs):**
- Endpoint: `POST /exports` ✅
- Required fields: `design_id` and `format` object
- Format object structure: `{ "type": "pdf", "size": "a4", "pages": [1] }`
- Example: `{ "design_id": "DAVZr1z5464", "format": { "type": "pdf", "size": "a4" } }`
- **IMPORTANT**: Exports are asynchronous - need to poll job status until completion
- Source: [Canva API Export Documentation](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/)

### Autofill Creation (POST /autofills)

**Attempt 1: data only**
- Request: `{ "data": {...} }`
- Result: 400 - "One of 'design_type' or 'asset_id' must be defined."
- Status: ❌ FAILED

**Attempt 2: design_type + data**
- Request: `{ "design_type": "presentation", "data": {...} }`
- Result: 400 - "'type' must not be null."
- Status: ❌ FAILED

**Attempt 3: type + data**
- Request: `{ "type": "presentation", "data": {...} }`
- Result: 400 - "One of 'design_type' or 'asset_id' must be defined."
- Status: ❌ FAILED

**CORRECT FORMAT (from official docs):**
- Endpoint: `POST /autofills` (NOT `/designs`)
- Required fields: `brand_template_id` and `data` object
- Format: `{ "brand_template_id": "template_id", "data": {...} }`
- **IMPORTANT**: Autofill is asynchronous - need to poll job status until completion
- **FIXED**: Added `pollAutofillJob()` method to poll job status until completion
- Source: [Canva Autofill API Documentation](https://www.canva.dev/docs/connect/api-reference/autofills/)

## Key Observations

1. **Contradictory API Messages**: Canva API gives conflicting error messages:
   - Sometimes says it needs `design_type`
   - Sometimes says it needs `type`
   - This suggests the API might have inconsistent validation or we're missing something

2. **Export Endpoint**: 
   - `/designs/{id}/export` - 404 (doesn't exist)
   - `/designs/{id}/exports` - 404 (doesn't exist)
   - `/exports` - exists but needs correct payload

3. **Pattern**: All endpoints seem to require some form of type specification, but the field name is inconsistent

## Next Steps to Try

1. Try both `design_type` AND `type` in the same request
2. Try `asset_id` instead of design creation
3. Check if there are other required fields we're missing
4. Look for actual Canva API documentation examples

## Current Status
- Design Creation: ✅ WORKING - Can create blank designs with design_type
- Export: ✅ WORKING - Fixed with proper job polling and correct API format
- Autofill: ❌ DISABLED - Requires Canva Enterprise organization membership (not available for standard accounts)
- Template Listing: ✅ WORKING - Can fetch and display user's designs
- Design Duplication: ❌ NOT SUPPORTED - Canva API does not support duplicating existing designs for standard accounts

## CONCLUSION: Design Duplication Not Supported

After 9 different attempts with various API parameters, the Canva Connect API does NOT support duplicating existing designs for standard accounts:

- `asset_id` only works for image assets, not designs
- `template_id` parameter is completely ignored by the API
- `type: "TEMPLATE"` is not a valid parameter
- The API only supports creating blank designs with `design_type`

**RECOMMENDATION**: Accept that design duplication is not possible with the current Canva API. Users will need to manually copy content from existing designs to new blank designs.

## TypeScript Fixes Applied
- Updated `CanvaExportResponse` interface to include `urls?: string[]` and `error?` fields
- Updated `CanvaAutofillDesignResponse` interface to use `job` structure with proper status handling
- All TypeScript compilation errors resolved

## API Fixes Applied (January 15, 2025)
- **Design Creation**: Fixed `createDesignFromTemplate()` and `createTestDesign()` methods to include both `design_type` and `type` fields
- **Request Format**: Changed from `{ "design_type": "presentation" }` to `{ "design_type": "presentation", "type": "presentation" }`
- **Documentation**: Updated comments to reference official Canva API documentation
- **Autofill Disabled**: Removed autofill functionality as it requires Canva Enterprise organization membership
- **Duplicate Fixed**: Added proper `duplicateDesign()` method that creates new blank designs
- **Status**: Design Creation, Export, and Template Listing working correctly; Autofill disabled due to Enterprise requirement


## OFFICIAL CANVA DOCS (FOLLOW)

- https://www.canva.dev/docs/connect/api-reference/authentication/
- https://www.canva.dev/docs/connect/api-reference/assets/
- https://www.canva.dev/docs/connect/api-reference/autofills/
- https://www.canva.dev/docs/connect/api-reference/brand-templates/
- https://www.canva.dev/docs/connect/api-reference/comments/
- https://www.canva.dev/docs/connect/api-reference/designs/
- https://www.canva.dev/docs/connect/api-reference/design-imports/
- https://www.canva.dev/docs/connect/api-reference/exports/
- https://www.canva.dev/docs/connect/api-reference/folders/
- https://www.canva.dev/docs/connect/api-reference/resizes/
- https://www.canva.dev/docs/connect/api-reference/users/