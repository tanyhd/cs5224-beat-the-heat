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
  filterShelteredLinkwaysInBoundary,
  loadShelteredLinkwayData,
  convertShelteredLinkwayToGoogleMapsPolygons,
  selectOptimalLinkwayWaypoints,
  svy21ToWGS84,
  type ShelteredLinkwayData,
  type ShelteredLinkwayFeature,
  type LatLngCoordinate,
} from "@/common/utils/shelteredLinkway";
import {
  fetchTreesForRouteTiles,
  filterTreesByDistanceToRoute,
  type TreePointFeature,
} from "@/common/utils/treeTiles";

const containerStyle = {
  width: "100%",
  height: "400px",
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
  const [markers, setMarkers] = useState<google.maps.LatLngLiteral[]>([]);
  const [shelteredLinkwayData, setShelteredLinkwayData] =
    useState<ShelteredLinkwayData | null>(null);
  const [filteredLinkways, setFilteredLinkways] = useState<
    ShelteredLinkwayFeature[]
  >([]);
  const [originCoords, setOriginCoords] = useState<LatLngCoordinate | null>(
    null
  );
  const [destCoords, setDestCoords] = useState<LatLngCoordinate | null>(null);
  const [autoAddLinkwayWaypoints, setAutoAddLinkwayWaypoints] =
    useState<boolean>(true);
  const [optimalWaypoints, setOptimalWaypoints] = useState<LatLngCoordinate[]>(
    []
  );
  const [showTrees, setShowTrees] = useState<boolean>(false);
  const [routeTrees, setRouteTrees] = useState<TreePointFeature[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["routes", "geometry", "places"],
  });

  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destRef = useRef<google.maps.places.Autocomplete | null>(null);
  const TREES_TILE_BASE =
    "https://beat-the-heat-data.s3.ap-southeast-2.amazonaws.com/datasets/trees/v1/tiles";
  const TREES_TILE_DEG = 0.01; // must match your chunk script
  const TREES_BUFFER_M = 100; // bbox buffer before precise filtering
  const TREES_NEAR_M = 10; // final distance-to-route threshold

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

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

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

      // Fetch trees along the route if overview_path is available
      if (results.routes[0]?.overview_path) {
        // 1) fetch only intersecting tiles
        const tileTrees = await fetchTreesForRouteTiles({
          baseUrl: TREES_TILE_BASE,
          tileDeg: TREES_TILE_DEG,
          path: results.routes[0].overview_path,
          bufferMeters: TREES_BUFFER_M,
        });

        // 2) keep only trees within 10 m of the actual route polyline
        const near = filterTreesByDistanceToRoute({
          trees: tileTrees,
          routePath: results.routes[0].overview_path,
          thresholdMeters: TREES_NEAR_M,
        });
        setRouteTrees(near);
      }

      // Filter sheltered linkways and optionally add them as waypoints
      if (shelteredLinkwayData && originCoordinates && destCoordinates) {
        const filtered = filterShelteredLinkwaysInBoundary(
          originCoordinates,
          destCoordinates,
          shelteredLinkwayData,
          {
            bufferDistance: 300, // 300m buffer from route line
            maxResults: 5, // Limit to 5 results to avoid too many waypoints
            strictFiltering: true, // Use strict filtering along route line
          }
        );
        setFilteredLinkways(filtered);
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

        // If auto-add is enabled and we have linkways, add them as waypoints and recalculate
        if (autoAddLinkwayWaypoints && filtered.length > 0) {
          // Use the current route result to select optimal waypoints that minimize detours
          const optimalLinkwayWaypoints = selectOptimalLinkwayWaypoints(
            results,
            filtered,
            {
              maxDetourRatio: 1.2, // Allow maximum 20% detour
              maxWaypoints: 3, // Limit to 3 waypoints to avoid complexity
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

            // Recalculate route with optimal linkway waypoints
            const resultsWithLinkways = await directionsService.route({
              origin: origin,
              destination: destination,
              waypoints: allWaypointObjects,
              optimizeWaypoints: false, // Don't reorder since we've already optimized positions
              travelMode: google.maps.TravelMode.WALKING, // Use walking for sheltered paths
              provideRouteAlternatives: true,
            });

            setDirectionsResponse(resultsWithLinkways);
            setRouteOptions(resultsWithLinkways.routes || []);
            setSelectedRouteIndex(0);

            // Set initial duration and distance for the first route
            if (resultsWithLinkways.routes && resultsWithLinkways.routes[0]) {
              const details = getRouteDetails(resultsWithLinkways.routes[0]);
              setDuration(details.duration);
              setDistance(details.distance);
            }

            // Fetch trees along the updated route
            if (resultsWithLinkways.routes[0]?.overview_path) {
              // 1) fetch only intersecting tiles
              const tileTrees = await fetchTreesForRouteTiles({
                baseUrl: TREES_TILE_BASE,
                tileDeg: TREES_TILE_DEG,
                path: resultsWithLinkways.routes[0].overview_path,
                bufferMeters: TREES_BUFFER_M,
              });

              // 2) keep only trees within 10 m of the actual route polyline
              const near = filterTreesByDistanceToRoute({
                trees: tileTrees,
                routePath: resultsWithLinkways.routes[0].overview_path,
                thresholdMeters: TREES_NEAR_M,
              });
              setRouteTrees(near);
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
    setMarkers([]);
    setFilteredLinkways([]);
    setOriginCoords(null);
    setDestCoords(null);
    setOptimalWaypoints([]);
    setRouteTrees([]);
  }, []);

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

  // Wrapped button handlers with logging
  const calculateRouteWithLogging = useCallback(
    logButtonClick("Calculate Route", calculateRoute),
    [calculateRoute]
  );

  const clearRouteWithLogging = useCallback(
    logButtonClick("Clear Route", clearRoute),
    [clearRoute]
  );

  const testFilterWithLogging = useCallback(
    logButtonClick("Test Filter", () => {
      if (shelteredLinkwayData) {
        // Test with Marina Bay to Raffles Place
        const testOrigin = { lat: 1.2834, lng: 103.8607 };
        const testDest = { lat: 1.2844, lng: 103.8507 };
        const filtered = filterShelteredLinkwaysInBoundary(
          testOrigin,
          testDest,
          shelteredLinkwayData,
          { bufferDistance: 200, maxResults: 10, strictFiltering: true }
        );
        console.log("Test filtering result:", filtered.length);
        setFilteredLinkways(filtered);
      }
    }),
    [shelteredLinkwayData]
  );

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarkers((prev) => [...prev, newMarker]);
    }
  }, []);

  return isLoaded ? (
    <div>
      {/* Route Controls */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "white",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <Autocomplete
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
                backgroundColor: "#F5F5F5",
                color: "black",
                padding: "5px",
                flex: 1,
              }}
            />
          </Autocomplete>

          <Autocomplete
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
                backgroundColor: "#F5F5F5",
                color: "black",
                padding: "5px",
                flex: 1,
              }}
            />
          </Autocomplete>
          <button
            onClick={calculateRouteWithLogging}
            style={{
              backgroundColor: "black",
              color: "white",
              padding: "5px 15px",
            }}
          >
            Calculate Route
          </button>
          <button
            onClick={clearRouteWithLogging}
            style={{
              backgroundColor: "black",
              color: "white",
              padding: "5px 15px",
            }}
          >
            Clear
          </button>
          <button
            onClick={testFilterWithLogging}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "5px 15px",
            }}
          >
            Test Filter
          </button>
        </div>

        {/* Auto-add linkway waypoints toggle */}
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={autoAddLinkwayWaypoints}
              onChange={(e) => setAutoAddLinkwayWaypoints(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span style={{ color: "#333" }}>
              Automatically route through sheltered infrastructure
            </span>
            <span
              style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}
            >
              (Routes will be optimized to pass through covered walkways,
              linkways, and pedestrian bridges)
            </span>
          </label>
        </div>

        {/* Show Trees toggle */}
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={showTrees}
              onChange={(e) => setShowTrees(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span style={{ color: "#333" }}>Show Trees along route</span>
          </label>
        </div>
        {routeOptions.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <h3 style={{ marginBottom: "5px", fontWeight: "bold" }}>
              Route Options:
            </h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {routeOptions
                .slice(
                  0,
                  parseInt(process.env.NEXT_PUBLIC_MAX_ROUTE_OPTIONS || "2")
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
                          selectedRouteIndex === index ? "#007bff" : "#f8f9fa",
                        color: selectedRouteIndex === index ? "white" : "black",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Option {index + 1}: {details.duration} |{" "}
                      {details.distance}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
        {duration && distance && (
          <div>
            <p>
              Duration: {duration} | Distance: {distance}
            </p>
            {filteredLinkways.length > 0 && (
              <p style={{ color: "#00aa00", fontWeight: "bold" }}>
                Found {filteredLinkways.length} sheltered infrastructure
                feature(s) along the route
              </p>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        onClick={onMapClick}
      >
        {/* Render route if available */}
        {directionsResponse && routeOptions.length > 0 && (
          <DirectionsRenderer
            directions={directionsResponse}
            routeIndex={selectedRouteIndex}
            options={{
              suppressMarkers: false,
            }}
          />
        )}

        {/* Render sheltered linkway polygons */}
        {filteredLinkways.length > 0 &&
          convertShelteredLinkwayToGoogleMapsPolygons(filteredLinkways).map(
            (polygonPath, index) => (
              <Polygon
                key={`linkway-${index}`}
                paths={polygonPath}
                options={{
                  fillColor: "#00ff00",
                  fillOpacity: 0.3,
                  strokeColor: "#00aa00",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )
          )}

        {/* Render clicked markers */}
        {markers.map((marker, index) => (
          <Marker key={index} position={marker} />
        ))}

        {/* Render optimal waypoint markers */}
        {optimalWaypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={waypoint}
            icon={{
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="8" fill="#FF6B35" stroke="white" stroke-width="2"/>
                  <text x="10" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${
                    index + 1
                  }</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(20, 20),
            }}
            title={`Optimal Waypoint ${index + 1}: ${waypoint.lat.toFixed(
              6
            )}, ${waypoint.lng.toFixed(6)}`}
          />
        ))}

        {/* Trees from tiles — only show when toggled on */}
        {showTrees &&
          routeTrees.map((f, i) => {
            const [lng, lat] = f.geometry.coordinates;
            return (
              <Marker
                key={`tree-${i}`}
                position={{ lat, lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 4,
                  fillColor: "#228B22",
                  fillOpacity: 0.85,
                  strokeWeight: 0,
                }}
              />
            );
          })}
      </GoogleMap>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
};

export { Map };
