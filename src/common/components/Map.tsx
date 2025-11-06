"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
  Polygon,
  Autocomplete,
} from "@react-google-maps/api";
import {
  filterShelteredLinkwaysAlongRoute,
  loadShelteredLinkwayData,
  convertShelteredLinkwayToGoogleMapsPolygons,
  selectOptimalLinkwayWaypoints,
  getShelteredLinkwayCentroid,
  type ShelteredLinkwayData,
  type ShelteredLinkwayFeature,
  type LatLngCoordinate,
} from "@/common/utils/shelteredLinkway";
import { createShelterMarkerIcon } from "@/common/utils/shelterMarkerIcon";

import styles from "./Map.module.css";
import PillToggle from "./PillTabs";
import RouteMode from "../constants/routeMode";
import Swap from "../icons/Swap";
import Pill from "./Pill";
import Pin from "../icons/Pin";
import Flag from "../icons/Flag";
import ShelterSlider from "./ShelterSlider";
import Walking from "../icons/Walking";
import Cycling from "../icons/Cycling";
import Route from "../icons/Route";
import Clock from "../icons/Clock";
import MapIcon from "../icons/Map";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "6px",
  marginTop: "16px"
};

const center = {
  lat: 1.3521, // Singapore
  lng: 103.8198,
};

// Utility function to log button clicks with input/output parameters
const logButtonClick = <T extends unknown[], R>(
  buttonName: string,
  fn: (...args: T) => R
) => {
  return (...args: T): R => {
    console.groupCollapsed(`🔘 Button Click: ${buttonName}`);
    console.log("Input parameters:", args);
    try {
      const result = fn(...args);
      console.log("Output result:", result);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error("Error occurred:", error);
      console.groupEnd();
      throw error;
    }
  };
};

