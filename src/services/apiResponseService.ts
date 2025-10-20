import { NextResponse } from "next/server";
import { GeoJSONFeatureCollection, ApiError } from "@/common/types";

export class ApiResponseService {
  /**
   * Creates a successful JSON response
   * @param data - The data to return
   * @param status - HTTP status code (default: 200)
   * @returns NextResponse with JSON data
   */
  static success<T>(data: T, status: number = 200): NextResponse<T> {
    return NextResponse.json(data, { status });
  }

  /**
   * Creates an error response
   * @param message - Error message
   * @param status - HTTP status code (default: 500)
   * @returns NextResponse with error
   */
  static error(message: string, status: number = 500): NextResponse<ApiError> {
    return NextResponse.json({ error: message }, { status });
  }

  /**
   * Creates a bad request error response
   * @param message - Error message
   * @returns NextResponse with 400 status
   */
  static badRequest(message: string): NextResponse<ApiError> {
    return this.error(message, 400);
  }

  /**
   * Creates a GeoJSON response
   * @param geoJsonData - The GeoJSON FeatureCollection
   * @returns NextResponse with GeoJSON data
   */
  static geoJson(
    geoJsonData: GeoJSONFeatureCollection
  ): NextResponse<GeoJSONFeatureCollection> {
    return this.success(geoJsonData);
  }
}
