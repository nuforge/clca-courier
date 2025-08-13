export interface RoadData {
  id: string;
  name: string;
  path: string;
  category: 'main' | 'court' | 'lane' | 'drive' | 'trail' | 'way' | 'run' | 'circle' | 'terrace';
  estimatedLength?: number;
  connectedRoads?: string[];
}

export class RoadManager {
  private roads: Map<string, RoadData> = new Map();

  constructor(roadData?: RoadData[]) {
    if (roadData) {
      this.addRoads(roadData);
    } else {
      this.initializeDefaultRoads();
    }
  }

  private initializeDefaultRoads() {
    const defaultRoads: RoadData[] = [
      {
        id: 'indian-run-court',
        name: 'Indian Run Court',
        path: 'M2346.77,1364.62C2368.82,1356.69 2351.51,1352.23 2403.37,1371.69C2431.68,1382.31 2437.39,1364.85 2470.46,1380.7C2523.93,1406.32 2527.01,1473.62 2519.64,1498.9C2515.44,1513.31 2499.17,1516.1 2479.62,1524.36C2471.96,1527.59 2468.21,1565.67 2427.53,1543.9',
        category: 'court',
      },
      {
        id: 'conklin-lane',
        name: 'Conklin Lane',
        path: 'M972.279,1287.16C972.279,1287.16 990.673,1279.73 1011.92,1253.24C1033.18,1226.75 1052.15,1209.01 1054.69,1207.69',
        category: 'lane',
      },
      {
        id: 'geronimo-path',
        name: 'Geronimo Path',
        path: 'M1330.88,1732.12C1363.24,1780.62 1361.69,1805.33 1416.47,1809.49',
        category: 'trail',
      },
      {
        id: 'seneca-drive',
        name: 'Seneca Drive',
        path: 'M1346.67,232.793C1308.74,260.196 1231.17,278.528 1254.46,319.638C1316.11,363.006 1307.69,400.682 1330.67,417.378C1371.12,446.76 1389.04,507.411 1393.31,524.216C1403.81,565.494 1454.88,644.354 1339.79,826.711C1312,873.133 1289.9,920.712 1289.9,920.712C1289.9,920.712 1178.17,1048.12 1291.51,1140.38C1335.04,1175.82 1360.05,1183.1 1392.33,1207.83C1481.63,1276.23 1488.64,1222.1 1515.78,1257.19C1527.13,1278.31 1536.78,1298.42 1554.58,1312.61C1570.91,1325.62 1591.83,1331.59 1614.03,1338.21C1648.98,1348.63 1657.26,1396.36 1688.48,1413.64C1745.62,1445.28 1705.55,1506.09 1786.68,1526.32C1815.15,1533.43 1830.32,1520.06 1848.66,1506.14C1866,1500.56 1875.71,1474.05 1880.99,1429.08C1884.51,1399.18 1948.35,1423.57 1981.83,1387.97C2001.81,1348.32 2005.41,1339.17 2018.48,1315.45C2031.57,1291.67 2043.02,1257.31 2060.4,1245.32C2108.7,1212.02 2148.27,1250.62 2176.24,1235.92',
        category: 'main',
        connectedRoads: ['flatbrook-court', 'flatbrook-way'],
      },
      {
        id: 'conashaugh-trail',
        name: 'Conashaugh Trail',
        path: 'M1750.23,293.989C1750.23,293.989 1720.39,405.167 1716.9,419.463C1713.54,433.214 1702.86,463.318 1768.66,520.122C1788.41,537.174 1823.97,567.282 1838.56,575.797C1867.25,592.552 1895.34,607.412 1918.4,643.244C1935.83,670.321 1946.52,692.101 1963.15,715.095C1982.06,741.256 2012.2,770.29 2031.44,798.141C2051.7,827.445 2075.65,882.413 2075.65,882.413C2075.65,882.413 2089.33,894.431 2082.87,989.059C2093.92,1021.34 2086.99,1044.25 2095.18,1076.12C2104.03,1110.59 2136.14,1164.88 2149.65,1191.88C2157.32,1207.22 2165.98,1218.01 2176.24,1235.92C2226.84,1334.87 2296.16,1290.37 2346.72,1364.55C2357.14,1379.84 2357.44,1416.67 2346.77,1433.92C2334.27,1454.11 2325.73,1473.41 2305.81,1495.44C2289.66,1513.32 2276.7,1528.24 2267.97,1561.15C2263.83,1576.76 2262.99,1600.2 2261.98,1632.06C2261.65,1642.41 2261.28,1654.36 2260.8,1666.3C2260.26,1679.91 2243.36,1695.22 2214.53,1709.7C2165.55,1734.3 2106.5,1776.26 2083.95,1774.66C2059.81,1772.95 1996.4,1727.59 1949.78,1812.48C1941.81,1827 1885.13,1860.19 1865.95,1868.18',
        category: 'main',
      },
      // Add more roads as needed
    ];

    this.addRoads(defaultRoads);
  }

