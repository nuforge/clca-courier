#!/usr/bin/env node

import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

console.log('=== TESTING ACTUAL PARSER LOGIC ===\n');

// Read the original SVG
const svgContent = fs.readFileSync('public/conashaugh-map-square.svg', 'utf8');
const parser = new DOMParser();
const doc = parser.parseFromString(svgContent, 'image/svg+xml');

// Simulate the exact logic from svgLotParser.ts
function isRoadElement(pathElement) {
  let currentElement = pathElement;

  while (currentElement) {
    if (currentElement.tagName?.toLowerCase() === 'g') {
      const id = (currentElement.getAttribute('id') || '').toLowerCase();
      const serifId = (currentElement.getAttribute('serif:id') || '').toLowerCase();

      if (id === 'roads' || serifId === 'roads') {
        return true;
      }
    }
    currentElement = currentElement.parentElement;
  }

  return false;
}

function extractLotNumber(id) {
  if (!id) return null;

  // Try to extract number from various patterns
  let match = id.match(/^_?(\d+)/);
  if (match) return match[1];

  match = id.match(/(\d+)$/);
  if (match) return match[1];

  // Handle named lots (like "bald-hill-inc")
  return id.replace(/^_+/, '') || null;
}

function extractSection(groupElement, pathElement) {
  // Try the group's serif:id attribute first
  if (groupElement) {
    const serifId = groupElement.getAttribute('serif:id');
    if (serifId) {
      return formatSectionName(serifId);
    }
  }

  // Try parent elements
  let currentElement = pathElement.parentElement;
  while (currentElement) {
    const elementId = currentElement.getAttribute('id');
    const serifId = currentElement.getAttribute('serif:id');

    if (serifId && serifId.toLowerCase().includes('section')) {
      return formatSectionName(serifId);
    }

    if (elementId) {
      const sectionMatch = elementId.match(/sect[io]+n[_-]?([^\s_-]+)/i);
      if (sectionMatch && sectionMatch[1]) {
        return formatSectionName(sectionMatch[1]);
      }

      if (elementId.toLowerCase().includes('commercial')) {
        return 'Commercial';
      }
      if (elementId.toLowerCase().includes('bald-hill')) {
        return 'Bald Hill Inc';
      }
    }
    currentElement = currentElement.parentElement;
  }

  return 'Unknown';
}

function formatSectionName(sectionRaw) {
  if (sectionRaw.toLowerCase().includes('commercial')) {
    return 'Commercial';
  }
  if (sectionRaw.toLowerCase().includes('bald hill')) {
    return 'Bald Hill Inc';
  }

  const cleaned = sectionRaw
    .replace(/^Section\s*/i, '')
    .replace(/^Sect[io]+n\s*/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.match(/^[IVX]+[abc]?$/i)) {
    return 'Section ' + cleaned.toUpperCase();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

// Test the parser logic
const allPaths = doc.getElementsByTagName('path');
console.log(`Testing parser on ${allPaths.length} paths...\n`);

let skippedRoads = 0;
let processedLots = 0;
let failedExtractions = 0;

const lots = [];
const debugSamples = [];

for (let i = 0; i < allPaths.length; i++) {
  const pathElement = allPaths[i];
  const id = pathElement.getAttribute('id');

  if (!id) continue;

  if (isRoadElement(pathElement)) {
    skippedRoads++;
    if (skippedRoads <= 5) {
      debugSamples.push(`ROAD: ${id}`);
    }
    continue;
  }

  const lotNumber = extractLotNumber(id);
  if (!lotNumber) {
    failedExtractions++;
    if (failedExtractions <= 5) {
      debugSamples.push(`NO_LOT_NUMBER: ${id}`);
    }
    continue;
  }

  const groupElement =
    pathElement.parentNode && pathElement.parentNode.tagName === 'g'
      ? pathElement.parentNode
      : null;
  const section = extractSection(groupElement, pathElement);

  lots.push({
    id: id,
    number: lotNumber,
    section: section,
  });

  processedLots++;
  if (processedLots <= 10) {
    debugSamples.push(`LOT: ${id} -> #${lotNumber} in ${section}`);
  }
}

console.log('=== PARSER RESULTS ===');
console.log(`Skipped roads: ${skippedRoads}`);
console.log(`Failed extractions: ${failedExtractions}`);
console.log(`Processed lots: ${processedLots}`);
console.log(`Total lots created: ${lots.length}`);

console.log('\n=== DEBUG SAMPLES ===');
debugSamples.forEach((sample) => console.log(sample));

console.log('\n=== SECTION SUMMARY ===');
const sectionCounts = lots.reduce((acc, lot) => {
  acc[lot.section] = (acc[lot.section] || 0) + 1;
  return acc;
}, {});

Object.entries(sectionCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([section, count]) => {
    console.log(`${section}: ${count} lots`);
  });
