import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { OFFICE, distanceToOffice } from './office';

export type LocationStatus = 'locating' | 'ready' | 'denied' | 'error';

export interface LocationState {
  status: LocationStatus;
  coords?: { lat: number; lng: number; accuracy: number };
  /** Distance to the office in meters (when status === 'ready'). */
  distanceM?: number;
  /** Whether the current position is within the office geofence. */
  inRadius?: boolean;
}

/**
 * Requests foreground location permission and reads the device GPS, then
 * computes distance to the AII office and whether the user is inside the
 * geofence. Call `refresh()` to re-read. Works on device and on web
 * (navigator.geolocation, secure context).
 */
export function useLocation(): LocationState & { refresh: () => void } {
  const [state, setState] = useState<LocationState>({ status: 'locating' });

  const load = useCallback(async () => {
    setState({ status: 'locating' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ status: 'denied' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ?? 0;
      const distanceM = distanceToOffice(lat, lng);
      setState({
        status: 'ready',
        coords: { lat, lng, accuracy },
        distanceM,
        // Accuracy-aware: give the benefit of the doubt when the fix is coarse
        // (indoors / high floors), so a noisy GPS doesn't reject someone inside.
        inRadius: distanceM - accuracy <= OFFICE.radiusM,
      });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
