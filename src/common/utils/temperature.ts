export interface TemperatureStation {
  id: string;
  deviceId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface TemperatureReading {
  stationId: string;
  value: number;
}

export interface TemperatureData {
  code: number;
  data: {
    stations: TemperatureStation[];
    readings: Array<{
      timestamp: string;
      data: TemperatureReading[];
    }>;
    readingType: string;
    readingUnit: string;
  };
  errorMsg: string;
}

export interface TemperatureStationWithReading extends TemperatureStation {
  temperature: number;
}

/**
 * Fetch temperature data from our backend API route
 */
export const fetchTemperatureData = async (): Promise<TemperatureData | null> => {
  try {
    const response = await fetch('/api/temperature');

    if (!response.ok) {
      console.error('Failed to fetch temperature data:', response.statusText);
      return null;
    }

    const data: TemperatureData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    return null;
  }
};

/**
 * Combine station data with their temperature readings
 */
export const combineStationsWithReadings = (
  data: TemperatureData
): TemperatureStationWithReading[] => {
  const stations = data.data.stations;
  const readings = data.data.readings[0]?.data || [];

  return stations
    .map((station) => {
      const reading = readings.find((r) => r.stationId === station.id);
      if (!reading) return null;

      return {
        ...station,
        temperature: reading.value,
      };
    })
    .filter((station): station is TemperatureStationWithReading => station !== null);
};

/**
 * Calculate Haversine distance between two lat/lng points (in meters)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Find the nearest temperature station to a given coordinate
 */
export const getNearestTemperature = (
  lat: number,
  lng: number,
  stations: TemperatureStationWithReading[]
): number | null => {
  if (stations.length === 0) return null;

  let nearestStation = stations[0];
  let minDistance = calculateDistance(
    lat,
    lng,
    nearestStation.location.latitude,
    nearestStation.location.longitude
  );

  for (let i = 1; i < stations.length; i++) {
    const station = stations[i];
    const distance = calculateDistance(
      lat,
      lng,
      station.location.latitude,
      station.location.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  return nearestStation.temperature;
};
