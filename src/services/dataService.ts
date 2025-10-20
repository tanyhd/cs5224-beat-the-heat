import fs from "fs";
import path from "path";
import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  DataType,
  DATA_TYPES,
} from "@/common/types";

export class DataService {
  private static readonly DATA_DIR = path.join(
    process.cwd(),
    "public",
    "static-data"
  );

  /**
   * Reads a GeoJSON file from the static data directory
   * @param filename - The name of the file to read
   * @returns The parsed GeoJSON FeatureCollection or null if error
   */
  static readGeoJSONFile(filename: string): GeoJSONFeatureCollection | null {
    try {
      const filePath = path.join(this.DATA_DIR, filename);
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data) as GeoJSONFeatureCollection;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return null;
    }
  }

  /**
   * Gets all available data types
   * @returns Array of available data types
   */
  static getAvailableDataTypes(): DataType[] {
    return Object.keys(DATA_TYPES) as DataType[];
  }

  /**
   * Validates if a data type is valid
   * @param type - The data type to validate
   * @returns True if valid, false otherwise
   */
  static isValidDataType(type: string): type is DataType {
    return type in DATA_TYPES;
  }

  /**
   * Gets the filename for a data type
   * @param type - The data type
   * @returns The corresponding filename
   */
  static getFilenameForType(type: DataType): string {
    return DATA_TYPES[type];
  }
}

export class DataCombinerService {
  /**
   * Combines features from multiple data sources
   * @param dataTypes - Array of data types to combine, or undefined for all
   * @returns Combined GeoJSON FeatureCollection
   */
  static combineData(dataTypes?: DataType[]): GeoJSONFeatureCollection {
    const typesToLoad = dataTypes || DataService.getAvailableDataTypes();
    const combinedFeatures: GeoJSONFeature[] = [];

    for (const type of typesToLoad) {
      const filename = DataService.getFilenameForType(type);
      const data = DataService.readGeoJSONFile(filename);

      if (data) {
        // Add dataType to each feature's properties
        const featuresWithType = data.features.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            dataType: type,
          },
        }));

        combinedFeatures.push(...featuresWithType);
      }
    }

    return {
      type: "FeatureCollection",
      features: combinedFeatures,
    };
  }

  /**
   * Gets data for a specific type
   * @param type - The data type to retrieve
   * @returns GeoJSON FeatureCollection for the specified type
   */
  static getDataByType(type: DataType): GeoJSONFeatureCollection {
    return this.combineData([type]);
  }

  /**
   * Gets all available data
   * @returns Combined GeoJSON FeatureCollection with all data
   */
  static getAllData(): GeoJSONFeatureCollection {
    return this.combineData();
  }
}

// Backwards-compatible named export expected by some routes
// `dataService` provides the same static methods as DataCombinerService
export const dataService = DataCombinerService;