const Map: React.FC = () => {
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [routeOptions, setRouteOptions] = useState<
    google.maps.DirectionsRoute[]
  >([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [duration, setDuration] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [shelteredLinkwayData, setShelteredLinkwayData] =
    useState<ShelteredLinkwayData | null>(null);
  const [filteredLinkways, setFilteredLinkways] = useState<
    ShelteredLinkwayFeature[]
  >([]);
  const [orderedShelters, setOrderedShelters] = useState<
    ShelteredLinkwayFeature[]
  >([]);
  const [autoAddLinkwayWaypoints, setAutoAddLinkwayWaypoints] =
    useState<boolean>(true);
  const [optimalWaypoints, setOptimalWaypoints] = useState<LatLngCoordinate[]>(
    []
  );
  const [shelterPreference, setShelterPreference] = useState<number>(50); // 0-100 slider value
  const [appliedShelterPreference, setAppliedShelterPreference] = useState<number>(50); // Shelter preference used in last route calculation
  // keep setters for origin/dest coords used during route calculation
  const [, setOriginCoords] = useState<LatLngCoordinate | null>(null);
  const [, setDestCoords] = useState<LatLngCoordinate | null>(null);
  const [routeMode, setRouteMode] = useState<google.maps.TravelMode>(
    RouteMode.WALKING
  );

  const handleToggleChange = () => {
    const toggledMode = routeMode === RouteMode.WALKING
      ? RouteMode.BICYCLING
      : RouteMode.WALKING;
    setRouteMode(toggledMode);
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["routes", "geometry", "places"],
  });

  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Order shelters by distance from destination (closest to destination = #1)
  const orderSheltersFromDestination = useCallback((
    shelters: ShelteredLinkwayFeature[],
    destination: LatLngCoordinate
  ): ShelteredLinkwayFeature[] => {
    return [...shelters].sort((a, b) => {
      const centroidA = getShelteredLinkwayCentroid(a);
      const centroidB = getShelteredLinkwayCentroid(b);

      // Calculate distance from destination using Haversine formula
      const distanceA = calculateHaversineDistance(centroidA, destination);
      const distanceB = calculateHaversineDistance(centroidB, destination);

      return distanceA - distanceB; // Closest first
    });
  }, []);

  // Calculate Haversine distance between two lat/lng points (in meters)
  const calculateHaversineDistance = (point1: LatLngCoordinate, point2: LatLngCoordinate): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Filter shelters for a specific route path
  const filterSheltersForRoute = useCallback((
    route: google.maps.DirectionsRoute,
    shelteredData: ShelteredLinkwayData,
    shelterParams: { bufferDistance: number; maxResults: number }
  ): ShelteredLinkwayFeature[] => {
    if (!route.overview_path || route.overview_path.length === 0) {
      return [];
    }

    // Extract route path as array of coordinates
    const routePath: LatLngCoordinate[] = route.overview_path.map((point) => ({
      lat: point.lat(),
      lng: point.lng(),
    }));

    // Use filterShelteredLinkwaysAlongRoute for path-specific filtering
    return filterShelteredLinkwaysAlongRoute(routePath, shelteredData, {
      bufferDistance: shelterParams.bufferDistance,
      maxResults: shelterParams.maxResults,
      strictFiltering: true,
    });
  }, []);

  // Calculate shelter parameters based on slider value (0-100) and route distance
  const calculateShelterParams = useCallback((preferenceValue: number, routeDistanceMeters: number) => {
    // If slider is 0, return 0 shelters
    if (preferenceValue === 0) {
      return {
        maxResults: 0,
        bufferDistance: 0,
        maxWaypoints: 0,
      };
    }

    // Base calculation: 1 shelter per 500m for preference = 50
    const routeDistanceKm = routeDistanceMeters / 1000;
    const baseSheltersPerKm = 2; // 1 shelter per 500m at 50% preference

    // Scale based on preference (0-100)
    // At 25%: 0.5x shelters, At 50%: 1x shelters, At 75%: 1.5x shelters, At 100%: 2x shelters
    const preferenceMultiplier = preferenceValue / 50;

    const calculatedShelters = Math.ceil(routeDistanceKm * baseSheltersPerKm * preferenceMultiplier);

    // Ensure at least 1 shelter if preference > 0, max 25 (Google Maps API limit)
    const maxResults = Math.min(Math.max(1, calculatedShelters), 25);

    // Buffer distance scales with preference: 200m (low) to 500m (high)
    const bufferDistance = 200 + (preferenceValue / 100) * 300;

    // Max waypoints scales: 1-8 based on preference
    const maxWaypoints = Math.min(Math.max(1, Math.ceil(maxResults / 3)), 8);

    console.log(`Shelter calculation: preference=${preferenceValue}%, distance=${routeDistanceKm.toFixed(2)}km, maxResults=${maxResults}, buffer=${bufferDistance.toFixed(0)}m, maxWaypoints=${maxWaypoints}`);

    return {
      maxResults,
      bufferDistance: Math.round(bufferDistance),
      maxWaypoints,
    };
  }, []);

  // Load sheltered linkway data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadShelteredLinkwayData();
        setShelteredLinkwayData(data);
        console.groupCollapsed("ShelteredLinkway: loaded data");
        console.log(`count: ${data.features.length}`);
        try {
          // show a compact sample of first 10 features (properties + geometry type)
          const sample = data.features.slice(0, 10).map((f, i: number) => ({
            index: i,
            properties: f.properties || null,
            geometryType: f.geometry?.type || null,
            // try to include a small coordinate sample without dumping everything
            coordSample:
              f.geometry?.coordinates && Array.isArray(f.geometry.coordinates)
                ? JSON.stringify(f.geometry.coordinates).slice(0, 200)
                : null,
          }));
          console.table(sample);
        } catch (e) {
          console.log("ShelteredLinkway sample logging failed", e);
        }
        console.groupEnd();
      } catch (error) {
        console.error("Failed to load sheltered linkway data:", error);
      }
    };
    loadData();
  }, []);

  // Update shelters when route selection changes (using appliedShelterPreference, NOT live shelterPreference)
  useEffect(() => {
    if (!shelteredLinkwayData || !directionsResponse || !routeOptions.length) {
      return;
    }

    const selectedRoute = routeOptions[selectedRouteIndex];
    if (!selectedRoute) {
      return;
    }

    // Get route distance for proportional calculation
    const routeDistance = selectedRoute.legs?.reduce(
      (total, leg) => total + (leg.distance?.value || 0),
      0
    ) || 1000;

    // Use the appliedShelterPreference (from last route calculation), not the live slider value
    const shelterParams = calculateShelterParams(appliedShelterPreference, routeDistance);

    // Filter shelters along the selected route path
    const filtered = filterSheltersForRoute(selectedRoute, shelteredLinkwayData, shelterParams);
    setFilteredLinkways(filtered);

    // Get destination coordinates from the selected route
    const lastLeg = selectedRoute.legs?.[selectedRoute.legs.length - 1];
    if (lastLeg?.end_location) {
      const destCoords = {
        lat: lastLeg.end_location.lat(),
        lng: lastLeg.end_location.lng(),
      };
      const ordered = orderSheltersFromDestination(filtered, destCoords);
      setOrderedShelters(ordered);
    }

    console.log(`Updated shelters for route option ${selectedRouteIndex + 1}: ${filtered.length} shelters found`);
  }, [
    selectedRouteIndex,
    shelteredLinkwayData,
    directionsResponse,
    routeOptions,
    appliedShelterPreference,
    calculateShelterParams,
    filterSheltersForRoute,
    orderSheltersFromDestination,
  ]);

  // Function to geocode an address and get coordinates
  const geocodeAddress = useCallback(
    async (address: string): Promise<LatLngCoordinate | null> => {
      if (!isLoaded) return null;

      const geocoder = new google.maps.Geocoder();

      try {
        const result = await geocoder.geocode({ address });
        if (result.results[0]) {
          const location = result.results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng(),
          };
          console.log("Geocode:", { address, coords });
          return coords;
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      }

      return null;
    },
    [isLoaded]
  );

  // Function to get route details (duration, distance) for a specific route
  const getRouteDetails = useCallback((route: google.maps.DirectionsRoute) => {
    if (!route.legs) return { duration: "", distance: "" };

    let totalDuration = 0;
    let totalDistance = 0;

    route.legs.forEach((leg) => {
      if (leg.duration?.value) totalDuration += leg.duration.value;
      if (leg.distance?.value) totalDistance += leg.distance.value;
    });

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const distanceText = `${(totalDistance / 1000).toFixed(1)} km`;

    return { duration: durationText, distance: distanceText };
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

    // Capture the current shelter preference at the time of calculation
    setAppliedShelterPreference(shelterPreference);

    const directionsService = new google.maps.DirectionsService();

    try {
      // Get coordinates for origin and destination
      const originCoordinates = await geocodeAddress(origin);
      const destCoordinates = await geocodeAddress(destination);

      if (!originCoordinates || !destCoordinates) {
        alert("Could not find coordinates for the provided addresses");
        return;
      }

      setOriginCoords(originCoordinates);
      setDestCoords(destCoordinates);

      // Process waypoints if any
      const waypointObjects: google.maps.DirectionsWaypoint[] = [];
      const validWaypoints = waypoints.filter((wp) => wp.trim() !== "");

      for (const waypoint of validWaypoints) {
        waypointObjects.push({
          location: waypoint,
          stopover: true,
        });
      }

      // Route debug (move after validWaypoints is defined)
      console.groupCollapsed("Route debug: inputs");
      console.log("originCoordinates:", originCoordinates);
      console.log("destCoordinates:", destCoordinates);
      console.log("manual waypoints:", validWaypoints);
      console.log("waypointObjects:", waypointObjects);
      console.groupEnd();

      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypointObjects.length > 0 ? waypointObjects : undefined,
        optimizeWaypoints: waypointObjects.length > 1, // Optimize order if multiple waypoints
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
      });

      setDirectionsResponse(results);
      setRouteOptions(results.routes || []);
      setSelectedRouteIndex(0);

      // Set initial duration and distance for the first route
      if (results.routes && results.routes[0]) {
        const details = getRouteDetails(results.routes[0]);
        setDuration(details.duration);
        setDistance(details.distance);
      }


      // Filter sheltered linkways along the first route (will update when route changes)
      if (shelteredLinkwayData && results.routes && results.routes[0]) {
        const firstRoute = results.routes[0];

        // Get route distance for proportional calculation
        const routeDistance = firstRoute.legs?.reduce(
          (total, leg) => total + (leg.distance?.value || 0),
          0
        ) || 1000; // Default to 1km if distance unavailable

        // Calculate shelter parameters based on user preference and route distance
        const shelterParams = calculateShelterParams(shelterPreference, routeDistance);

        // Filter shelters along the actual route path (not just bounding box)
        const filtered = filterSheltersForRoute(firstRoute, shelteredLinkwayData, shelterParams);
        setFilteredLinkways(filtered);

        // Order shelters from destination for numbering
        if (destCoordinates) {
          const ordered = orderSheltersFromDestination(filtered, destCoordinates);
          setOrderedShelters(ordered);
        }

        console.groupCollapsed("Filtered sheltered linkways");
        console.log(`count: ${filtered.length}`);
        try {
          const summaries = filtered.map((f, i: number) => ({
            index: i,
            properties: f.properties || null,
            geometryType: f.geometry?.type || null,
            coordSample:
              f.geometry?.coordinates && Array.isArray(f.geometry.coordinates)
                ? JSON.stringify(f.geometry.coordinates).slice(0, 200)
                : null,
          }));
          console.table(summaries);
        } catch (e) {
          console.log("Filtered summary logging failed", e);
        }
        console.groupEnd();

        // Enhanced logging for route calculation results
        console.groupCollapsed("🚶 Route Calculation Results");
        console.log(
          `📍 Number of sheltered walkways found: ${filtered.length}`
        );

        // Log breakdown by data type
        const dataTypeCounts: Record<string, number> = {};
        filtered.forEach((feature) => {
          const type = feature.properties.dataType || "unknown";
          dataTypeCounts[type] = (dataTypeCounts[type] || 0) + 1;
        });
        console.log("📍 Data type breakdown:", dataTypeCounts);

        console.log("📍 Sheltered walkway coordinates:");
        filtered.forEach((linkway, index) => {
          console.log(
            `  ${index + 1}. [${linkway.properties.dataType}] Coordinates:`,
            linkway.geometry?.coordinates || "N/A"
          );
        });
        console.groupEnd();

        // Log auto-add check so we can see why augmentation may be skipped
        console.debug("Auto-add check", {
          autoAddLinkwayWaypoints,
          filteredCount: filtered.length,
        });

        // If auto-add is enabled and we have linkways, add them as waypoints and recalculate
        if (autoAddLinkwayWaypoints && filtered.length > 0 && shelterParams.maxResults > 0) {
          // Use the current route result to select optimal waypoints that minimize detours
          const optimalLinkwayWaypoints = selectOptimalLinkwayWaypoints(
            results,
            filtered,
            {
              maxDetourRatio: 1.2, // Allow maximum 20% detour
              maxWaypoints: shelterParams.maxWaypoints, // Use calculated waypoints based on preference
              minDistanceBetweenWaypoints: 300, // 300m minimum distance between waypoints
            }
          );

          if (optimalLinkwayWaypoints.length > 0) {
            console.groupCollapsed("Optimal linkway waypoint selection");
            console.log("candidates:", optimalLinkwayWaypoints.length);
            try {
              console.table(
                optimalLinkwayWaypoints.map((c, i: number) => ({
                  index: i,
                  lat: c.lat,
                  lng: c.lng,
                }))
              );
            } catch (e) {
              console.log("Optimal candidate logging failed", e);
            }

            const linkwayWaypointObjects: google.maps.DirectionsWaypoint[] =
              optimalLinkwayWaypoints.map((coords) => ({
                location: new google.maps.LatLng(coords.lat, coords.lng),
                stopover: false, // Set to false since these are just route optimization points
              }));

            console.log(
              "selected waypoints (lat/lng):",
              linkwayWaypointObjects.map((wp) => ({
                lat: (wp.location as google.maps.LatLng).lat(),
                lng: (wp.location as google.maps.LatLng).lng(),
              }))
            );
            console.groupEnd();

            // Enhanced logging for optimal waypoints
            console.groupCollapsed("🎯 Optimal Waypoints Selected");
            console.log(
              `📍 Number of optimal waypoints: ${optimalLinkwayWaypoints.length}`
            );
            console.log("📍 Optimal waypoint coordinates:");
            optimalLinkwayWaypoints.forEach((waypoint, index) => {
              console.log(
                `  ${index + 1}. Lat: ${waypoint.lat}, Lng: ${waypoint.lng}`
              );
            });
            console.groupEnd();

            // Store optimal waypoints for map display
            setOptimalWaypoints(optimalLinkwayWaypoints);

            // Combine manual waypoints with optimal linkway waypoints
            const allWaypointObjects = [
              ...waypointObjects, // Manual waypoints (stopover: true)
              ...linkwayWaypointObjects, // Optimal linkway waypoints (stopover: false)
            ];

            console.log(
              `Recalculating route with ${linkwayWaypointObjects.length} optimal linkway waypoints (filtered from ${filtered.length} candidates)`
            );

            // Recalculate route with optimal linkways
            const resultsWithLinkways = await directionsService.route({
              origin: origin,
              destination: destination,
              waypoints: allWaypointObjects,
              optimizeWaypoints: false, // Don't reorder since we've already optimized positions
              travelMode: google.maps.TravelMode.WALKING, // Use walking for sheltered paths
              provideRouteAlternatives: true,
            });

            // Merge original routes with augmented (linkway) routes instead of replacing them.
            // This preserves the original alternatives so users can still select them.
            const originalRoutes = results.routes || [];
            const augmentedRoutes = resultsWithLinkways.routes || [];
            const mergedRoutes = [...originalRoutes, ...augmentedRoutes];

            // Build a merged DirectionsResult object (we keep the recalculated result as base
            // but overwrite routes to include both sets). This is sufficient for rendering
            // and for route selection via routeIndex.
            const mergedDirectionsResult = {
              ...resultsWithLinkways,
              routes: mergedRoutes,
            } as unknown as google.maps.DirectionsResult;

            setDirectionsResponse(mergedDirectionsResult);
            setRouteOptions(mergedRoutes);
            // Keep the original route as the first selectable option
            setSelectedRouteIndex(0);

            // Update duration/distance using the primary (original) route to avoid surprising the user
            if (mergedRoutes[0]) {
              const details = getRouteDetails(mergedRoutes[0]);
              setDuration(details.duration);
              setDistance(details.distance);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route. Please check your addresses.");
    }
  }, [
    origin,
    destination,
    waypoints,
    geocodeAddress,
    shelteredLinkwayData,
    autoAddLinkwayWaypoints,
    getRouteDetails,
    shelterPreference,
    calculateShelterParams,
  ]);

  const clearRoute = useCallback(() => {
    setDirectionsResponse(null);
    setRouteOptions([]);
    setSelectedRouteIndex(0);
    setDuration("");
    setDistance("");
    setOrigin("");
    setDestination("");
    setWaypoints([]);
    setFilteredLinkways([]);
    setOrderedShelters([]);
    setOriginCoords(null);
    setDestCoords(null);
    setOptimalWaypoints([]);
    // Note: We keep appliedShelterPreference so it's ready for next calculation
    // setRouteTrees([]);
  }, []);

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Function to select a route
  const selectRoute = useCallback(
    (index: number) => {
      setSelectedRouteIndex(index);
      if (routeOptions[index]) {
        const details = getRouteDetails(routeOptions[index]);
        setDuration(details.duration);
        setDistance(details.distance);
      }
    },
    [routeOptions, getRouteDetails]
  );

  // Wrapped button handlers with logging (no hook indirection)
  const calculateRouteWithLogging = logButtonClick(
    "Calculate Route",
    calculateRoute
  );

  const clearRouteWithLogging = logButtonClick("Clear Route", clearRoute);

  return isLoaded ? (
    <div>
      {/* Route Controls */}
      <div
        style={{
          marginBottom: "16px",
          borderRadius: "16px",
          padding: "16px",
          background: "#F5FFFE",
        }}
      >
        <div style={{ color: "#064E3B", fontWeight: "bold" }}>Plan your route</div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className={styles.inputContainer}>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" }} className={styles.inputGroup}>
            <div style={{ display: "flex", gap: "10px", flex: 1}} className={styles.innerInputGroup}>
              <div style={{ position: "relative", flex: 1 }}>
                <div style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "62%", 
                  transform: "translateY(-50%)", 
                  zIndex: 1,
                  color: "#064E3B"
                }}>
                  <Pin />
                </div>
                <Autocomplete
                  className={styles.autocomplete}
                  options={{
                  componentRestrictions: { country: "sg" },
                  fields: ["formatted_address", "geometry", "name"],
                  }}
                  onLoad={(autocomplete) => (originRef.current = autocomplete)}
                  onPlaceChanged={() => {
                  const place = originRef.current?.getPlace();
                  if (place?.geometry?.location) {
                    setOrigin(place.formatted_address || place.name || "");
                  }
                  }}
                >
                  <input
                  type="text"
                  placeholder="Origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  style={{
                    backgroundColor: "#FFF",
                    color: "black",
                    padding: "5px 5px 5px 35px",
                    flex: 1,
                    borderRadius: "48px",
                    border: "3px solid #D1EEF8",
                    width: "100%"
                  }}
                  />
                </Autocomplete>
              </div>

              <div 
                onClick={swapLocations}
                style={{ 
                  cursor: "pointer", 
                  color: "#064E3B", 
                  fontWeight: "bold",
                  backgroundColor: "#F3F9FB",
                  borderRadius: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  padding: "4px",
                  margin: 'auto'
                }}
              >
                <Swap />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <div style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "60%", 
                  transform: "translateY(-50%)", 
                  zIndex: 1,
                  color: "#064E3B"
                }}>
                  <Flag />
                </div>
                <Autocomplete
                  className={styles.autocomplete}
                  options={{
                    componentRestrictions: { country: "sg" },
                    fields: ["formatted_address", "geometry", "name"],
                  }}
                  onLoad={(autocomplete) => (destRef.current = autocomplete)}
                  onPlaceChanged={() => {
                    const place = destRef.current?.getPlace();
                    if (place?.geometry?.location) {
                      setDestination(place.formatted_address || place.name || "");
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={{
                      backgroundColor: "#FFF",
                      color: "black",
                      padding: "5px 5px 5px 35px",
                      flex: 1,
                      borderRadius: "48px",
                      border: "3px solid #D1EEF8",
                      width: "100%"
                    }}
                  />
                </Autocomplete>
              </div>
            </div>
          </div>
          <div className={styles.pillGroup}>
            <PillToggle
              tabs={[{
                id: RouteMode.WALKING,
                label: "Walking",
                content: null,
              }, {
                id: RouteMode.BICYCLING,
                label: "Bicycling",
                content: null,
              }]} onChange={handleToggleChange} />
          </div>
        </div>
        <ShelterSlider
          value={shelterPreference}
          onChange={setShelterPreference}
        />
        <div style={{ display: "flex", gap: "10px"}}>
            <button
            onClick={calculateRouteWithLogging}
            style={{
              backgroundColor: "#06B6D4",
              color: "white",
              borderRadius: "16px",
              padding: "8px 16px",
              width: "80%",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0891B2";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(6, 182, 212, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#06B6D4";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
            Find Cooler Route
            </button>
            <button
            onClick={clearRouteWithLogging}
            style={{
              backgroundColor: "#EFFCFB",
              color: "#064E3B",
              padding: "8px 16px",
              width: "20%",
              borderRadius: "16px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#D1F2EA";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(6, 78, 59, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#EFFCFB";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
            Clear
            </button>
        </div>

      </div>

      {/* Map */}
      <div style={{
        borderRadius: "16px",
        border: "3px solid #D1EEF8",
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        padding: "16px",
        background: "#FFFFFF",
      }} >
        {routeOptions.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {routeOptions
                .slice(
                  0,
                  parseInt(process.env.NEXT_PUBLIC_MAX_ROUTE_OPTIONS || "5")
                )
                .map((route, index) => {
                  const details = getRouteDetails(route);
                  return (
                    <button
                      key={index}
                      onClick={() => selectRoute(index)}
                      style={{
                      padding: "8px 12px",
                      backgroundColor:
                        selectedRouteIndex === index ? "#06B6D4" : "#EFFCFB",
                      color: selectedRouteIndex === index ? "#FFF" : "#064E3B",
                      fontWeight: "bold",
                      border: "1px solid #ddd",
                      borderRadius: "48px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                      if (selectedRouteIndex !== index) {
                        e.currentTarget.style.backgroundColor = "#D1F2EA";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(6, 78, 59, 0.15)";
                      } else {
                        e.currentTarget.style.backgroundColor = "#0891B2";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(6, 182, 212, 0.3)";
                      }
                      }}
                      onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        selectedRouteIndex === index ? "#06B6D4" : "#EFFCFB";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <Route style={{position: "relative", top:"3px"}} stroke={selectedRouteIndex === index ? "#FFF" : "#064E3B"} />
                      Option {index + 1}: {details.duration} |{" "}
                      {details.distance}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={11}
        >
          {/* Render route if available */}
          {directionsResponse && routeOptions.length > 0 && (
            <DirectionsRenderer
              directions={directionsResponse}
              routeIndex={selectedRouteIndex}
              options={{
                suppressMarkers: true, // Suppress default Google Maps markers (origin, destination, waypoints)
              }}
            />
          )}

          {/* Render sheltered linkway polygons with subtle cyan */}
          {filteredLinkways.length > 0 &&
            convertShelteredLinkwayToGoogleMapsPolygons(filteredLinkways).map(
              (polygonPath, index) => (
                <Polygon
                  key={`linkway-${index}`}
                  paths={polygonPath}
                  options={{
                    fillColor: "#06B6D4",
                    fillOpacity: 0.2,
                    strokeColor: "#06B6D4",
                    strokeOpacity: 0.5,
                    strokeWeight: 1.5,
                  }}
                />
              )
            )}

          {/* Render numbered markers for shelters (ordered from destination) */}
          {orderedShelters.length > 0 &&
            orderedShelters.map((shelter, index) => {
              const centroid = getShelteredLinkwayCentroid(shelter);
              // Create unique key using route index, shelter coordinates, and index
              const uniqueKey = `shelter-${selectedRouteIndex}-${centroid.lat.toFixed(6)}-${centroid.lng.toFixed(6)}-${index}`;
              return (
                <Marker
                  key={uniqueKey}
                  position={{ lat: centroid.lat, lng: centroid.lng }}
                  icon={createShelterMarkerIcon(index + 1)}
                  title={`Shelter ${index + 1}`}
                  zIndex={1000 + index}
                />
              );
            })}
        </GoogleMap>
      </div>

      {duration && distance && <div style={{ 
        borderRadius: "16px",
        border: "3px solid #D1EEF8",
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        padding: "16px",
        background: "#FFFFFF",
        marginTop: "16px",
        marginBottom: "32px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "16px" }}>Coolest Path</div>
          <div><Pill label={routeMode}/></div>
        </div>
        <div style={{ color: "#7AA9C3", display: "flex", alignItems: "center", gap: "4px" }}><Clock stroke="#7AA9C3" />{duration}   <MapIcon />{distance}</div>
        <div style={{marginTop: '8px'}}>
          <Pill label={`+ Tree lined streets`} />
          <Pill label={`+ ${filteredLinkways?.length} Sheltered Linkways`} />
        </div>
      </div>}
    </div>
  ) : (
    <div>Loading Map...</div>
  );
};

export { Map };
export default Map;
