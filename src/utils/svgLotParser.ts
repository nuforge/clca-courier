import type { PropertyLot } from '../composables/useInteractivePropertyMap';

export class SVGLotParser {
  private lots: PropertyLot[] = [];
  private svgElement: SVGSVGElement | null = null;

  constructor() {
    this.lots = [];
  }

  parseSVG(svgElement: SVGSVGElement): void {
    this.svgElement = svgElement;
    this.lots = [];

    try {
      console.log(`Starting to parse SVG for property lots...`);
      console.log(`=== PARSER DEBUG INFO ===`);

      // Find all path elements that represent lots
      const pathElements = svgElement.querySelectorAll('path[id]');
      console.log(`Found ${pathElements.length} path elements with IDs`);

      // Also find group elements that contain paths without IDs (like lot 504)
      const groupElements = svgElement.querySelectorAll('g[id] > path:not([id])');
      console.log(`Found ${groupElements.length} paths in groups without their own IDs`);

      let skippedRoads = 0;
      let processedLots = 0;

      // Process regular path elements with IDs
      for (const pathElement of pathElements) {
        const path = pathElement as SVGPathElement;
        const id = path.getAttribute('id');

        if (!id) continue;

        // Skip if this looks like a road or other non-lot element
        const isRoad = this.isRoadElement(path);
        if (isRoad) {
          skippedRoads++;
          console.log(`SKIPPED ROAD: ${id}`);
          continue;
        }

        // Extract lot information
        const lot = this.extractLotInfo(path, id);
        if (lot) {
          this.lots.push(lot);
          processedLots++;
          if (processedLots <= 10) {
            // Only log first 10
            console.log(`PROCESSED LOT: ${id} -> ${lot.id} in section ${lot.section}`);
          }
        } else {
          if (processedLots <= 5) {
            // Only log first 5 failures
            console.log(`FAILED TO EXTRACT: ${id}`);
          }
        }
      }

      // Process group elements that contain paths without IDs (like lot 504)
      for (const pathElement of groupElements) {
        const path = pathElement as SVGPathElement;
        const groupElement = path.closest('g') as SVGGElement;
        const groupId = groupElement?.getAttribute('id');

        if (!groupId) continue;

        // Skip if this looks like a road or other non-lot element
        const isRoad = this.isRoadElement(path);
        if (isRoad) {
          skippedRoads++;
          console.log(`SKIPPED ROAD GROUP: ${groupId}`);
          continue;
        }

        // Extract lot information using the group ID
        const lot = this.extractLotInfo(path, groupId);
        if (lot) {
          this.lots.push(lot);
          processedLots++;
          console.log(`PROCESSED GROUP LOT: ${groupId} -> ${lot.id} in section ${lot.section}`);
        } else {
          console.log(`FAILED TO EXTRACT GROUP: ${groupId}`);
        }
      }

      console.log(`Skipped ${skippedRoads} road elements`);
      console.log(`Processed ${processedLots} potential lots`);
      console.log(`=== END DEBUG INFO ===`);

      console.log(`Successfully parsed ${this.lots.length} property lots`);
      console.log('Sections found:', [...new Set(this.lots.map((lot) => lot.section))]);
    } catch (error) {
      console.error('Error parsing SVG:', error);
      throw error;
    }
  }

  private isRoadElement(pathElement: SVGPathElement): boolean {
    // Check if element is within the "Roads" group by traversing up the hierarchy
    let currentElement: Element | null = pathElement;

    // Traverse up the DOM tree looking for the Roads group or road indicators
    while (currentElement && currentElement !== this.svgElement) {
      if (currentElement.tagName?.toLowerCase() === 'g') {
        const id = (currentElement.getAttribute('id') || '').toLowerCase();
        const serifId = (currentElement.getAttribute('serif:id') || '').toLowerCase();

        // Check if we're explicitly in a "Roads" group
        if (id === 'roads' || serifId === 'roads') {
          return true;
        }

        // Check for road-related keywords in group names
        const roadKeywords = [
          'road',
          'street',
          'lane',
          'drive',
          'trail',
          'path',
          'court',
          'way',
          'run',
          'circle',
          'terrace',
          'avenue',
        ];
        if (roadKeywords.some((keyword) => id.includes(keyword) || serifId.includes(keyword))) {
          return true;
        }
      }
      currentElement = currentElement.parentElement;
    }

    // Also check the path element itself for road-like names
    const pathId = (pathElement.getAttribute('id') || '').toLowerCase();
    const pathSerifId = (pathElement.getAttribute('serif:id') || '').toLowerCase();
    const roadKeywords = [
      'road',
      'street',
      'lane',
      'drive',
      'trail',
      'path',
      'court',
      'way',
      'run',
      'circle',
      'terrace',
      'avenue',
    ];

    if (roadKeywords.some((keyword) => pathId.includes(keyword) || pathSerifId.includes(keyword))) {
      return true;
    }

    return false;
  }
  private extractLotInfo(pathElement: SVGPathElement, id: string): PropertyLot | null {
    try {
      const pathData = pathElement.getAttribute('d');
      if (!pathData) return null;

      // Get the group element that contains this lot
      const groupElement = pathElement.closest('g') as SVGGElement;
      const groupId = groupElement?.getAttribute('id') || '';

      // Extract lot number from ID
      const lotNumber = this.extractLotNumber(id);
      if (!lotNumber) return null;

      // Extract section from group ID or other attributes
      const section = this.extractSection(groupElement, groupId, pathElement);

      // Create lot object
      const lot: PropertyLot = {
        id,
        number: lotNumber,
        pathData,
        section,
        element: pathElement,
        group: groupElement,
      };

      return lot;
    } catch (error) {
      console.warn(`Failed to extract lot info for element ${id}:`, error);
      return null;
    }
  }

