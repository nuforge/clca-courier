# Legacy Content System Reference Scanner
# PowerShell script to find all legacy UserContent system references
# Usage: .\find-legacy-content-references.ps1

Write-Host "LEGACY CONTENT SYSTEM REFERENCE SCANNER" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Define search patterns
$patterns = @{
    "UserContent Interface/Type" = @("UserContent")
    "Legacy Collection Names" = @("userContent", "content_submissions", "approvalQueue")
    "Legacy Method Calls" = @("getPendingContent", "getPublishedContent", "getApprovedContent")
    "Legacy Subscriptions" = @("subscribeToPendingContent", "subscribeToPublishedContent")
    "Legacy Constants" = @("USER_CONTENT", "APPROVAL_QUEUE")
    "Legacy Conversion Methods" = @("ToNewsItem", "ToClassified", "ToEvent", "AsNewsItems")
    "Legacy Translation Keys" = @("userContent")
    "Legacy Imports" = @("import.*UserContent", "from.*UserContent")
}

# Define search directories
$searchDirs = @("src", "tests", "docs")
$excludeDirs = @("node_modules", "dist", ".quasar", ".git")

# Function to search for patterns
function Search-Pattern {
    param(
        [string]$pattern,
        [string[]]$directories,
        [string[]]$extensions = @("*.ts", "*.vue", "*.js", "*.md", "*.json")
    )
    
    $results = @()
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            foreach ($ext in $extensions) {
                $files = Get-ChildItem -Path $dir -Recurse -Include $ext | Where-Object {
                    $exclude = $false
                    foreach ($excludeDir in $excludeDirs) {
                        if ($_.FullName -like "*\$excludeDir\*") {
                            $exclude = $true
                            break
                        }
                    }
                    return -not $exclude
                }
                
                foreach ($file in $files) {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    if ($content -and $content -match $pattern) {
                        $results += @{
                            File = $file.FullName.Replace((Get-Location).Path + "\", "")
                            Pattern = $pattern
                        }
                    }
                }
            }
        }
    }
    return $results
}

# Main scanning process
$allResults = @{}
$totalFiles = 0

foreach ($category in $patterns.Keys) {
    Write-Host "Scanning for: $category" -ForegroundColor Cyan
    $categoryResults = @()
    
    foreach ($pattern in $patterns[$category]) {
        $results = Search-Pattern -pattern $pattern -directories $searchDirs
        foreach ($result in $results) {
            $categoryResults += $result
            $totalFiles++
        }
    }
    
    if ($categoryResults.Count -gt 0) {
        $allResults[$category] = $categoryResults
        Write-Host "   Found $($categoryResults.Count) references" -ForegroundColor Red
        
        # Show files for this category
        $uniqueFiles = $categoryResults | Group-Object -Property File | ForEach-Object { $_.Name }
        foreach ($file in $uniqueFiles) {
            Write-Host "     $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No references found" -ForegroundColor Green
    }
    Write-Host ""
}

# Summary
Write-Host "SCAN SUMMARY" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow
Write-Host "Total categories scanned: $($patterns.Keys.Count)"
Write-Host "Categories with references: $($allResults.Keys.Count)"
Write-Host "Total files with legacy references: $totalFiles"
Write-Host ""

if ($allResults.Keys.Count -gt 0) {
    Write-Host "CRITICAL: Legacy references found!" -ForegroundColor Red
    Write-Host "The following categories need cleanup:" -ForegroundColor Red
    foreach ($category in $allResults.Keys) {
        Write-Host "  - $category ($($allResults[$category].Count) references)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Review the comprehensive removal plan: docs/LEGACY_CONTENT_SYSTEM_COMPREHENSIVE_REMOVAL_PLAN.md"
    Write-Host "2. Start with Phase 1: Interface & Type Cleanup"
    Write-Host "3. Use the field mapping guide for replacements"
    Write-Host "4. Test each change thoroughly"
    Write-Host "5. Re-run this scanner after each phase"
} else {
    Write-Host "SUCCESS: No legacy content references found!" -ForegroundColor Green
    Write-Host "The legacy content system has been successfully eliminated." -ForegroundColor Green
}

Write-Host ""
Write-Host "For detailed guidance, see:" -ForegroundColor Cyan
Write-Host "   docs/LEGACY_CONTENT_SYSTEM_COMPREHENSIVE_REMOVAL_PLAN.md"
Write-Host "   docs/LEGACY_CONTENT_REMOVAL_DOCUMENTATION.md"
