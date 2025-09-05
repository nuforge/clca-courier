# 🚨 CRITICAL DEVELOPMENT RULES - DO NOT VIOLATE 🚨

**CREATED:** August 17, 2025  
**LAST UPDATED:** September 5, 2025  
**PURPOSE:** Permanent record of user-enforced development rules  
**PRIORITY:** HIGHEST - These rules override all other considerations

---

## ❌ ABSOLUTE PROHIBITIONS ❌

### 1. HASH MODE ROUTING 🚫

- **RULE**: NEVER USE HASH MODE
- **WHY**: User explicitly stated "NEVER USE HASH MODE" and "WE ARE IN HISTORY MODE"
- **EXAMPLES**:
  - ✅ **CORRECT**: `http://localhost:9000/archive`
  - ❌ **WRONG**: `http://localhost:9000/#/archive`
- **IMPACT**: Application uses history mode routing exclusively

### 2. HARDCODED/STATIC DATA 🚫

- **RULE**: NO MORE STATIC TEST DATA. EVER!!!
- **WHY**: User repeatedly emphasized "NO HARDCODED LISTS!!! NEVER! NEVER!" and "DYNAMICALLY PULL THE FUCKING DATA!"
- **EXAMPLES**:
  - ❌ **WRONG**: Arrays of PDF filenames like `['2024.01-newsletter.pdf', '2024.02-newsletter.pdf']`
  - ❌ **WRONG**: JSON files with issue lists or newsletter data
  - ❌ **WRONG**: Hardcoded file lists in services
  - ✅ **CORRECT**: Firebase-first data discovery with dynamic content loading
  - ✅ **CORRECT**: Multi-tier storage with API-driven content management
  - ✅ **CORRECT**: Real-time Firestore subscriptions for content updates
- **IMPACT**: All content must be discovered from Firebase services or API endpoints
- **UPDATED**: September 5, 2025 - Enhanced for Firebase-first multi-tier storage architecture

### 3. THEME INTERFERENCE 🚫

- **RULE**: NEVER HARDCODE BACKGROUND COLORS OR THEME-SPECIFIC STYLES
- **WHY**: User enforced "stop setting background colors. You keep fucking up with the dark theme"
- **EXAMPLES**:
  - ❌ **WRONG**: `background-color: #f5f5f5` or any hardcoded colors
  - ❌ **WRONG**: `style="background: white"` or similar theme assumptions
  - ❌ **WRONG**: CSS classes that force light/dark theme colors
  - ✅ **CORRECT**: Use Quasar's theme-aware color classes (`bg-primary`, `text-on-dark`, etc.)
  - ✅ **CORRECT**: Let components inherit theme colors naturally
  - ✅ **CORRECT**: Use CSS variables that adapt to theme
- **IMPACT**: All styling must respect user's chosen light/dark theme
- **ADDED**: September 4, 2025 - After PDF tool theme conflicts

### 4. RESPONSIVE LAYOUT GUTTER VIOLATIONS 🚫

- **RULE**: NEVER USE `q-gutter-*` CLASSES WITH PRECISE COLUMN LAYOUTS
- **WHY**: User experienced consistent column overflow: "4 columns will have 3 cols on one row and the fourth on the next"
- **ROOT CAUSE**: `q-gutter` classes add margin that breaks 12-column grid math on widescreen monitors
- **EXAMPLES**:
  - ❌ **WRONG**: `<div class="row q-gutter-md"><div class="col-12 col-md-6">`
  - ❌ **WRONG**: `<div class="row q-gutter-lg"><div class="col-12 col-sm-4">`
  - ✅ **CORRECT**: `<div class="row"><div class="col-12 col-md-6 q-pa-md">`
  - ✅ **CORRECT**: `<div class="row"><div class="col-12 col-sm-4 q-pa-md">`
- **IMPACT**: All responsive layouts must use padding-based spacing instead of margin-based gutters
- **ADDED**: September 5, 2025 - After systematic site-wide responsive layout fixes

### 5. PATH ASSUMPTIONS 🚫

