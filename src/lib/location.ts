import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Coordinates } from './geofence';

export interface LiveLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  provider: 'capacitor' | 'browser' | 'fallback';
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Check and request Geolocation permissions on native device
 */
export async function ensureLocationPermission(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    // Try Capacitor Geolocation permissions first
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location === 'granted' || permStatus.coarseLocation === 'granted') {
      return true;
    }

    const reqStatus = await Geolocation.requestPermissions();
    return reqStatus.location === 'granted' || reqStatus.coarseLocation === 'granted';
  } catch (err) {
    // If running in standard web browser, check browser permissions
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return result.state === 'granted' || result.state === 'prompt';
      } catch (e) {
        return true;
      }
    }
    return true;
  }
}

/**
 * Fetch a fresh, high-precision live hardware satellite GPS fix
 */
export async function getLiveHardwarePosition(
  options: PositionOptions = DEFAULT_OPTIONS
): Promise<LiveLocationResult> {
  // 1. Try Native Capacitor Geolocation (High Accuracy Hardware GPS)
  try {
    await ensureLocationPermission();
    const pos = await Geolocation.getCurrentPosition(options);
    if (pos && pos.coords) {
      return {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Math.round((pos.coords.accuracy || 5) * 10) / 10,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
        provider: 'capacitor',
      };
    }
  } catch (capError) {
    console.warn('[Location] Capacitor Geolocation notice, falling back to Browser API:', capError);
  }

  // 2. Fallback to Standard HTML5 Geolocation API
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation ไม่รองรับบนอุปกรณ์นี้'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (browserPos) => {
        resolve({
          latitude: Number(browserPos.coords.latitude.toFixed(6)),
          longitude: Number(browserPos.coords.longitude.toFixed(6)),
          accuracy: Math.round((browserPos.coords.accuracy || 5) * 10) / 10,
          altitude: browserPos.coords.altitude,
          heading: browserPos.coords.heading,
          speed: browserPos.coords.speed,
          timestamp: browserPos.timestamp,
          provider: 'browser',
        });
      },
      (browserError) => {
        reject(new Error(`ไม่สามารถดึงพิกัด GPS ได้ (${browserError.message})`));
      },
      options
    );
  });
}

/**
 * Continuously watch live hardware GPS position
 */
export function watchLivePosition(
  onUpdate: (location: LiveLocationResult) => void,
  onError: (error: any) => void,
  options: PositionOptions = DEFAULT_OPTIONS
): () => void {
  let watchIdCapacitor: string | null = null;
  let watchIdBrowser: number | null = null;
  let isCancelled = false;

  // 1. Try Capacitor Watch
  Geolocation.watchPosition(options, (position, err) => {
    if (isCancelled) return;
    if (err) {
      console.warn('[Location] Capacitor watch error:', err);
      onError(err);
      return;
    }
    if (position && position.coords) {
      onUpdate({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: Math.round((position.coords.accuracy || 5) * 10) / 10,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        provider: 'capacitor',
      });
    }
  })
    .then((id) => {
      if (isCancelled) {
        Geolocation.clearWatch({ id });
      } else {
        watchIdCapacitor = id;
      }
    })
    .catch((err) => {
      console.warn('[Location] Capacitor watch init failed, falling back to Browser watch:', err);
      // 2. Fallback to Browser watchPosition
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        watchIdBrowser = navigator.geolocation.watchPosition(
          (browserPos) => {
            if (isCancelled) return;
            onUpdate({
              latitude: Number(browserPos.coords.latitude.toFixed(6)),
              longitude: Number(browserPos.coords.longitude.toFixed(6)),
              accuracy: Math.round((browserPos.coords.accuracy || 5) * 10) / 10,
              altitude: browserPos.coords.altitude,
              heading: browserPos.coords.heading,
              speed: browserPos.coords.speed,
              timestamp: browserPos.timestamp,
              provider: 'browser',
            });
          },
          (browserError) => {
            if (isCancelled) return;
            onError(browserError);
          },
          options
        );
      }
    });

  // Return unsubscribe/cleanup function
  return () => {
    isCancelled = true;
    if (watchIdCapacitor) {
      Geolocation.clearWatch({ id: watchIdCapacitor });
      watchIdCapacitor = null;
    }
    if (watchIdBrowser !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdBrowser);
      watchIdBrowser = null;
    }
  };
}