  addRoad(road: RoadData): void {
    this.roads.set(road.id, road);
  }

  addRoads(roads: RoadData[]): void {
    roads.forEach((road) => this.addRoad(road));
  }

  getRoad(id: string): RoadData | undefined {
    return this.roads.get(id);
  }

  getAllRoads(): RoadData[] {
    return Array.from(this.roads.values());
  }

  getRoadsByCategory(category: RoadData['category']): RoadData[] {
    return this.getAllRoads().filter((road) => road.category === category);
  }

  searchRoads(query: string): RoadData[] {
    const searchTerm = query.toLowerCase();
    return this.getAllRoads().filter(
      (road) =>
        road.name.toLowerCase().includes(searchTerm) ||
        road.id.toLowerCase().includes(searchTerm) ||
        road.category.toLowerCase().includes(searchTerm),
    );
  }

  getConnectedRoads(roadId: string): RoadData[] {
    const road = this.getRoad(roadId);
    if (!road || !road.connectedRoads) return [];

    return road.connectedRoads
      .map((id) => this.getRoad(id))
      .filter((road): road is RoadData => road !== undefined);
  }

  // Calculate approximate road center for labeling
  getRoadCenter(roadId: string): { x: number; y: number } | null {
    const road = this.getRoad(roadId);
    if (!road) return null;

    // Simple approach: extract first and last coordinates from path
    const pathData = road.path;
    const coords = this.extractCoordinatesFromPath(pathData);

    if (coords.length === 0) return null;

    // Calculate center point
    const sumX = coords.reduce((sum, coord) => sum + coord.x, 0);
    const sumY = coords.reduce((sum, coord) => sum + coord.y, 0);

    return {
      x: sumX / coords.length,
      y: sumY / coords.length,
    };
  }

  private extractCoordinatesFromPath(pathData: string): { x: number; y: number }[] {
    // Extract coordinate pairs from SVG path data
    const coords: { x: number; y: number }[] = [];
    const matches = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);

    if (matches) {
      for (let i = 0; i < matches.length; i += 2) {
        if (i + 1 < matches.length && matches[i] && matches[i + 1]) {
          coords.push({
            x: parseFloat(matches[i]!),
            y: parseFloat(matches[i + 1]!),
          });
        }
      }
    }

    return coords;
  }

  // Export road data for external use
  exportRoads(): RoadData[] {
    return this.getAllRoads();
  }

  // Import road data
  importRoads(roadData: RoadData[]): void {
    this.roads.clear();
    this.addRoads(roadData);
  }

  // Get statistics
  getStats() {
    const roads = this.getAllRoads();
    const categories = roads.reduce(
      (acc, road) => {
        acc[road.category] = (acc[road.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRoads: roads.length,
      categories,
      longestRoadName: roads.reduce(
        (longest, road) => (road.name.length > longest.length ? road.name : longest),
        '',
      ),
    };
  }
}
