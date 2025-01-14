"use client";

import { ReactNode, useEffect, useState } from "react";
import React, { createContext, useContext } from "react";

function detectTouchDevice() {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
}

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false); // Default to false

  useEffect(() => {
    function onResize() {
      const isTouch = detectTouchDevice();
      if (typeof document !== "undefined" && document.body) {
        document.body.classList.toggle("not-touch", !isTouch);
      }
      setIsTouchDevice(isTouch);
    }

    // Add a small debounce to avoid excessive state updates on rapid resizes
    const debounceTimeout = 200;
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(onResize, debounceTimeout);
    };

    // Only add listeners on the client
    if (typeof window !== "undefined") {
      onResize(); // Run on initial mount
      window.addEventListener("resize", debouncedResize);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", debouncedResize);
      }
    };
  }, []);

  return isTouchDevice;
}

const IsTouchscreenContext = createContext(false);

export const IsTouchscreenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isTouchDevice = useIsTouchDevice();
  return (
    <IsTouchscreenContext.Provider value={isTouchDevice}>
      {children}
    </IsTouchscreenContext.Provider>
  );
};

export const useIsTouchscreen = () => useContext(IsTouchscreenContext);