- **RULE**: ALWAYS VERIFY BEFORE IMPLEMENTING
- **WHY**: User was frustrated: "SHOULDN'T YOU UFKCING CHECK OR KNOW ALL PATHING! ARE YOU JUST GUESSING!?"
- **EXAMPLES**:
  - ❌ **WRONG**: Assuming `/webviewer` directory exists without checking
  - ❌ **WRONG**: Referencing file paths without verification
  - ✅ **CORRECT**: Using `list_dir`, `file_search`, `grep_search` to verify existence
  - ✅ **CORRECT**: Checking actual file structure before making changes
- **IMPACT**: Must verify all paths, directories, and files before referencing them

---

## 💰 MULTI-TIER STORAGE STRATEGY (TENTATIVE) 💰

### 7. COST-OPTIMIZED PDF STORAGE 💰

- **RULE**: IMPLEMENT MULTI-TIER STORAGE FOR COST EFFICIENCY
- **WHY**: Separate fast delivery from cheap storage to optimize costs while maintaining performance
- **ARCHITECTURE**:
  - **Tier 1 (Firebase Storage)**: Web-optimized PDFs, thumbnails - fast CDN delivery
  - **Tier 2 (External Storage)**: High-quality PDFs via Backblaze B2/Cloudflare R2 - cheap archive
  - **Smart Routing**: Automatic tier selection based on user action (view vs. download)
- **EXAMPLES**:
  - ✅ **CORRECT**: Web version for viewing (compressed, fast loading)
  - ✅ **CORRECT**: Archive version for downloading (full quality, cost-effective storage)
  - ✅ **CORRECT**: Firebase thumbnails for instant preview
  - ❌ **WRONG**: Single storage tier for all use cases
  - ❌ **WRONG**: High-quality files for web viewing (slow + expensive)
- **BENEFITS**: 70-90% cost reduction with maintained user experience
- **STATUS**: Implementation pending - architecture planned for Phase 1

### 8. STORAGE PROVIDER SELECTION 📦

- **RULE**: PRIORITIZE COST-EFFECTIVE EXTERNAL STORAGE FOR ARCHIVES
- **RECOMMENDATIONS**:
  - **Primary**: Backblaze B2 ($0.005/GB/month + $0.01/GB download)
  - **Secondary**: Cloudflare R2 (FREE egress, $0.015/GB/month storage)
  - **Alternative**: DigitalOcean Spaces (fixed $5/month for predictable costs)
- **INTEGRATION**: S3-compatible APIs for seamless Firebase integration
- **DECISION**: User preference will determine final provider selection

---

## ✅ MANDATORY PRACTICES ✅

### DYNAMIC EVERYTHING

- All PDF discovery must use Firebase services with real-time subscriptions
- Newsletter loading from Firebase Firestore metadata + Storage URLs
- Content generation from actual Firebase-hosted PDFs and metadata
- Multi-tier storage routing based on user actions and file optimization

### FIREBASE-FIRST ARCHITECTURE

- All data operations through Firebase services (Firestore, Storage, Functions)
- Real-time subscriptions for content updates and metadata changes
- API-agnostic service layer for clean separation of concerns
- Multi-tier storage integration maintaining Firebase ecosystem benefits

### VERIFICATION FIRST

- Check if directories exist before referencing them
- Test URLs before using them in code
- Validate file paths before making assumptions
- Use available tools to inspect file structure

### HISTORY MODE ONLY

- Application routing uses history mode exclusively
- Never use hash-based routing URLs
- All testing and browser opening must use clean URLs

---

## 🔥 USER FRUSTRATION TRIGGERS 🔥

**These behaviors caused significant user frustration and must be avoided:**

1. **Making assumptions about file paths without checking**
2. **Using hardcoded lists when dynamic discovery was demanded**
3. **Using hash mode URLs when history mode was specified**
4. **Repeating the same mistakes after being corrected**
5. **Not learning from previous corrections in the same session**

---

## 📋 IMPLEMENTATION CHECKLIST

Before implementing any feature:

- [ ] ✅ Verified all file paths exist using appropriate tools
- [ ] ✅ Used dynamic discovery instead of hardcoded data
- [ ] ✅ Used history mode URLs exclusively
- [ ] ✅ Checked actual directory structure
- [ ] ✅ No static arrays or JSON files for content
- [ ] ✅ All content generated from real files

---

**REMEMBER**: These rules are absolute and take priority over all other considerations. Violating them causes significant user frustration and project delays.
