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
import {
  fetchTemperatureData,
  combineStationsWithReadings,
  getNearestTemperature,
  type TemperatureStationWithReading,
} from "@/common/utils/temperature";

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
import Notification, { NotificationType, NotificationTypeEnum } from "./Notification";
import Modal from "./Modal";

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
  // keep origin/dest coords used during route calculation
  const [originCoords, setOriginCoords] = useState<LatLngCoordinate | null>(null);
  const [destCoords, setDestCoords] = useState<LatLngCoordinate | null>(null);
  const [routeMode, setRouteMode] = useState<google.maps.TravelMode>(
    RouteMode.WALKING
  );
  const [temperatureStations, setTemperatureStations] = useState<
    TemperatureStationWithReading[]
  >([]);
  const [notificationState, setNotificationState] = useState({
    message: '',
    type: null as NotificationType,
  });
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>("");
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [loadingSavedRoutes, setLoadingSavedRoutes] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [routeToShare, setRouteToShare] = useState<any>(null);

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

  // Calculate temperature statistics for a route
  const getRouteTemperatureStats = useCallback(
    (route: google.maps.DirectionsRoute): { avg: number; max: number } | null => {
      if (!route.overview_path || route.overview_path.length === 0 || temperatureStations.length === 0) {
        return null;
      }

      // Sample points along the route (every 10th point to optimize performance)
      const sampleInterval = Math.max(1, Math.floor(route.overview_path.length / 20));
      const temperatures: number[] = [];

      for (let i = 0; i < route.overview_path.length; i += sampleInterval) {
        const point = route.overview_path[i];
        const temp = getNearestTemperature(
          point.lat(),
          point.lng(),
          temperatureStations
        );
        if (temp !== null) {
          temperatures.push(temp);
        }
      }

      if (temperatures.length === 0) return null;

      const avg = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
      const max = Math.max(...temperatures);

      return { avg: Math.round(avg * 10) / 10, max: Math.round(max * 10) / 10 };
    },
    [temperatureStations]
  );

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

  // Load temperature data on component mount
  useEffect(() => {
    const loadTemperatureData = async () => {
      try {
        const data = await fetchTemperatureData();
        if (data) {
          const stationsWithReadings = combineStationsWithReadings(data);
          setTemperatureStations(stationsWithReadings);
          console.groupCollapsed("Temperature: loaded data");
          console.log(`Station count: ${stationsWithReadings.length}`);
          console.table(
            stationsWithReadings.map((station) => ({
              id: station.id,
              name: station.name,
              temperature: station.temperature,
              lat: station.location.latitude,
              lng: station.location.longitude,
            }))
          );
          console.groupEnd();
        }
      } catch (error) {
        console.error("Failed to load temperature data:", error);
      }
    };
    loadTemperatureData();
  }, []);

  // Load saved routes when component mounts (if user is logged in)
  useEffect(() => {
    const fetchSavedRoutes = async () => {
      const userToken = sessionStorage.getItem('userToken');
      if (!userToken) {
        return; // User not logged in
      }

      setLoadingSavedRoutes(true);
      try {
        const response = await fetch('/api/routes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSavedRoutes(data.routes || []);
        }
      } catch (error) {
        console.error('Error fetching saved routes:', error);
      } finally {
        setLoadingSavedRoutes(false);
      }
    };

    fetchSavedRoutes();
  }, []);

  // Load shared route from sessionStorage if coming from shared link
  useEffect(() => {
    const sharedRouteData = sessionStorage.getItem('sharedRouteData');
    if (sharedRouteData) {
      try {
        const route = JSON.parse(sharedRouteData);

        // Clear the sessionStorage after reading
        sessionStorage.removeItem('sharedRouteData');

        // Load route data into form
        setOrigin(route.origin.address);
        setDestination(route.destination.address);
        setShelterPreference(route.preferences.shelterLevel);
        setAppliedShelterPreference(route.preferences.shelterLevel);
        setRouteMode(route.preferences.travelMode);

        // Store the route index to select after calculation
        setLoadedRouteIndex(route.selectedRouteIndex || 0);

        setNotificationState({
          message: `Loaded shared route: ${route.routeName}`,
          type: NotificationTypeEnum.SUCCESS,
        });

        // Trigger auto-calculation
        setShouldAutoCalculate(true);
      } catch (error) {
        console.error('Error loading shared route:', error);
      }
    }
  }, []);

  // Function to save current route
  const handleSaveRoute = async () => {
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken) {
      setNotificationState({
        message: "Please login to save routes",
        type: NotificationTypeEnum.WARNING,
      });
      return;
    }

    if (!routeName.trim()) {
      setNotificationState({
        message: "Please enter a route name",
        type: NotificationTypeEnum.WARNING,
      });
      return;
    }

    try {
      console.log('Saving route - selectedRouteIndex:', selectedRouteIndex);

      const response = await fetch('/api/routes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          routeName: routeName.trim(),
          origin: {
            address: origin,
            lat: directionsResponse?.routes?.[selectedRouteIndex]?.legs?.[0]?.start_location.lat() || 0,
            lng: directionsResponse?.routes?.[selectedRouteIndex]?.legs?.[0]?.start_location.lng() || 0,
          },
          destination: {
            address: destination,
            lat: directionsResponse?.routes?.[selectedRouteIndex]?.legs?.[directionsResponse.routes[selectedRouteIndex].legs.length - 1]?.end_location.lat() || 0,
            lng: directionsResponse?.routes?.[selectedRouteIndex]?.legs?.[directionsResponse.routes[selectedRouteIndex].legs.length - 1]?.end_location.lng() || 0,
          },
          preferences: {
            shelterLevel: appliedShelterPreference,
            travelMode: routeMode,
          },
          routeData: {
            distance: distance,
            duration: duration,
            sheltersCount: filteredLinkways.length,
          },
          selectedRouteIndex: selectedRouteIndex,
        }),
      });

      if (response.ok) {
        setNotificationState({
          message: "Route saved successfully!",
          type: NotificationTypeEnum.SUCCESS,
        });
        setShowSaveModal(false);
        setRouteName("");

        // Refresh saved routes list
        const routesResponse = await fetch('/api/routes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        });
        if (routesResponse.ok) {
          const data = await routesResponse.json();
          setSavedRoutes(data.routes || []);
        }
      } else {
        setNotificationState({
          message: "Failed to save route",
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Error saving route:', error);
      setNotificationState({
        message: "Error saving route",
        type: NotificationTypeEnum.ERROR,
      });
    }
  };

  // State to track when to auto-calculate after loading
  const [shouldAutoCalculate, setShouldAutoCalculate] = useState<boolean>(false);
  const [loadedRouteIndex, setLoadedRouteIndex] = useState<number | null>(null);

  // Function to delete a saved route
  const handleDeleteRoute = (routeId: string) => {
    setRouteToDelete(routeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteRoute = async () => {
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken || !routeToDelete) return;

    setShowDeleteModal(false);

    try {
      const response = await fetch(`/api/routes/delete/${routeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        setNotificationState({
          message: 'Route deleted successfully',
          type: NotificationTypeEnum.SUCCESS,
        });

        // Refresh saved routes list
        const routesResponse = await fetch('/api/routes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        });
        if (routesResponse.ok) {
          const data = await routesResponse.json();
          setSavedRoutes(data.routes || []);
        }
      } else {
        setNotificationState({
          message: 'Failed to delete route',
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      setNotificationState({
        message: 'Error deleting route',
        type: NotificationTypeEnum.ERROR,
      });
    } finally {
      setRouteToDelete(null);
    }
  };

  // Function to share a saved route
  const handleShareRoute = async (route: any) => {
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken) return;

    try {
      const response = await fetch('/api/routes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          routeId: route._id,  // Include the saved route ID
          routeName: route.routeName,
          origin: route.origin,
          destination: route.destination,
          preferences: route.preferences,
          routeData: route.routeData,
          selectedRouteIndex: route.selectedRouteIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
        setRouteToShare(route);
        setShowShareModal(true);

        // Show different message for existing vs new share
        if (data.isExisting) {
          setNotificationState({
            message: 'Using existing share link',
            type: NotificationTypeEnum.SUCCESS,
          });
        }
      } else {
        setNotificationState({
          message: 'Failed to share route',
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Error sharing route:', error);
      setNotificationState({
        message: 'Error sharing route',
        type: NotificationTypeEnum.ERROR,
      });
    }
  };

  const handleCopyShareLink = () => {
    try {
      // Check if clipboard API is available (requires HTTPS)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setNotificationState({
            message: 'Link copied to clipboard!',
            type: NotificationTypeEnum.SUCCESS,
          });
        }).catch((error) => {
          console.error('Clipboard API failed:', error);
          fallbackCopyToClipboard(shareUrl);
        });
      } else {
        // Fallback for HTTP or older browsers
        fallbackCopyToClipboard(shareUrl);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      fallbackCopyToClipboard(shareUrl);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setNotificationState({
          message: 'Link copied to clipboard!',
          type: NotificationTypeEnum.SUCCESS,
        });
      } else {
        setNotificationState({
          message: 'Please copy the link manually',
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      setNotificationState({
        message: 'Please copy the link manually',
        type: NotificationTypeEnum.ERROR,
      });
    }
  };

  // Function to load a saved route
  const handleLoadSavedRoute = useCallback(async (routeId: string) => {
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken || !routeId) return;

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const route = data.route;

        // Clear existing route first
        setDirectionsResponse(null);
        setRouteOptions([]);
        setSelectedRouteIndex(0);
        setDuration("");
        setDistance("");
        setFilteredLinkways([]);
        setOrderedShelters([]);
        setWaypoints([]);
        setOptimalWaypoints([]);

        // Load route data into form
        setOrigin(route.origin.address);
        setDestination(route.destination.address);
        setShelterPreference(route.preferences.shelterLevel);
        setAppliedShelterPreference(route.preferences.shelterLevel);
        setRouteMode(route.preferences.travelMode);

        // Store the route index to select after calculation
        const indexToLoad = route.selectedRouteIndex || 0;
        setLoadedRouteIndex(indexToLoad);

        setNotificationState({
          message: `Loaded route: ${route.routeName}`,
          type: NotificationTypeEnum.SUCCESS,
        });

        // Trigger auto-calculation via effect
        setShouldAutoCalculate(true);
      }
    } catch (error) {
      console.error('Error loading saved route:', error);
      setNotificationState({
        message: "Error loading route",
        type: NotificationTypeEnum.ERROR,
      });
    }
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

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      setNotificationState({
        message: "Please enter both origin and destination",
        type: NotificationTypeEnum.WARNING,
      });
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
        setNotificationState({
          message: "Could not find coordinates for the provided addresses",
          type: NotificationTypeEnum.ERROR,
        });
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
        travelMode: routeMode, // Use selected travel mode (walking or bicycling)
        provideRouteAlternatives: true,
      });

      // Store initial results but don't set state yet - wait to see if we'll merge with augmented routes
      let finalDirectionsResponse = results;
      let finalRouteOptions = results.routes || [];

      // Don't reset selectedRouteIndex if we're loading a saved route
      // (loadedRouteIndex will be set by the auto-select effect)
      let shouldSetInitialRoute = loadedRouteIndex === null;


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
              travelMode: routeMode, // Use selected travel mode (walking or bicycling)
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

            // Update final results with merged data
            finalDirectionsResponse = mergedDirectionsResult;
            finalRouteOptions = mergedRoutes;
          }
        }
      }

      // Set all route state at once after all calculations are complete
      setDirectionsResponse(finalDirectionsResponse);
      setRouteOptions(finalRouteOptions);

      // Only reset to index 0 if NOT loading a saved route
      if (shouldSetInitialRoute) {
        setSelectedRouteIndex(0);

        // Set initial duration and distance for the first route
        if (finalRouteOptions[0]) {
          const details = getRouteDetails(finalRouteOptions[0]);
          setDuration(details.duration);
          setDistance(details.distance);
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      setNotificationState({
        message: "Error calculating route. Please check your addresses.",
        type: NotificationTypeEnum.ERROR,
      });
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
    routeMode,
    loadedRouteIndex,
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

  // Auto-calculate route when loading a saved route
  useEffect(() => {
    if (shouldAutoCalculate && origin && destination && isLoaded && shelteredLinkwayData) {
      calculateRoute();
      setShouldAutoCalculate(false);
    }
  }, [shouldAutoCalculate, origin, destination, isLoaded, shelteredLinkwayData, calculateRoute]);

  // Select the correct route option after calculation when loading a saved route
  useEffect(() => {
    if (loadedRouteIndex !== null && routeOptions.length > 0) {
      // Wait a bit to ensure route merging is complete
      // This prevents selecting before the shelter waypoint routes are merged
      const timer = setTimeout(() => {
        // Make sure the route index is within bounds
        const indexToSelect = Math.min(loadedRouteIndex, routeOptions.length - 1);

        if (routeOptions[indexToSelect]) {
          // Use selectRoute function (same as manual click) to ensure UI updates
          selectRoute(indexToSelect);
        }

        // Clear the loaded route index after selection
        setLoadedRouteIndex(null);
      }, 500); // Wait 500ms for route merging to complete

      return () => clearTimeout(timer);
    }
  }, [loadedRouteIndex, routeOptions, selectedRouteIndex, selectRoute]);

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Wrapped button handlers with logging (no hook indirection)
  const calculateRouteWithLogging = logButtonClick(
    "Calculate Route",
    calculateRoute
  );

  const clearRouteWithLogging = logButtonClick("Clear Route", clearRoute);

  return isLoaded ? (
    <div>
      <Notification
        message={notificationState.message}
        type={notificationState.type}
        onClose={() => setNotificationState({ message: '', type: null })}
      />
      {/* Route Controls */}
      <div className={styles.routeControlsContainer}>
        <div className={styles.routeControlsTitle}>Plan your route</div>
        {sessionStorage.getItem('userToken') && savedRoutes.length > 0 && (
          <div className={styles.savedRoutesContainer}>
            <div className={styles.savedRoutesTitle}>
              📌 My Saved Routes ({savedRoutes.length})
            </div>
            <div className={styles.savedRoutesList}>
              {savedRoutes.map((route) => (
                <div
                  key={route._id}
                  className={styles.savedRouteItem}
                >
                  <div
                    onClick={() => handleLoadSavedRoute(route._id)}
                    className={styles.savedRouteContent}
                  >
                    <strong>{route.routeName}</strong>
                    <div className={styles.savedRouteAddress}>
                      📍 {route.origin.address} → {route.destination.address}
                    </div>
                    <div className={styles.savedRouteDetails}>
                      {route.preferences.travelMode === RouteMode.WALKING ? '🚶 Walking' : '🚴 Bicycling'} • Shelter: {route.preferences.shelterLevel}%
                    </div>
                    <div className={styles.savedRouteDetails}>
                      {route.routeData.distance} • {route.routeData.duration}
                    </div>
                  </div>
                  <div className={styles.savedRouteButtons}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareRoute(route);
                      }}
                      className={styles.shareRouteButton}
                      title="Share route"
                    >
                      📤
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoute(route._id);
                      }}
                      className={styles.deleteRouteButton}
                      title="Delete route"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={styles.inputContainer}>
          <div className={styles.inputGroup}>
            <div className={styles.innerInputGroup}>
              <div className={styles.inputWrapper}>
                <div className={styles.iconPin}>
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
                  className={styles.inputOrigin}
                  />
                </Autocomplete>
              </div>

              <div
                onClick={swapLocations}
                className={styles.swapButton}
              >
                <Swap />
              </div>

              <div className={styles.inputWrapper}>
                <div className={styles.iconFlag}>
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
                    className={styles.inputDestination}
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
              }]}
              value={routeMode}
              onChange={handleToggleChange} />
          </div>
        </div>
        <ShelterSlider
          value={shelterPreference}
          onChange={setShelterPreference}
        />
        <div className={styles.buttonsFlexContainer}>
            <button
            onClick={calculateRouteWithLogging}
            className={styles.findCoolerRouteButton}
            >
            Find Cooler Route
            </button>
            <button
            onClick={clearRouteWithLogging}
            className={styles.clearRouteButton}
            >
            Clear
            </button>
        </div>

        {/* Save Route Button - only show when route is calculated and user is logged in */}
        {directionsResponse && sessionStorage.getItem('userToken') && (
          <div className={styles.saveRouteButtonWrapper}>
            <button
              onClick={() => setShowSaveModal(true)}
              className={styles.saveThisRouteButton}
            >
              Save This Route
            </button>
          </div>
        )}

      </div>

      {/* Save Route Modal */}
      <Modal isOpen={showSaveModal}>
        <div className={styles.modalContainer}>
          <h2 className={styles.modalTitle}>💾 Save Route</h2>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Route Name *
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g., Morning Commute to Office"
              className={styles.formInput}
            />
          </div>

          <div className={styles.routeSummaryBox}>
            <div><strong>From:</strong> {origin}</div>
            <div><strong>To:</strong> {destination}</div>
            <div><strong>Mode:</strong> {routeMode === RouteMode.WALKING ? "🚶 Walking" : "🚴 Bicycling"}</div>
            <div><strong>Shelter Level:</strong> {appliedShelterPreference}%</div>
            <div><strong>Distance:</strong> {distance} | <strong>Duration:</strong> {duration}</div>
          </div>

          <div className={styles.modalButtonGroup}>
            <button
              onClick={() => {
                setShowSaveModal(false);
                setRouteName("");
              }}
              className={styles.modalCancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRoute}
              className={styles.modalPrimaryButton}
            >
              Save Route
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Route Confirmation Modal */}
      <Modal isOpen={showDeleteModal}>
        <div className={styles.modalContainerSmall}>
          <h2 className={styles.modalTitleSmall}>🗑️ Delete Route</h2>
          <p className={styles.modalTextLarge}>
            Are you sure you want to delete this saved route? This action cannot be undone.
          </p>
          <div className={styles.modalButtonGroup}>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setRouteToDelete(null);
              }}
              className={styles.modalCancelButton}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteRoute}
              className={styles.modalDeleteButton}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Route Modal */}
      <Modal isOpen={showShareModal}>
        <div className={styles.modalContainer}>
          <h2 className={styles.modalTitleSmall}>📤 Share Route</h2>
          <p className={styles.modalText}>
            Share this route with anyone! They can view it by opening this link.
          </p>

          {routeToShare && (
            <div className={styles.shareRouteInfoBox}>
              <strong>{routeToShare.routeName}</strong>
              <div className={styles.shareRouteSubtext}>
                {routeToShare.origin.address} → {routeToShare.destination.address}
              </div>
            </div>
          )}

          <div className={styles.shareUrlBox}>
            {shareUrl}
          </div>

          <div className={styles.modalButtonGroup}>
            <button
              onClick={() => {
                setShowShareModal(false);
                setShareUrl("");
                setRouteToShare(null);
              }}
              className={styles.modalCancelButton}
            >
              Close
            </button>
            <button
              onClick={handleCopyShareLink}
              className={styles.modalPrimaryButton}
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      </Modal>

      {/* Map */}
      <div className={styles.mapOuterContainer}>
        {routeOptions.length > 0 && (
          <div className={styles.routeOptionsContainer}>
            <div className={styles.routeOptionsButtonsContainer}>
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
                      className={`${styles.routeOptionButton} ${selectedRouteIndex === index ? styles.selected : ''}`}
                    >
                      <Route style={{position: "relative", top:"3px"}} stroke={selectedRouteIndex === index ? "#FFF" : "#064E3B"} />
                      Option {index + 1}: {details.duration} | {details.distance}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
        <GoogleMap
          mapContainerClassName={styles.mapContainerStyle}
          center={center}
          zoom={11}
        >
          {/* Render route if available */}
          {directionsResponse && routeOptions.length > 0 && (
            <DirectionsRenderer
              directions={directionsResponse}
              routeIndex={selectedRouteIndex}
              options={{
                suppressMarkers: false, // Show default Google Maps markers for origin and destination
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

      {duration && distance && <div className={styles.coolestPathContainer}>
        <div className={styles.coolestPathHeader}>
          <div className={styles.coolestPathTitle}>Coolest Path</div>
          <div><Pill label={routeMode}/></div>
        </div>
        <div className={styles.coolestPathStats}><Clock stroke="#7AA9C3" />{duration}   <MapIcon />{distance}</div>
        <div className={styles.coolestPathPills}>
          <Pill label={`+ Tree lined streets`} />
          <Pill label={`+ ${filteredLinkways?.length} Sheltered Linkways`} />
          {routeOptions[selectedRouteIndex] && (() => {
            const tempStats = getRouteTemperatureStats(routeOptions[selectedRouteIndex]);
            return tempStats ? (
              <>
                <Pill label={`Avg Temp: ${tempStats.avg}°C`} />
                <Pill label={`Max Temp: ${tempStats.max}°C`} />
              </>
            ) : null;
          })()}
        </div>
      </div>}
    </div>
  ) : (
    <div>Loading Map...</div>
  );
};

export { Map };
export default Map;
