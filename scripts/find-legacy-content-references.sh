#!/bin/bash
# Legacy Content System Reference Scanner
# Bash script to find all legacy UserContent system references
# Usage: ./find-legacy-content-references.sh

echo "🔍 LEGACY CONTENT SYSTEM REFERENCE SCANNER"
echo "========================================="
echo ""

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Define search directories
SEARCH_DIRS=("src" "tests" "docs")
EXCLUDE_DIRS="node_modules|dist|\.quasar|\.git"

# Function to search for pattern
search_pattern() {
    local pattern="$1"
    local category="$2"
    
    # Use grep with appropriate flags
    # -r: recursive, -n: line numbers, -H: filename, -E: extended regex
    # --include: only search specific file types
    # --exclude-dir: exclude certain directories
    
    local files=$(grep -rHn \
        --include="*.ts" --include="*.vue" --include="*.js" --include="*.md" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.quasar --exclude-dir=.git \
        -E "$pattern" "${SEARCH_DIRS[@]}" 2>/dev/null | cut -d: -f1 | sort -u)
    
    echo "$files"
}

# Define patterns and search
declare -A PATTERNS=(
    ["UserContent Interface/Type"]="UserContent(\[\]|\|)?"
    ["Legacy Collection Names"]="userContent|content_submissions|approvalQueue"
    ["Legacy Method Calls"]="getPendingContent|getPublishedContent|getApprovedContent|getPublishedContentAsNewsItems|getApprovedContentAsNewsItems"
    ["Legacy Subscriptions"]="subscribeToPendingContent|subscribeToPublishedContent|subscribeToApprovedContent"
    ["Legacy Constants"]="USER_CONTENT|APPROVAL_QUEUE"
    ["Legacy Conversion Methods"]="ToNewsItem|ToClassified|ToEvent|AsNewsItems"
    ["Legacy Translation Keys"]="userContent|pending.*content|approved.*content"
    ["Legacy Imports"]="import.*UserContent|from.*UserContent"
)

# Main scanning process
total_categories=${#PATTERNS[@]}
categories_with_refs=0
total_files=0

for category in "${!PATTERNS[@]}"; do
    echo -e "${CYAN}🔍 Scanning for: $category${NC}"
    
    pattern="${PATTERNS[$category]}"
    files=$(search_pattern "$pattern" "$category")
    
    if [ -n "$files" ]; then
        file_count=$(echo "$files" | wc -l)
        categories_with_refs=$((categories_with_refs + 1))
        total_files=$((total_files + file_count))
        
        echo -e "   ${RED}Found $file_count references${NC}"
        
        # Show files for this category
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                # Remove leading ./ if present and show relative path
                clean_file=$(echo "$file" | sed 's|^\./||')
                echo -e "     ${GRAY}📄 $clean_file${NC}"
            fi
        done <<< "$files"
    else
        echo -e "   ${GREEN}✅ No references found${NC}"
    fi
    echo ""
done

# Summary
echo -e "${YELLOW}📊 SCAN SUMMARY${NC}"
echo -e "${YELLOW}===============${NC}"
echo "Total categories scanned: $total_categories"
echo "Categories with references: $categories_with_refs"
echo "Total files with legacy references: $total_files"
echo ""

if [ $categories_with_refs -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL: Legacy references found!${NC}"
    echo -e "${RED}The following categories need cleanup:${NC}"
    
    for category in "${!PATTERNS[@]}"; do
        pattern="${PATTERNS[$category]}"
        files=$(search_pattern "$pattern" "$category")
        if [ -n "$files" ]; then
            file_count=$(echo "$files" | wc -l)
            echo -e "  ${RED}❌ $category ($file_count references)${NC}"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Review the comprehensive removal plan: docs/LEGACY_CONTENT_SYSTEM_COMPREHENSIVE_REMOVAL_PLAN.md"
    echo "2. Start with Phase 1: Interface & Type Cleanup"
    echo "3. Use the field mapping guide for replacements"
    echo "4. Test each change thoroughly"
    echo "5. Re-run this scanner after each phase"
else
    echo -e "${GREEN}🎉 SUCCESS: No legacy content references found!${NC}"
    echo -e "${GREEN}The legacy content system has been successfully eliminated.${NC}"
fi

echo ""
echo -e "${CYAN}📖 For detailed guidance, see:${NC}"
echo "   docs/LEGACY_CONTENT_SYSTEM_COMPREHENSIVE_REMOVAL_PLAN.md"
echo "   docs/LEGACY_CONTENT_REMOVAL_DOCUMENTATION.md"
