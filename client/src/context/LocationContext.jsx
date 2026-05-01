/**
 * LocationContext — real-time GPS tracking for the entire app.
 *
 * Usage:
 *   const { coords, accuracy, loading, error, lastUpdated, refresh } = useLocation();
 *
 * coords = { lat, lng } | null
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const LocationContext = createContext({
  coords: null,
  accuracy: null,
  loading: false,
  error: null,
  lastUpdated: null,
  refresh: () => {},
});

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const watchId = useRef(null);

  const onSuccess = useCallback((position) => {
    setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    setAccuracy(Math.round(position.coords.accuracy));
    setLastUpdated(new Date());
    setLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    setLoading(false);
    if (err.code === 1) {
      setError('location_denied');
    } else if (err.code === 2) {
      setError('location_unavailable');
    } else {
      setError('location_timeout');
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('location_unsupported');
      return;
    }
    setLoading(true);
    // Clear any existing watch
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000,   // accept cached position up to 30 s old
    });
  }, [onSuccess, onError]);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, [onSuccess, onError]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [startTracking]);

  return (
    <LocationContext.Provider value={{ coords, accuracy, loading, error, lastUpdated, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}

export default LocationContext;
