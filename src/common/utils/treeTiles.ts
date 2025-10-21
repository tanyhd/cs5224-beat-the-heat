/** Basic types for tree GeoJSON points */
export interface TreePointFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: Record<string, unknown>;
}
export interface TreeFeatureCollection {
  type: "FeatureCollection";
  features: TreePointFeature[];
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

// Simple in-memory cache for fetched tiles to avoid redundant network requests
const tileCache = new Map<string, TreePointFeature[]>();

/** meters → degrees (rough conversion; ok for Singapore-scale buffers) */
function metersToDeg(m: number) {
  const deg = m / 111_320; // ~111.32km per degree
  return { dLat: deg, dLng: deg };
}

/** Get bbox of a Google overview_path + buffer(m) */
export function bboxOfRoute(
  path: google.maps.LatLng[],
  bufferMeters = 100
): BBox {
  let minLat = 90,
    minLng = 180;
  let maxLat = -90,
    maxLng = -180;
  for (const p of path) {
    const { lat, lng } = p.toJSON();
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const { dLat, dLng } = metersToDeg(bufferMeters);
  return {
    minLng: minLng - dLng,
    minLat: minLat - dLat,
    maxLng: maxLng + dLng,
    maxLat: maxLat + dLat,
  };
}

/** Tiles must match your chunker: key = floor(lng/size) + "_" + floor(lat/size) */
export function tileKeysForBBox(bbox: BBox, tileDeg: number): string[] {
  const x0 = Math.floor(bbox.minLng / tileDeg);
  const x1 = Math.floor(bbox.maxLng / tileDeg);
  const y0 = Math.floor(bbox.minLat / tileDeg);
  const y1 = Math.floor(bbox.maxLat / tileDeg);
  const keys: string[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) keys.push(`${x}_${y}`);
  }
  return keys;
}

/** Fetch a single tile JSON from S3 (expects FeatureCollection) */
async function fetchTile(
  baseUrl: string,
  key: string
): Promise<TreeFeatureCollection> {
  const url = `${baseUrl}/${key}.json`;

  // Return cached copy when available
  if (tileCache.has(key)) {
    return { type: "FeatureCollection", features: tileCache.get(key)! };
  }

  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error(`Tile fetch failed: ${url} ${r.status}`);
  const json = await r.json();

  // Store into cache for future calls
  try {
    if (json?.features && Array.isArray(json.features)) {
      tileCache.set(key, json.features);
    }
  } catch (e) {
    // swallow cache store issues
  }

  return json;
}

/** Fetch only tiles intersecting the route bbox (with buffer), merge features */
export async function fetchTreesForRouteTiles(opts: {
  baseUrl: string; // e.g. https://.../datasets/trees/v1/tiles
  tileDeg: number; // e.g. 0.01
  path: google.maps.LatLng[]; // overview_path from Directions
  bufferMeters?: number; // default 100m
  concurrency?: number; // default 6
  // Optional: allow pre-filtering within the tile fetch by passing the route path
  // and a threshold in meters. This prevents loading large numbers of irrelevant
  // tree features into memory and speeds up downstream filtering.
  routePath?: google.maps.LatLng[];
  thresholdMeters?: number;
}): Promise<TreePointFeature[]> {
  const {
    baseUrl,
    tileDeg,
    path,
    bufferMeters = 100,
    concurrency = 6,
    routePath,
    thresholdMeters,
  } = opts;
  if (!path || path.length === 0) return [];
  const bbox = bboxOfRoute(path, bufferMeters);
  const keys = tileKeysForBBox(bbox, tileDeg);

  const queue = [...keys];
  const features: TreePointFeature[] = [];

  async function worker() {
    while (queue.length) {
      const k = queue.shift()!;
      try {
        const tile = await fetchTile(baseUrl, k);
        if (!tile?.features?.length) continue;

        // If caller provided a routePath and thresholdMeters, pre-filter features
        // here to avoid pushing large numbers of irrelevant points.
        if (routePath && typeof thresholdMeters === "number") {
          const kept: TreePointFeature[] = [];
          for (const f of tile.features) {
            const [lng, lat] = f.geometry.coordinates;
            const d = distanceToRouteMeters(
              { lat, lng },
              routePath.map((p) => ({ lat: p.lat(), lng: p.lng() }))
            );
            if (d <= thresholdMeters + 20) {
              // keep a small leeway (+20m) so we don't drop borderline trees
              kept.push(f);
            }
          }
          if (kept.length) features.push(...kept);
        } else {
          features.push(...tile.features);
        }
      } catch {
        // swallow individual tile errors for robustness
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, keys.length) }, worker)
  );
  return features;
}

/**
 * Distance from a point to the closest point on a polyline (in meters).
 * Requires Google Maps JS `geometry` library loaded.
 */
export function distanceToRouteMeters(
  point: google.maps.LatLngLiteral,
  routePath: google.maps.LatLngLiteral[]
): number {
  // We'll project point onto each segment and take the min distance.
  let min = Infinity;

  for (let i = 0; i < routePath.length - 1; i++) {
    const a = routePath[i];
    const b = routePath[i + 1];

    // Compute projection of P onto segment AB using vectors in meters via spherical utilities
    // We'll approximate by scanning candidate points along the segment using the nearest on great-circle.
    // A simpler & accurate approach: sample nearest point by parameter t in [0,1].

    // Convert to google LatLng for computeDistanceBetween
    const P = new google.maps.LatLng(point.lat, point.lng);

    // Parametric projection using linear interpolation in lat/lng (small-segment approximation)
    const tNumer =
      (point.lng - a.lng) * (b.lng - a.lng) +
      (point.lat - a.lat) * (b.lat - a.lat);
    const tDenom =
      (b.lng - a.lng) * (b.lng - a.lng) + (b.lat - a.lat) * (b.lat - a.lat);
    const t = tDenom === 0 ? 0 : Math.max(0, Math.min(1, tNumer / tDenom));

    const proj = new google.maps.LatLng(
      a.lat + t * (b.lat - a.lat),
      a.lng + t * (b.lng - a.lng)
    );

    const d = google.maps.geometry.spherical.computeDistanceBetween(P, proj);
    if (d < min) min = d;
  }
  return min;
}

/** Keep only trees within `thresholdMeters` of the actual route polyline */
export function filterTreesByDistanceToRoute(opts: {
  trees: TreePointFeature[];
  routePath: google.maps.LatLng[]; // overview_path
  thresholdMeters: number; // e.g. 10
}): TreePointFeature[] {
  if (!opts.routePath?.length || !opts.trees?.length) return [];
  const line: google.maps.LatLngLiteral[] = opts.routePath.map((p) => ({
    lat: p.lat(),
    lng: p.lng(),
  }));

  return opts.trees.filter((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const d = distanceToRouteMeters({ lat, lng }, line);
    return d <= opts.thresholdMeters;
  });
}
