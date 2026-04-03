"use client";

import { useCallback, useRef } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<GeoPosition | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchId.current !== null) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosition.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      },
      () => {
        // silently ignore watch errors
      },
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, []);

  const getPosition = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          lastPosition.current = result;
          resolve(result);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(
              new Error(
                "Location access is required to stamp your photos. Please enable it in your browser settings."
              )
            );
          } else {
            reject(new Error("Location unavailable"));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const requestPermission = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Your browser does not support the required features. Please use Safari (iOS) or Chrome (Android)."
          )
        );
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(
              new Error(
                "Location access is required to stamp your photos. Please enable it in your browser settings."
              )
            );
          } else {
            // Timeout or unavailable — permission was granted but location failed.
            // That's fine for onboarding — we just needed permission.
            resolve();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { getPosition, requestPermission, startWatching, lastPosition };
}