  private extractLotNumber(id: string): string | null {
    // Try to extract lot number from various ID patterns

    // Pattern 1: Direct number (e.g., "5503", "_5503")
    const directNumberMatch = id.match(/^_?(\d{4,})$/);
    if (directNumberMatch && directNumberMatch[1]) {
      return directNumberMatch[1];
    }

    // Pattern 2: Lot number in ID (e.g., "lot-5503", "5503-lot")
    const lotNumberMatch = id.match(/(?:lot[_-]?)?(\d{4,})/i);
    if (lotNumberMatch && lotNumberMatch[1]) {
      return lotNumberMatch[1];
    }

    // Pattern 3: Any 3+ digit number (lowered threshold)
    const numberMatch = id.match(/(\d{3,})/);
    if (numberMatch && numberMatch[1]) {
      return numberMatch[1];
    }

    // Pattern 4: Special named lots (e.g., "Section-I--Seneca-Lake-")
    if (
      id.toLowerCase().includes('section') &&
      (id.toLowerCase().includes('seneca') || id.toLowerCase().includes('lake'))
    ) {
      return 'Section I (Seneca Lake)';
    }

    // Pattern 5: Handle other named lots (e.g., "bald-hill-inc", "st-vincent-church")
    // For named lots, use the cleaned ID as the lot number
    if (id && id.length > 0) {
      const cleaned = id.replace(/^_+/, '').replace(/[-_]+/g, ' ').trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    return null;
  }

  private extractSection(
    groupElement: SVGGElement | null,
    groupId: string,
    pathElement: SVGPathElement,
  ): string {
    // Try to extract section from various sources

    // First, try the group's serif:id attribute (often cleaner)
    if (groupElement) {
      const serifId = groupElement.getAttribute('serif:id');
      if (serifId) {
        return this.formatSectionName(serifId);
      }
    }

    // Try the group ID
    if (groupId) {
      // Handle "section" patterns (including typos like "sectioin")
      const sectionMatch = groupId.match(/sect[io]+n[_-]?([^\s_-]+)/i);
      if (sectionMatch && sectionMatch[1]) {
        return this.formatSectionName(sectionMatch[1]);
      }

      // Handle special groups
      if (groupId.toLowerCase().includes('commercial')) {
        return 'Commercial';
      }
      if (groupId.toLowerCase().includes('bald-hill')) {
        return 'Bald Hill Inc';
      }

      // Use the group ID directly if it looks like a section
      if (groupId.length > 0 && !groupId.startsWith('_')) {
        return this.formatSectionName(groupId);
      }
    }

    // Try parent elements
    let currentElement: Element | null = pathElement.parentElement;
    while (currentElement && currentElement !== this.svgElement) {
      const elementId = currentElement.getAttribute('id');
      const serifId = currentElement.getAttribute('serif:id');

      // Check serif:id first
      if (serifId && serifId.toLowerCase().startsWith('section')) {
        return this.formatSectionName(serifId);
      }

      if (elementId) {
        // Handle section patterns (including typos)
        const sectionMatch = elementId.match(/sect[io]+n[_-]?([^\s_-]+)/i);
        if (sectionMatch && sectionMatch[1]) {
          return this.formatSectionName(sectionMatch[1]);
        }

        // Handle special groups
        if (elementId.toLowerCase().includes('commercial')) {
          return 'Commercial';
        }
        if (elementId.toLowerCase().includes('bald-hill')) {
          return 'Bald Hill Inc';
        }
      }
      currentElement = currentElement.parentElement;
    }

    // Try to infer section from lot number ranges or SVG structure
    const lotNumber = this.extractLotNumber(pathElement.getAttribute('id') || '');
    if (lotNumber) {
      return this.inferSectionFromLotNumber(lotNumber);
    }

    return 'Unknown';
  }

  private formatSectionName(sectionRaw: string): string {
    // Handle special cases first
    if (sectionRaw.toLowerCase().includes('commercial')) {
      return 'Commercial';
    }
    if (sectionRaw.toLowerCase().includes('bald hill')) {
      return 'Bald Hill Inc';
    }
    if (sectionRaw.toLowerCase().includes('seneca lake')) {
      return 'Seneca Lake';
    }

    // Clean up section patterns
    const cleaned = sectionRaw
      .replace(/^Section\s*/i, '')
      .replace(/^Sect[io]+n\s*/i, '') // Handle typos like "Sectioin"
      .replace(/[_-]/g, ' ')
      .replace(/\?+/g, '') // Remove question marks
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/\s+/g, ' ')
      .trim();

    // Format section names consistently
    if (cleaned.match(/^XVIII?[abc]?\??$/i)) {
      const cleanRoman = cleaned.replace(/\?+/g, '').trim();
      return 'Section ' + cleanRoman.toUpperCase();
    }
    if (cleaned.match(/^XVII?[abc]?\??$/i)) {
      const cleanRoman = cleaned.replace(/\?+/g, '').trim();
      return 'Section ' + cleanRoman.toUpperCase();
    }
    if (cleaned.match(/^XVI?[abc]?\??$/i)) {
      const cleanRoman = cleaned.replace(/\?+/g, '').trim();
      return 'Section ' + cleanRoman.toUpperCase();
    }
    if (cleaned.match(/^[IVX]+[abc]?\??$/i)) {
      const cleanRoman = cleaned.replace(/\?+/g, '').trim();
      return 'Section ' + cleanRoman.toUpperCase();
    }

    // Return cleaned version with proper casing
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }

