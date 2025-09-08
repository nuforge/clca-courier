#!/usr/bin/env node

/**
 * DATA TYPE ALIGNMENT CHECKER
 * Scans codebase for type mismatches and undefined handling issues
 */

import fs from 'fs';
import path from 'path';

const PROBLEMATIC_PATTERNS = [
  // Undefined handling issues
  /\.id(?!\s*[=:])/g, // accessing .id without null check
  /\?\.\w+(?!\?)/g, // optional chaining without proper fallback
  /:\s*undefined/g, // explicit undefined assignments
  /setDoc\([^)]+\)/g, // Firebase setDoc calls (need validation)

  // Type casting issues
  /as\s+any/g, // any type casts
  /as\s+unknown\s+as/g, // double casting
  /@ts-ignore/g, // TypeScript ignore comments

  // Interface mismatches
  /interface\s+\w+Newsletter/g, // Multiple newsletter interfaces
  /type\s+\w+Newsletter/g, // Multiple newsletter types
];

const TYPE_DEFINITION_FILES = [
  'src/types/**/*.ts',
  'src/services/**/*.ts',
  'src/composables/**/*.ts',
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  PROBLEMATIC_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        pattern: pattern.toString(),
        matches: matches.length,
        examples: matches.slice(0, 3),
      });
    }
  });

  return issues;
}

function scanDirectory(dir, issues = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.')) {
      scanDirectory(filePath, issues);
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      const fileIssues = scanFile(filePath);
      issues.push(...fileIssues);
    }
  });

  return issues;
}

function generateReport() {
  console.log('🔍 SCANNING FOR DATA TYPE ISSUES...\n');

  const issues = scanDirectory('src');

  if (issues.length === 0) {
    console.log('✅ No major type issues found!');
    return;
  }

  console.log(`❌ Found ${issues.length} potential issues:\n`);

  // Group by pattern type
  const grouped = {};
  issues.forEach((issue) => {
    const key = issue.pattern;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(issue);
  });

  Object.entries(grouped).forEach(([pattern, patternIssues]) => {
    console.log(`\n📋 PATTERN: ${pattern}`);
    patternIssues.forEach((issue) => {
      console.log(`   📄 ${issue.file} (${issue.matches} occurrences)`);
      issue.examples.forEach((ex) => console.log(`      - ${ex}`));
    });
  });

  console.log('\n🛠️  RECOMMENDED ACTIONS:');
  console.log('1. Add null checks before accessing .id properties');
  console.log('2. Replace "as any" with proper type definitions');
  console.log('3. Consolidate Newsletter interfaces into one');
  console.log('4. Add data validation before Firebase operations');
  console.log('5. Use the new data-type-validator.ts utility');
}

generateReport();

export { scanDirectory, generateReport };
