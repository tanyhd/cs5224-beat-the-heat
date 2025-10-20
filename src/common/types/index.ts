// GeoJSON Types
export interface GeoJSONPosition {
  0: number; // longitude
  1: number; // latitude
  2?: number; // elevation (optional)
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONGeometry {
  type:
    | "Polygon"
    | "Point"
    | "LineString"
    | "MultiPolygon"
    | "MultiPoint"
    | "MultiLineString"
    | "GeometryCollection";
  coordinates: unknown;
}

export interface GeoJSONFeatureProperties {
  OBJECTID?: number;
  dataType?: DataType;
  [key: string]: unknown;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: GeoJSONFeatureProperties;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Data Types
export type DataType = "sheltered-linkway" | "pedestrian-overheadbridge";

export const DATA_TYPES: Record<DataType, string> = {
  "sheltered-linkway": "ShelteredLinkway.json",
  "pedestrian-overheadbridge": "PedestrainOverheadbridge.json",
};

// API Types
export interface StaticDataQueryParams {
  type?: DataType;
}

export interface StaticDataResponse extends GeoJSONFeatureCollection {}

export interface ApiError {
  error: string;
}
