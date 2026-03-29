"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface OnlineStatus {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the browser was recently offline (resets after 5 seconds) */
  wasOffline: boolean;
}

/**
 * React hook that tracks online/offline status using navigator.onLine
 * and the online/offline window events.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);
  const wasOfflineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);

    // Clear wasOffline after 5 seconds
    if (wasOfflineTimerRef.current) {
      clearTimeout(wasOfflineTimerRef.current);
    }
    wasOfflineTimerRef.current = setTimeout(() => {
      setWasOffline(false);
    }, 5000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (wasOfflineTimerRef.current) {
        clearTimeout(wasOfflineTimerRef.current);
      }
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
