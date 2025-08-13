/**
 * SVG Road Parser - Extracts road data dynamically from SVG DOM
 * This utility parses SVG elements to build road registry without duplication
 */

export interface ParsedRoad {
  id: string;
  name: string;
  pathData: string;
  element?: SVGPathElement;
  group?: SVGGElement;
}

export interface RoadParserOptions {
  excludeGroups?: string[];
  includeOnly?: string[];
}

export class SVGRoadParser {
  private svgElement: SVGSVGElement | null = null;

  constructor(svgElement?: SVGSVGElement) {
    if (svgElement) {
      this.svgElement = svgElement;
    }
  }

  /**
   * Set the SVG element to parse
   */
  setSVGElement(svgElement: SVGSVGElement): void {
    this.svgElement = svgElement;
  }

  /**
   * Parse all road groups from the SVG
   */
  parseRoads(options: RoadParserOptions = {}): ParsedRoad[] {
    if (!this.svgElement) {
      throw new Error('SVG element not set. Call setSVGElement() first.');
    }

    const roads: ParsedRoad[] = [];
    const groups = this.svgElement.querySelectorAll('g[id]');

    groups.forEach((group) => {
      const groupElement = group as SVGGElement;
      const groupId = groupElement.id;

      // Skip if in exclude list
      if (options.excludeGroups?.includes(groupId)) {
        return;
      }

      // Skip if includeOnly is specified and this group is not in it
      if (options.includeOnly && !options.includeOnly.includes(groupId)) {
        return;
      }

      // Find path element within the group
      const pathElement = groupElement.querySelector('path') as SVGPathElement;
      if (!pathElement) {
        return;
      }

      const pathData = pathElement.getAttribute('d');
      if (!pathData) {
        return;
      }

      // Convert ID to readable name
      const name = this.formatRoadName(groupId);

      roads.push({
        id: groupId,
        name,
        pathData,
        element: pathElement,
        group: groupElement,
      });
    });

    return roads;
  }

  /**
   * Get a specific road by ID
   */
  getRoadById(roadId: string): ParsedRoad | null {
    if (!this.svgElement) {
      return null;
    }

    const group = this.svgElement.querySelector(`g[id="${roadId}"]`) as SVGGElement;
    if (!group) {
      return null;
    }

    const pathElement = group.querySelector('path') as SVGPathElement;
    if (!pathElement) {
      return null;
    }

    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      return null;
    }

    return {
      id: roadId,
      name: this.formatRoadName(roadId),
      pathData,
      element: pathElement,
      group,
    };
  }

  /**
   * Convert kebab-case ID to readable name
   */
  private formatRoadName(id: string): string {
    return id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get all road IDs from the SVG
   */
  getRoadIds(): string[] {
    if (!this.svgElement) {
      return [];
    }

    const groups = this.svgElement.querySelectorAll('g[id]');
    return Array.from(groups).map((group) => group.id);
  }

  /**
   * Check if a road exists
   */
  hasRoad(roadId: string): boolean {
    if (!this.svgElement) {
      return false;
    }

    return !!this.svgElement.querySelector(`g[id="${roadId}"]`);
  }

  /**
   * Get road count
   */
  getRoadCount(): number {
    if (!this.svgElement) {
      return 0;
    }

    return this.svgElement.querySelectorAll('g[id] path').length;
  }

  /**
   * Validate SVG structure for road parsing
   */
  validateSVGStructure(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.svgElement) {
      issues.push('No SVG element provided');
      return { isValid: false, issues };
    }

    const groups = this.svgElement.querySelectorAll('g[id]');
    if (groups.length === 0) {
      issues.push('No groups with IDs found');
    }

    const pathsWithoutGroups = this.svgElement.querySelectorAll('path:not(g path)');
    if (pathsWithoutGroups.length > 0) {
      issues.push(`${pathsWithoutGroups.length} paths found outside of groups`);
    }

    groups.forEach((group) => {
      const paths = group.querySelectorAll('path');
      if (paths.length === 0) {
        issues.push(`Group "${group.id}" has no path elements`);
      } else if (paths.length > 1) {
        issues.push(`Group "${group.id}" has multiple path elements (${paths.length})`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Extract road statistics
   */
  getRoadStatistics(): {
    totalRoads: number;
    roadsWithPaths: number;
    averagePathLength: number;
    longestRoad: { id: string; pathLength: number } | null;
    shortestRoad: { id: string; pathLength: number } | null;
  } {
    const roads = this.parseRoads();

    if (roads.length === 0) {
      return {
        totalRoads: 0,
        roadsWithPaths: 0,
        averagePathLength: 0,
        longestRoad: null,
        shortestRoad: null,
      };
    }

    const pathLengths = roads.map((road) => ({
      id: road.id,
      pathLength: road.pathData.length,
    }));

    const totalPathLength = pathLengths.reduce((sum, road) => sum + road.pathLength, 0);
    const longestRoad = pathLengths.reduce((longest, road) =>
      road.pathLength > longest.pathLength ? road : longest,
    );
    const shortestRoad = pathLengths.reduce((shortest, road) =>
      road.pathLength < shortest.pathLength ? road : shortest,
    );

    return {
      totalRoads: roads.length,
      roadsWithPaths: roads.length,
      averagePathLength: Math.round(totalPathLength / roads.length),
      longestRoad,
      shortestRoad,
    };
  }
}

/**
 * Helper function to create parser from SVG element
 */
export function createRoadParser(svgElement: SVGSVGElement): SVGRoadParser {
  return new SVGRoadParser(svgElement);
}

/**
 * Helper function to parse roads from SVG element
 */
export function parseRoadsFromSVG(
  svgElement: SVGSVGElement,
  options?: RoadParserOptions,
): ParsedRoad[] {
  const parser = new SVGRoadParser(svgElement);
  return parser.parseRoads(options);
}
