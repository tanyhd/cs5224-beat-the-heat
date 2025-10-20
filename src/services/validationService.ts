import { DataType } from "@/common/types";
import { DataService } from "./dataService";

export class ValidationService {
  /**
   * Validates query parameters for the static data API
   * @param params - The query parameters object
   * @returns Object with validation result and error message if invalid
   */
  static validateStaticDataParams(params: { type?: string }): {
    isValid: boolean;
    error?: string;
    dataType?: DataType;
  } {
    const { type } = params;

    if (!type) {
      return { isValid: true };
    }

    if (!DataService.isValidDataType(type)) {
      const validTypes = DataService.getAvailableDataTypes().join(", ");
      return {
        isValid: false,
        error: `Invalid type parameter. Valid types: ${validTypes}`,
      };
    }

    return {
      isValid: true,
      dataType: type as DataType,
    };
  }
}
