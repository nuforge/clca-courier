#!/usr/bin/env node

import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

console.log('=== SVG STRUCTURE ANALYSIS ===\n');

// Read the original SVG
const svgContent = fs.readFileSync('public/conashaugh-map-square.svg', 'utf8');
const parser = new DOMParser();
const doc = parser.parseFromString(svgContent, 'image/svg+xml');

// Find all path elements
const allPaths = doc.getElementsByTagName('path');
console.log(`Total path elements found: ${allPaths.length}\n`);

// Analyze structure
const groupAnalysis = new Map();
const pathAnalysis = [];

for (let i = 0; i < allPaths.length; i++) {
  const pathElement = allPaths[i];
  const pathId = pathElement.getAttribute('id') || 'NO_ID';
  const pathSerifId = pathElement.getAttribute('serif:id') || '';

  // Find parent groups
  const parentGroups = [];
  let currentElement = pathElement.parentNode;

  while (currentElement && currentElement.nodeType === 1) {
    if (currentElement.tagName.toLowerCase() === 'g') {
      const groupId = currentElement.getAttribute('id') || 'NO_ID';
      const groupSerifId = currentElement.getAttribute('serif:id') || '';
      parentGroups.push({ id: groupId, serifId: groupSerifId });
    }
    currentElement = currentElement.parentNode;
  }

  // Categorize
  let category = 'UNKNOWN';
  let isInRoadsGroup = false;

  for (const group of parentGroups) {
    const groupIdLower = group.id.toLowerCase();
    const groupSerifIdLower = group.serifId.toLowerCase();

    if (groupIdLower === 'roads' || groupSerifIdLower === 'roads') {
      category = 'ROAD';
      isInRoadsGroup = true;
      break;
    }

    if (groupIdLower.startsWith('section') || groupSerifIdLower.startsWith('section')) {
      category = 'PROPERTY_LOT';
    }
  }

  // Track group usage
  const topLevelGroup = parentGroups[parentGroups.length - 1];
  if (topLevelGroup) {
    const groupKey = `${topLevelGroup.id} / ${topLevelGroup.serifId}`;
    if (!groupAnalysis.has(groupKey)) {
      groupAnalysis.set(groupKey, { count: 0, category: category });
    }
    groupAnalysis.get(groupKey).count++;
  }

  pathAnalysis.push({
    id: pathId,
    serifId: pathSerifId,
    category: category,
    isInRoadsGroup: isInRoadsGroup,
    parentGroups: parentGroups.map((g) => `${g.id}${g.serifId ? ` (${g.serifId})` : ''}`),
  });
}

// Report findings
console.log('=== GROUP ANALYSIS ===');
console.log(`Total groups found: ${groupAnalysis.size}\n`);

const sortedGroups = Array.from(groupAnalysis.entries()).sort((a, b) => b[1].count - a[1].count);
sortedGroups.forEach(([groupKey, info]) => {
  console.log(`${groupKey}: ${info.count} paths (${info.category})`);
});

console.log('\n=== CATEGORY SUMMARY ===');
const categoryCounts = pathAnalysis.reduce((acc, path) => {
  acc[path.category] = (acc[path.category] || 0) + 1;
  return acc;
}, {});

Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`${category}: ${count} paths`);
});

console.log('\n=== ROADS GROUP ANALYSIS ===');
const roadsInGroup = pathAnalysis.filter((p) => p.isInRoadsGroup);
console.log(`Paths explicitly in Roads group: ${roadsInGroup.length}`);
roadsInGroup.slice(0, 10).forEach((path) => {
  console.log(`  - ${path.id} ${path.serifId ? `(${path.serifId})` : ''}`);
});

console.log('\n=== POTENTIAL MISSED LOTS ===');
const unknownPaths = pathAnalysis.filter((p) => p.category === 'UNKNOWN');
console.log(`Uncategorized paths: ${unknownPaths.length}`);
unknownPaths.slice(0, 20).forEach((path) => {
  console.log(
    `  - ${path.id} ${path.serifId ? `(${path.serifId})` : ''} | Parents: ${path.parentGroups.join(' -> ')}`,
  );
});

console.log('\n=== SAMPLE PROPERTY LOTS ===');
const propertyLots = pathAnalysis.filter((p) => p.category === 'PROPERTY_LOT');
console.log(`Property lots found: ${propertyLots.length}`);
propertyLots.slice(0, 10).forEach((path) => {
  console.log(
    `  - ${path.id} ${path.serifId ? `(${path.serifId})` : ''} | Parents: ${path.parentGroups.join(' -> ')}`,
  );
});
