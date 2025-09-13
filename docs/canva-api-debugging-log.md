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

**Attempt 4: Both fields**
- Request: `{ "design_type": "presentation", "type": "presentation" }`
- Result: NOT TESTED YET
- Status: ⏳ PENDING

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
- Design Creation: ❌ Still failing with contradictory errors
- Export: ❌ Still failing with contradictory errors  
- Autofill: ❌ Still failing with contradictory errors
