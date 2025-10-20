import { dataService } from "../../../services/dataService";
import { ValidationService } from "../../../services/validationService";
import { ApiResponseService } from "../../../services/apiResponseService";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") || undefined;

  // Validate query parameters
  const validation = ValidationService.validateStaticDataParams({
    type: typeParam,
  });
  if (!validation.isValid) {
    return ApiResponseService.badRequest(validation.error);
  }

  try {
    // Get combined data based on type parameter
    const data = validation.dataType
      ? dataService.getDataByType(validation.dataType)
      : dataService.getAllData();

    return ApiResponseService.geoJson(data);
  } catch (error) {
    console.error("Error processing static data request:", error);
    return ApiResponseService.error("Internal server error");
  }
}
