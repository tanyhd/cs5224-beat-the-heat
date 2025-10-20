// Utility functions for filtering sheltered linkway data based on geographic boundaries

import proj4 from "proj4";

export interface LatLngCoordinate {
  lat: number;
  lng: number;
}

export interface ShelteredLinkwayFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    OBJECTID: number;
    dataType?: string;
    TYP_CD?: string | null;
    SHAPE_AREA?: number;
    SHAPE_LEN?: number;
    TYP_CD_DES?: string;
  };
}

export interface ShelteredLinkwayData {
  type: "FeatureCollection";
  features: ShelteredLinkwayFeature[];
}

// Define coordinate systems
const WGS84 = "EPSG:4326";
// Official SVY21 projection parameters for Singapore
const SVY21 =
  "+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.833333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

// Convert WGS84 coordinates to SVY21 (Singapore's coordinate system)
function wgs84ToSVY21(lat: number, lng: number): { x: number; y: number } {
  try {
    const [x, y] = proj4(WGS84, SVY21, [lng, lat]);

    // Validate that the coordinates are within Singapore's bounds
    if (x < 0 || x > 60000 || y < 0 || y > 50000) {
      console.warn(
        `Coordinates may be outside Singapore bounds: x=${x}, y=${y} for lat=${lat}, lng=${lng}`
      );
    }

    return { x, y };
  } catch (error) {
    console.error("Coordinate transformation failed:", error);
    // Fallback to approximate conversion
    const originLat = 1.366666;
    const originLng = 103.833333;
    const scaleFactor = 100000;

    const x = (lng - originLng) * scaleFactor * Math.cos((lat * Math.PI) / 180);
    const y = (lat - originLat) * scaleFactor;

    return { x: x + 28001.642, y: y + 38744.572 };
  }
}

// Check if a point is within a bounding box
function isPointInBoundingBox(
  point: { x: number; y: number },
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  return (
    point.x >= bbox.minX &&
    point.x <= bbox.maxX &&
    point.y >= bbox.minY &&
    point.y <= bbox.maxY
  );
}

// Get the centroid of a polygon (handles both Polygon and MultiPolygon)
function getPolygonCentroid(coordinates: number[][][] | number[][][][]): {
  x: number;
  y: number;
} {
  // If it's a MultiPolygon, take the first polygon
  const coords: number[][][] = Array.isArray(coordinates[0][0][0])
    ? (coordinates as number[][][][])[0]
    : (coordinates as number[][][]);
  const firstRing = coords[0]; // Take the outer ring of the polygon
  let area = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < firstRing.length - 1; i++) {
    const coord0 = firstRing[i] as [number, number];
    const coord1 = firstRing[i + 1] as [number, number];
    const x0 = coord0[0];
    const y0 = coord0[1];
    const x1 = coord1[0];
    const y1 = coord1[1];

    const a = x0 * y1 - x1 * y0;
    area += a;
    centroidX += (x0 + x1) * a;
    centroidY += (y0 + y1) * a;
  }

  area *= 0.5;
  centroidX /= 6 * area;
  centroidY /= 6 * area;

  return { x: centroidX, y: centroidY };
}

// Calculate distance between two points
function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the distance from a point to a line segment
function distanceFromPointToLineSegment(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    // Line segment is actually a point
    return calculateDistance(point, lineStart);
  }

  let param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Filter sheltered linkways along multiple route segments (supports waypoints)