  private inferSectionFromLotNumber(lotNumber: string): string {
    const num = parseInt(lotNumber);

    // Based on the SVG structure, infer sections from lot number ranges
    if (num >= 5500 && num < 5700) return 'XVIII';
    if (num >= 5700 && num < 5800) return 'XVIII';
    if (num >= 5300 && num < 5400) return 'XVIIIc';
    if (num >= 5900 && num < 6000) return 'XVIIIa';
    if (num >= 6100 && num < 6300) return 'XVIIa';
    if (num >= 5400 && num < 5500) return 'XVIIIb';

    return 'Unknown';
  }

  getLots(): PropertyLot[] {
    return [...this.lots];
  }

  getLotById(id: string): PropertyLot | undefined {
    return this.lots.find((lot) => lot.id === id);
  }

  // Debug method to find specific lots
  debugFindLot(searchTerm: string): PropertyLot[] {
    return this.lots.filter(
      (lot) =>
        lot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.section.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  getLotsBySection(section: string): PropertyLot[] {
    return this.lots.filter((lot) => lot.section === section);
  }

  getStatistics() {
    const sections = [...new Set(this.lots.map((lot) => lot.section))];
    const sectionCounts = sections.map((section) => ({
      section,
      count: this.lots.filter((lot) => lot.section === section).length,
    }));

    return {
      totalLots: this.lots.length,
      sections: sections.length,
      sectionCounts,
      lotNumbers: this.lots.map((lot) => lot.number).sort(),
    };
  }

  // Utility method to validate the parsed data
  validateParsedData(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.lots.length === 0) {
      issues.push('No lots were parsed from the SVG');
    }

    const duplicateIds = this.findDuplicateIds();
    if (duplicateIds.length > 0) {
      issues.push(`Duplicate lot IDs found: ${duplicateIds.join(', ')}`);
    }

    const missingPathData = this.lots.filter((lot) => !lot.pathData || lot.pathData.trim() === '');
    if (missingPathData.length > 0) {
      issues.push(`${missingPathData.length} lots missing path data`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private findDuplicateIds(): string[] {
    const idCounts: { [key: string]: number } = {};
    const duplicates: string[] = [];

    this.lots.forEach((lot) => {
      idCounts[lot.id] = (idCounts[lot.id] || 0) + 1;
    });

    Object.entries(idCounts).forEach(([id, count]) => {
      if (count > 1) {
        duplicates.push(id);
      }
    });

    return duplicates;
  }
}
