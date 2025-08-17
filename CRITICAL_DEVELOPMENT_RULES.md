# 🚨 CRITICAL DEVELOPMENT RULES - DO NOT VIOLATE 🚨

**CREATED:** August 17, 2025  
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
  - ✅ **CORRECT**: Dynamic discovery using pattern matching + HTTP validation
  - ✅ **CORRECT**: File system scanning and API calls
- **IMPACT**: All content must be discovered from actual files that exist

### 3. PATH/FILE ASSUMPTIONS 🚫

- **RULE**: ALWAYS VERIFY BEFORE IMPLEMENTING
- **WHY**: User was frustrated: "SHOULDN'T YOU UFKCING CHECK OR KNOW ALL PATHING! ARE YOU JUST GUESSING!?"
- **EXAMPLES**:
  - ❌ **WRONG**: Assuming `/webviewer` directory exists without checking
  - ❌ **WRONG**: Referencing file paths without verification
  - ✅ **CORRECT**: Using `list_dir`, `file_search`, `grep_search` to verify existence
  - ✅ **CORRECT**: Checking actual file structure before making changes
- **IMPACT**: Must verify all paths, directories, and files before referencing them

---

## ✅ MANDATORY PRACTICES ✅

### DYNAMIC EVERYTHING

- All PDF discovery must use pattern matching + HTTP validation
- Newsletter loading from actual files in `/public/issues/` directory
- Content generation from real PDFs, not fake data
- No hardcoded lists anywhere in the codebase

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