export function filterShelteredLinkwaysAlongRoute(
  routePoints: LatLngCoordinate[], // Array of points including origin, waypoints, and destination
  shelteredLinkwayData: ShelteredLinkwayData,
  options: {
    bufferDistance?: number;
    maxResults?: number;
    strictFiltering?: boolean;
  } = {}
): ShelteredLinkwayFeature[] {
  if (routePoints.length < 2) {
    console.warn("Need at least 2 points to filter along route");
    return [];
  }

  const {
    bufferDistance = 500,
    maxResults = 50,
    strictFiltering = true,
  } = options;

  // Convert all points to SVY21
  const svy21Points = routePoints.map((point) =>
    wgs84ToSVY21(point.lat, point.lng)
  );

  // Create overall bounding box for all segments
  const xs = svy21Points.map((p) => p.x);
  const ys = svy21Points.map((p) => p.y);
  const minX = Math.min(...xs) - bufferDistance;
  const maxX = Math.max(...xs) + bufferDistance;
  const minY = Math.min(...ys) - bufferDistance;
  const maxY = Math.max(...ys) + bufferDistance;

  const boundingBox = { minX, minY, maxX, maxY };
  console.log("Multi-segment bounding box:", boundingBox);

  // Filter features
  const filteredFeatures = shelteredLinkwayData.features.filter((feature) => {
    const centroid = getPolygonCentroid(feature.geometry.coordinates);
    const isInBounds = isPointInBoundingBox(centroid, boundingBox);

    if (!isInBounds) return false;

    if (strictFiltering) {
      // Check distance to any route segment
      let minDistanceToRoute = Infinity;

      for (let i = 0; i < svy21Points.length - 1; i++) {
        const segmentDistance = distanceFromPointToLineSegment(
          centroid,
          svy21Points[i],
          svy21Points[i + 1]
        );
        minDistanceToRoute = Math.min(minDistanceToRoute, segmentDistance);
      }

      return minDistanceToRoute <= bufferDistance;
    }

    return true;
  });

  console.log(
    `Filtered ${filteredFeatures.length} features along multi-segment route`
  );

  // Sort by minimum distance to any route segment
  if (strictFiltering) {
    filteredFeatures.sort((a, b) => {
      const centroidA = getPolygonCentroid(a.geometry.coordinates);
      const centroidB = getPolygonCentroid(b.geometry.coordinates);

      let minDistanceA = Infinity;
      let minDistanceB = Infinity;

      for (let i = 0; i < svy21Points.length - 1; i++) {
        const distanceA = distanceFromPointToLineSegment(
          centroidA,
          svy21Points[i],
          svy21Points[i + 1]
        );
        const distanceB = distanceFromPointToLineSegment(
          centroidB,
          svy21Points[i],
          svy21Points[i + 1]
        );
        minDistanceA = Math.min(minDistanceA, distanceA);
        minDistanceB = Math.min(minDistanceB, distanceB);
      }

      return minDistanceA - minDistanceB;
    });
  }

  return maxResults ? filteredFeatures.slice(0, maxResults) : filteredFeatures;
}

// Main function to filter sheltered linkway features within the boundary of two points
export function filterShelteredLinkwaysInBoundary(
  origin: LatLngCoordinate,
  destination: LatLngCoordinate,
  shelteredLinkwayData: ShelteredLinkwayData,
  options: {
    bufferDistance?: number; // Buffer distance in meters from the route line
    maxResults?: number; // Maximum number of results to return
    strictFiltering?: boolean; // Whether to use strict filtering along route line
  } = {}
): ShelteredLinkwayFeature[] {
  const {
    bufferDistance = 500,
    maxResults = 50,
    strictFiltering = true,
  } = options;
  // Convert WGS84 coordinates to SVY21
  const originSVY21 = wgs84ToSVY21(origin.lat, origin.lng);
  const destinationSVY21 = wgs84ToSVY21(destination.lat, destination.lng);

  console.log("Origin SVY21:", originSVY21);
  console.log("Destination SVY21:", destinationSVY21);

  // Create bounding box with buffer
  const minX = Math.min(originSVY21.x, destinationSVY21.x) - bufferDistance;
  const maxX = Math.max(originSVY21.x, destinationSVY21.x) + bufferDistance;
  const minY = Math.min(originSVY21.y, destinationSVY21.y) - bufferDistance;
  const maxY = Math.max(originSVY21.y, destinationSVY21.y) + bufferDistance;

  const boundingBox = { minX, minY, maxX, maxY };
  console.log("Bounding box:", boundingBox);

  // Filter features that are within the bounding box
  const filteredFeatures = shelteredLinkwayData.features.filter((feature) => {
    const centroid = getPolygonCentroid(feature.geometry.coordinates);
    const isInBounds = isPointInBoundingBox(centroid, boundingBox);

    if (!isInBounds) return false;

    if (strictFiltering) {
      // Additional validation: check if the polygon actually intersects with the route corridor
      // Calculate distance from centroid to the route line (between origin and destination)
      const distanceToRoute = distanceFromPointToLineSegment(
        centroid,
        originSVY21,
        destinationSVY21
      );

      // Only include if within buffer distance from the route line
      return distanceToRoute <= bufferDistance;
    }

    return true;
  });

  console.log(
    `Filtered ${filteredFeatures.length} features from ${shelteredLinkwayData.features.length} total`
  );

  // Sort by distance from the route line (not just route center)
  if (strictFiltering) {
    filteredFeatures.sort((a, b) => {
      const centroidA = getPolygonCentroid(a.geometry.coordinates);
      const centroidB = getPolygonCentroid(b.geometry.coordinates);

      const distanceA = distanceFromPointToLineSegment(
        centroidA,
        originSVY21,
        destinationSVY21
      );
      const distanceB = distanceFromPointToLineSegment(
        centroidB,
        originSVY21,
        destinationSVY21
      );

      return distanceA - distanceB;
    });
  } else {
    // Sort by distance from route center for non-strict filtering
    const routeCenter = {
      x: (originSVY21.x + destinationSVY21.x) / 2,
      y: (originSVY21.y + destinationSVY21.y) / 2,
    };

    filteredFeatures.sort((a, b) => {
      const centroidA = getPolygonCentroid(a.geometry.coordinates);
      const centroidB = getPolygonCentroid(b.geometry.coordinates);

      const distanceA = calculateDistance(centroidA, routeCenter);
      const distanceB = calculateDistance(centroidB, routeCenter);

      return distanceA - distanceB;
    });
  }

  // Limit results if maxResults is specified
  return maxResults ? filteredFeatures.slice(0, maxResults) : filteredFeatures;
}

// Function to load sheltered linkway data (now loads combined data from API)
export async function loadShelteredLinkwayData(): Promise<ShelteredLinkwayData> {
  try {
    const response = await fetch("/api/static-data");
    if (!response.ok) {
      throw new Error(
        `Failed to load sheltered linkway data: ${response.statusText}`
      );
    }
    const data: ShelteredLinkwayData = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading sheltered linkway data:", error);
    throw error;
  }
}

// Function to convert SVY21 coordinates back to WGS84 for display on Google Maps
export function svy21ToWGS84(x: number, y: number): LatLngCoordinate {
  const [lng, lat] = proj4(SVY21, WGS84, [x, y]);
  return { lat, lng };
}

// Function to convert sheltered linkway polygons to Google Maps compatible format
export function convertShelteredLinkwayToGoogleMapsPolygons(
  features: ShelteredLinkwayFeature[]
): google.maps.LatLngLiteral[][] {
  return features.map((feature) => {
    // Handle both Polygon and MultiPolygon
    const coords =
      feature.geometry.type === "MultiPolygon"
        ? (feature.geometry.coordinates as number[][][][])[0] // Take first polygon from MultiPolygon
        : (feature.geometry.coordinates as number[][][]);

    const outerRing = coords[0];
    return outerRing.map((coord) => {
      const [x, y] = coord as [number, number];
      const { lat, lng } = svy21ToWGS84(x, y);
      return { lat, lng };
    });
  });
}

// Function to get the centroid coordinates of a sheltered linkway feature in WGS84
export function getShelteredLinkwayCentroid(
  feature: ShelteredLinkwayFeature
): LatLngCoordinate {
  const centroidSVY21 = getPolygonCentroid(feature.geometry.coordinates);
  return svy21ToWGS84(centroidSVY21.x, centroidSVY21.y);
}

// Function to convert sheltered linkway features to waypoint coordinates
export function convertLinkwaysToWaypoints(
  features: ShelteredLinkwayFeature[]
): LatLngCoordinate[] {
  return features.map((feature) => getShelteredLinkwayCentroid(feature));
}

// Function to select optimal linkway waypoints to minimize detours
export function selectOptimalLinkwayWaypoints(
  directRoute: google.maps.DirectionsResult,
  features: ShelteredLinkwayFeature[],
  options: {
    maxDetourRatio?: number; // Maximum detour ratio (e.g., 1.2 = 20% detour allowed)
    maxWaypoints?: number; // Maximum number of waypoints to add
    minDistanceBetweenWaypoints?: number; // Minimum distance between waypoints in meters
  } = {}
): LatLngCoordinate[] {
  const {
    maxDetourRatio = 1.15, // Allow maximum 15% detour
    maxWaypoints = 3,
    minDistanceBetweenWaypoints = 200, // 200m minimum distance
  } = options;

  if (!directRoute.routes[0]?.overview_path || features.length === 0) {
    return [];
  }

  const routePath = directRoute.routes[0].overview_path;
  const routeDistance =
    directRoute.routes[0].legs?.reduce(
      (total, leg) => total + (leg.distance?.value || 0),
      0
    ) || 0;

  // Convert route path to SVY21 for accurate distance calculations
  const routePathSVY21 = routePath.map((point) =>
    wgs84ToSVY21(point.lat(), point.lng())
  );

  // Evaluate each linkway feature
  const linkwayEvaluations = features.map((feature) => {
    const centroid = getShelteredLinkwayCentroid(feature);
    const centroidSVY21 = wgs84ToSVY21(centroid.lat, centroid.lng);

    // Find the closest point on the route to this linkway
    let minDistance = Infinity;
    let closestRouteIndex = 0;

    for (let i = 0; i < routePathSVY21.length - 1; i++) {
      const distance = distanceFromPointToLineSegment(
        centroidSVY21,
        routePathSVY21[i],
        routePathSVY21[i + 1]
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestRouteIndex = i;
      }
    }

    // Estimate detour distance (simplified calculation)
    // If the linkway is very close to the route, detour should be minimal
    const estimatedDetour = minDistance * 2; // Rough estimate: distance to + distance from

    return {
      feature,
      centroid,
      distanceFromRoute: minDistance,
      estimatedDetour,
      routePosition: closestRouteIndex / routePathSVY21.length, // Position along route (0-1)
      detourRatio: (routeDistance + estimatedDetour) / routeDistance,
    };
  });

  // Filter out linkways that would cause too much detour
  const viableLinkways = linkwayEvaluations.filter(
    (evaluation) =>
      evaluation.detourRatio <= maxDetourRatio &&
      evaluation.distanceFromRoute <= 100 // Within 100m of route
  );

  // Sort by route position to maintain order along the route
  viableLinkways.sort((a, b) => a.routePosition - b.routePosition);

  // Select waypoints ensuring minimum distance between them
  const selectedWaypoints: LatLngCoordinate[] = [];

  for (const linkway of viableLinkways) {
    if (selectedWaypoints.length >= maxWaypoints) break;

    // Check if this waypoint is far enough from already selected ones
    const tooClose = selectedWaypoints.some((existing) => {
      const existingSVY21 = wgs84ToSVY21(existing.lat, existing.lng);
      const currentSVY21 = wgs84ToSVY21(
        linkway.centroid.lat,
        linkway.centroid.lng
      );
      const distance = calculateDistance(existingSVY21, currentSVY21);
      return distance < minDistanceBetweenWaypoints;
    });

    if (!tooClose) {
      selectedWaypoints.push(linkway.centroid);
    }
  }

  console.log(
    `Selected ${selectedWaypoints.length} optimal linkway waypoints from ${features.length} candidates`
  );
  console.log("Linkway evaluations:", viableLinkways.slice(0, 5)); // Log first 5 for debugging

  return selectedWaypoints;
}

// Debug function to test coordinate transformation with known Singapore landmarks
export function debugCoordinateTransformation(): void {
  console.log("=== Coordinate Transformation Debug ===");

  // Test with known Singapore coordinates
  const testPoints = [
    { name: "Marina Bay Sands", lat: 1.2834, lng: 103.8607 },
    { name: "Raffles Place", lat: 1.2844, lng: 103.8507 },
    { name: "Orchard Road", lat: 1.3048, lng: 103.8318 },
    { name: "Singapore Center", lat: 1.3521, lng: 103.8198 },
  ];

  testPoints.forEach((point) => {
    const svy21 = wgs84ToSVY21(point.lat, point.lng);
    const backToWgs84 = svy21ToWGS84(svy21.x, svy21.y);

    console.log(`${point.name}:`);
    console.log(`  Original: ${point.lat}, ${point.lng}`);
    console.log(`  SVY21: ${svy21.x.toFixed(2)}, ${svy21.y.toFixed(2)}`);
    console.log(
      `  Back to WGS84: ${backToWgs84.lat.toFixed(
        6
      )}, ${backToWgs84.lng.toFixed(6)}`
    );
    console.log(
      `  Difference: ${Math.abs(point.lat - backToWgs84.lat).toFixed(
        6
      )}, ${Math.abs(point.lng - backToWgs84.lng).toFixed(6)}`
    );
    console.log("---");
  });
}
